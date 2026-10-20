import { Router } from "express";
import { AdmRankingCampanhasControle } from "../controles/c.adm.campanhas.ranking";

const rotasAdmRankingCampanhas = Router();

/**
 * =========================================================
 * ROTAS: adm.campanhas.ativas (ou adm.ranking.campanhas)
 * Endpoints dedicados para envio do ranking de campanhas ativas
 * agrupadas por valor de orçamento diário em ordem decrescente
 * =========================================================
 */

// Envio de métricas e ranking de campanhas ativas
rotasAdmRankingCampanhas.get("/", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.post("/", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.get("/dados", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.post("/dados", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.get("/ranking", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.post("/ranking", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.get("/metricas", AdmRankingCampanhasControle.obterDados);
rotasAdmRankingCampanhas.post("/metricas", AdmRankingCampanhasControle.obterDados);

// Disparo proativo para API_URL (painel administrativo)
rotasAdmRankingCampanhas.post("/enviar", AdmRankingCampanhasControle.enviarParaPainel);
rotasAdmRankingCampanhas.post("/disparar", AdmRankingCampanhasControle.enviarParaPainel);

export default rotasAdmRankingCampanhas;
export { rotasAdmRankingCampanhas };
