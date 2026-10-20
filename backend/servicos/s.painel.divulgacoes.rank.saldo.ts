import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemRankingSaldo {
  posicao: number;
  usuario: string;
  saldo: number;
  saldoFormatado: string;
  linha: string;
}

export interface RespostaRankingSaldo {
  sucesso: boolean;
  area: "rank_saldo";
  titulo: string;
  fonte: string;
  totalUsuarios: number;
  ranking: ItemRankingSaldo[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_RANKINGS = path.resolve(process.cwd(), "admin_rankings.dados.json");

const DADOS_PADRAO_SALDO: ItemRankingSaldo[] = [
  {
    posicao: 1,
    usuario: "@lucas",
    saldo: 12877.90,
    saldoFormatado: "12.877,90",
    linha: "saldo de 12.877,90 de @lucas",
  },
  {
    posicao: 2,
    usuario: "@zebra",
    saldo: 11989.90,
    saldoFormatado: "11.989,90",
    linha: "saldo de 11.989,90 de @zebra",
  },
  {
    posicao: 3,
    usuario: "@will",
    saldo: 11503.90,
    saldoFormatado: "11.503,90",
    linha: "saldo de 11.503,90 de @will",
  },
  {
    posicao: 4,
    usuario: "@talon",
    saldo: 10433.90,
    saldoFormatado: "10.433,90",
    linha: "saldo de 10.433,90 de @talon",
  },
  {
    posicao: 5,
    usuario: "@juba",
    saldo: 10271.90,
    saldoFormatado: "10.271,90",
    linha: "saldo de 10.271,90 de @juba",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RankSaldo] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const RankSaldoServico = {
  /**
   * Obtém o ranking formatado de saldos disponíveis
   */
  async obterRankingSaldos(): Promise<RespostaRankingSaldo> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    const lista: ItemRankingSaldo[] =
      dadosArquivo.saldos && Array.isArray(dadosArquivo.saldos) && dadosArquivo.saldos.length > 0
        ? dadosArquivo.saldos
        : DADOS_PADRAO_SALDO;

    const titulo = "rank de saldos disponíveis:";
    const linhas = lista.map((item) => item.linha || `saldo de ${item.saldoFormatado} de ${item.usuario}`);
    const textoFormatado = `${titulo}\n${linhas.join("\n")}`;

    return {
      sucesso: true,
      area: "rank_saldo",
      titulo,
      fonte: dadosArquivo.saldos ? "arquivo_persistente" : "padrao",
      totalUsuarios: lista.length,
      ranking: lista,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o ranking de saldos para o painel administrativo (API_URL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_saldo",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingSaldos();

      const payload = {
        evento,
        area: "rank_saldo",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalUsuarios: metricas.totalUsuarios,
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

export default RankSaldoServico;
