import fs from "fs";
import path from "path";
import {
  PerfilInteresseUsuario,
  AfinidadeHashtag,
  GrupoInteressePercentual,
  ItemSequenciaSessao,
  TipoAcaoInteresse,
} from "./tipos.interesses";
import { CONFIG_INTERESSES } from "./s.pesos.config";
import { QualificacaoPublicoServico } from "./s.qualificacao.publico";

const ARQUIVO_INTERESSES = path.resolve(process.cwd(), "usuarios_interesses.dados.json");

// Agrupamentos conceituais padrão para vincular tags afins a grupos de interesse
export const GRUPOS_PADRAO: Record<string, string[]> = {
  "marketing digital": [
    "marketing",
    "cursos",
    "empreendedorismo",
    "negocios",
    "negócios",
    "dinheiro",
    "vendas",
    "trafego",
    "tráfego",
    "afiliados",
  ],
  "tecnologia & dev": [
    "tech",
    "tecnologia",
    "programacao",
    "programação",
    "dev",
    "fullstack",
    "react",
    "nodejs",
    "ia",
    "prompts",
    "python",
  ],
  "oficina & automotivo": [
    "carros",
    "ferramentas",
    "manutencao",
    "manutenção",
    "pecas",
    "peças",
    "profissional",
    "mecanica",
    "mecânica",
    "oficina",
    "motores",
  ],
  "finanças & cripto": [
    "financas",
    "finanças",
    "cripto",
    "bitcoin",
    "investimentos",
    "acoes",
    "ações",
    "economia",
    "mercado",
    "renda",
  ],
  "moda & estilo": [
    "moda",
    "estilo",
    "roupas",
    "beleza",
    "looks",
    "acessorios",
    "tendencias",
  ],
  "entretenimento & humor": [
    "humor",
    "memes",
    "filmes",
    "series",
    "games",
    "jogos",
    "musica",
    "entretenimento",
  ],
  "conteúdo adulto": [
    "porn",
    "mulher",
    "negras",
    "jovem",
    "rabuda",
    "adulto",
    "sensual",
  ],
};

function lerInteressesPersistidos(): Record<string, PerfilInteresseUsuario> {
  try {
    if (fs.existsSync(ARQUIVO_INTERESSES)) {
      const conteudo = fs.readFileSync(ARQUIVO_INTERESSES, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn("[PerfilInteresses] Falha ao ler arquivo de interesses:", err);
  }
  return {};
}

function salvarInteressesPersistidos(dados: Record<string, PerfilInteresseUsuario>): void {
  try {
    fs.writeFileSync(ARQUIVO_INTERESSES, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error("[PerfilInteresses] Falha ao salvar arquivo de interesses:", err);
  }
}

export const PerfilInteressesServico = {
  /**
   * Obtém o perfil de interesses de um usuário ou cria a estrutura padrão inicial
   */
  obterPerfil(usuarioId: string, nickname?: string): PerfilInteresseUsuario {
    const todos = lerInteressesPersistidos();
    const idLimpo = (usuarioId || "anonimo").trim();

    if (todos[idLimpo]) {
      return todos[idLimpo];
    }

    const agora = new Date().toISOString();
    const nickFinal = nickname || (idLimpo.startsWith("@") ? idLimpo : `@${idLimpo}`);

    const novoPerfil: PerfilInteresseUsuario = {
      usuarioId: idLimpo,
      nickname: nickFinal,
      totalInteracoes: 0,
      totalLikes: 0,
      totalCliques: 0,
      totalVisualizacoes: 0,
      tempoRetencaoEstimadoSegundos: 0,
      classificacaoPublico: "Passivo",
      taxaCliquesCTR: 0,
      descricaoQualificacao: "Usuário novo sem histórico recente de interações.",
      hashtags: {},
      distribuicaoGrupos: [],
      distribuicaoPercentual: {},
      sequenciaSessao: [],
      primeiraInteracao: agora,
      ultimaAtualizacao: agora,
    };

    todos[idLimpo] = novoPerfil;
    salvarInteressesPersistidos(todos);
    return novoPerfil;
  },

  /**
   * Aplica decaimento temporal em uma pontuação com base no tempo decorrido
   */
  calcularPontosComDecaimento(pontosBrutos: number, dataStr: string): number {
    const agora = Date.now();
    const dataAcao = new Date(dataStr).getTime() || agora;
    const deltaDias = Math.max(0, (agora - dataAcao) / (1000 * 60 * 60 * 24));
    const fatorDecaimento = 1 / (1 + CONFIG_INTERESSES.LAMBDA_DECAIMENTO_DIAS * deltaDias);
    return Number((pontosBrutos * fatorDecaimento).toFixed(3));
  },

  /**
   * Recalcula os percentuais de afinidade do usuário (garantindo soma exata de 100,00%)
   */
  recalcularPercentuais(perfil: PerfilInteresseUsuario): void {
    const agora = new Date().toISOString();
    let somaPontosDecaidos = 0;

    // 1. Atualiza pontos decaídos de cada hashtag
    for (const tag in perfil.hashtags) {
      const item = perfil.hashtags[tag];
      item.pontosDecaidos = this.calcularPontosComDecaimento(item.pontosBrutos, item.ultimaInteracao);
      somaPontosDecaidos += item.pontosDecaidos;
    }

    const distribuicaoPercentual: Record<string, number> = {};
    if (somaPontosDecaidos > 0) {
      for (const tag in perfil.hashtags) {
        const item = perfil.hashtags[tag];
        const pct = (item.pontosDecaidos / somaPontosDecaidos) * 100;
        item.percentual = Number(pct.toFixed(2));
        distribuicaoPercentual[tag] = item.percentual;
      }
    }

    // 2. Mapeia para grupos conceituais (ex: Marketing Digital, Automotivo, etc.)
    const mapaGruposPontos: Record<string, { tags: Set<string>; pontos: number; totalAcoes: number }> = {};

    for (const tag in perfil.hashtags) {
      const item = perfil.hashtags[tag];
      const tagLimpa = tag.toLowerCase().replace(/^#/, "");

      // Encontra a qual grupo pertence ou cria um grupo para ela
      let grupoAlvo = "outros interesses";
      for (const [nomeGrupo, tagsDoGrupo] of Object.entries(GRUPOS_PADRAO)) {
        if (tagsDoGrupo.includes(tagLimpa) || tagLimpa.includes(nomeGrupo)) {
          grupoAlvo = nomeGrupo;
          break;
        }
      }

      if (!mapaGruposPontos[grupoAlvo]) {
        mapaGruposPontos[grupoAlvo] = { tags: new Set(), pontos: 0, totalAcoes: 0 };
      }
      mapaGruposPontos[grupoAlvo].tags.add(tagLimpa);
      mapaGruposPontos[grupoAlvo].pontos += item.pontosDecaidos;
      mapaGruposPontos[grupoAlvo].totalAcoes += item.totalInteracoes;
    }

    let somaPontosGrupos = 0;
    for (const g in mapaGruposPontos) {
      somaPontosGrupos += mapaGruposPontos[g].pontos;
    }

    const listaGrupos: GrupoInteressePercentual[] = [];
    if (somaPontosGrupos > 0) {
      for (const [nomeGrupo, dados] of Object.entries(mapaGruposPontos)) {
        const pct = Number(((dados.pontos / somaPontosGrupos) * 100).toFixed(2));
        listaGrupos.push({
          grupoNome: nomeGrupo,
          tags: Array.from(dados.tags),
          percentual: pct,
          pontosPonderados: Number(dados.pontos.toFixed(2)),
          totalAcoes: dados.totalAcoes,
        });
      }
      listaGrupos.sort((a, b) => b.percentual - a.percentual);
    }

    perfil.distribuicaoGrupos = listaGrupos;
    perfil.distribuicaoPercentual = distribuicaoPercentual;

    // 3. Reavalia qualificação do usuário
    const diag = QualificacaoPublicoServico.avaliar({
      visualizacoes: perfil.totalVisualizacoes,
      likes: perfil.totalLikes,
      cliques: perfil.totalCliques,
      totalInteracoes: perfil.totalInteracoes,
      tempoRetencaoEstimadoSegundos: perfil.tempoRetencaoEstimadoSegundos,
    });

    perfil.classificacaoPublico = diag.classificacao;
    perfil.taxaCliquesCTR = diag.taxaCliquesCTR;
    perfil.descricaoQualificacao = diag.descricao;
    perfil.ultimaAtualizacao = agora;
  },

  /**
   * Registra uma interação do usuário e atualiza afinidades em tempo real
   */
  registrarInteracao(params: {
    usuarioId: string;
    nickname?: string;
    tipo: TipoAcaoInteresse;
    publicacaoId?: string;
    tags?: string[];
    nicho?: string;
    duracaoSegundos?: number;
  }): PerfilInteresseUsuario {
    const perfil = this.obterPerfil(params.usuarioId, params.nickname);
    const agora = new Date().toISOString();
    const pesoBase = CONFIG_INTERESSES.PESOS_ACAO[params.tipo] ?? 0.5;

    perfil.totalInteracoes += 1;

    // Atualiza contadores globais
    if (params.tipo === "like") {
      perfil.totalLikes += 1;
    } else if (params.tipo === "descurtir") {
      perfil.totalLikes = Math.max(0, perfil.totalLikes - 1);
    } else if (params.tipo === "clique_link" || params.tipo === "clique_tag") {
      perfil.totalCliques += 1;
    } else if (params.tipo === "visualizacao") {
      perfil.totalVisualizacoes += 1;
    } else if (params.tipo === "dwell") {
      perfil.tempoRetencaoEstimadoSegundos += params.duracaoSegundos || 5;
    }

    // Registra na sequência de sessão (mantém os últimos N eventos)
    const novoItemSequencia: ItemSequenciaSessao = {
      tag: params.tags?.[0],
      nicho: params.nicho,
      publicacaoId: params.publicacaoId,
      tipo: params.tipo,
      timestamp: agora,
    };

    perfil.sequenciaSessao.unshift(novoItemSequencia);
    if (perfil.sequenciaSessao.length > CONFIG_INTERESSES.MAX_ITENS_SEQUENCIA_SESSAO) {
      perfil.sequenciaSessao = perfil.sequenciaSessao.slice(0, CONFIG_INTERESSES.MAX_ITENS_SEQUENCIA_SESSAO);
    }

    // Atualiza pontuações por hashtag
    const tagsLimpos = Array.isArray(params.tags)
      ? params.tags.map((t) => t.toLowerCase().replace(/^#/, "").trim()).filter(Boolean)
      : [];

    // Se não forneceu tags explícitas mas forneceu nicho
    if (tagsLimpos.length === 0 && params.nicho) {
      tagsLimpos.push(params.nicho.toLowerCase().trim());
    }

    for (const tag of tagsLimpos) {
      if (!perfil.hashtags[tag]) {
        perfil.hashtags[tag] = {
          tag,
          pontosBrutos: 0,
          pontosDecaidos: 0,
          percentual: 0,
          totalInteracoes: 0,
          likes: 0,
          cliques: 0,
          visualizacoes: 0,
          ultimaInteracao: agora,
        };
      }

      const h = perfil.hashtags[tag];
      h.pontosBrutos = Math.max(0, h.pontosBrutos + pesoBase);
      h.totalInteracoes += 1;
      h.ultimaInteracao = agora;

      if (params.tipo === "like") h.likes += 1;
      if (params.tipo === "descurtir") h.likes = Math.max(0, h.likes - 1);
      if (params.tipo === "clique_link" || params.tipo === "clique_tag") h.cliques += 1;
      if (params.tipo === "visualizacao") h.visualizacoes += 1;
    }

    // Recalcula distribuição percentual e salva
    this.recalcularPercentuais(perfil);

    const todos = lerInteressesPersistidos();
    todos[perfil.usuarioId] = perfil;
    salvarInteressesPersistidos(todos);

    return perfil;
  },
};
