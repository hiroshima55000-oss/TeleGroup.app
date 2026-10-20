import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemTransferencia {
  id?: string;
  usuario: string; // Ex: "@acbdwsa"
  valor: number; // Ex: 35.90
  valorFormatado: string; // Ex: "+35,90"
  hora: string; // Ex: "12:40"
  data: string; // Ex: "21/10/2026"
  bloco?: string;
}

export interface RespostaHistoricoTransferencias {
  sucesso: boolean;
  area: "historico_transferencias";
  titulo: string;
  subtitulo: string;
  intervaloTitulo: string;
  intervaloMax: string;
  intervaloMin: string;
  transferencias: ItemTransferencia[];
  blocosTexto: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_ARRECADACAO = path.resolve(process.cwd(), "admin_arrecadacao.dados.json");

const DADOS_PADRAO_TRANSFERENCIAS: ItemTransferencia[] = [
  {
    usuario: "@acbdwsa",
    valor: 35.90,
    valorFormatado: "+35,90",
    hora: "12:40",
    data: "21/10/2026",
  },
  {
    usuario: "@acbdwsa",
    valor: 35.90,
    valorFormatado: "+35,90",
    hora: "12:40",
    data: "21/10/2026",
  },
  {
    usuario: "@acbdwsa",
    valor: 35.90,
    valorFormatado: "+35,90",
    hora: "12:40",
    data: "21/10/2026",
  },
  {
    usuario: "@acbdwsa",
    valor: 35.90,
    valorFormatado: "+35,90",
    hora: "12:40",
    data: "21/10/2026",
  },
  {
    usuario: "@acbdwsa",
    valor: 35.90,
    valorFormatado: "+35,90",
    hora: "12:40",
    data: "21/10/2026",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[HistoricoTransferencias] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const ArrecadacaoHistoricoTransferenciasServico = {
  /**
   * Obtém o histórico detalhado de transferências formatado para o painel
   */
  async obterHistorico(): Promise<RespostaHistoricoTransferencias> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_ARRECADACAO, {});
    const config = dadosArquivo.transferencias || {};

    const intervaloMax = config.intervaloMax || "30 mins";
    const intervaloMin = config.intervaloMin || "1 mins e 54s";
    const transferencias: ItemTransferencia[] =
      config.itens && Array.isArray(config.itens) && config.itens.length > 0
        ? config.itens
        : DADOS_PADRAO_TRANSFERENCIAS;

    const blocosTexto = transferencias.map((t) => {
      const val = t.valorFormatado.startsWith("+") ? t.valorFormatado : `+${t.valorFormatado}`;
      return `${t.usuario} transferiu ${val} \nàs ${t.hora} em ${t.data}`;
    });

    const textoFormatado =
      `histórico de transferências.\n` +
      `histórico de transferências :\n\n` +
      `intervalo entre transferências\n` +
      `intervalo max : ${intervaloMax}\n` +
      `intervalo min : ${intervaloMin}\n\n` +
      blocosTexto.join("\n\n");

    return {
      sucesso: true,
      area: "historico_transferencias",
      titulo: "histórico de transferências.",
      subtitulo: "histórico de transferências :",
      intervaloTitulo: "intervalo entre transferências",
      intervaloMax,
      intervaloMin,
      transferencias,
      blocosTexto,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o histórico de transferências para a API_URL (Painel)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_historico_transferencias",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterHistorico();

      const payload = {
        evento,
        area: "historico_transferencias",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          subtitulo: metricas.subtitulo,
          intervaloMax: metricas.intervaloMax,
          intervaloMin: metricas.intervaloMin,
          transferencias: metricas.transferencias,
          blocosTexto: metricas.blocosTexto,
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

export default ArrecadacaoHistoricoTransferenciasServico;
