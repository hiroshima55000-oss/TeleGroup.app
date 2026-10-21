/**
 * Tipagens do Sistema Equilibrado de Interesses e Ranqueamento de Publicações
 */

export type TipoAcaoInteresse =
  | "visualizacao"
  | "dwell" // Tempo retido de leitura (> 4s)
  | "like"
  | "descurtir"
  | "clique_link" // Clique de entrada no canal/grupo do Telegram
  | "clique_tag"; // Busca/filtro ativo por hashtag

export type ClassificacaoPublico =
  | "Público de Alto Clique (Tráfego Focado)"
  | "Engajador Social"
  | "Explorador"
  | "Passivo";

export interface ItemSequenciaSessao {
  tag?: string;
  nicho?: string;
  publicacaoId?: string;
  tipo: TipoAcaoInteresse;
  timestamp: string;
}

export interface AfinidadeHashtag {
  tag: string;
  pontosBrutos: number;
  pontosDecaidos: number;
  percentual: number; // Participação percentual normalizada (0 a 100)
  totalInteracoes: number;
  likes: number;
  cliques: number;
  visualizacoes: number;
  ultimaInteracao: string;
}

export interface GrupoInteressePercentual {
  grupoNome: string;
  tags: string[];
  percentual: number; // Ex: 39.37%
  pontosPonderados: number;
  totalAcoes: number;
}

export interface PerfilInteresseUsuario {
  usuarioId: string;
  nickname: string;
  totalInteracoes: number;
  totalLikes: number;
  totalCliques: number;
  totalVisualizacoes: number;
  tempoRetencaoEstimadoSegundos: number;

  // Qualificação do Usuário (visível ao Painel Administrativo)
  classificacaoPublico: ClassificacaoPublico;
  taxaCliquesCTR: number; // (totalCliques / totalVisualizacoes) * 100
  descricaoQualificacao: string;

  // Scores por Hashtags e Distribuição Percentual
  hashtags: Record<string, AfinidadeHashtag>;
  distribuicaoGrupos: GrupoInteressePercentual[];
  distribuicaoPercentual: Record<string, number>; // { "marketing": 39.37, "moda": 25.28, ... }

  // Sequência e Contexto Imediato de Sessão
  sequenciaSessao: ItemSequenciaSessao[];

  primeiraInteracao: string;
  ultimaAtualizacao: string;
}

export interface ScoreDetalhadoPublicacao {
  publicacaoId: string;
  scoreRecencia: number; // 0.0 a 1.0 (recência da publicação - peso 25%)
  scoreSequencia: number; // 0.0 a 1.0 (sequência da sessão - peso 20%)
  scoreHashtags: number; // 0.0 a 1.0 (afinidade com hashtags - peso 40%)
  scoreQualidade: number; // 0.0 a 1.0 (qualidade com regularização Bayesiana - peso 15%)
  scoreTotalEquilibrado: number; // 0.0 a 1.0 (soma estrita dos 4 pesos = 100%)
  isExploracaoSlot: boolean; // Flag se a posição no feed veio da regra de exploração anti-bolha
  tagsCoincidentes: string[];
}
