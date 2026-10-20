import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemTotalMes {
  mes: number;
  mesNome: string;
  ano: number;
  total: number;
  totalFormatado: string;
  linha: string;
}

export interface RespostaTotalMes {
  sucesso: boolean;
  area: "total_mes";
  titulo: string;
  ano: number;
  meses: ItemTotalMes[];
  linhas: string[];
  totalGeral: number;
  totalGeralFormatado: string;
  linhaTotal: string;
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_ARRECADACAO = path.resolve(process.cwd(), "admin_arrecadacao.dados.json");

const DADOS_PADRAO_MESES: Array<{ mes: number; mesNome: string; ano: number; total: number; totalFormatado: string }> = [
  { mes: 1, mesNome: "jan", ano: 2026, total: 1293.90, totalFormatado: "1.293,90" },
  { mes: 2, mesNome: "fev", ano: 2026, total: 1847.50, totalFormatado: "1.847,50" },
  { mes: 3, mesNome: "mar", ano: 2026, total: 2315.80, totalFormatado: "2.315,80" },
  { mes: 4, mesNome: "abr", ano: 2026, total: 986.40, totalFormatado: "986,40" },
  { mes: 5, mesNome: "mai", ano: 2026, total: 1672.30, totalFormatado: "1.672,30" },
  { mes: 6, mesNome: "jun", ano: 2026, total: 2048.90, totalFormatado: "2.048,90" },
  { mes: 7, mesNome: "jul", ano: 2026, total: 1435.70, totalFormatado: "1.435,70" },
  { mes: 8, mesNome: "ago", ano: 2026, total: 2761.20, totalFormatado: "2.761,20" },
  { mes: 9, mesNome: "set", ano: 2026, total: 1928.60, totalFormatado: "1.928,60" },
  { mes: 10, mesNome: "out", ano: 2026, total: 2384.10, totalFormatado: "2.384,10" },
  { mes: 11, mesNome: "nov", ano: 2026, total: 1756.80, totalFormatado: "1.756,80" },
  { mes: 12, mesNome: "dez", ano: 2026, total: 3125.40, totalFormatado: "3.125,40" },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[TotalMes] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const ArrecadacaoTotalMesServico = {
  /**
   * Obtém a arrecadação mensal consolidada formatada para o painel
   */
  async obterTotalMes(ano: number = 2026): Promise<RespostaTotalMes> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_ARRECADACAO, {});
    const configMes = dadosArquivo.totaisMes || {};

    const mesesRaw: Array<{ mes: number; mesNome: string; ano: number; total: number; totalFormatado: string }> =
      configMes.meses && Array.isArray(configMes.meses) && configMes.meses.length > 0
        ? configMes.meses
        : DADOS_PADRAO_MESES;

    let soma = 0;
    const meses: ItemTotalMes[] = mesesRaw.map((m) => {
      soma += m.total;
      return {
        mes: m.mes,
        mesNome: m.mesNome,
        ano: m.ano || ano,
        total: m.total,
        totalFormatado: m.totalFormatado,
        linha: `acessar ${m.ano || ano} ${m.mesNome} foi ${m.totalFormatado}`,
      };
    });

    const totalGeralFormatado = configMes.totalGeralFormatado || `${soma.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    const linhaTotal = `${ano} total : ${totalGeralFormatado}`;

    // Agrupamento semestral conforme exibição do painel: Jan-Jun e Jul-Dez
    const semestre1 = meses.filter((m) => m.mes >= 1 && m.mes <= 6).map((m) => m.linha);
    const semestre2 = meses.filter((m) => m.mes >= 7 && m.mes <= 12).map((m) => m.linha);

    const titulo = "Por mês.";
    const textoFormatado =
      `${titulo}\n` +
      `${semestre1.join("\n")}\n\n\n` +
      `${semestre2.join("\n")}\n\n` +
      linhaTotal;

    const linhas = [...meses.map((m) => m.linha), linhaTotal];

    return {
      sucesso: true,
      area: "total_mes",
      titulo,
      ano,
      meses,
      linhas,
      totalGeral: Number(soma.toFixed(2)),
      totalGeralFormatado,
      linhaTotal,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente os totais mensais para a API_URL (Painel)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_arrecadacao_total_mes",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterTotalMes();

      const payload = {
        evento,
        area: "total_mes",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          ano: metricas.ano,
          meses: metricas.meses,
          linhas: metricas.linhas,
          totalGeral: metricas.totalGeral,
          totalGeralFormatado: metricas.totalGeralFormatado,
          linhaTotal: metricas.linhaTotal,
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
};

export default ArrecadacaoTotalMesServico;
