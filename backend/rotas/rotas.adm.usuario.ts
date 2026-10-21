import { Router } from "express";
import { AdmUsuarioControle } from "../controles/c.adm.usuario";

const rotasAdmUsuario = Router();

/**
 * =========================================================
 * ROTAS: adm.usuario
 * Endpoints dedicados para envio de dados, métricas e histórico de usuários
 * =========================================================
 */

// Envio de dados consolidados de usuários (suporta GET e POST para máxima compatibilidade)
rotasAdmUsuario.get("/", AdmUsuarioControle.obterDados);
rotasAdmUsuario.post("/", AdmUsuarioControle.obterDados);
rotasAdmUsuario.get("/dados", AdmUsuarioControle.obterDados);
rotasAdmUsuario.post("/dados", AdmUsuarioControle.obterDados);
rotasAdmUsuario.get("/metricas", AdmUsuarioControle.obterDados);
rotasAdmUsuario.post("/metricas", AdmUsuarioControle.obterDados);

// Histórico de usuários com cartões organizados
rotasAdmUsuario.get("/historico", AdmUsuarioControle.obterHistorico);
rotasAdmUsuario.post("/historico", AdmUsuarioControle.obterHistorico);
rotasAdmUsuario.delete("/historico", AdmUsuarioControle.removerHistorico);

// Histórico de interesses e afinidades dos usuários
rotasAdmUsuario.get("/interesses", AdmUsuarioControle.obterInteresses);
rotasAdmUsuario.post("/interesses", AdmUsuarioControle.obterInteresses);
rotasAdmUsuario.get("/historico/interesses", AdmUsuarioControle.obterInteresses);
rotasAdmUsuario.post("/historico/interesses", AdmUsuarioControle.obterInteresses);
rotasAdmUsuario.post("/enviar-interesses", AdmUsuarioControle.enviarInteressesParaPainel);

// Ações de moderação administrativa (Banir, Desbanir, Excluir, Investigar)
rotasAdmUsuario.post("/banir", AdmUsuarioControle.banirUsuario);
rotasAdmUsuario.post("/ban", AdmUsuarioControle.banirUsuario);
rotasAdmUsuario.patch("/banir", AdmUsuarioControle.banirUsuario);

rotasAdmUsuario.post("/desbanir", AdmUsuarioControle.desbanirUsuario);
rotasAdmUsuario.post("/unban", AdmUsuarioControle.desbanirUsuario);
rotasAdmUsuario.patch("/desbanir", AdmUsuarioControle.desbanirUsuario);

rotasAdmUsuario.post("/excluir", AdmUsuarioControle.excluirUsuario);
rotasAdmUsuario.delete("/excluir", AdmUsuarioControle.excluirUsuario);
rotasAdmUsuario.delete("/:id", AdmUsuarioControle.excluirUsuario);

rotasAdmUsuario.get("/investigar", AdmUsuarioControle.investigarUsuario);
rotasAdmUsuario.get("/investigar/:id", AdmUsuarioControle.investigarUsuario);

// Envio proativo para API_URL
rotasAdmUsuario.post("/enviar", AdmUsuarioControle.enviarParaPainel);
rotasAdmUsuario.post("/enviar-painel", AdmUsuarioControle.enviarParaPainel);

export default rotasAdmUsuario;
export { rotasAdmUsuario };
