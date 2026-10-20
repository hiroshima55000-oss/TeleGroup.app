import { Request, Response } from "express";
import { UsuarioServico } from "../servicos/s.criacao.usuario";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { GOOGLE_CLIENT_ID } from "../configuracao/variaveis";

export const UsuarioControle = {
  /**
   * Endpoint: GET /api/auth/google-config
   */
  async obterGoogleConfig(_req: Request, res: Response): Promise<void> {
    const clientId =
      GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      "";

    res.json({
      clientId,
      configurado: Boolean(clientId),
    });
  },

  /**
   * Endpoint: GET /api/usuario/status-banimento
   */
  async checarStatusBanimento(req: Request, res: Response): Promise<void> {
    try {
      const usuario = String(
        req.query.usuario || req.query.usuarioId || req.query.email || ""
      ).trim();
      const resultado = await UsuarioServico.verificarBanimento(usuario);
      res.json(resultado);
    } catch (erro: any) {
      res.status(500).json({ banido: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/usuario/registrar-visita
   */
  async registrarVisita(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    try {
      const usuario = await UsuarioServico.processarRegistroVisita(req.body);
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Visita registrada para ${usuario.usuarioId}`,
        200,
        ip,
        duracao
      );

      res.json({
        sucesso: true,
        usuarioId: usuario.usuarioId,
        mensagem: "Visita registrada com sucesso",
        usuario,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Falha ao registrar visita",
        500,
        ip,
        duracao
      );
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/usuario/metricas e GET /api/usuarios/metricas
   */
  async obterMetricas(_req: Request, res: Response): Promise<void> {
    try {
      const metricas = await UsuarioServico.obterMetricasAudilencia();
      res.json(metricas);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/auth/google-login e POST /api/usuario/login-google
   */
  async loginGoogle(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    try {
      const idAnonimo =
        req.body.idAnonimo ||
        (req.headers["x-user-id"] as string) ||
        req.body.usuarioId;

      const usuario = await UsuarioServico.autenticarGoogle({
        ...req.body,
        idAnonimo,
      });

      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Login Google bem-sucedido para ${usuario.email}`,
        200,
        ip,
        duracao
      );

      res.json({
        sucesso: true,
        mensagem: "Login Google processado com sucesso!",
        usuario,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Falha na autenticação Google",
        400,
        ip,
        duracao
      );
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: PUT /api/usuario/perfil e POST /api/usuario/perfil
   */
  async atualizarPerfil(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        (req.headers["x-user-id"] as string) || req.body.usuarioId;
      const { nickname, nome } = req.body;

      const usuario = await UsuarioServico.atualizarPerfil(usuarioId, {
        nickname,
        nome,
      });

      res.json({
        sucesso: true,
        mensagem: "Perfil atualizado com sucesso!",
        usuario,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/usuarios
   * Cadastra um usuário real no Website 2 (Push do Website 1)
   */
  async cadastrarUsuario(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    // 1. Prevenção de loop
    const loop = ComunicacaoServico.checarLoopInstancia(req);
    if (loop.loop) {
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        loop.motivo!,
        400,
        loop.ip || "Interno",
        0
      );
      res.status(400).json({ sucesso: false, erro: loop.motivo, motivo: loop.motivo });
      return;
    }

    // 2. Validação da Chave Secreta
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        ip,
        duracao,
        res
      );
      res.status(401).json({ sucesso: false, erro: motivo, motivo });
      return;
    }

    try {
      const usuario = await UsuarioServico.cadastrarUsuario(req.body);
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário cadastrado com sucesso (${usuario.usuarioId})`,
        201,
        ip,
        duracao,
        res
      );

      res.status(201).json({
        sucesso: true,
        mensagem: "Usuário cadastrado com sucesso no Website 2",
        usuario,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Erro ao cadastrar usuário",
        500,
        ip,
        duracao,
        res
      );
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: PATCH /api/usuarios/:id
   * Altera status/banimento ou dados no Website 2 (Push do Website 1)
   */
  async atualizarStatus(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    // 1. Prevenção de loop
    const loop = ComunicacaoServico.checarLoopInstancia(req);
    if (loop.loop) {
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        loop.motivo!,
        400,
        loop.ip || "Interno",
        0
      );
      res.status(400).json({ sucesso: false, erro: loop.motivo, motivo: loop.motivo });
      return;
    }

    // 2. Validação da Chave Secreta
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        ip,
        duracao,
        res
      );
      res.status(401).json({ sucesso: false, erro: motivo, motivo });
      return;
    }

    try {
      const { id } = req.params;
      const resultado = await UsuarioServico.atualizarStatusUsuario(id, req.body);
      const duracao = Date.now() - inicio;

      const acao = resultado.banido ? "banido" : "status atualizado";
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário ${id} ${acao}`,
        200,
        ip,
        duracao,
        res
      );

      res.json({
        sucesso: true,
        mensagem: "Status do usuário atualizado com sucesso no Website 2",
        ...resultado,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Erro ao atualizar status",
        500,
        ip,
        duracao,
        res
      );
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: DELETE /api/usuarios/:id
   * Remove o usuário no Website 2 (Push do Website 1)
   */
  async removerUsuario(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    // 1. Prevenção de loop
    const loop = ComunicacaoServico.checarLoopInstancia(req);
    if (loop.loop) {
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        loop.motivo!,
        400,
        loop.ip || "Interno",
        0
      );
      res.status(400).json({ sucesso: false, erro: loop.motivo, motivo: loop.motivo });
      return;
    }

    // 2. Validação de Autorização
    const headerAutorizado = req.headers["x-autorizado"];
    if (headerAutorizado === "false") {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        "Acesso não autorizado",
        403,
        ip,
        duracao,
        res
      );
      res.status(403).json({ sucesso: false, erro: "Acesso não autorizado", motivo: "Acesso não autorizado" });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        ip,
        duracao,
        res
      );
      res.status(401).json({ sucesso: false, erro: motivo, motivo });
      return;
    }

    try {
      const { id } = req.params;
      const sucesso = await UsuarioServico.removerUsuario(id);
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário ${id} removido com sucesso`,
        200,
        ip,
        duracao,
        res
      );

      res.json({
        sucesso,
        mensagem: "Usuário removido com sucesso no Website 2",
        id,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Erro ao remover usuário",
        500,
        ip,
        duracao,
        res
      );
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/usuarios
   * Lista usuários reais do Website 2
   */
  async listarUsuarios(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    try {
      const lista = await UsuarioServico.listarTodos();
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `${lista.length} usuários retornados`,
        200,
        ip,
        duracao,
        res
      );

      res.json({
        sucesso: true,
        total: lista.length,
        dados: lista,
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Erro ao listar usuários",
        500,
        ip,
        duracao,
        res
      );
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/usuario/saldo
   * Consulta o saldo de campanhas do usuário (pelo usuarioId, @nickname ou email)
   */
  async obterSaldo(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "";
      const usuario =
        (req.query.usuario as string) ||
        (req.query.arroba as string) ||
        (req.headers["x-usuario"] as string) ||
        "";
      const email =
        (req.query.email as string) ||
        (req.headers["x-google-email"] as string) ||
        "";
      const orcamento = req.query.orcamento ? Number(req.query.orcamento) : undefined;

      const identificadores = {
        usuarioId: usuarioId.trim(),
        usuario: usuario.trim(),
        email: email.trim(),
      };

      if (!identificadores.usuarioId && !identificadores.usuario && !identificadores.email) {
        res.status(400).json({ sucesso: false, erro: "Identificador de usuário não fornecido." });
        return;
      }

      const { PainelAdicionarSaldoServico } = await import("../servicos/s.painel.divulgacoes.adcionar.saldo");
      const dados = await PainelAdicionarSaldoServico.consultarSaldo(identificadores, orcamento);
      res.json(dados);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/usuarios/:id
   */
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuario = await UsuarioServico.buscarPorId(id);
      if (!usuario) {
        res.status(404).json({ sucesso: false, erro: "Usuário não encontrado" });
        return;
      }
      res.json({ sucesso: true, usuario });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default UsuarioControle;
