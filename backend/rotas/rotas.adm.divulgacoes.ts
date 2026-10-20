import { Router } from "express";
import { AdmDivulgacoesControle } from "../controles/c.adm.divulgacoes";

const rotasAdmDivulgacoes = Router();

/**
 * =========================================================
 * ROTAS: adm.divulgacoes (ou adm.divulgações)
 * Endpoints dedicados para envio de dados da área de divulgações
 * (divulgações, publicações e campanhas)
 * =========================================================
 */

// Envio de métricas consolidadas da área de divulgações
rotasAdmDivulgacoes.get("/", AdmDivulgacoesControle.obterDados);
rotasAdmDivulgacoes.post("/", AdmDivulgacoesControle.obterDados);
rotasAdmDivulgacoes.get("/dados", AdmDivulgacoesControle.obterDados);
rotasAdmDivulgacoes.post("/dados", AdmDivulgacoesControle.obterDados);
rotasAdmDivulgacoes.get("/metricas", AdmDivulgacoesControle.obterDados);
rotasAdmDivulgacoes.post("/metricas", AdmDivulgacoesControle.obterDados);

// Ranking de campanhas mais custo-benefício
rotasAdmDivulgacoes.get("/resultado", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.post("/resultado", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.get("/resultado-campanhas", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.post("/resultado-campanhas", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.get("/custo-beneficio", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.post("/custo-beneficio", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.get("/rank-resultado", AdmDivulgacoesControle.obterRankResultadoCampanhas);
rotasAdmDivulgacoes.post("/rank-resultado", AdmDivulgacoesControle.obterRankResultadoCampanhas);

// Disparo proativo para API_URL (painel administrativo)
rotasAdmDivulgacoes.post("/enviar", AdmDivulgacoesControle.enviarParaPainel);
rotasAdmDivulgacoes.post("/disparar", AdmDivulgacoesControle.enviarParaPainel);

// Ajustes e baseline da área de divulgações
rotasAdmDivulgacoes.post("/ajuste", AdmDivulgacoesControle.atualizarAjustes);

export default rotasAdmDivulgacoes;
export { rotasAdmDivulgacoes };
