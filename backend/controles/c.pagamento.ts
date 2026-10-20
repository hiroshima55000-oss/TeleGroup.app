import { Request, Response } from "express";
import { SyncPayServico } from "../servicos/s.criacao.pagamento.syncpay";
import {
  SYNCPAY_PUBLIC_KEY,
  SYNCPAY_PRIVATE_KEY,
} from "../configuracao/variaveis";

export const PagamentoControle = {
  /**
   * Endpoint: GET /api/pagamento/config
   * Verifica se as credenciais da SyncPay estão definidas nas variáveis de ambiente
   */
  async obterConfig(_req: Request, res: Response): Promise<void> {
    const configurado = Boolean(SYNCPAY_PUBLIC_KEY && SYNCPAY_PRIVATE_KEY);
    res.json({
      configurado,
      provedor: "SyncPay",
      publicKeyConfigurada: Boolean(SYNCPAY_PUBLIC_KEY),
      privateKeyConfigurada: Boolean(SYNCPAY_PRIVATE_KEY),
    });
  },

  /**
   * Endpoint: POST /api/pagamento/pix
   * Gera uma cobrança Pix real usando a API da SyncPay (Cash-In)
   */
  async gerarPix(req: Request, res: Response): Promise<void> {
    try {
      const { valor, amount, descricao, description, referenciaId, nome, email, cpf, phone } = req.body;

      const valorFinal = Number(valor || amount);
      if (!valorFinal || isNaN(valorFinal) || valorFinal <= 0) {
        res.status(400).json({
          sucesso: false,
          erro: "O valor da transação deve ser maior que zero.",
        });
        return;
      }

      const usuarioId =
        (req.headers["x-user-id"] as string) || req.body.usuarioId || "";
      const googleEmail =
        (req.headers["x-google-email"] as string) || email;
      const googleNome = req.headers["x-google-nome"]
        ? decodeURIComponent(req.headers["x-google-nome"] as string)
        : nome;

      // Constrói a URL do webhook apontando para o servidor atual
      const host = req.get("host") || "";
      const protocol = req.protocol === "http" && !host.includes("localhost") ? "https" : req.protocol;
      const webhookUrl = host ? `${protocol}://${host}/api/pagamento/webhook` : undefined;

      const resultado = await SyncPayServico.criarCashIn({
        valor: valorFinal,
        descricao: descricao || description || "TeleGroup Anúncios",
        referenciaId,
        usuarioId,
        nome: googleNome,
        email: googleEmail,
        cpf,
        phone,
        webhookUrl,
      });

      res.status(200).json(resultado);
    } catch (erro: any) {
      console.error("❌ [PagamentoControle] Erro ao gerar PIX:", erro.message);
      res.status(400).json({
        sucesso: false,
        erro: erro.message || "Falha ao gerar cobrança PIX com a SyncPay.",
      });
    }
  },

  /**
   * Endpoint: GET /api/pagamento/status/:id
   * Consulta o status real da cobrança PIX
   */
  async consultarStatus(req: Request, res: Response): Promise<void> {
    try {
      const identifier = req.params.id;
      if (!identifier) {
        res.status(400).json({ pago: false, erro: "Identificador ausente." });
        return;
      }

      const status = await SyncPayServico.consultarStatus(identifier);
      res.json(status);
    } catch (erro: any) {
      console.error("❌ [PagamentoControle] Erro ao consultar status:", erro.message);
      res.status(500).json({
        pago: false,
        erro: erro.message || "Erro ao consultar status da transação.",
      });
    }
  },

  /**
   * Endpoint: POST /api/pagamento/webhook e POST /api/webhook/syncpay
   * Recebe as notificações de criação ou liquidação de PIX enviadas pela SyncPay
   */
  async receberWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const resultado = await SyncPayServico.processarWebhook(payload);
      res.status(200).json({
        recebido: true,
        ...resultado,
      });
    } catch (erro: any) {
      console.error("❌ [PagamentoControle] Erro no webhook:", erro.message);
      res.status(200).json({
        recebido: true,
        erro: erro.message,
      });
    }
  },
};

export default PagamentoControle;
