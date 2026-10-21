import fs from "fs";
import path from "path";
import { EventoColetado, PerfilInteressesBaseDados, GrupoInteresseOtimizado } from "./tipos.base.dados";

const ARQUIVO_INTERESSES = path.resolve(process.cwd(), "usuarios_interesses.dados.json");

// Pesos por ação do usuário (Etapa 2: Otimização Ponderada)
const PESOS_ACAO = {
  clique_link: 5.0,  // Maior intenção de conversão e entrada na comunidade
  clique_tag: 2.5,   // Busca intencional direta por nicho
  like: 1.5,         // Validação social explícita
  dwell: 0.8,        // Leitura retida por mais de 4 segundos
  filtro_nicho: 2.0, // Seleção deliberada de aba de nicho
  busca: 2.2,        // Pesquisa ativa
  visualizacao: 0.1, // Rolagem simples de tela
  descurtir: -1.5,   // Rejeição
};

// Agrupamentos conceituais para vincular tags/eventos a grupos de interesse
const GRUPOS_MAPEAMENTO: Record<string, string[]> = {
  "marketing digital": [
    "marketing",
    "marketingdigital",
    "cursos",
    "empreendedorismo",
    "negocios",
    "vendas",
    "trafego",
    "afiliados",
    "dropshipping",
  ],
  "tecnologia e dev": [
    "tecnologia",
    "programacao",
    "ia",
    "inteligenciaartificial",
    "python",
    "javascript",
    "dev",
    "cybersecurity",
    "chatgpt",
  ],
  "investimentos e cripto": [
    "cripto",
    "bitcoin",
    "investimentos",
    "financas",
    "rendaextra",
    "daytrade",
    "bolsadevalores",
  ],
  "educação e estudos": [
    "cursos",
    "livros",
    "estudos",
    "concursos",
    "idiomas",
    "ingles",
  ],
  "entretenimento e midia": [
    "humor",
    "memes",
    "filmes",
    "series",
    "animes",
    "games",
    "musica",
    "futebol",
  ],
  "ofertas e utilidades": [
    "promocoes",
    "cupons",
    "descontos",
    "vagas",
    "noticias",
  ],
};

// Cache em memória dos perfis otimizados
const perfisOtimizadosCache = new Map<string, PerfilInteressesBaseDados>();

function lerPerfisArquivo(): Record<string, any> {
  try {
    if (fs.existsSync(ARQUIVO_INTERESSES)) {
      const conteudo = fs.readFileSync(ARQUIVO_INTERESSES, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn("[OtimizacaoInteresses] Falha ao ler usuarios_interesses.dados.json:", err);
  }
  return {};
}

function salvarPerfisArquivo(perfis: Record<string, any>): void {
  try {
    fs.writeFileSync(ARQUIVO_INTERESSES, JSON.stringify(perfis, null, 2), "utf-8");
  } catch (err) {
    console.error("[OtimizacaoInteresses] Falha ao persistir usuarios_interesses.dados.json:", err);
  }
}

export const OtimizacaoInteressesServico = {
  /**
   * ETAPA 2 DO CICLO:
   * Processa os dados coletados e otimiza a matriz de interesses de um usuário
   */
  otimizarPerfil(usuarioId: string, eventos: EventoColetado[], versaoCiclo = 1): PerfilInteressesBaseDados {
    const agora = Date.now();
    const acumuladorTags: Record<string, { pontos: number; usos: number }> = {};
    const acumuladorGrupos: Record<string, { pontos: number; totalAcoes: number }> = {};
    const acumuladorNichos: Record<string, number> = {};

    let totalVisualizacoes = 0;
    let totalCliques = 0;
    let totalLikes = 0;
    let nickname = "";

    // Inicializa os grupos conhecidos
    for (const grupoNome of Object.keys(GRUPOS_MAPEAMENTO)) {
      acumuladorGrupos[grupoNome] = { pontos: 0, totalAcoes: 0 };
    }

    // Processa os eventos com decaimento temporal
    for (const evento of eventos) {
      if (evento.nickname && !nickname) nickname = evento.nickname;

      if (evento.tipo === "visualizacao") totalVisualizacoes++;
      if (evento.tipo === "clique_link" || evento.tipo === "clique_tag") totalCliques++;
      if (evento.tipo === "like") totalLikes++;

      // Fator de decaimento temporal: eventos mais recentes pesam 100%, eventos com 7 dias pesam ~65%
      const deltaHoras = Math.max(0, (agora - evento.timestamp) / (1000 * 60 * 60));
      const fatorDecaimento = 1 / (1 + 0.003 * deltaHoras);
      const pesoAcao = (PESOS_ACAO[evento.tipo] || 0.5) * fatorDecaimento;

      // 1. Processa Hashtag
      if (evento.tag) {
        const tag = evento.tag.toLowerCase();
        if (!acumuladorTags[tag]) {
          acumuladorTags[tag] = { pontos: 0, usos: 0 };
        }
        acumuladorTags[tag].pontos += Math.max(0.1, pesoAcao);
        acumuladorTags[tag].usos += 1;

        // Associa tag aos grupos mapeados
        for (const [grupoNome, tagsDoGrupo] of Object.entries(GRUPOS_MAPEAMENTO)) {
          if (tagsDoGrupo.includes(tag) || tagsDoGrupo.some((t) => tag.includes(t))) {
            acumuladorGrupos[grupoNome].pontos += pesoAcao;
            acumuladorGrupos[grupoNome].totalAcoes += 1;
          }
        }
      }

      // 2. Processa Nicho
      if (evento.nicho) {
        const nicho = evento.nicho.toLowerCase();
        acumuladorNichos[nicho] = (acumuladorNichos[nicho] || 0) + pesoAcao;

        for (const [grupoNome] of Object.entries(GRUPOS_MAPEAMENTO)) {
          if (grupoNome.includes(nicho) || nicho.includes(grupoNome)) {
            acumuladorGrupos[grupoNome].pontos += pesoAcao * 1.2;
            acumuladorGrupos[grupoNome].totalAcoes += 1;
          }
        }
      }
    }

    // Calcula total de pontos para distribuição 100%
    let somaPontosGrupos = 0;
    for (const g of Object.values(acumuladorGrupos)) {
      somaPontosGrupos += g.pontos;
    }

    const distribuicaoPercentual: Record<string, number> = {};
    const distribuicaoGrupos: GrupoInteresseOtimizado[] = [];

    if (somaPontosGrupos > 0) {
      for (const [grupoNome, dados] of Object.entries(acumuladorGrupos)) {
        if (dados.pontos > 0) {
          const pct = Number(((dados.pontos / somaPontosGrupos) * 100).toFixed(2));
          distribuicaoPercentual[grupoNome] = pct;
          distribuicaoGrupos.push({
            grupoNome,
            percentual: pct,
            pontosPonderados: Number(dados.pontos.toFixed(2)),
            totalAcoes: dados.totalAcoes,
          });
        }
      }
      distribuicaoGrupos.sort((a, b) => b.percentual - a.percentual);
    } else {
      // Fallback uniforme com base nos nichos padrão
      const grupos = Object.keys(GRUPOS_MAPEAMENTO);
      const basePct = Number((100 / grupos.length).toFixed(2));
      for (const g of grupos) {
        distribuicaoPercentual[g] = basePct;
        distribuicaoGrupos.push({
          grupoNome: g,
          percentual: basePct,
          pontosPonderados: 1,
          totalAcoes: 0,
        });
      }
    }

    // Top Hashtags otimizadas com percentuais relativos
    let somaPontosTags = 0;
    for (const t of Object.values(acumuladorTags)) {
      somaPontosTags += t.pontos;
    }

    const topHashtags: Record<string, { pontos: number; percentual: number; usos: number }> = {};
    const tagsOrdenadas = Object.entries(acumuladorTags).sort((a, b) => b[1].pontos - a[1].pontos).slice(0, 20);
    for (const [tag, dados] of tagsOrdenadas) {
      const pct = somaPontosTags > 0 ? Number(((dados.pontos / somaPontosTags) * 100).toFixed(2)) : 0;
      topHashtags[tag] = {
        pontos: Number(dados.pontos.toFixed(2)),
        percentual: pct,
        usos: dados.usos,
      };
    }

    // Cálculo do CTR real (cliques sobre visualizações)
    const taxaCliquesCTR = totalVisualizacoes > 0
      ? Number(((totalCliques / totalVisualizacoes) * 100).toFixed(2))
      : totalCliques > 0 ? 100 : 0;

    // Classificação comportamental otimizada do público
    let classificacaoPublico = "Passivo";
    if (taxaCliquesCTR >= 20 || totalCliques >= 5) {
      classificacaoPublico = "Público de Alto Clique (Tráfego Focado)";
    } else if (totalLikes >= 5 && totalVisualizacoes >= 10) {
      classificacaoPublico = "Público Engajado Social (Likes e Comunidade)";
    } else if (Object.keys(acumuladorTags).length >= 4) {
      classificacaoPublico = "Explorador Curioso (Múltiplos Nichos)";
    } else if (totalVisualizacoes > 0) {
      classificacaoPublico = "Visualizador Moderado (Consumo Passivo)";
    }

    const scoreEngajamento = Number((somaPontosGrupos + totalCliques * 2 + totalLikes).toFixed(2));

    const perfilOtimizado: PerfilInteressesBaseDados = {
      usuarioId,
      nickname,
      classificacaoPublico,
      taxaCliquesCTR,
      totalEventosColetados: eventos.length,
      totalVisualizacoes,
      totalCliques,
      totalLikes,
      distribuicaoPercentual,
      distribuicaoGrupos,
      topHashtags,
      afinidadesNichos: acumuladorNichos,
      scoreEngajamento,
      versaoCiclo,
      ultimaOtimizacao: new Date(agora).toISOString(),
    };

    // Atualiza cache em memória
    perfisOtimizadosCache.set(usuarioId, perfilOtimizado);

    // Persiste no arquivo JSON unificado
    const arquivo = lerPerfisArquivo();
    arquivo[usuarioId] = perfilOtimizado;
    salvarPerfisArquivo(arquivo);

    return perfilOtimizado;
  },

  /**
   * Obtém o perfil já otimizado do cache ou do arquivo
   */
  obterPerfil(usuarioId: string): PerfilInteressesBaseDados | null {
    if (perfisOtimizadosCache.has(usuarioId)) {
      return perfisOtimizadosCache.get(usuarioId)!;
    }
    const arquivo = lerPerfisArquivo();
    if (arquivo[usuarioId]) {
      perfisOtimizadosCache.set(usuarioId, arquivo[usuarioId]);
      return arquivo[usuarioId];
    }
    return null;
  },

  /**
   * Retorna todos os perfis otimizados
   */
  obterTodosPerfis(): PerfilInteressesBaseDados[] {
    const arquivo = lerPerfisArquivo();
    return Object.values(arquivo);
  },
};

export default OtimizacaoInteressesServico;
