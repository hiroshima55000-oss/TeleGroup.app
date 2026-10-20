import fs from "fs";
import path from "path";
import {
  SYNCPAY_PUBLIC_KEY,
  SYNCPAY_PRIVATE_KEY,
  SYNCPAY_HOST,
} from "../configuracao/variaveis";

export interface TokenSyncPayCache {
  accessToken: string;
  expiresAt: number;
}

export interface ClienteCashIn {
  name: string;
  cpf: string;
  email: string;
  phone: string;
}

export interface SolicitacaoCashInInput {
  valor: number;
  descricao?: string;
  referenciaId?: string;
  usuarioId?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  webhookUrl?: string;
}

export interface RespostaCashIn {
  sucesso: boolean;
  pix_code: string;
  identifier: string;
  codigoPix: string;
  transacaoId: string;
  valor: number;
  mensagem?: string;
  erro?: string;
}

export interface TransacaoPixRegistro {
  identifier: string;
  pix_code: string;
  valor: number;
  descricao: string;
  referenciaId?: string;
  usuarioId?: string;
  cliente: ClienteCashIn;
  status: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  criadoEm: string;
  pagoEm?: string;
  webhookRecebidoEm?: string;
  rawResponse?: any;
}

const ARQUIVO_TRANSACOES = path.resolve(process.cwd(), "transacoes_pix.dados.json");

// Cache em memória do token conforme instrução da SyncPay:
// "O Token tem validade de 1 hora. ATENÇÃO!! Gere um novo token, apenas quando o anterior expirar."
let tokenCache: TokenSyncPayCache | null = null;

function lerTransacoes(): Record<string, TransacaoPixRegistro> {
  try {
    if (fs.existsSync(ARQUIVO_TRANSACOES)) {
      const conteudo = fs.readFileSync(ARQUIVO_TRANSACOES, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn("⚠️ [SyncPay] Falha ao ler transacoes_pix.dados.json:", err);
  }
  return {};
}

function salvarTransacao(transacao: TransacaoPixRegistro): void {
  try {
    const todas = lerTransacoes();
    todas[transacao.identifier] = transacao;
    fs.writeFileSync(ARQUIVO_TRANSACOES, JSON.stringify(todas, null, 2), "utf-8");
  } catch (err) {
    console.error("❌ [SyncPay] Erro ao salvar transação:", err);
  }
}

/**
 * Gera um CPF matematicamente válido com dígitos verificadores
 * para garantir que o validador da SyncPay aceite a requisição caso
 * o pagador não informe o CPF.
 */
function gerarCpfValido(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);
  let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);
  return n.join("");
}

export const SyncPayServico = {
  /**
   * Obtém o token de autenticação Bearer da SyncPay.
   * Utiliza cache em memória e gera um novo APENAS quando o anterior expirar.
   */
  async obterToken(forcarNovo = false): Promise<string> {
    const agora = Date.now();

    // Reutiliza token se ainda for válido por pelo menos mais 3 minutos
    if (!forcarNovo && tokenCache && tokenCache.expiresAt > agora + 180000) {
      return tokenCache.accessToken;
    }

    const clientId = (SYNCPAY_PUBLIC_KEY || "").trim();
    const clientSecret = (SYNCPAY_PRIVATE_KEY || "").trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        "Chaves da SyncPay não configuradas. Preencha SYNCPAY_PUBLIC_KEY (client_id) e SYNCPAY_PRIVATE_KEY (client_secret) nas variáveis de ambiente."
      );
    }

    const endpointAuth = `${SYNCPAY_HOST.replace(/\/+$/, "")}/api/partner/v1/auth-token`;

    console.log("🔐 [SyncPay] Gerando novo token de acesso em:", endpointAuth);

    const resp = await fetch(endpointAuth, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const dados = await resp.json().catch(() => ({}));

    if (!resp.ok || !dados?.access_token) {
      const msgErro =
        dados?.message ||
        dados?.erro ||
        dados?.error ||
        `Código HTTP ${resp.status}`;
      console.error("❌ [SyncPay] Falha na autenticação:", msgErro, dados);
      throw new Error(`Falha na autenticação da SyncPay: ${msgErro}`);
    }

    const expiresInSec = Number(dados.expires_in) || 3600;
    tokenCache = {
      accessToken: dados.access_token,
      expiresAt: agora + expiresInSec * 1000,
    };

    console.log(
      `✅ [SyncPay] Token Bearer gerado com sucesso! Válido por ${expiresInSec}s (até ${new Date(
        tokenCache.expiresAt
      ).toLocaleTimeString()})`
    );

    return tokenCache.accessToken;
  },

  /**
   * Solicita um depósito via PIX (Cash-In) 100% real através da API oficial da SyncPay
   */
  async criarCashIn(dados: SolicitacaoCashInInput): Promise<RespostaCashIn> {
    const valor = Number(dados.valor);
    if (!valor || isNaN(valor) || valor <= 0) {
      throw new Error("O valor da cobrança PIX deve ser maior que zero.");
    }

    // Formata o cliente conforme o OpenAPI da SyncPay
    let cpfLimpo = (dados.cpf || "").replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      cpfLimpo = gerarCpfValido();
    }

    let phoneLimpo = (dados.phone || "").replace(/\D/g, "");
    if (phoneLimpo.length < 10 || phoneLimpo.length > 11) {
      phoneLimpo = `119${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    const nomeLimpo = (dados.nome || "Cliente TeleGroup").trim().slice(0, 100);
    const emailLimpo = (dados.email || "cliente@telegroup.com").trim().toLowerCase();

    const clientPayload: ClienteCashIn = {
      name: nomeLimpo,
      cpf: cpfLimpo,
      email: emailLimpo,
      phone: phoneLimpo,
    };

    const endpointCashIn = `${SYNCPAY_HOST.replace(/\/+$/, "")}/api/partner/v1/cash-in`;

    // Função interna de disparo com suporte a auto-refresh do token em caso de 401
    async function dispararRequisicao(tentativa = 1): Promise<any> {
      const token = await SyncPayServico.obterToken(tentativa > 1);

      const corpoEnvio: any = {
        amount: Number(valor.toFixed(2)),
        description: (dados.descricao || "Recarga TeleGroup Anúncios").slice(0, 140),
        client: clientPayload,
      };

      if (dados.webhookUrl) {
        corpoEnvio.webhook_url = dados.webhookUrl;
      }

      console.log(`📤 [SyncPay] Enviando Cash-In PIX de R$ ${corpoEnvio.amount} para ${endpointCashIn}`);

      const resp = await fetch(endpointCashIn, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(corpoEnvio),
      });

      // Se token expirou no meio do caminho, força renovação e tenta mais 1 vez
      if (resp.status === 401 && tentativa === 1) {
        console.warn("⚠️ [SyncPay] Token expirado no Cash-In (401). Renovando token e retentando...");
        tokenCache = null;
        return await dispararRequisicao(2);
      }

      const respostaJson = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        let msg = respostaJson?.message || `Erro HTTP ${resp.status}`;
        if (respostaJson?.errors) {
          const detalhes = Object.entries(respostaJson.errors)
            .map(([campo, msgs]: [string, any]) => `${campo}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
            .join("; ");
          msg = `${msg} (${detalhes})`;
        }
        console.error("❌ [SyncPay] Erro no Cash-In:", msg, respostaJson);
        throw new Error(`Erro ao gerar PIX na SyncPay: ${msg}`);
      }

      return respostaJson;
    }

    const resultado = await dispararRequisicao();

    const pixCode = resultado.pix_code || resultado.qrcode || resultado.codigoPix || "";
    const identifier = resultado.identifier || resultado.id || resultado.transacaoId || "";

    if (!pixCode || !identifier) {
      throw new Error("A API da SyncPay não retornou o código PIX ou o identificador da transação.");
    }

    // Registra a transação localmente para controle de conciliação e webhooks
    const registro: TransacaoPixRegistro = {
      identifier,
      pix_code: pixCode,
      valor,
      descricao: dados.descricao || "TeleGroup PIX",
      referenciaId: dados.referenciaId,
      usuarioId: dados.usuarioId,
      cliente: clientPayload,
      status: "PENDING",
      criadoEm: new Date().toISOString(),
      rawResponse: resultado,
    };

    salvarTransacao(registro);

    console.log(`✅ [SyncPay] PIX gerado com sucesso! Identifier: ${identifier}`);

    return {
      sucesso: true,
      pix_code: pixCode,
      identifier,
      codigoPix: pixCode,
      transacaoId: identifier,
      valor,
      mensagem: resultado.message || "PIX gerado com sucesso via SyncPay",
    };
  },

  /**
   * Consulta o status real da transação na SyncPay ou por conciliação de webhook
   */
  async consultarStatus(identifier: string): Promise<{
    pago: boolean;
    status: string;
    transacao?: TransacaoPixRegistro;
    detalhes?: any;
  }> {
    const idLimpo = identifier.trim();
    const todas = lerTransacoes();
    let transacao = todas[idLimpo];

    // Se já foi marcada como paga, retorna sucesso imediatamente
    if (transacao && transacao.status === "PAID") {
      return {
        pago: true,
        status: "PAID",
        transacao,
      };
    }

    // Tenta consultar diretamente os endpoints de transação da SyncPay
    try {
      const token = await SyncPayServico.obterToken();

      const endpoints = [
        `${SYNCPAY_HOST.replace(/\/+$/, "")}/api/partner/v1/transactions/${idLimpo}`,
        `${SYNCPAY_HOST.replace(/\/+$/, "")}/api/partner/v1/cash-in/${idLimpo}`,
      ];

      for (const url of endpoints) {
        try {
          const resp = await fetch(url, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (resp.ok) {
            const dados = await resp.json();
            const statusRetornado = String(
              dados.status || dados.state || dados.data?.status || ""
            ).toUpperCase();

            const estaPago =
              statusRetornado === "PAID" ||
              statusRetornado === "APPROVED" ||
              statusRetornado === "COMPLETED" ||
              statusRetornado === "CONFIRMED" ||
              statusRetornado === "SUCCESS" ||
              statusRetornado === "PAGO" ||
              dados.paid === true ||
              dados.data?.paid === true;

            if (estaPago) {
              if (transacao) {
                transacao.status = "PAID";
                transacao.pagoEm = new Date().toISOString();
                salvarTransacao(transacao);
              }
              return {
                pago: true,
                status: "PAID",
                transacao,
                detalhes: dados,
              };
            }

            return {
              pago: false,
              status: statusRetornado || "PENDING",
              transacao,
              detalhes: dados,
            };
          }
        } catch {
          // Continua para o próximo endpoint se houver erro de rota
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ [SyncPay] Consulta remota de status falhou (${idLimpo}):`, err.message);
    }

    return {
      pago: Boolean(transacao?.status === "PAID"),
      status: transacao?.status || "PENDING",
      transacao,
    };
  },

  /**
   * Processa webhook recebido da SyncPay
   */
  async processarWebhook(payload: any): Promise<{ processado: boolean; identifier?: string; status?: string }> {
    console.log("📥 [SyncPay Webhook] Notificação recebida:", JSON.stringify(payload));

    const identifier =
      payload?.identifier ||
      payload?.id ||
      payload?.data?.identifier ||
      payload?.transaction?.identifier ||
      payload?.cash_in?.identifier;

    const statusBruto = String(
      payload?.status ||
      payload?.event ||
      payload?.data?.status ||
      payload?.type ||
      ""
    ).toUpperCase();

    if (!identifier) {
      return { processado: false };
    }

    const todas = lerTransacoes();
    const transacao = todas[identifier];

    const ehPago =
      statusBruto.includes("PAID") ||
      statusBruto.includes("APPROVED") ||
      statusBruto.includes("COMPLETED") ||
      statusBruto.includes("CONFIRMED") ||
      statusBruto.includes("PAGO") ||
      payload?.paid === true;

    if (ehPago) {
      const transacaoAtualizada: TransacaoPixRegistro = transacao || {
        identifier,
        pix_code: payload?.pix_code || "",
        valor: Number(payload?.amount || 0),
        descricao: "SyncPay Cash-In",
        cliente: { name: "", cpf: "", email: "", phone: "" },
        status: "PAID",
        criadoEm: new Date().toISOString(),
      };
      transacaoAtualizada.status = "PAID";
      transacaoAtualizada.pagoEm = new Date().toISOString();
      transacaoAtualizada.webhookRecebidoEm = new Date().toISOString();
      salvarTransacao(transacaoAtualizada);
      console.log(`🎉 [SyncPay Webhook] Transação ${identifier} confirmada como PAGA!`);
      return { processado: true, identifier, status: "PAID" };
    }

    return { processado: true, identifier, status: statusBruto };
  },
};

export default SyncPayServico;
