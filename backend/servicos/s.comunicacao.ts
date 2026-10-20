import { Request, Response } from "express";

/**
 * Utilitário para extrair o IP real do cliente HTTP de forma limpa
 */
export function extrairIp(req: Request): string {
  const isInterno =
    req.headers["x-origem"] === "interno" ||
    req.headers["x-origem"] === "website_2" ||
    req.headers["x-interno"] === "true" ||
    req.body?.origem === "interno" ||
    req.body?.origem === "website_2";

  if (isInterno) {
    return "Interno";
  }

  const rawIp =
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const cleanIp = rawIp.replace(/^::ffff:/, "");
  return cleanIp === "::1" ? "127.0.0.1" : cleanIp;
}

export const LoggerInformativo = {
  /**
   * Log formatado para requisições bloqueadas
   * Exemplo:
   * 🚫 [Requisição Bloqueada] POST /api/dados/usuarios | Motivo: Chave secreta inválida | Status: 401 | IP: 187.110.233.108 | 2ms
   */
  requisicaoBloqueada(
    metodo: string,
    rota: string,
    motivo: string,
    status: number,
    ip: string,
    duracaoMs: number,
    res?: Response
  ): void {
    if (res) {
      res.locals._logRegistrado = true;
    }
    console.log(
      `🚫 [Requisição Bloqueada] ${metodo.toUpperCase()} ${rota} | Motivo: ${motivo} | Status: ${status} | IP: ${ip} | ${duracaoMs}ms`
    );
  },

  /**
   * Log formatado para requisições permitidas e atendidas com sucesso
   * Exemplo:
   * ✅ [Requisição Permitida] POST /api/dados/usuarios | Info: Métricas enviadas ao Painel | Status: 200 | IP: 187.110.233.108 | 2ms
   */
  requisicaoPermitida(
    metodo: string,
    rota: string,
    info: string,
    status: number,
    ip: string,
    duracaoMs: number,
    res?: Response
  ): void {
    if (res) {
      res.locals._logRegistrado = true;
    }
    console.log(
      `✅ [Requisição Permitida] ${metodo.toUpperCase()} ${rota} | Info: ${info} | Status: ${status} | IP: ${ip} | ${duracaoMs}ms`
    );
  },

  /**
   * Log formatado para webhooks recebidos
   * Exemplo:
   * ⚡ [Webhook Recebido] POST /api/webhook | Evento: atualizacao_metricas | Status: 200 | IP: 187.110.233.108 | 2ms
   */
  webhookRecebido(
    metodo: string,
    rota: string,
    evento: string,
    status: number,
    ip: string,
    duracaoMs: number,
    res?: Response
  ): void {
    if (res) {
      res.locals._logRegistrado = true;
    }
    console.log(
      `⚡ [Webhook Recebido] ${metodo.toUpperCase()} ${rota} | Evento: ${evento} | Status: ${status} | IP: ${ip} | ${duracaoMs}ms`
    );
  },

  /**
   * Log formatado para webhooks enviados proativamente para o Website 1
   * Exemplo:
   * 📤 [Webhook Enviado] POST https://painel.com/api/webhook | Evento: atualizacao_metricas | Status: 200 | 12ms
   */
  webhookEnviado(
    url: string,
    evento: string,
    status: number,
    duracaoMs: number
  ): void {
    console.log(
      `📤 [Webhook Enviado] POST ${url} | Evento: ${evento} | Status: ${status} | ${duracaoMs}ms`
    );
  },

  info(msg: string): void {
    console.log(`ℹ️ [Informativo] ${msg}`);
  },

  aviso(msg: string): void {
    console.log(`⚠️ [Aviso] ${msg}`);
  },

  erro(msg: string): void {
    console.log(`❌ [Erro] ${msg}`);
  },
};

export default LoggerInformativo;
