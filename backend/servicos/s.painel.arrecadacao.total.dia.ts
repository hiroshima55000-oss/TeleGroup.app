import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemTotalDia {
  dia: number;
  diaTexto: string;
  total: number;
  totalFormatado: string;
  linha: string;
}

export interface RespostaTotalDia {
  sucesso: boolean;
  area: "total_dia";
  titulo: string;
  dias: ItemTotalDia[];
  linhas: string[];
  totalGeral: number;
  totalGeralFormatado: string;
  linhaTotal: string;
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_ARRECADACAO = path.resolve(process.cwd(), "admin_arrecadacao.dados.json");

const DADOS_PADRAO_DIAS: Array<{ dia: number; diaTexto: string; total: number; totalFormatado: string }> = [
  { dia: 1, diaTexto: "01", total: 98.50, totalFormatado: "98,50" },
  { dia: 2, diaTexto: "02", total: 112.30, totalFormatado: "112,30" },
  { dia: 3, diaTexto: "03", total: 85.70, totalFormatado: "85,70" },
  { dia: 4, diaTexto: "04", total: 120.40, totalFormatado: "120,40" },
  { dia: 5, diaTexto: "05", total: 95.80, totalFormatado: "95,80" },
  { dia: 6, diaTexto: "06", total: 110.20, totalFormatado: "110,20" },
  { dia: 7, diaTexto: "07", total: 87.60, totalFormatado: "87,60" },
  { dia: 8, diaTexto: "08", total: 105.90, totalFormatado: "105,90" },
  { dia: 9, diaTexto: "09", total: 92.40, totalFormatado: "92,40" },
  { dia: 10, diaTexto: "10", total: 115.70, totalFormatado: "115,70" },
  { dia: 11, diaTexto: "11", total: 89.30, totalFormatado: "89,30" },
  { dia: 12, diaTexto: "12", total: 100.80, totalFormatado: "100,80" },
  { dia: 13, diaTexto: "13", total: 125.60, totalFormatado: "125,60" },
  { dia: 14, diaTexto: "14", total: 94.20, totalFormatado: "94,20" },
  { dia: 15, diaTexto: "15", total: 108.50, totalFormatado: "108,50" },
  { dia: 16, diaTexto: "16", total: 83.90, totalFormatado: "83,90" },
  { dia: 17, diaTexto: "17", total: 117.40, totalFormatado: "117,40" },
  { dia: 18, diaTexto: "18", total: 96.70, totalFormatado: "96,70" },
  { dia: 19, diaTexto: "19", total: 102.30, totalFormatado: "102,30" },
  { dia: 20, diaTexto: "20", total: 88.60, totalFormatado: "88,60" },
  { dia: 21, diaTexto: "21", total: 114.80, totalFormatado: "114,80" },
  { dia: 22, diaTexto: "22", total: 91.50, totalFormatado: "91,50" },
  { dia: 23, diaTexto: "23", total: 106.20, totalFormatado: "106,20" },
  { dia: 24, diaTexto: "24", total: 99.40, totalFormatado: "99,40" },
  { dia: 25, diaTexto: "25", total: 121.70, totalFormatado: "121,70" },
  { dia: 26, diaTexto: "26", total: 86.30, totalFormatado: "86,30" },
  { dia: 27, diaTexto: "27", total: 103.60, totalFormatado: "103,60" },
  { dia: 28, diaTexto: "28", total: 97.80, totalFormatado: "97,80" },
  { dia: 29, diaTexto: "29", total: 109.20, totalFormatado: "109,20" },
  { dia: 30, diaTexto: "30", total: 93.50, totalFormatado: "93,50" },
  { dia: 31, diaTexto: "31", total: 89.80, totalFormatado: "89,80" },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[TotalDia] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const ArrecadacaoTotalDiaServico = {
  /**
   * Obtém a arrecadação diária consolidada formatada para o painel
   */
  async obterTotalDia(): Promise<RespostaTotalDia> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_ARRECADACAO, {});
    const configDia = dadosArquivo.totaisDia || {};

    const diasRaw: Array<{ dia: number; diaTexto: string; total: number; totalFormatado: string }> =
      configDia.dias && Array.isArray(configDia.dias) && configDia.dias.length > 0
        ? configDia.dias
        : DADOS_PADRAO_DIAS;

    let soma = 0;
    const dias: ItemTotalDia[] = diasRaw.map((d) => {
      soma += d.total;
      return {
        dia: d.dia,
        diaTexto: d.diaTexto,
        total: d.total,
        totalFormatado: d.totalFormatado,
        linha: `Dia ${d.diaTexto} foi ${d.totalFormatado}`,
      };
    });

    const totalGeralFormatado = configDia.totalGeralFormatado || soma.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const linhaTotal = `Total foi ${totalGeralFormatado}`;

    // Agrupamento decendial conforme exibição solicitada: 01-10, 11-20, 21-31
    const grupo1 = dias.filter((d) => d.dia >= 1 && d.dia <= 10).map((d) => d.linha);
    const grupo2 = dias.filter((d) => d.dia >= 11 && d.dia <= 20).map((d) => d.linha);
    const grupo3 = dias.filter((d) => d.dia >= 21 && d.dia <= 31).map((d) => d.linha);

    const titulo = "Por dia.";
    const textoFormatado =
      `${titulo}\n` +
      `${grupo1.join("\n")}\n\n\n` +
      `${grupo2.join("\n")}\n\n\n` +
      `${grupo3.join("\n")}\n\n` +
      linhaTotal;

    const linhas = [...dias.map((d) => d.linha), linhaTotal];

    return {
      sucesso: true,
      area: "total_dia",
      titulo,
      dias,
      linhas,
      totalGeral: Number(soma.toFixed(2)),
      totalGeralFormatado,
      linhaTotal,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente os totais diários para a API_URL (Painel)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_arrecadacao_total_dia",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterTotalDia();

      const payload = {
        evento,
        area: "total_dia",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          dias: metricas.dias,
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

export default ArrecadacaoTotalDiaServico;
