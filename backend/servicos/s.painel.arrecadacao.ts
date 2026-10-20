import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import { ArrecadacaoHistoricoTransferenciasServico } from "./s.painel.arrecadacao.historico";
import { ArrecadacaoTotalAnoServico } from "./s.painel.arrecadacao.total.ano";
import { ArrecadacaoTotalMesServico } from "./s.painel.arrecadacao.total.mes";
import { ArrecadacaoTotalDiaServico } from "./s.painel.arrecadacao.total.dia";

export * from "./s.painel.arrecadacao.historico";
export * from "./s.painel.arrecadacao.total.ano";
export * from "./s.painel.arrecadacao.total.mes";
export * from "./s.painel.arrecadacao.total.dia";

export interface MetricasArrecadacaoValores {
  hoje: number;
  ontem: number;
  ultimos_10_dias: number;
  ultimos_30_dias: number;
  ultimos_60_dias: number;
  ultimos_90_dias: number;
  ultimo_1_ano: number;
  periodo_total: number;
}

export interface MetricasArrecadacaoFormatadas {
  hoje: string;
  ontem: string;
  ultimos_10_dias: string;
  ultimos_30_dias: string;
  ultimos_60_dias: string;
  ultimos_90_dias: string;
  ultimo_1_ano: string;
  periodo_total: string;
}

export interface RespostaCompletaArrecadacao {
  sucesso: boolean;
  area: "arrecadacao";
  titulo: string;
  fonte: string;
  valores: MetricasArrecadacaoValores;
  valoresFormatados: MetricasArrecadacaoFormatadas;
  dados: MetricasArrecadacaoValores;
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_TRANSACOES = path.resolve(process.cwd(), "transacoes_pix.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

export function formatarMoedaReais(valor: number): string {
  if (!valor || valor === 0) {
    return "R$ 00,00";
  }
  const formatado = valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R$ ${formatado}`;
}

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[Arrecadacao] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

const transacoesMemoria: Array<{
  id: string;
  valor: number;
  data: string;
  origem?: string;
  descricao?: string;
}> = [];

export const ArrecadacaoServico = {
  // Submódulos especializados
  historicoTransferencias: ArrecadacaoHistoricoTransferenciasServico,
  totalAno: ArrecadacaoTotalAnoServico,
  totalMes: ArrecadacaoTotalMesServico,
  totalDia: ArrecadacaoTotalDiaServico,

  obterHistoricoTransferencias: () => ArrecadacaoHistoricoTransferenciasServico.obterHistorico(),
  obterTotalPorAno: () => ArrecadacaoTotalAnoServico.obterTotalAno(),
  obterTotalPorMes: (ano?: number) => ArrecadacaoTotalMesServico.obterTotalMes(ano),
  obterTotalPorDia: () => ArrecadacaoTotalDiaServico.obterTotalDia(),

  /**
   * Consolida métricas gerais da área de arrecadação para envio ao painel (API_URL)
   */
  async obterMetricasCompletas(): Promise<RespostaCompletaArrecadacao> {
    let fonte = "arquivos_persistentes";

    let totalHoje = 0;
    let totalOntem = 0;
    let total10Dias = 0;
    let total30Dias = 0;
    let total60Dias = 0;
    let total90Dias = 0;
    let total1Ano = 0;
    let totalPeriodo = 0;

    const agora = new Date();
    const hojeIso = agora.toISOString().split("T")[0];

    const ontemData = new Date(agora);
    ontemData.setUTCDate(ontemData.getUTCDate() - 1);
    const ontemIso = ontemData.toISOString().split("T")[0];

    const dezDiasMs = 10 * 24 * 60 * 60 * 1000;
    const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;
    const sessentaDiasMs = 60 * 24 * 60 * 60 * 1000;
    const noventaDiasMs = 90 * 24 * 60 * 60 * 1000;
    const umAnoMs = 365 * 24 * 60 * 60 * 1000;
    const agoraMs = agora.getTime();

    // 1. Tenta buscar transações pagas no PostgreSQL caso conectado
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        fonte = "banco_postgresql";

        const resCampanhas = await pool.query(`
          SELECT 
            COALESCE(SUM(CASE WHEN DATE(data_criacao AT TIME ZONE 'UTC') = CURRENT_DATE THEN gasto_total ELSE 0 END), 0) as hoje,
            COALESCE(SUM(CASE WHEN DATE(data_criacao AT TIME ZONE 'UTC') = CURRENT_DATE - INTERVAL '1 day' THEN gasto_total ELSE 0 END), 0) as ontem,
            COALESCE(SUM(CASE WHEN data_criacao >= NOW() - INTERVAL '10 days' THEN gasto_total ELSE 0 END), 0) as dez_dias,
            COALESCE(SUM(CASE WHEN data_criacao >= NOW() - INTERVAL '30 days' THEN gasto_total ELSE 0 END), 0) as trinta_dias,
            COALESCE(SUM(CASE WHEN data_criacao >= NOW() - INTERVAL '60 days' THEN gasto_total ELSE 0 END), 0) as sessenta_dias,
            COALESCE(SUM(CASE WHEN data_criacao >= NOW() - INTERVAL '90 days' THEN gasto_total ELSE 0 END), 0) as noventa_dias,
            COALESCE(SUM(CASE WHEN data_criacao >= NOW() - INTERVAL '365 days' THEN gasto_total ELSE 0 END), 0) as um_ano,
            COALESCE(SUM(gasto_total), 0) as total_geral
          FROM campanhas
        `);

        if (resCampanhas.rows.length > 0) {
          const row = resCampanhas.rows[0];
          totalHoje += Number(row.hoje || 0);
          totalOntem += Number(row.ontem || 0);
          total10Dias += Number(row.dez_dias || 0);
          total30Dias += Number(row.trinta_dias || 0);
          total60Dias += Number(row.sessenta_dias || 0);
          total90Dias += Number(row.noventa_dias || 0);
          total1Ano += Number(row.um_ano || 0);
          totalPeriodo += Number(row.total_geral || 0);
          usouPostgres = true;
        }
      }
    } catch (err: any) {
      console.warn("[Arrecadacao] PostgreSQL indisponível para arrecadação:", err.message);
    }

    // 2. Se não utilizou PostgreSQL, contabiliza transações PIX pagas do arquivo transacoes_pix.dados.json
    if (!usouPostgres) {
      const transacoesMap = lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {});
      const transacoes = Object.values(transacoesMap);

      for (const t of transacoes) {
        if (t.status === "PAID" || t.status === "PAGO" || t.pagoEm) {
          const valor = Number(t.valor || 0);
          const dataRef = t.pagoEm ? new Date(t.pagoEm) : (t.criadoEm ? new Date(t.criadoEm) : null);

          if (dataRef) {
            const dataIso = dataRef.toISOString().split("T")[0];
            const ms = dataRef.getTime();
            const diffMs = agoraMs - ms;

            if (dataIso === hojeIso) totalHoje += valor;
            if (dataIso === ontemIso) totalOntem += valor;
            if (diffMs <= dezDiasMs) total10Dias += valor;
            if (diffMs <= trintaDiasMs) total30Dias += valor;
            if (diffMs <= sessentaDiasMs) total60Dias += valor;
            if (diffMs <= noventaDiasMs) total90Dias += valor;
            if (diffMs <= umAnoMs) total1Ano += valor;
            totalPeriodo += valor;
          }
        }
      }

      const campanhasLista = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
      for (const c of campanhasLista) {
        const valorGasto = Number(c.gastoTotal || 0);
        if (valorGasto > 0 && c.dataCriacao) {
          const dt = new Date(c.dataCriacao);
          const dataIso = dt.toISOString().split("T")[0];
          const ms = dt.getTime();
          const diffMs = agoraMs - ms;

          if (dataIso === hojeIso) totalHoje += valorGasto;
          if (dataIso === ontemIso) totalOntem += valorGasto;
          if (diffMs <= dezDiasMs) total10Dias += valorGasto;
          if (diffMs <= trintaDiasMs) total30Dias += valorGasto;
          if (diffMs <= sessentaDiasMs) total60Dias += valorGasto;
          if (diffMs <= noventaDiasMs) total90Dias += valorGasto;
          if (diffMs <= umAnoMs) total1Ano += valorGasto;
          totalPeriodo += valorGasto;
        }
      }
    }

    // 3. Adiciona transações registradas diretamente
    for (const item of transacoesMemoria) {
      const valor = Number(item.valor || 0);
      const dataRef = item.data ? new Date(item.data) : null;
      if (dataRef) {
        const dataIso = dataRef.toISOString().split("T")[0];
        const ms = dataRef.getTime();
        const diffMs = agoraMs - ms;

        if (dataIso === hojeIso) totalHoje += valor;
        if (dataIso === ontemIso) totalOntem += valor;
        if (diffMs <= dezDiasMs) total10Dias += valor;
        if (diffMs <= trintaDiasMs) total30Dias += valor;
        if (diffMs <= sessentaDiasMs) total60Dias += valor;
        if (diffMs <= noventaDiasMs) total90Dias += valor;
        if (diffMs <= umAnoMs) total1Ano += valor;
        totalPeriodo += valor;
      }
    }

    const valores: MetricasArrecadacaoValores = {
      hoje: Number(totalHoje.toFixed(2)),
      ontem: Number(totalOntem.toFixed(2)),
      ultimos_10_dias: Number(total10Dias.toFixed(2)),
      ultimos_30_dias: Number(total30Dias.toFixed(2)),
      ultimos_60_dias: Number(total60Dias.toFixed(2)),
      ultimos_90_dias: Number(total90Dias.toFixed(2)),
      ultimo_1_ano: Number(total1Ano.toFixed(2)),
      periodo_total: Number(totalPeriodo.toFixed(2)),
    };

    const valoresFormatados: MetricasArrecadacaoFormatadas = {
      hoje: formatarMoedaReais(valores.hoje),
      ontem: formatarMoedaReais(valores.ontem),
      ultimos_10_dias: formatarMoedaReais(valores.ultimos_10_dias),
      ultimos_30_dias: formatarMoedaReais(valores.ultimos_30_dias),
      ultimos_60_dias: formatarMoedaReais(valores.ultimos_60_dias),
      ultimos_90_dias: formatarMoedaReais(valores.ultimos_90_dias),
      ultimo_1_ano: formatarMoedaReais(valores.ultimo_1_ano),
      periodo_total: formatarMoedaReais(valores.periodo_total),
    };

    const linhas = [
      `Hoje: ${valoresFormatados.hoje}`,
      `Ontem: ${valoresFormatados.ontem}`,
      `Últimos 10 dias: ${valoresFormatados.ultimos_10_dias}`,
      `Últimos 30 dias: ${valoresFormatados.ultimos_30_dias}`,
      `Últimos 60 dias: ${valoresFormatados.ultimos_60_dias}`,
      `Últimos 90 dias: ${valoresFormatados.ultimos_90_dias}`,
      `Último 1 ano:  ${valoresFormatados.ultimo_1_ano}`,
      `Período total: ${valoresFormatados.periodo_total}`,
    ];

    const textoFormatado =
      `ÁREA: ARRECADAÇÃO\n\n` +
      `Hoje: ${valoresFormatados.hoje}\n` +
      `Ontem: ${valoresFormatados.ontem}\n\n` +
      `Últimos 10 dias: ${valoresFormatados.ultimos_10_dias}\n` +
      `Últimos 30 dias: ${valoresFormatados.ultimos_30_dias}\n` +
      `Últimos 60 dias: ${valoresFormatados.ultimos_60_dias}\n` +
      `Últimos 90 dias: ${valoresFormatados.ultimos_90_dias}\n\n` +
      `Último 1 ano:  ${valoresFormatados.ultimo_1_ano}\n\n` +
      `Período total: ${valoresFormatados.periodo_total}`;

    return {
      sucesso: true,
      area: "arrecadacao",
      titulo: "ÁREA: ARRECADAÇÃO",
      fonte,
      valores,
      valoresFormatados,
      dados: valores,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia os dados consolidados de arrecadação para a API_URL (PAINEL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_arrecadacao",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterMetricasCompletas();

      const payload = {
        evento,
        area: "arrecadacao",
        origem: "website_2",
        dados: {
          valores: metricas.valores,
          valoresFormatados: metricas.valoresFormatados,
          dados: metricas.dados,
          linhas: metricas.linhas,
          textoFormatado: metricas.textoFormatado,
          ...dadosExtras,
        },
        timestamp: new Date().toISOString(),
      };

      const chave = PAINEL_CHAVE_SECRETA || CHAVE_SECRETA_TELEGROUP;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-origem": "website_2",
      };

      if (chave) {
        headers["x-painel-chave-secreta"] = chave;
        headers["Authorization"] = `Bearer ${chave}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resposta = await fetch(endpointWebhook, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.webhookEnviado(endpointWebhook, evento, resposta.status, duracaoMs);

      return {
        enviado: resposta.ok,
        status: resposta.status,
        duracaoMs,
      };
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.webhookEnviado(endpointWebhook, evento, 500, duracaoMs);
      return {
        enviado: false,
        erro: err.message,
        duracaoMs,
      };
    }
  },

  async atualizarAjustesManuais(novosAjustes: Record<string, number>): Promise<{ sucesso: boolean; dados: Record<string, number> }> {
    return { sucesso: true, dados: novosAjustes };
  },

  async registrarTransacao(dados: {
    valor: number;
    origem?: string;
    descricao?: string;
    data?: string;
  }): Promise<{ sucesso: boolean; id: string }> {
    const id = `arr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const novaTransacao = {
      id,
      valor: Number(dados.valor),
      data: dados.data || new Date().toISOString(),
      origem: dados.origem || "painel",
      descricao: dados.descricao || "Arrecadação registrada",
    };

    transacoesMemoria.push(novaTransacao);
    return { sucesso: true, id };
  },
};

export default ArrecadacaoServico;
