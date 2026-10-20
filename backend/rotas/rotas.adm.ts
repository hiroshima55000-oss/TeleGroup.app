import { Router } from "express";
import { AdmControle } from "../controles/c.adm";
import { HistoricoControle } from "../controles/c.historico";
import rotasAdmUsuario from "./rotas.adm.usuario";
import rotasAdmArrecadacao from "./rotas.adm.arrecadacao";
import rotasAdmDivulgacoes from "./rotas.adm.divulgacoes";
import rotasAdmCampanhasAtivas from "./rotas.adm.campanhas.ativas";
import rotasAdmRankingCampanhas from "./rotas.adm.campanhas.ranking";
import rotasAdmSaldo from "./rotas.adm.saldo";
import rotasAdmRankings from "./rotas.adm.rankings";

export { rotasAdmUsuario, rotasAdmArrecadacao, rotasAdmDivulgacoes, rotasAdmCampanhasAtivas, rotasAdmRankingCampanhas, rotasAdmSaldo, rotasAdmRankings };

const rotasAdm = Router();

/**
 * =========================================================
 * ROTAS ADMINISTRATIVAS E DE COMUNICAÇÃO (WEBSITE 1 & WEBSITE 2)
 * =========================================================
 * 
 * Módulos organizados:
 * - adm.usuario: dados e métricas de usuários
 * - adm.arrecadação: faturamento e dados de quanto a plataforma arrecadou
 * - adm.divulgações: dados e métricas da área de divulgações (divulgações, publicações e campanhas)
 * - adm.campanhas.ativas: ranking de campanhas ativas por quantidade agrupadas por orçamento diário
 * - adm.rankings: rankings de publicadores, anunciantes, investidores e saldos disponíveis
 */

// 1. Módulos Específicos e Isolados
rotasAdm.use("/usuario", rotasAdmUsuario);
rotasAdm.use("/usuarios", rotasAdmUsuario);
rotasAdm.use("/arrecadacao", rotasAdmArrecadacao);
rotasAdm.use("/arrecadação", rotasAdmArrecadacao);
rotasAdm.use("/divulgacoes", rotasAdmDivulgacoes);
rotasAdm.use("/divulgações", rotasAdmDivulgacoes);
rotasAdm.use("/campanhas-ativas", rotasAdmCampanhasAtivas);
rotasAdm.use("/ranking-campanhas", rotasAdmCampanhasAtivas);
rotasAdm.use("/campanhas", rotasAdmCampanhasAtivas);
rotasAdm.use("/saldo", rotasAdmSaldo);
rotasAdm.use("/adicionar-saldo", rotasAdmSaldo);
rotasAdm.use("/adcionar-saldo", rotasAdmSaldo);
rotasAdm.use("/rankings", rotasAdmRankings);
rotasAdm.use("/rank", rotasAdmRankings);

// Rota raiz e métricas gerais (roteia automaticamente entre usuários, arrecadação, divulgações e campanhas se especificado)
rotasAdm.get("/", AdmControle.rotearPorArea);
rotasAdm.post("/", AdmControle.rotearPorArea);

// =========================================================
// ÁREA: USUÁRIOS (Compatibilidade com endpoints legados)
// =========================================================
rotasAdm.get("/area/usuarios", AdmControle.obterMetricasUsuarios);
rotasAdm.post("/area/usuarios", AdmControle.obterMetricasUsuarios);
rotasAdm.get("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotasAdm.post("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotasAdm.get("/metricas/usuarios", AdmControle.obterMetricasUsuarios);
rotasAdm.post("/metricas/usuarios", AdmControle.obterMetricasUsuarios);

// =========================================================
// ÁREA: ARRECADAÇÃO (Compatibilidade com endpoints legados)
// =========================================================
rotasAdm.get("/area/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotasAdm.post("/area/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotasAdm.get("/dados/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotasAdm.post("/dados/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotasAdm.get("/metricas/arrecadacao", AdmControle.obterMetricasArrecadacao);
rotasAdm.post("/metricas/arrecadacao", AdmControle.obterMetricasArrecadacao);

// Disparo proativo para API_URL (Painel)
rotasAdm.post("/enviar/arrecadacao", AdmControle.enviarArrecadacaoParaPainel);
rotasAdm.post("/enviar/arrecadação", AdmControle.enviarArrecadacaoParaPainel);

// =========================================================
// ÁREA: DIVULGAÇÕES (Divulgações, Publicações e Campanhas)
// =========================================================
rotasAdm.get("/area/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/area/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.get("/area/divulgações", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/area/divulgações", AdmControle.obterMetricasDivulgacoes);
rotasAdm.get("/dados/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/dados/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.get("/dados/divulgações", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/dados/divulgações", AdmControle.obterMetricasDivulgacoes);
rotasAdm.get("/metricas/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/metricas/divulgacoes", AdmControle.obterMetricasDivulgacoes);
rotasAdm.get("/metricas/divulgações", AdmControle.obterMetricasDivulgacoes);
rotasAdm.post("/metricas/divulgações", AdmControle.obterMetricasDivulgacoes);

// Disparo proativo para API_URL (Painel)
rotasAdm.post("/enviar/divulgacoes", AdmControle.enviarDivulgacoesParaPainel);
rotasAdm.post("/enviar/divulgações", AdmControle.enviarDivulgacoesParaPainel);

// =========================================================
// ÁREA: CAMPANHAS ATIVAS (Ranking por quantidade de ativas)
// =========================================================
rotasAdm.get("/area/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.post("/area/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.get("/area/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.post("/area/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.get("/dados/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.post("/dados/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.get("/dados/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.post("/dados/ranking-campanhas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.get("/metricas/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);
rotasAdm.post("/metricas/campanhas-ativas", AdmControle.obterMetricasCampanhasAtivas);

// Disparo proativo para API_URL (Painel)
rotasAdm.post("/enviar/campanhas-ativas", AdmControle.enviarCampanhasAtivasParaPainel);
rotasAdm.post("/enviar/ranking-campanhas", AdmControle.enviarCampanhasAtivasParaPainel);
rotasAdm.post("/enviar/usuarios", rotasAdmUsuario);
rotasAdm.post("/enviar/usuario", rotasAdmUsuario);
rotasAdm.post("/enviar/historico", rotasAdmUsuario);

// Rota explícita de comunicação (atende área solicitada no query/body: usuarios ou arrecadacao)
rotasAdm.get("/comunicacao", AdmControle.rotearPorArea);
rotasAdm.post("/comunicacao", AdmControle.rotearPorArea);

// Métricas complementares
rotasAdm.get("/metricas", AdmControle.rotearPorArea);
rotasAdm.post("/metricas", AdmControle.rotearPorArea);

// Despacho de requisições e proxy reverso
rotasAdm.post("/controle/requisicao", AdmControle.despacharRequisicao);
rotasAdm.all("/proxy/*", AdmControle.proxy);

// Histórico de Usuários
rotasAdm.get("/historico/usuarios", HistoricoControle.obterHistorico);
rotasAdm.post("/historico/usuarios", HistoricoControle.obterHistorico);
rotasAdm.get("/historico", HistoricoControle.obterHistorico);
rotasAdm.post("/historico", HistoricoControle.obterHistorico);
rotasAdm.delete("/historico/usuarios", HistoricoControle.removerHistorico);

// Ações de moderação administrativa
rotasAdm.post("/banir", HistoricoControle.banirUsuario);
rotasAdm.post("/usuario/banir", HistoricoControle.banirUsuario);
rotasAdm.post("/desbanir", HistoricoControle.desbanirUsuario);
rotasAdm.post("/usuario/desbanir", HistoricoControle.desbanirUsuario);
rotasAdm.post("/excluir", HistoricoControle.excluirUsuario);
rotasAdm.post("/usuario/excluir", HistoricoControle.excluirUsuario);
rotasAdm.delete("/usuarios/:id", HistoricoControle.excluirUsuario);
rotasAdm.delete("/usuario/:id", HistoricoControle.excluirUsuario);
rotasAdm.get("/investigar/:id", HistoricoControle.investigarUsuario);
rotasAdm.get("/usuario/investigar/:id", HistoricoControle.investigarUsuario);

// Webhook
rotasAdm.post("/webhook", AdmControle.receberWebhook);

export default rotasAdm;
export { rotasAdm };
