import { Router } from "express";
import { AdmModeracaoControle } from "../controles/c.adm.moderacao";

const rotas = Router();

/**
 * =========================================================
 * ROTAS ADMINISTRATIVAS: MODERAÇÃO (PAINEL ADMINISTRATIVO)
 * =========================================================
 * 
 * - s.painel.moderacao.rank.denunciados (rank de denunciados)
 * - s.painel.moderacao.historico.banido (histórico de banidos)
 */

// Rank de Denunciados
rotas.get("/denunciados", AdmModeracaoControle.obterRankDenunciados);
rotas.post("/denunciados", AdmModeracaoControle.obterRankDenunciados);
rotas.get("/rank/denunciados", AdmModeracaoControle.obterRankDenunciados);
rotas.post("/rank/denunciados", AdmModeracaoControle.obterRankDenunciados);
rotas.get("/rank-denunciados", AdmModeracaoControle.obterRankDenunciados);
rotas.post("/rank-denunciados", AdmModeracaoControle.obterRankDenunciados);

// Registrar nova denúncia
rotas.post("/denunciar", AdmModeracaoControle.registrarDenuncia);
rotas.post("/denuncia", AdmModeracaoControle.registrarDenuncia);

// Histórico de Banidos
rotas.get("/banidos", AdmModeracaoControle.obterHistoricoBanidos);
rotas.post("/banidos", AdmModeracaoControle.obterHistoricoBanidos);
rotas.get("/historico/banido", AdmModeracaoControle.obterHistoricoBanidos);
rotas.post("/historico/banido", AdmModeracaoControle.obterHistoricoBanidos);
rotas.get("/historico-banido", AdmModeracaoControle.obterHistoricoBanidos);
rotas.post("/historico-banido", AdmModeracaoControle.obterHistoricoBanidos);
rotas.get("/historico/banidos", AdmModeracaoControle.obterHistoricoBanidos);
rotas.post("/historico/banidos", AdmModeracaoControle.obterHistoricoBanidos);

// Ações de moderação
rotas.post("/banir", AdmModeracaoControle.banirUsuario);
rotas.post("/desbanir", AdmModeracaoControle.desbanirUsuario);

// Envio proativo para API_URL (Painel)
rotas.post("/enviar", AdmModeracaoControle.enviarParaPainel);
rotas.post("/enviar/:tipo", AdmModeracaoControle.enviarParaPainel);

export default rotas;
export { rotas as rotasAdmModeracao };
