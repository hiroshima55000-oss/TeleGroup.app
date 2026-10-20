import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemTotalAno {
  ano: number;
  total: number;
  totalFormatado: string;
  linha: string;
}

export interface RespostaTotalAno {
  sucesso: boolean;
  area: "total_ano";
  titulo: string;
  anos: ItemTotalAno[];
  linhas: string[];
  textoFormatado: string;
  totalGeral: number;
  totalGeralFormatado: string;
  timestamp: string;
}

const ARQUIVO_ARRECADACAO = path.resolve(process.cwd(), "admin_arrecadacao.dados.json");

const DADOS_PADRAO_ANO: Array<{ ano: number; total: number; totalFormatado: string }> = [
  { ano: 2005, total: 8432.50, totalFormatado: "8.432,50" },
  { ano: 2006, total: 9175.80, totalFormatado: "9.175,80" },
  { ano: 2007, total: 11284.30, totalFormatado: "11.284,30" },
  { ano: 2008, total: 7956.40, totalFormatado: "7.956,40" },
  { ano: 2009, total: 12637.90, totalFormatado: "12.637,90" },
  { ano: 2010, total: 14285.60, totalFormatado: "14.285,60" },
  { ano: 2011, total: 10748.20, totalFormatado: "10.748,20" },
  { ano: 2012, total: 16392.70, totalFormatado: "16.392,70" },
  { ano: 2013, total: 13856.40, totalFormatado: "13.856,40" },
  { ano: 2014, total: 18475.90, totalFormatado: "18.475,90" },
  { ano: 2015, total: 15628.30, totalFormatado: "15.628,30" },
  { ano: 2016, total: 19347.60, totalFormatado: "19.347,60" },
  { ano: 2017, total: 17892.50, totalFormatado: "17.892,50" },
  { ano: 2018, total: 21456.80, totalFormatado: "21.456,80" },
  { ano: 2019, total: 20183.40, totalFormatado: "20.183,40" },
  { ano: 2020, total: 24765.20, totalFormatado: "24.765,20" },
  { ano: 2021, total: 18934.70, totalFormatado: "18.934,70" },
  { ano: 2022, total: 26382.90, totalFormatado: "26.382,90" },
  { ano: 2023, total: 23647.50, totalFormatado: "23.647,50" },
  { ano: 2024, total: 19825.60, totalFormatado: "19.825,60" },
  { ano: 2025, total: 22217.60, totalFormatado: "22.217,60" },
  { ano: 2026, total: 23556.60, totalFormatado: "23.556,60" },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[TotalAno] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const ArrecadacaoTotalAnoServico = {
  /**
   * Obtém a arrecadação anual consolidada formatada para o painel
   */
  async obterTotalAno(): Promise<RespostaTotalAno> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_ARRECADACAO, {});
    const listaRaw: Array<{ ano: number; total: number; totalFormatado: string }> =
      dadosArquivo.totaisAno && Array.isArray(dadosArquivo.totaisAno) && dadosArquivo.totaisAno.length > 0
        ? dadosArquivo.totaisAno
        : DADOS_PADRAO_ANO;

    let soma = 0;
    const anos: ItemTotalAno[] = listaRaw.map((item) => {
      soma += item.total;
      return {
        ano: item.ano,
        total: item.total,
        totalFormatado: item.totalFormatado,
        linha: `acessar ${item.ano} total: ${item.totalFormatado}`,
      };
    });

    // Agrupamento visual com linhas em branco conforme exemplo do painel
    // Grupo 1: 2005-2009 (5)
    // Grupo 2: 2010-2019 (10)
    // Grupo 3: 2020-2026 (7)
    const grupo1 = anos.filter((a) => a.ano >= 2005 && a.ano <= 2009).map((a) => a.linha);
    const grupo2 = anos.filter((a) => a.ano >= 2010 && a.ano <= 2019).map((a) => a.linha);
    const grupo3 = anos.filter((a) => a.ano >= 2020).map((a) => a.linha);

    const blocos: string[] = [];
    if (grupo1.length > 0) blocos.push(grupo1.join("\n"));
    if (grupo2.length > 0) blocos.push(grupo2.join("\n"));
    if (grupo3.length > 0) blocos.push(grupo3.join("\n"));

    const titulo = "Por ano :";
    const textoFormatado = `${titulo}\n${blocos.join("\n\n")}`;
    const linhas = anos.map((a) => a.linha);

    return {
      sucesso: true,
      area: "total_ano",
      titulo,
      anos,
      linhas,
      textoFormatado,
      totalGeral: Number(soma.toFixed(2)),
      totalGeralFormatado: soma.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente os totais anuais para a API_URL (Painel)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_arrecadacao_total_ano",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterTotalAno();

      const payload = {
        evento,
        area: "total_ano",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          anos: metricas.anos,
          linhas: metricas.linhas,
          textoFormatado: metricas.textoFormatado,
          totalGeral: metricas.totalGeral,
          totalGeralFormatado: metricas.totalGeralFormatado,
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

export default ArrecadacaoTotalAnoServico;
