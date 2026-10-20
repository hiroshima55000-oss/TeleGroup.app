import { Router } from "express";
import { AdmCampanhasAtivasControle } from "../controles/c.adm.campanhas.ativas";

const rotasAdmCampanhasAtivas = Router();

/**
 * =========================================================
 * ROTAS: adm.campanhas.ativas
 * Endpoints dedicados para identificação e envio de campanhas ativas
 * agrupadas por valor de orçamento diário
 * =========================================================
 */

// Envio de dados e levantamento de campanhas ativas
rotasAdmCampanhasAtivas.get("/", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.post("/", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.get("/dados", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.post("/dados", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.get("/ranking", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.post("/ranking", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.get("/metricas", AdmCampanhasAtivasControle.obterDados);
rotasAdmCampanhasAtivas.post("/metricas", AdmCampanhasAtivasControle.obterDados);

// Disparo proativo para API_URL (painel administrativo)
rotasAdmCampanhasAtivas.post("/enviar", AdmCampanhasAtivasControle.enviarParaPainel);
rotasAdmCampanhasAtivas.post("/disparar", AdmCampanhasAtivasControle.enviarParaPainel);

export default rotasAdmCampanhasAtivas;
export { rotasAdmCampanhasAtivas };
