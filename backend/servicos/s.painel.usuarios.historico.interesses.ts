import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import { PerfilInteressesServico } from "./AlgoritmoOrganico/s.perfil.interesses";
import { PerfilInteresseUsuario, GrupoInteressePercentual } from "./AlgoritmoOrganico/tipos.interesses";

export interface ItemInteresseGrupo {
  grupoNome: string;
  percentual: number;
  pontosPonderados?: number;
  totalAcoes?: number;
  linhaFormatada: string; // Ex: "39.37% em grupo de marketing digital"
}

export interface PerfilInteressePainel {
  usuarioId: string;
  usuario: string; // Ex: "@vitinho"
  classificacaoPublico: string; // Ex: "Público de Alto Clique (Tráfego Focado)"
  taxaCliquesCTR: number; // Ex: 29.19
  taxaCliquesCTRFormatada: string; // Ex: "29,19%"
  totalInteracoes: number;
  totalLikes: number;
  totalCliques: number;
  totalVisualizacoes: number;
  distribuicaoPercentual: Record<string, number>;
  distribuicaoGrupos: ItemInteresseGrupo[];
  topHashtags: string[];
  linhasTexto: string[];
  textoFormatado: string;
  ultimaAtualizacao?: string;
}

export interface GrupoRankingGlobal {
  posicao: number;
  grupoNome: string;
  percentualMedio: number;
  percentualMedioFormatado: string;
  totalUsuariosEngajados: number;
  totalAcoes: number;
  linha: string;
}

export interface RespostaHistoricoInteresses {
  sucesso: boolean;
  area: "historico_interesses";
  titulo: string;
  fonte: string;
  totalPerfis: number;
  rankingGruposGerais: GrupoRankingGlobal[];
  perfis: PerfilInteressePainel[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_INTERESSES = path.resolve(process.cwd(), "usuarios_interesses.dados.json");
const ARQUIVO_USUARIOS_METRICAS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[PainelUsuariosHistoricoInteresses] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

/**
 * Normaliza um identificador de usuário para busca
 */
function normalizarIdentificador(termo: string): { handle: string; termoLimpo: string } {
  const limpo = (termo || "").trim().toLowerCase();
  const handle = limpo.startsWith("@") ? limpo : `@${limpo}`;
  const termoLimpo = handle.replace(/^@/, "");
  return { handle, termoLimpo };
}

/**
 * Formata um perfil de interesses em bloco de texto padronizado para o painel administrativo
 */
export function formatarTextoPerfilInteresses(perfil: {
  usuario: string;
  classificacaoPublico: string;
  taxaCliquesCTR: number;
  distribuicaoGrupos: ItemInteresseGrupo[];
}): string {
  const ctrFormatado = perfil.taxaCliquesCTR.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const linhasGrupos = perfil.distribuicaoGrupos.map((g) => g.linhaFormatada);
  const blocosDistribuicao = linhasGrupos.length > 0
    ? linhasGrupos.join("\n")
    : "nenhum interesse específico registrado ainda";

  return [
    `perfil de interesses : ${perfil.usuario}`,
    `classificação : ${perfil.classificacaoPublico}`,
    `taxa de cliques CTR : ${ctrFormatado}%`,
    "",
    "distribuição de interesses :",
    blocosDistribuicao,
  ].join("\n");
}

export const PainelUsuariosHistoricoInteressesServico = {
  /**
   * Obtém o perfil de interesses de um usuário específico formatado para o painel
   */
  obterPerfilUsuario(identificador: string): PerfilInteressePainel {
    const { handle, termoLimpo } = normalizarIdentificador(identificador);
    const dadosArquivo = lerJsonSeguro<Record<string, PerfilInteresseUsuario>>(ARQUIVO_INTERESSES, {});

    // 1. Tenta buscar no arquivo de interesses persistente
    let usuarioIdEncontrado: string = termoLimpo;
    let perfilRaw: PerfilInteresseUsuario | null = null;

    for (const [id, p] of Object.entries(dadosArquivo)) {
      const pNick = (p.nickname || "").trim().toLowerCase();
      const pId = (p.usuarioId || id || "").trim().toLowerCase();

      if (
        pNick === handle ||
        pNick === termoLimpo ||
        pNick.replace(/^@/, "") === termoLimpo ||
        pId === termoLimpo ||
        pId === handle
      ) {
        usuarioIdEncontrado = id;
        perfilRaw = p;
        break;
      }
    }

    // 2. Se não encontrou, recorre ao PerfilInteressesServico que pode construir em runtime
    if (!perfilRaw) {
      perfilRaw = PerfilInteressesServico.obterPerfil(usuarioIdEncontrado, handle);
    }

    const classificacaoPublico = perfilRaw.classificacaoPublico || "Passivo";
    const taxaCliquesCTR = Number(perfilRaw.taxaCliquesCTR || 0);
    const taxaCliquesCTRFormatada = `${taxaCliquesCTR.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

    const distribuicaoGrupos: ItemInteresseGrupo[] = (perfilRaw.distribuicaoGrupos || []).map((g) => {
      const pct = Number(g.percentual || 0);
      const linhaFormatada = `${pct.toFixed(2)}% em grupo de ${g.grupoNome}`;
      return {
        grupoNome: g.grupoNome,
        percentual: pct,
        pontosPonderados: g.pontosPonderados,
        totalAcoes: g.totalAcoes,
        linhaFormatada,
      };
    });

    const topHashtags = Object.keys(perfilRaw.hashtags || {}).slice(0, 10);
    const linhasTexto = distribuicaoGrupos.map((g) => g.linhaFormatada);

    const textoFormatado = formatarTextoPerfilInteresses({
      usuario: handle,
      classificacaoPublico,
      taxaCliquesCTR,
      distribuicaoGrupos,
    });

    return {
      usuarioId: perfilRaw.usuarioId || usuarioIdEncontrado,
      usuario: perfilRaw.nickname || handle,
      classificacaoPublico,
      taxaCliquesCTR,
      taxaCliquesCTRFormatada,
      totalInteracoes: Number(perfilRaw.totalInteracoes || 0),
      totalLikes: Number(perfilRaw.totalLikes || 0),
      totalCliques: Number(perfilRaw.totalCliques || 0),
      totalVisualizacoes: Number(perfilRaw.totalVisualizacoes || 0),
      distribuicaoPercentual: perfilRaw.distribuicaoPercentual || {},
      distribuicaoGrupos,
      topHashtags,
      linhasTexto,
      textoFormatado,
      ultimaAtualizacao: perfilRaw.ultimaAtualizacao,
    };
  },

  /**
   * Consolida todos os perfis de interesses de usuários e o ranking geral de categorias
   */
  async obterHistoricoGeral(): Promise<RespostaHistoricoInteresses> {
    const dadosArquivo = lerJsonSeguro<Record<string, PerfilInteresseUsuario>>(ARQUIVO_INTERESSES, {});
    const perfisIds = Object.keys(dadosArquivo);

    const perfis: PerfilInteressePainel[] = perfisIds.map((id) =>
      this.obterPerfilUsuario(id)
    );

    // Consolida ranking geral acumulado de grupos de interesses
    const acumuladorGrupos = new Map<string, { somaPercentual: number; contagem: number; totalAcoes: number }>();

    for (const p of perfis) {
      for (const g of p.distribuicaoGrupos) {
        const atual = acumuladorGrupos.get(g.grupoNome) || { somaPercentual: 0, contagem: 0, totalAcoes: 0 };
        atual.somaPercentual += g.percentual;
        atual.contagem += 1;
        atual.totalAcoes += Number(g.totalAcoes || 0);
        acumuladorGrupos.set(g.grupoNome, atual);
      }
    }

    const totalUsuariosComInteresse = Math.max(1, perfis.length);

    const rankingGruposGerais: GrupoRankingGlobal[] = Array.from(acumuladorGrupos.entries())
      .map(([grupoNome, dados]) => {
        const percentualMedio = Number((dados.somaPercentual / totalUsuariosComInteresse).toFixed(2));
        const percentualMedioFormatado = `${percentualMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
        return {
          posicao: 0,
          grupoNome,
          percentualMedio,
          percentualMedioFormatado,
          totalUsuariosEngajados: dados.contagem,
          totalAcoes: dados.totalAcoes,
          linha: `${percentualMedioFormatado} de interesse geral em grupo de ${grupoNome}`,
        };
      })
      .sort((a, b) => b.percentualMedio - a.percentualMedio)
      .map((item, idx) => ({
        ...item,
        posicao: idx + 1,
      }));

    const titulo = "histórico de interesses de usuários:";
    const linhas = rankingGruposGerais.map((r) => r.linha);

    const blocosPerfisTexto = perfis.map((p) => p.textoFormatado).join("\n\n----------------------------------------\n\n");

    const textoFormatado =
      `${titulo}\n\n` +
      `ranking geral de afinidade por grupo:\n` +
      `${linhas.join("\n")}\n\n` +
      `========================================\n` +
      `PERFIS DETALHADOS POR USUÁRIO\n` +
      `========================================\n\n` +
      blocosPerfisTexto;

    return {
      sucesso: true,
      area: "historico_interesses",
      titulo,
      fonte: "usuarios_interesses.dados.json",
      totalPerfis: perfis.length,
      rankingGruposGerais,
      perfis,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o histórico de interesses para a API_URL (Website 1 / Painel)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_historico_interesses",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterHistoricoGeral();

      const payload = {
        evento,
        area: "historico_interesses",
        modulo: "s.painel.usuarios.historico.interesses",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalPerfis: metricas.totalPerfis,
          rankingGruposGerais: metricas.rankingGruposGerais,
          perfis: metricas.perfis,
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

export default PainelUsuariosHistoricoInteressesServico;
