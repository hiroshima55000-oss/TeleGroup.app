import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemRankingPublicador {
  posicao: number;
  usuario: string;
  quantidade: number;
  quantidadeFormatada: string;
  linha: string;
}

export interface RespostaRankingPublicadores {
  sucesso: boolean;
  area: "rank_publicadores";
  titulo: string;
  fonte: string;
  totalPublicadores: number;
  ranking: ItemRankingPublicador[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_RANKINGS = path.resolve(process.cwd(), "admin_rankings.dados.json");

const DADOS_PADRAO_PUBLICADORES: ItemRankingPublicador[] = [
  {
    posicao: 1,
    usuario: "@mariayt",
    quantidade: 507,
    quantidadeFormatada: "507",
    linha: "507 publicações de @mariayt",
  },
  {
    posicao: 2,
    usuario: "@cutsw",
    quantidade: 501,
    quantidadeFormatada: "501",
    linha: "501 publicações de @cutsw",
  },
  {
    posicao: 3,
    usuario: "@lulaew",
    quantidade: 487,
    quantidadeFormatada: "487",
    linha: "487 publicações de @lulaew",
  },
  {
    posicao: 4,
    usuario: "@viro12",
    quantidade: 322,
    quantidadeFormatada: "322",
    linha: "322 publicações de @viro12",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RankPublicadores] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const RankPublicadoresServico = {
  /**
   * Obtém o ranking formatado de publicadores
   */
  async obterRankingPublicadores(): Promise<RespostaRankingPublicadores> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    const lista: ItemRankingPublicador[] =
      dadosArquivo.publicadores && Array.isArray(dadosArquivo.publicadores) && dadosArquivo.publicadores.length > 0
        ? dadosArquivo.publicadores
        : DADOS_PADRAO_PUBLICADORES;

    const titulo = "rank de publicadores:";
    const linhas = lista.map((item) => item.linha || `${item.quantidade} publicações de ${item.usuario}`);
    const textoFormatado = `${titulo}\n${linhas.join("\n")}`;

    return {
      sucesso: true,
      area: "rank_publicadores",
      titulo,
      fonte: dadosArquivo.publicadores ? "arquivo_persistente" : "padrao",
      totalPublicadores: lista.length,
      ranking: lista,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o ranking de publicadores para o painel administrativo (API_URL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_publicadores",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingPublicadores();

      const payload = {
        evento,
        area: "rank_publicadores",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalPublicadores: metricas.totalPublicadores,
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

export default RankPublicadoresServico;
