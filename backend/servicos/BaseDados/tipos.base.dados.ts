/**
 * Tipos e Estruturas de Dados do Ciclo Contínuo BaseDados
 * Ciclo: 1 (Coleta) -> 2 (Otimização) -> 3 (Entrega) -> 4 (Mais Coleta) -> 1
 */

export type TipoAcaoBaseDados =
  | "visualizacao"
  | "dwell"
  | "like"
  | "descurtir"
  | "clique_link"
  | "clique_tag"
  | "busca"
  | "filtro_nicho";

export interface EventoColetado {
  id: string;
  usuarioId: string;
  nickname?: string;
  tipo: TipoAcaoBaseDados;
  publicacaoId?: string;
  tag?: string;
  nicho?: string;
  termoBusca?: string;
  duracaoSegundos?: number;
  timestamp: number;
  dataIso: string;
  etapaOrigem: 1 | 4;
}

export interface GrupoInteresseOtimizado {
  grupoNome: string;
  percentual: number;
  pontosPonderados: number;
  totalAcoes: number;
}

export interface PerfilInteressesBaseDados {
  usuarioId: string;
  nickname?: string;
  classificacaoPublico: string;
  taxaCliquesCTR: number;
  totalEventosColetados: number;
  totalVisualizacoes: number;
  totalCliques: number;
  totalLikes: number;
  distribuicaoPercentual: Record<string, number>;
  distribuicaoGrupos: GrupoInteresseOtimizado[];
  topHashtags: Record<string, { pontos: number; percentual: number; usos: number }>;
  afinidadesNichos: Record<string, number>;
  scoreEngajamento: number;
  versaoCiclo: number;
  ultimaOtimizacao: string;
}

export interface EntregaInteressePayload {
  usuarioId: string;
  perfil: PerfilInteressesBaseDados;
  nichosRecomendados: string[];
  tagsRecomendadas: string[];
  multiplicadorAfinidade: Record<string, number>;
  timestampEntrega: string;
  etapa: 3;
}

export interface FeedbackEntrega {
  entregaId: string;
  usuarioId: string;
  conteudoEntregueId: string;
  reacao: "clique" | "like" | "ignorado" | "dwell";
  tempoDecorridoMs: number;
  timestamp: number;
}

export interface MetricasCicloBaseDados {
  etapaAtual: 1 | 2 | 3 | 4;
  ciclosCompletados: number;
  totalEventosColetados: number;
  totalOtimizacoesRealizadas: number;
  totalEntregasRealizadas: number;
  totalFeedbacksCapturados: number;
  usuariosAtivosNoCiclo: number;
  ultimoCicloData: string;
  historicoCiclo: string[];
}
