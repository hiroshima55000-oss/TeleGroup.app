import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemRankingAnunciante {
  posicao: number;
  usuario: string;
  quantidade: number;
  quantidadeFormatada: string;
  linha: string;
}

export interface RespostaRankingAnunciantes {
  sucesso: boolean;
  area: "rank_anunciantes";
  titulo: string;
  fonte: string;
  totalAnunciantes: number;
  ranking: ItemRankingAnunciante[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_RANKINGS = path.resolve(process.cwd(), "admin_rankings.dados.json");

const DADOS_PADRAO_ANUNCIANTES: ItemRankingAnunciante[] = [
  {
    posicao: 1,
    usuario: "@mariayt",
    quantidade: 507,
    quantidadeFormatada: "507",
    linha: "507 campanhas de @mariayt",
  },
  {
    posicao: 2,
    usuario: "@cutsw",
    quantidade: 501,
    quantidadeFormatada: "501",
    linha: "501 campanhas de @cutsw",
  },
  {
    posicao: 3,
    usuario: "@lulaew",
    quantidade: 487,
    quantidadeFormatada: "487",
    linha: "487 campanhas de @lulaew",
  },
  {
    posicao: 4,
    usuario: "@viro12",
    quantidade: 322,
    quantidadeFormatada: "322",
    linha: "322 campanhas de @viro12",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RankAnunciantes] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const RankAnunciantesServico = {
  /**
   * Obtém o ranking formatado de anunciantes
   */
  async obterRankingAnunciantes(): Promise<RespostaRankingAnunciantes> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    const lista: ItemRankingAnunciante[] =
      dadosArquivo.anunciantes && Array.isArray(dadosArquivo.anunciantes) && dadosArquivo.anunciantes.length > 0
        ? dadosArquivo.anunciantes
        : DADOS_PADRAO_ANUNCIANTES;

    const titulo = "rank de anunciantes:";
    const linhas = lista.map((item) => item.linha || `${item.quantidade} campanhas de ${item.usuario}`);
    const textoFormatado = `${titulo}\n${linhas.join("\n")}`;

    return {
      sucesso: true,
      area: "rank_anunciantes",
      titulo,
      fonte: dadosArquivo.anunciantes ? "arquivo_persistente" : "padrao",
      totalAnunciantes: lista.length,
      ranking: lista,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o ranking de anunciantes para o painel administrativo (API_URL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_anunciantes",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingAnunciantes();

      const payload = {
        evento,
        area: "rank_anunciantes",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalAnunciantes: metricas.totalAnunciantes,
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

export default RankAnunciantesServico;
