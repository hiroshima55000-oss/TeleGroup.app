/**
 * Tipagens do Sistema de Campanhas Pagas e Leilão de Tráfego Prioritário
 */

import { Campanha } from "../../schemas/schema.campanhas";

export type SlotExibicao = "feed_topo" | "feed_inline" | "destaque_banner";

export type RitmoPacing = "Acelerado" | "Otimizado" | "Cadenciado";

export interface ResultadoLeilaoItem {
  campanha: Campanha;
  scoreRankeamento: number; // AdRank composto com multiplicador de vantagem
  ecpmEstimado: number; // eCPM baseado no lance diário e qualidade
  fatorRelevancia: number; // Cruzamento de afinidade com a matriz de interesses do usuário
  scoreQualidade: number; // CTR histórico normalizado
  multiplicadorVantagemPaga: number; // Boost de vantagem sobre qualquer item orgânico (ex: 3.5x a 5.0x)
  ritmoPacing: RitmoPacing;
  motivoVitoria: string;
  custoPorImpressaoEstimado: number;
  custoPorCliqueEstimado: number;
  slotAtribuido: SlotExibicao;
}

export interface MetricasAlgoritmoItem {
  totalLeiloesRealizados: number;
  impressoesEntreguesHoje: number;
  cliquesAtribuidosHoje: number;
  ecpmMedioPlataforma: number;
  taxaPreenchimento: number; // Fill rate (% de slots preenchidos por anúncios)
  campanhasAtivasNoPool: number;
  distribuicaoPorCategoria: Record<string, number>;
  totalCreditosConvertidos: number;
  lucroRetidoPlataforma: number;
  margemLucroPercentual: number;
  cpcMedioEfetivo: number;
  cpmMedioEfetivo: number;
  cliquesInvalidosBloqueados?: number;
}

export interface DiagnosticoCampanha {
  campanhaId: string;
  nome: string;
  scoreQualidade: number;
  ritmoPacing: RitmoPacing;
  fatorPacing: number;
  status: string;
  orcamentoDiario: number;
  saldoConsumido: number;
  saldoRestante: number;
  visualizacoes: number;
  cliques: number;
  visitasValidas: number;
  ctr: number;
  taxaVisitasValidasPercentual: number;
  custoPorVisitaValida: number;
  ecpmRealizado: number;
  cpcMedioRealizado: number;
  posicaoMediaCompetitiva: number;
  vantagemMultiplicadorAplicada: number;
}

export interface ParametrosSimulacaoItem {
  faixaUsuarios: number;
  postsVistosPorUsuarioDia?: number;
  taxaLikesPercentual?: number;
  taxaCliquesPercentual?: number;
  proporcaoAnunciosPercentual?: number;
  totalAnunciantesAtivos?: number;
  orcamentoMedioPorCampanha?: number;
}

export interface ResultadoSimulacaoItem {
  usuariosBase: number;
  labelFaixa: string;
  visualizacoesTotaisDia: number;
  likesEstimadosDia: number;
  cliquesTotaisEstimadosDia: number;
  slotsAnunciosDisponiveisDia: number;
  maxImpressoesPorUsuarioDia: number;
  capacidadeConsumoFinanceiroDia: number;
  capacidadeConsumoFinanceiroMes: number;
  anunciantesRecomendados: number;
  campanhasSustentaveisSimultaneas: number;
  statusLeilao: "Subutilizado" | "Equilibrado" | "Superaquecido";
  diagnosticoLeilao: string;
  pressaoLeilaoPercentual: number;
  cpmEstimado: number;
  cpcEstimado: number;
  faturamentoBrutoEstimadoDia: number;
  faturamentoBrutoEstimadoMes: number;
  lucroRetidoPlataformaDia: number;
  lucroRetidoPlataformaMes: number;
  custoRedeServidoresEstimadoMes: number;
  impactoPorNicho: {
    nichoOuHashtag: string;
    impressoesDiariasNicho: number;
    concorrenciaEstimada: "Baixa" | "Média" | "Alta";
  }[];
}
