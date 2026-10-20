import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface MetricasDivulgacoesValores {
  divulgacoes: number;
  publicacoes: number;
  campanhas: number;
}

export interface MetricasDivulgacoesFormatadas {
  divulgacoes: string;
  publicacoes: string;
  campanhas: string;
}

export interface RespostaCompletaDivulgacoes {
  sucesso: boolean;
  area: "divulgacoes";
  titulo: string;
  fonte: string;
  valores: MetricasDivulgacoesValores;
  valoresFormatados: MetricasDivulgacoesFormatadas;
  dados: MetricasDivulgacoesValores;
  divulgacoes: number;
  publicacoes: number;
  campanhas: number;
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_PUBLICACOES = path.resolve(process.cwd(), "publicacoes.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

export function formatarNumeroMilhar(valor: number): string {
  if (isNaN(valor)) return "0";
  return valor.toLocaleString("pt-BR");
}

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "[]");
    }
  } catch (err) {
    console.warn(`[Divulgacoes] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const DivulgacoesServico = {
  /**
   * Consolida métricas 100% REAIS da área de divulgações (divulgações = publicações + campanhas).
   * Sem dados artificiais ou arquivos de baseline: tudo zerado se não houver registros reais.
   */
  async obterMetricasCompletas(): Promise<RespostaCompletaDivulgacoes> {
    let fonte = "arquivos_persistentes";
    let totalPublicacoes = 0;
    let totalCampanhas = 0;

    // 1. Tenta obter registros reais do banco PostgreSQL caso conectado
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        fonte = "banco_postgresql";

        const resPubs = await pool.query("SELECT COUNT(*) as total FROM publicacoes");
        if (resPubs.rows.length > 0) {
          totalPublicacoes = Number(resPubs.rows[0].total || 0);
        }

        const resCamps = await pool.query("SELECT COUNT(*) as total FROM campanhas");
        if (resCamps.rows.length > 0) {
          totalCampanhas = Number(resCamps.rows[0].total || 0);
        }
        usouPostgres = true;
      }
    } catch (err: any) {
      console.warn("[Divulgacoes] PostgreSQL indisponível para contagem real:", err.message);
    }

    // 2. Se não utilizou PostgreSQL, conta os registros reais nos arquivos de dados
    if (!usouPostgres) {
      const listaPubs = lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []);
      const listaCamps = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
      totalPublicacoes = Array.isArray(listaPubs) ? listaPubs.length : 0;
      totalCampanhas = Array.isArray(listaCamps) ? listaCamps.length : 0;
    }

    // Divulgação é a união de campanhas e publicações reais
    const totalDivulgacoes = totalPublicacoes + totalCampanhas;

    const valores: MetricasDivulgacoesValores = {
      divulgacoes: totalDivulgacoes,
      publicacoes: totalPublicacoes,
      campanhas: totalCampanhas,
    };

    const valoresFormatados: MetricasDivulgacoesFormatadas = {
      divulgacoes: formatarNumeroMilhar(valores.divulgacoes),
      publicacoes: formatarNumeroMilhar(valores.publicacoes),
      campanhas: formatarNumeroMilhar(valores.campanhas),
    };

    const titulo = "área : divulgações :";

    const linhas = [
      `são ${valoresFormatados.divulgacoes} divulgações`,
      `são ${valoresFormatados.publicacoes} publicações`,
      `são ${valoresFormatados.campanhas} campanhas`,
    ];

    const textoFormatado =
      `${titulo}\n` +
      `são ${valoresFormatados.divulgacoes} divulgações\n` +
      `são ${valoresFormatados.publicacoes} publicações\n` +
      `são ${valoresFormatados.campanhas} campanhas`;

    return {
      sucesso: true,
      area: "divulgacoes",
      titulo,
      fonte,
      valores,
      valoresFormatados,
      dados: valores,
      divulgacoes: valores.divulgacoes,
      publicacoes: valores.publicacoes,
      campanhas: valores.campanhas,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia os dados reais de divulgações para a API_URL (PAINEL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_divulgacoes",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterMetricasCompletas();

      const payload = {
        evento,
        area: "divulgacoes",
        origem: "website_2",
        dados: {
          valores: metricas.valores,
          valoresFormatados: metricas.valoresFormatados,
          divulgacoes: metricas.valores.divulgacoes,
          publicacoes: metricas.valores.publicacoes,
          campanhas: metricas.valores.campanhas,
          textoFormatado: metricas.textoFormatado,
          linhas: metricas.linhas,
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

export default DivulgacoesServico;
