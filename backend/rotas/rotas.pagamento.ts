import { Router } from "express";
import { PagamentoControle } from "../controles/c.pagamento";

const rotasPagamento = Router();

rotasPagamento.get("/config", PagamentoControle.obterConfig);
rotasPagamento.post("/pix", PagamentoControle.gerarPix);
rotasPagamento.get("/status/:id", PagamentoControle.consultarStatus);
rotasPagamento.post("/webhook", PagamentoControle.receberWebhook);

export default rotasPagamento;
export { rotasPagamento };
