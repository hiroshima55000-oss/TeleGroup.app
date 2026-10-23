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
   * Obtém o ranking real de investidores baseado nas campanhas pagas
   */
  async obterRankingInvestidores(): Promise<RespostaRankingInvestidores> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    let lista: ItemRankingInvestidor[] = [];

    if (dadosArquivo.investidores && Array.isArray(dadosArquivo.investidores) && dadosArquivo.investidores.length > 0) {
      lista = dadosArquivo.investidores;
    } else {
      try {
        const { RepositorioCampanhas } = await import("../repositorios/repositorio.campanhas");
        const todasCampanhas = await RepositorioCampanhas.buscarTodas();
        const somaPorUsuario = new Map<string, number>();

        for (const c of todasCampanhas) {
          const usr = ((c as any).usuario || c.usuarioId || "investidor").trim();
          const handle = usr.startsWith("@") ? usr : `@${usr}`;
          const valor = Number(c.gastoTotal || (c.orcamentoDiario ? c.orcamentoDiario * 30 : 0) || 0);
          if (valor > 0) {
            somaPorUsuario.set(handle, (somaPorUsuario.get(handle) || 0) + valor);
          }
        }

        lista = Array.from(somaPorUsuario.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([usuario, valor], idx) => {
            const valorFormatado = valor.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return {
              posicao: idx + 1,
              usuario,
              valor,
              valorFormatado,
              linha: `foi investido ${valorFormatado} por ${usuario}`,
            };
          });
      } catch {
        lista = [];
      }
    }

    const titulo = "rank de investidores:";
    const linhas = lista.map((item) => item.linha || `foi investido ${item.valorFormatado} por ${item.usuario}`);
    const textoFormatado =
      linhas.length > 0
        ? `${titulo}\n${linhas.join("\n")}`
        : `${titulo}\nnenhum investimento registrado ainda`;

    return {
      sucesso: true,
      area: "rank_investidores",
      titulo,
      fonte: "banco_real",
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
