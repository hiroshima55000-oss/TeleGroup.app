import { RepositorioUsuario } from "../repositorios/repositorio.usuario";
import {
  Usuario,
  RegistroVisitaInput,
  LoginGoogleInput,
  validarEmail,
} from "../schemas/schema.usuario";
import { ComunicacaoServico } from "./s.painel.comunicacao";

export const UsuarioServico = {
  /**
   * Valida se um usuário ou identificador está impedido/banido
   */
  async verificarBanimento(usuario: string): Promise<{ banido: boolean; motivo?: string }> {
    if (!usuario || !usuario.trim()) {
      return { banido: false };
    }
    return await RepositorioUsuario.checarBanido(usuario.trim());
  },

  /**
   * Processa o registro de acesso do usuário, atualizando contadores e horários
   */
  async processarRegistroVisita(dados: RegistroVisitaInput): Promise<Usuario> {
    const idLimpo = dados.usuarioId ? dados.usuarioId.trim() : `usr_${Date.now()}`;
    const emailLimpo =
      dados.email && validarEmail(dados.email.trim())
        ? dados.email.trim().toLowerCase()
        : undefined;
    const nomeLimpo = dados.nome ? dados.nome.trim() : undefined;

    const nicknameLimpo = dados.nickname ? dados.nickname.trim() : undefined;

    const usuario = await RepositorioUsuario.registrarAcesso({
      usuarioId: idLimpo,
      email: emailLimpo,
      nome: nomeLimpo,
      nickname: nicknameLimpo,
      foto: dados.foto,
      googleId: dados.googleId,
      cadastrado: dados.cadastrado ?? Boolean(emailLimpo),
    });

    // Constrói o cartão enriquecido no formato exigido pelo painel administrativo
    const { HistoricoUsuarioServico } = await import("./s.painel.usuarios.historico");
    const itemCard = await HistoricoUsuarioServico.construirItemUsuario(usuario);

    // Notifica o Website 1 em tempo real sobre a nova visita/acesso (não bloqueante)
    ComunicacaoServico.dispararWebhookParaWebsite1("visita_registrada", "usuarios", {
      usuarioId: usuario.usuarioId,
      cadastrado: usuario.cadastrado,
      usuario: itemCard,
      historicoItem: itemCard,
      cardFormatado: itemCard.cardFormatado,
    }).catch(() => {});

    return usuario;
  },

  /**
   * Agrega e retorna as métricas de audiência da plataforma
   */
  async obterMetricasAudilencia() {
    const metricas = await RepositorioUsuario.obterMetricas();
    return {
      sucesso: true,
      ...metricas,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Processa autenticação federada com Google
   */
  async autenticarGoogle(dados: LoginGoogleInput) {
    if (!dados.email || !validarEmail(dados.email.trim())) {
      throw new Error("Email Google inválido ou ausente.");
    }

    const emailLimpo = dados.email.trim().toLowerCase();
    const nomeLimpo =
      dados.name?.trim() ||
      dados.nome?.trim() ||
      emailLimpo.split("@")[0] ||
      "Usuário Google";
    const googleId = dados.googleId || `gid_${Date.now()}`;
    const foto = dados.picture || dados.foto;

    const nickLimpo = emailLimpo.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);
    const nickname = `@${nickLimpo || "usuario"}`;

    const usuario = await RepositorioUsuario.salvarOuAtualizarGoogle({
      usuarioId: dados.idAnonimo,
      email: emailLimpo,
      nome: nomeLimpo,
      foto,
      googleId,
      nickname,
    });

    // Notifica o Website 1 em tempo real sobre o login/cadastro
    ComunicacaoServico.dispararWebhookParaWebsite1("login_google", "usuarios", {
      usuarioId: usuario.usuarioId,
      email: usuario.email,
    }).catch(() => {});

    return {
      id: usuario.usuarioId,
      usuarioId: usuario.usuarioId,
      email: usuario.email || emailLimpo,
      nome: usuario.nome || nomeLimpo,
      foto: usuario.foto,
      googleId: usuario.googleId || googleId,
      nickname: usuario.nickname || nickname,
      cadastrado: true,
      conectadoEm: new Date().toISOString(),
    };
  },

  /**
   * Cadastra um usuário real no Website 2 (POST /api/usuarios via Website 1)
   */
  async cadastrarUsuario(dados: Partial<Usuario> & { id?: string; usuarioId?: string }): Promise<Usuario> {
    const usuario = await RepositorioUsuario.cadastrarOuAtualizar(dados);

    // Notifica o Website 1 proativamente
    ComunicacaoServico.dispararWebhookParaWebsite1("usuario_cadastrado", "usuarios", {
      usuarioId: usuario.usuarioId,
      email: usuario.email,
      nome: usuario.nome,
    }).catch(() => {});

    return usuario;
  },

  /**
   * Altera status/banimento ou dados no Website 2 (PATCH /api/usuarios/:id via Website 1)
   */
  async atualizarStatusUsuario(
    id: string,
    alteracoes: {
      banido?: boolean;
      motivo?: string;
      cadastrado?: boolean;
      nome?: string;
      email?: string;
      nickname?: string;
    }
  ): Promise<{ usuario: Usuario; banido: boolean; motivo?: string }> {
    const resultado = await RepositorioUsuario.atualizarStatus(id, alteracoes);

    const evento =
      alteracoes.banido === true
        ? "usuario_banido"
        : alteracoes.banido === false
        ? "usuario_desbanido"
        : "usuario_atualizado";

    ComunicacaoServico.dispararWebhookParaWebsite1(evento, "usuarios", {
      usuarioId: resultado.usuario.usuarioId,
      banido: resultado.banido,
      motivo: resultado.motivo,
    }).catch(() => {});

    return resultado;
  },

  /**
   * Remove o usuário no Website 2 (DELETE /api/usuarios/:id via Website 1)
   */
  async removerUsuario(id: string): Promise<boolean> {
    const sucesso = await RepositorioUsuario.removerUsuario(id);

    ComunicacaoServico.dispararWebhookParaWebsite1("usuario_removido", "usuarios", {
      usuarioId: id,
    }).catch(() => {});

    return sucesso;
  },

  /**
   * Busca usuário por ID
   */
  async buscarPorId(id: string): Promise<Usuario | null> {
    return await RepositorioUsuario.buscarPorId(id);
  },

  /**
   * Lista todos os usuários
   */
  async listarTodos(): Promise<Usuario[]> {
    return await RepositorioUsuario.listarTodos();
  },

  /**
   * Atualiza dados de perfil do usuário (nome e nickname)
   */
  async atualizarPerfil(usuarioId: string, dados: { nickname?: string; nome?: string }): Promise<Usuario> {
    if (!usuarioId) {
      throw new Error("Identificador do usuário é obrigatório.");
    }

    let nickLimpo = dados.nickname?.trim();
    if (nickLimpo && !nickLimpo.startsWith("@")) {
      nickLimpo = `@${nickLimpo}`;
    }

    const usuario = await RepositorioUsuario.atualizarPerfil(usuarioId, {
      nickname: nickLimpo,
      nome: dados.nome?.trim(),
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    return usuario;
  },
};

export default UsuarioServico;
