import { Router } from "express";
import rotasServidor from "./rotas/rotas.servidor";
import rotasBanco from "./rotas/rotas.banco";
import rotasUsuario from "./rotas/rotas.usuario";
import rotasCampanhas from "./rotas/rotas.campanhas";
import rotasPublicacoes from "./rotas/rotas.publicacoes";
import rotasTrafego from "./rotas/rotas.trafego";
import rotasPagamento from "./rotas/rotas.pagamento";
import rotasAdm, { rotasAdmUsuario, rotasAdmArrecadacao, rotasAdmDivulgacoes, rotasAdmRankingCampanhas, rotasAdmRankings } from "./rotas/rotas.adm";
import { PagamentoControle } from "./controles/c.pagamento";
import { AdmControle } from "./controles/c.adm";
import { HistoricoControle } from "./controles/c.historico";

const rotas = Router();

/**
 * =========================================================
 * MÓDULOS DE ROTAS DO BACKEND (WEBSITE 2)
 * =========================================================
 */

// Servidor & Health check (/api, /api/status, /api/health, /api/ambiente)
rotas.use("/", rotasServidor);

// Banco de Dados PostgreSQL (/api/banco/status, /api/banco/teste, /api/banco/reconectar)
rotas.use("/banco", rotasBanco);

// Autenticação, Usuários e CRUD (/api/auth/*, /api/usuario/*, /api/usuarios/*)
rotas.use("/", rotasUsuario);

// Campanhas & Anúncios Pagos (/api/campanhas/*)
rotas.use("/campanhas", rotasCampanhas);

// Leilão de Tráfego, AdRank e Vantagem Paga (/api/trafego/*)
rotas.use("/trafego", rotasTrafego);

// Publicações & Feed (/api/publicacoes/*)
rotas.use("/publicacoes", rotasPublicacoes);

// Pagamento PIX e Integração SyncPay (/api/pagamento/*)
rotas.use("/pagamento", rotasPagamento);

// Módulos dedicados para o Painel Administrativo
// adm.usuario -> dados de usuários
rotas.use(["/adm.usuario", "/adm/usuario"], rotasAdmUsuario);

// adm.arrecadação -> quanto a plataforma arrecadou
rotas.use(
  ["/adm.arrecadacao", "/adm.arrecadação", encodeURI("/adm.arrecadação"), "/adm/arrecadacao", "/adm/arrecadação", encodeURI("/adm/arrecadação")],
  rotasAdmArrecadacao
);

// adm.divulgações -> dados da área de divulgações (divulgações, publicações e campanhas)
rotas.use(
  ["/adm.divulgacoes", "/adm.divulgações", encodeURI("/adm.divulgações"), "/adm/divulgacoes", "/adm/divulgações", encodeURI("/adm/divulgações")],
  rotasAdmDivulgacoes
);

// adm.campanhas.ativas -> ranking de campanhas ativas por quantidade
rotas.use(
  ["/adm.campanhas-ativas", "/adm/campanhas-ativas", "/adm.campanhas", "/adm/campanhas", "/adm.ranking-campanhas", "/adm/ranking-campanhas"],
  rotasAdmRankingCampanhas
);

// adm.rankings -> rankings de publicadores, anunciantes, investidores e saldos disponíveis
rotas.use(
  ["/adm.rankings", "/adm/rankings", "/adm.rank", "/adm/rank", "/rankings", "/rank"],
  rotasAdmRankings
);

// Painel Administrativo geral e Métricas (/api/adm/*, /api/admin/*)
rotas.use("/adm", rotasAdm);
rotas.use("/admin", rotasAdm);

/**
 * =========================================================
 * ARQUITETURA DE COMUNICAÇÃO DIRETA WEBSITE 1 <-> WEBSITE 2
 * =========================================================
 */

// 📥 Pedir Dados (Pull)
// POST /api/dados/usuarios ou POST /api/dados/arrecadacao ou POST /api/dados/divulgacoes ou POST /api/dados/campanhas-ativas ou POST /api/comunicacao
rotas.get("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotas.post("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotas.get("/dados/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotas.post("/dados/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotas.get("/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotas.post("/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotas.get("/arrecadacao/transferencias", AdmControle.arrecadacaoHistoricoTransferencias);
rotas.post("/arrecadacao/transferencias", AdmControle.arrecadacaoHistoricoTransferencias);
rotas.get("/arrecadacao/ano", AdmControle.arrecadacaoTotalAno);
rotas.post("/arrecadacao/ano", AdmControle.arrecadacaoTotalAno);
rotas.get("/arrecadacao/mes", AdmControle.arrecadacaoTotalMes);
rotas.post("/arrecadacao/mes", AdmControle.arrecadacaoTotalMes);
rotas.get("/arrecadacao/dia", AdmControle.arrecadacaoTotalDia);
rotas.post("/arrecadacao/dia", AdmControle.arrecadacaoTotalDia);

// Área: Divulgações (divulgações, publicações, campanhas)
rotas.get("/dados/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotas.post("/dados/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotas.get("/dados/divulgações", AdmControle.obterMetricasDivulgacoes);
rotas.post("/dados/divulgações", AdmControle.obterMetricasDivulgacoes);
rotas.get("/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotas.post("/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotas.get("/divulgações", AdmControle.obterMetricasDivulgacoes);
rotas.post("/divulgações", AdmControle.obterMetricasDivulgacoes);
rotas.get("/divulgacoes/resultado", AdmControle.divulgacoes.obterRankResultadoCampanhas);
rotas.post("/divulgacoes/resultado", AdmControle.divulgacoes.obterRankResultadoCampanhas);
rotas.get("/divulgacoes/custo-beneficio", AdmControle.divulgacoes.obterRankResultadoCampanhas);
rotas.post("/divulgacoes/custo-beneficio", AdmControle.divulgacoes.obterRankResultadoCampanhas);
rotas.post("/enviar/divulgacoes", AdmControle.enviarDivulgacoesParaPainel);
rotas.post("/enviar/divulgações", AdmControle.enviarDivulgacoesParaPainel);

// Área: Campanhas Ativas (Ranking por quantidade de ativas)
rotas.get("/dados/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotas.post("/dados/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotas.get("/dados/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotas.post("/dados/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotas.get("/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotas.post("/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotas.get("/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotas.post("/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotas.post("/enviar/campanhas-ativas", AdmControle.enviarCampanhasAtivasParaPainel);
rotas.post("/enviar/ranking-campanhas", AdmControle.enviarCampanhasAtivasParaPainel);

rotas.get("/comunicacao", AdmControle.rotearPorArea);
rotas.post("/comunicacao", AdmControle.rotearPorArea);

// 📊 Histórico de Usuários (/api/historico/usuarios)
rotas.get("/historico/usuarios", HistoricoControle.obterHistorico);
rotas.post("/historico/usuarios", HistoricoControle.inserirHistorico);
rotas.delete("/historico/usuarios", HistoricoControle.removerHistorico);

// 📤 Despachar Requisições / Proxy
// POST /api/controle/requisicao / USE /api/proxy
rotas.post("/controle/requisicao", AdmControle.despacharRequisicao);
rotas.all("/proxy/*", AdmControle.proxy);

// ⚡ Receber Dados em Tempo Real (Webhook do Website 1)
// POST /api/webhook
rotas.post("/webhook", AdmControle.receberWebhook);

// Alias de webhook para integrações externas da SyncPay
rotas.post("/webhook/syncpay", PagamentoControle.receberWebhook);

export default rotas;
export { rotas };
