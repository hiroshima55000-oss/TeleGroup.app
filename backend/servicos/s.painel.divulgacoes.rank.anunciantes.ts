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
   * Obtém o ranking real de anunciantes baseado nas campanhas salvas
   */
  async obterRankingAnunciantes(): Promise<RespostaRankingAnunciantes> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    let lista: ItemRankingAnunciante[] = [];

    if (dadosArquivo.anunciantes && Array.isArray(dadosArquivo.anunciantes) && dadosArquivo.anunciantes.length > 0) {
      lista = dadosArquivo.anunciantes;
    } else {
      try {
        const { RepositorioCampanhas } = await import("../repositorios/repositorio.campanhas");
        const todasCampanhas = await RepositorioCampanhas.buscarTodas();
        const contagemPorUsuario = new Map<string, number>();

        for (const c of todasCampanhas) {
          const usr = ((c as any).usuario || c.usuarioId || "anunciante").trim();
          const handle = usr.startsWith("@") ? usr : `@${usr}`;
          contagemPorUsuario.set(handle, (contagemPorUsuario.get(handle) || 0) + 1);
        }

        lista = Array.from(contagemPorUsuario.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([usuario, quantidade], idx) => ({
            posicao: idx + 1,
            usuario,
            quantidade,
            quantidadeFormatada: String(quantidade),
            linha: `${quantidade} campanhas de ${usuario}`,
          }));
      } catch {
        lista = [];
      }
    }

    const titulo = "rank de anunciantes:";
    const linhas = lista.map((item) => item.linha || `${item.quantidade} campanhas de ${item.usuario}`);
    const textoFormatado = linhas.length > 0 ? `${titulo}\n${linhas.join("\n")}` : `${titulo}\nnenhum anunciante registrado ainda`;

    return {
      sucesso: true,
      area: "rank_anunciantes",
      titulo,
      fonte: "banco_real",
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
