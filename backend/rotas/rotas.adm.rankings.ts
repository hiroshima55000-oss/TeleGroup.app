import { Router } from "express";
import { AdmRankingsControle } from "../controles/c.adm.rankings";

const rotas = Router();

/**
 * =========================================================
 * ROTAS ADMINISTRATIVAS: RANKINGS (PAINEL ADMINISTRATIVO)
 * =========================================================
 * 
 * - rank de publicadores
 * - rank de anunciantes
 * - rank de investidores
 * - rank de saldos disponíveis
 */

// Rank de Publicadores
rotas.get("/publicadores", AdmRankingsControle.obterRankPublicadores);
rotas.post("/publicadores", AdmRankingsControle.obterRankPublicadores);
rotas.get("/rank-publicadores", AdmRankingsControle.obterRankPublicadores);
rotas.post("/rank-publicadores", AdmRankingsControle.obterRankPublicadores);

// Rank de Anunciantes
rotas.get("/anunciantes", AdmRankingsControle.obterRankAnunciantes);
rotas.post("/anunciantes", AdmRankingsControle.obterRankAnunciantes);
rotas.get("/rank-anunciantes", AdmRankingsControle.obterRankAnunciantes);
rotas.post("/rank-anunciantes", AdmRankingsControle.obterRankAnunciantes);

// Rank de Investidores
rotas.get("/investidores", AdmRankingsControle.obterRankInvestidores);
rotas.post("/investidores", AdmRankingsControle.obterRankInvestidores);
rotas.get("/rank-investidores", AdmRankingsControle.obterRankInvestidores);
rotas.post("/rank-investidores", AdmRankingsControle.obterRankInvestidores);

// Rank de Saldos Disponíveis
rotas.get("/saldo", AdmRankingsControle.obterRankSaldo);
rotas.post("/saldo", AdmRankingsControle.obterRankSaldo);
rotas.get("/saldos", AdmRankingsControle.obterRankSaldo);
rotas.post("/saldos", AdmRankingsControle.obterRankSaldo);
rotas.get("/rank-saldo", AdmRankingsControle.obterRankSaldo);
rotas.post("/rank-saldo", AdmRankingsControle.obterRankSaldo);

// Rank de Resultado de Campanhas (Custo-Benefício)
rotas.get("/resultado", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.post("/resultado", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.get("/resultado-campanha", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.post("/resultado-campanha", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.get("/resultado-campanhas", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.post("/resultado-campanhas", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.get("/custo-beneficio", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.post("/custo-beneficio", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.get("/rank-resultado-campanha", AdmRankingsControle.obterRankResultadoCampanhas);
rotas.post("/rank-resultado-campanha", AdmRankingsControle.obterRankResultadoCampanhas);

// Envio proativo para o painel via Webhook
rotas.post("/enviar", AdmRankingsControle.enviarParaPainel);
rotas.post("/enviar/:tipo", AdmRankingsControle.enviarParaPainel);

export default rotas;
