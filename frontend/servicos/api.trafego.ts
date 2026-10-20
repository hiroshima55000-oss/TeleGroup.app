import { CampanhaItem } from "./api.campanhas";
import { obterUsuarioId } from "./usuario";

export interface ResultadoLeilaoItem {
  campanha: CampanhaItem;
  scoreRankeamento: number;
  ecpmEstimado: number;
  fatorRelevancia: number;
  scoreQualidade: number;
  ritmoPacing: "Acelerado" | "Otimizado" | "Cadenciado";
  motivoVitoria: string;
  custoPorImpressaoEstimado?: number;
  custoPorCliqueEstimado?: number;
}

export interface MetricasAlgoritmoItem {
  totalLeiloesRealizados: number;
  impressoesEntreguesHoje: number;
  cliquesAtribuidosHoje: number;
  ecpmMedioPlataforma: number;
  taxaPreenchimento: number;
  campanhasAtivasNoPool: number;
  distribuicaoPorCategoria: Record<string, number>;
  totalCreditosConvertidos?: number;
  lucroRetidoPlataforma?: number;
  margemLucroPercentual?: number;
  cpcMedioEfetivo?: number;
  cpmMedioEfetivo?: number;
}

export interface DiagnosticoCampanha {
  campanhaId: string;
  nome: string;
  scoreQualidade: number;
  ritmoPacing: string;
  fatorPacing: number;
  status: string;
  orcamentoDiario: number;
  visualizacoes: number;
  cliques: number;
  ctr: number;
}

export async function buscarAnuncioLeilao(params?: {
  categoria?: string;
  busca?: string;
  slot?: "feed_topo" | "feed_inline" | "destaque_banner";
  limite?: number;
}): Promise<ResultadoLeilaoItem[]> {
  try {
    const usuarioId = obterUsuarioId();
    const query = new URLSearchParams();
    if (params?.categoria && params.categoria !== "Todos") {
      query.append("categoria", params.categoria);
    }
    if (params?.busca) {
      query.append("busca", params.busca);
    }
    if (params?.slot) {
      query.append("slot", params.slot);
    }
    if (params?.limite) {
      query.append("limite", String(params.limite));
    }

    const resposta = await fetch(`/api/trafego/leilao?${query.toString()}`, {
      headers: {
        "x-user-id": usuarioId,
      },
    });

    if (!resposta.ok) {
      return [];
    }

    const json = await resposta.json();
    return json.dados || [];
  } catch (err) {
    console.error("Falha ao buscar anúncio no leilão:", err);
    return [];
  }
}

export async function registrarEventoTrafego(
  tipo: "impressao" | "clique",
  campanhaId: string
): Promise<boolean> {
  try {
    const usuarioId = obterUsuarioId();
    const resposta = await fetch("/api/trafego/evento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioId,
      },
      body: JSON.stringify({
        tipo,
        campanhaId,
      }),
    });

    const json = await resposta.json();
    return json.sucesso && json.atribuido;
  } catch {
    return false;
  }
}

export async function buscarMetricasTrafego(): Promise<MetricasAlgoritmoItem | null> {
  try {
    const resposta = await fetch("/api/trafego/metricas");
    if (!resposta.ok) return null;
    const json = await resposta.json();
    return json.dados;
  } catch {
    return null;
  }
}

export async function buscarDiagnosticoCampanha(
  campanhaId: string
): Promise<DiagnosticoCampanha | null> {
  try {
    const resposta = await fetch(`/api/trafego/campanha/${campanhaId}/diagnostico`);
    if (!resposta.ok) return null;
    const json = await resposta.json();
    return json.dados;
  } catch {
    return null;
  }
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

export async function simularCenarioTrafego(
  params: ParametrosSimulacaoItem
): Promise<ResultadoSimulacaoItem | null> {
  try {
    const resposta = await fetch("/api/trafego/simulador", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!resposta.ok) return null;
    const json = await resposta.json();
    return json.dados || null;
  } catch {
    return null;
  }
}

