import { Publicacao } from "../../schemas/schema.publicacoes";
import { PerfilInteresseUsuario, ScoreDetalhadoPublicacao } from "./tipos.interesses";
import { CONFIG_INTERESSES } from "./s.pesos.config";
import { PerfilInteressesServico } from "./s.perfil.interesses";

export const RanqueamentoFeedServico = {
  /**
   * 1. Score de Recência (0.0 a 1.0) — Peso: 25%
   * Prioriza grupos e publicações recentes sem soterrar conteúdos de alto valor.
   */
  calcularScoreRecencia(dataCriacaoStr: string): number {
    const agora = Date.now();
    const dataCriacao = new Date(dataCriacaoStr).getTime() || agora;
    const diferencaHoras = Math.max(0, (agora - dataCriacao) / (1000 * 60 * 60));

    // Menos de 6h: 1.0 | 24h: ~0.85 | 3 dias: ~0.65 | 7 dias: ~0.45 | 30+ dias: base mínima 0.20
    const score = 1 / (1 + 0.015 * diferencaHoras);
    return Math.max(0.2, Math.min(1.0, Number(score.toFixed(3))));
  },

  /**
   * 2. Score de Sequência de Sessão (0.0 a 1.0) — Peso: 20%
   * Conecta com os últimos cliques da sessão aberta (últimos 30 min).
   * Possui teto máximo (0.85) e decaimento temporal para não aprisionar a navegação.
   */
  calcularScoreSequencia(
    publicacaoTags: string[],
    categoria: string,
    perfil: PerfilInteresseUsuario
  ): number {
    if (!perfil.sequenciaSessao || perfil.sequenciaSessao.length === 0) {
      return 0.3; // Score neutro de base
    }

    const agora = Date.now();
    const limiteMs = CONFIG_INTERESSES.JANELA_SEQUENCIA_MINUTOS * 60 * 1000;
    const acoesRecentes = perfil.sequenciaSessao.filter((item) => {
      const tempoItem = new Date(item.timestamp).getTime();
      return agora - tempoItem <= limiteMs;
    });

    if (acoesRecentes.length === 0) {
      return 0.3;
    }

    const tagsPubLimpos = publicacaoTags.map((t) => t.toLowerCase().replace(/^#/, "").trim());
    const categoriaLimpa = (categoria || "").toLowerCase().trim();

    let matches = 0;
    let pesoTotalAcoes = 0;

    acoesRecentes.forEach((acao, index) => {
      const pesoOrdem = 1 / (index + 1);
      pesoTotalAcoes += pesoOrdem;

      const tagAcao = acao.tag?.toLowerCase().replace(/^#/, "").trim();
      const nichoAcao = acao.nicho?.toLowerCase().trim();

      if (tagAcao && tagsPubLimpos.includes(tagAcao)) {
        matches += 1.0 * pesoOrdem;
      } else if (nichoAcao && (categoriaLimpa.includes(nichoAcao) || nichoAcao.includes(categoriaLimpa))) {
        matches += 0.5 * pesoOrdem;
      }
    });

    if (pesoTotalAcoes === 0) return 0.3;
    const scoreNormalizado = Math.min(
      CONFIG_INTERESSES.TETO_BOOST_SEQUENCIA,
      (matches / pesoTotalAcoes) * 1.2
    );
    return Number(Math.max(0.1, scoreNormalizado).toFixed(3));
  },

  /**
   * 3. Score de Afinidade com as Hashtags (0.0 a 1.0) — Peso: 40%
   * Mapeia as 1 a 5 tags do grupo contra a distribuição de interesse acumulada do usuário.
   */
  calcularScoreHashtags(
    publicacaoTags: string[],
    categoria: string,
    perfil: PerfilInteresseUsuario
  ): { score: number; tagsCoincidentes: string[] } {
    const tagsPub = publicacaoTags.map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean);
    const tagsCoincidentes: string[] = [];

    // Se o usuário não tem histórico ainda, retorna pontuação padrão de equilíbrio
    if (Object.keys(perfil.hashtags).length === 0) {
      return { score: 0.35, tagsCoincidentes: [] };
    }

    let somaPontosTags = 0;
    const totalTagsAvaliadas = Math.max(1, tagsPub.length);

    for (const tag of tagsPub) {
      if (perfil.hashtags[tag]) {
        tagsCoincidentes.push(tag);
        const pct = perfil.hashtags[tag].percentual || 0;
        somaPontosTags += pct / 100;
      }
    }

    if (tagsCoincidentes.length === 0 && categoria) {
      const catLimpa = categoria.toLowerCase().trim();
      for (const grupo of perfil.distribuicaoGrupos) {
        if (grupo.grupoNome.includes(catLimpa) || catLimpa.includes(grupo.grupoNome)) {
          somaPontosTags += (grupo.percentual / 100) * 0.7;
          break;
        }
      }
    }

    let scoreMedio = somaPontosTags / totalTagsAvaliadas;

    // Bônus moderado e controlado para coocorrência de 2 ou mais tags (teto estrito de 1.0)
    if (tagsCoincidentes.length >= 2) {
      scoreMedio += CONFIG_INTERESSES.BONUS_COOCORRENCIA_LIMITADO;
    }

    const scoreFinal = Math.min(CONFIG_INTERESSES.ESCALA_MAXIMA_SCORE, Math.max(0.05, scoreMedio));
    return {
      score: Number(scoreFinal.toFixed(3)),
      tagsCoincidentes,
    };
  },

  /**
   * 4. Score de Qualidade Orgânica (0.0 a 1.0) — Peso: 15%
   * Utiliza Suavização Bayesiana (prior_cliques / prior_views) e fator de recência
   * para evitar viés de poucas amostras e evitar que posts gigantes antigos dominem tudo.
   */
  calcularScoreQualidade(pub: Publicacao): number {
    const views = Math.max(0, pub.visualizacoes || 0);
    const likes = Math.max(0, pub.likes || 0);
    const cliques = Math.max(0, pub.cliques || 0);

    // Suavização Bayesiana para o CTR: (cliques + prior_cliques) / (views + prior_views)
    const priorCliques = CONFIG_INTERESSES.QUALIDADE_PRIOR_CLIQUES;
    const priorViews = CONFIG_INTERESSES.QUALIDADE_PRIOR_VIEWS;
    const ctrRegularizado = (cliques + priorCliques) / (views + priorViews);

    // Suavização Bayesiana para curtidas
    const likeRateRegularizado = (likes + 1) / (views + 30);

    // Fator de desempenho recente da publicação
    const fatorRecencia = this.calcularScoreRecencia(pub.dataCriacao);

    // Combinação dos sinais de aprovação
    const qualidadeBruta = (ctrRegularizado * 0.65 + likeRateRegularizado * 0.35) * (0.6 + 0.4 * fatorRecencia);

    // Normalização (escala 0.0 a 1.0 com piso justo de 0.20)
    const normalizado = Math.min(1.0, Math.max(0.20, qualidadeBruta / 0.08));
    return Number(normalizado.toFixed(3));
  },

  /**
   * Executa o ranqueamento completo com a arquitetura dos 4 scores (100%)
   * e aplica a Regra Independente de Distribuição (Exploração Anti-Bolha).
   */
  ranquear(
    publicacoes: Publicacao[],
    usuarioId?: string
  ): {
    itensOrdenados: Publicacao[];
    scoresPorId: Record<string, ScoreDetalhadoPublicacao>;
  } {
    const perfil = PerfilInteressesServico.obterPerfil(usuarioId || "anonimo");
    const scoresPorId: Record<string, ScoreDetalhadoPublicacao> = {};

    // 1. Calcula os 4 scores de cada publicação (Soma estrita = 100%)
    const itensComScore = publicacoes.map((pub) => {
      const tags = Array.isArray(pub.tags) ? pub.tags : [];
      const scoreRecencia = this.calcularScoreRecencia(pub.dataCriacao);
      const scoreSequencia = this.calcularScoreSequencia(tags, pub.categoria, perfil);
      const { score: scoreHashtags, tagsCoincidentes } = this.calcularScoreHashtags(
        tags,
        pub.categoria,
        perfil
      );
      const scoreQualidade = this.calcularScoreQualidade(pub);

      // Soma Ponderada Estrita dos 4 scores:
      // 40% Hashtags + 25% Recência + 20% Sequência + 15% Qualidade = 100%
      let scoreTotalEquilibrado =
        CONFIG_INTERESSES.PESO_SCORE_HASHTAGS * scoreHashtags +
        CONFIG_INTERESSES.PESO_SCORE_RECENCIA * scoreRecencia +
        CONFIG_INTERESSES.PESO_SCORE_SEQUENCIA * scoreSequencia +
        CONFIG_INTERESSES.PESO_SCORE_QUALIDADE * scoreQualidade;

      if (pub.destaque) {
        scoreTotalEquilibrado = Math.min(1.0, scoreTotalEquilibrado + 0.06);
      }

      const scoreFormatado = Number(scoreTotalEquilibrado.toFixed(4));

      const detalhe: ScoreDetalhadoPublicacao = {
        publicacaoId: pub.id,
        scoreRecencia,
        scoreSequencia,
        scoreHashtags,
        scoreQualidade,
        scoreTotalEquilibrado: scoreFormatado,
        isExploracaoSlot: false,
        tagsCoincidentes,
      };

      scoresPorId[pub.id] = detalhe;

      return {
        pub,
        detalhe,
        score: scoreFormatado,
      };
    });

    // 2. Ordena por score equilibrado decrescente
    itensComScore.sort((a, b) => b.score - a.score);

    // 3. Regra Independente de Distribuição: Exploração Anti-Bolha
    // A exploração não afeta os números do score dos itens; ela atua como regra de slotting:
    // a cada INTERVALO_SLOT_EXPLORACAO posições (ex: a cada 5 posições), reserva um slot para
    // conteúdo alternativo bem ranqueado fora do nicho predominante do usuário.
    const nichoPrincipal = perfil.distribuicaoGrupos[0]?.grupoNome?.toLowerCase();
    const resultadoFinal: Publicacao[] = [];
    const poolExploracao: { pub: Publicacao; detalhe: ScoreDetalhadoPublicacao; score: number }[] = [];
    const poolAfinidade: { pub: Publicacao; detalhe: ScoreDetalhadoPublicacao; score: number }[] = [];

    for (const item of itensComScore) {
      const cat = (item.pub.categoria || "").toLowerCase();
      const ehDoNichoPrincipal = nichoPrincipal
        ? cat.includes(nichoPrincipal) || nichoPrincipal.includes(cat)
        : false;

      if (!ehDoNichoPrincipal && item.detalhe.scoreQualidade >= 0.35) {
        poolExploracao.push(item);
      } else {
        poolAfinidade.push(item);
      }
    }

    let idxAfinidade = 0;
    let idxExploracao = 0;
    let contadorSlot = 0;

    while (idxAfinidade < poolAfinidade.length || idxExploracao < poolExploracao.length) {
      contadorSlot++;

      // Regra de slotting: a cada 5 posições, insere 1 item de exploração se houver candidato
      if (contadorSlot % CONFIG_INTERESSES.INTERVALO_SLOT_EXPLORACAO === 0 && idxExploracao < poolExploracao.length) {
        const itemExp = poolExploracao[idxExploracao++];
        itemExp.detalhe.isExploracaoSlot = true;
        resultadoFinal.push(itemExp.pub);
      } else if (idxAfinidade < poolAfinidade.length) {
        resultadoFinal.push(poolAfinidade[idxAfinidade++].pub);
      } else if (idxExploracao < poolExploracao.length) {
        const itemExp = poolExploracao[idxExploracao++];
        itemExp.detalhe.isExploracaoSlot = true;
        resultadoFinal.push(itemExp.pub);
      }
    }

    return {
      itensOrdenados: resultadoFinal.length > 0 ? resultadoFinal : itensComScore.map((i) => i.pub),
      scoresPorId,
    };
  },
};
