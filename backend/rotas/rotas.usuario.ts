import { Router } from "express";
import { UsuarioControle } from "../controles/c.usuario";
import { AdmControle } from "../controles/c.adm";
import { HistoricoControle } from "../controles/c.historico";
import { PublicacoesControle } from "../controles/c.publicacoes";

const rotasUsuario = Router();

/**
 * =========================================================
 * ROTAS DE AUTENTICAÇÃO E GOOGLE
 * =========================================================
 */
rotasUsuario.get("/auth/google-config", UsuarioControle.obterGoogleConfig);
rotasUsuario.post("/auth/google-login", UsuarioControle.loginGoogle);

/**
 * =========================================================
 * ROTAS DE PERFIL, VISITAS E BANIMENTO (CLIENTE FRONTEND)
 * =========================================================
 */
rotasUsuario.get("/usuario/status-banimento", UsuarioControle.checarStatusBanimento);
rotasUsuario.post("/usuario/registrar-visita", UsuarioControle.registrarVisita);
rotasUsuario.get("/usuario/metricas", UsuarioControle.obterMetricas);
rotasUsuario.get("/usuarios/metricas", UsuarioControle.obterMetricas);
rotasUsuario.get("/usuario/saldo", UsuarioControle.obterSaldo);
rotasUsuario.post("/usuario/saldo", UsuarioControle.obterSaldo);
rotasUsuario.get("/saldo", UsuarioControle.obterSaldo);
rotasUsuario.post("/saldo", UsuarioControle.obterSaldo);
rotasUsuario.post("/usuario/login-google", UsuarioControle.loginGoogle);
rotasUsuario.put("/usuario/perfil", UsuarioControle.atualizarPerfil);
rotasUsuario.post("/usuario/perfil", UsuarioControle.atualizarPerfil);

// Interesses e perfil de afinidade do usuário
rotasUsuario.get("/usuario/interesses", PublicacoesControle.obterPerfilInteresses);
rotasUsuario.get("/usuario/interesses/:usuarioId", PublicacoesControle.obterPerfilInteresses);
rotasUsuario.post("/usuario/interesses/interagir", PublicacoesControle.registrarEventoInteresse);

// Histórico de usuários para o painel
rotasUsuario.get("/historico/usuarios", HistoricoControle.obterHistorico);
rotasUsuario.post("/historico/usuarios", HistoricoControle.obterHistorico);
rotasUsuario.get("/usuario/historico", HistoricoControle.obterHistorico);
rotasUsuario.post("/usuario/historico", HistoricoControle.obterHistorico);

// Ações de moderação administrativa
rotasUsuario.post("/usuario/banir", HistoricoControle.banirUsuario);
rotasUsuario.post("/usuario/desbanir", HistoricoControle.desbanirUsuario);
rotasUsuario.post("/usuario/excluir", HistoricoControle.excluirUsuario);
rotasUsuario.get("/usuario/investigar/:id", HistoricoControle.investigarUsuario);
rotasUsuario.get("/usuario/investigar", HistoricoControle.investigarUsuario);

/**
 * =========================================================
 * ROTAS DE GERENCIAMENTO DE USUÁRIOS (PUSH DO WEBSITE 1)
 * =========================================================
 * POST /api/usuarios: Cadastra um usuário real no Website 2.
 * PATCH /api/usuarios/:id: Altera status/banimento no Website 2.
 * DELETE /api/usuarios/:id: Remove o usuário no Website 2.
 * GET /api/usuarios: Lista usuários reais.
 * GET /api/usuarios/:id: Consulta dados do usuário.
 */
rotasUsuario.get("/usuarios", UsuarioControle.listarUsuarios);
rotasUsuario.post("/usuarios", UsuarioControle.cadastrarUsuario);
rotasUsuario.get("/usuarios/:id", UsuarioControle.obterPorId);
rotasUsuario.patch("/usuarios/:id", UsuarioControle.atualizarStatus);
rotasUsuario.delete("/usuarios/:id", UsuarioControle.removerUsuario);

/**
 * =========================================================
 * 📥 PEDIR DADOS (PULL)
 * =========================================================
 * Rota: POST /api/dados/usuarios ou POST /api/comunicacao
 */
rotasUsuario.get("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotasUsuario.post("/dados/usuarios", AdmControle.obterMetricasUsuarios);
rotasUsuario.get("/comunicacao", AdmControle.obterMetricasUsuarios);
rotasUsuario.post("/comunicacao", AdmControle.obterMetricasUsuarios);

export default rotasUsuario;
export { rotasUsuario };
