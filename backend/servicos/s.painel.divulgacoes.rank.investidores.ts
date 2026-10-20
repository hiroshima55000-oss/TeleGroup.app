import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemRankingInvestidor {
  posicao: number;
  usuario: string;
  valor: number;
  valorFormatado: string;
  linha: string;
}

export interface RespostaRankingInvestidores {
  sucesso: boolean;
  area: "rank_investidores";
  titulo: string;
  fonte: string;
  totalInvestidores: number;
  ranking: ItemRankingInvestidor[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_RANKINGS = path.resolve(process.cwd(), "admin_rankings.dados.json");

const DADOS_PADRAO_INVESTIDORES: ItemRankingInvestidor[] = [
  {
    posicao: 1,
    usuario: "@julios",
    valor: 12301.90,
    valorFormatado: "12.301,90",
    linha: "foi investido 12.301,90 por @julios",
  },
  {
    posicao: 2,
    usuario: "@viro12",
    valor: 12136.87,
    valorFormatado: "12.136,87",
    linha: "foi investido 12.136,87 por @viro12",
  },
  {
    posicao: 3,
    usuario: "@julios",
    valor: 11321.76,
    valorFormatado: "11.321,76",
    linha: "foi investido 11.321,76 por @julios",
  },
  {
    posicao: 4,
    usuario: "@lulaew",
    valor: 10376.65,
    valorFormatado: "10.376,65",
    linha: "foi investido 10.376,65 por @lulaew",
  },
  {
    posicao: 5,
    usuario: "@luldd",
    valor: 237.30,
    valorFormatado: "2.37,30",
    linha: "foi investido 2.37,30 por @luldd",
  },
  {
    posicao: 6,
    usuario: "@lulaew12",
    valor: 1327.35,
    valorFormatado: "1.327,35",
    linha: "foi investido 1.327,35 por @lulaew12",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RankInvestidores] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const RankInvestidoresServico = {
  /**
   * Obtém o ranking formatado de investidores
   */
  async obterRankingInvestidores(): Promise<RespostaRankingInvestidores> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    const lista: ItemRankingInvestidor[] =
      dadosArquivo.investidores && Array.isArray(dadosArquivo.investidores) && dadosArquivo.investidores.length > 0
        ? dadosArquivo.investidores
        : DADOS_PADRAO_INVESTIDORES;

    const titulo = "rank de investidores:";
    const linhas = lista.map((item) => item.linha || `foi investido ${item.valorFormatado} por ${item.usuario}`);

    // Preserva o espaçamento visual do painel se houver quebra entre grupos
    const textoFormatado = `${titulo}\n${linhas.slice(0, 4).join("\n")}\n\n${linhas.slice(4).join("\n")}`.trim();

    return {
      sucesso: true,
      area: "rank_investidores",
      titulo,
      fonte: dadosArquivo.investidores ? "arquivo_persistente" : "padrao",
      totalInvestidores: lista.length,
      ranking: lista,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o ranking de investidores para o painel administrativo (API_URL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_investidores",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingInvestidores();

      const payload = {
        evento,
        area: "rank_investidores",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalInvestidores: metricas.totalInvestidores,
          ranking: metricas.ranking,
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
};

export default RankInvestidoresServico;
