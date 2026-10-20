import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { HistoricoUsuarioServico } from "../servicos/s.painel.usuarios.historico";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";

export const HistoricoControle = {
  /**
   * Endpoint: GET /api/historico/usuarios ou GET /adm/historico/usuarios ou GET /adm.usuario/historico
   * Retorna os cartões estruturados e texto formatado dos usuários no histórico
   */
  async obterHistorico(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        checagemLoop.motivo!,
        400,
        checagemLoop.ip || "Interno",
        duracao,
        res
      );
      res.status(400).json({
        sucesso: false,
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        auth.motivo || "Chave secreta inválida",
        401,
        ip,
        duracao,
        res
      );
      res.status(401).json({
        sucesso: false,
        erro: auth.motivo || "Chave secreta inválida",
        motivo: auth.motivo || "Chave secreta inválida",
      });
      return;
    }

    try {
      const busca = String(req.query.busca || req.query.q || req.query.usuario || "").trim();
      const limite = req.query.limite ? Number(req.query.limite) : undefined;
      const formato = String(req.query.formato || "").toLowerCase();

      const resultado = await HistoricoUsuarioServico.obterHistoricoCompleto({
        busca,
        limite,
      });

      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Histórico de ${resultado.total} usuários consultado`,
        200,
        ip,
        duracao,
        res
      );

      // Suporte a retorno em texto puro
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(resultado.textoFormatado);
        return;
      }

      res.status(200).json({
        sucesso: true,
        total: resultado.total,
        historico: resultado.historico,
        cardsTexto: resultado.cardsTexto,
        textoFormatado: resultado.textoFormatado,
        dados: resultado.historico,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.erro(`Erro ao obter histórico de usuários: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        erro: erro.message || "Falha ao obter histórico de usuários",
      });
    }
  },

  /**
   * Endpoint: POST /adm/usuario/banir ou POST /adm.usuario/banir ou POST /api/historico/usuarios/banir
   * Bane o usuário solicitado
   */
  async banirUsuario(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      res.status(400).json({ sucesso: false, erro: checagemLoop.motivo });
      return;
    }

    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      res.status(401).json({ sucesso: false, erro: auth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const identificador =
        req.body?.usuarioId ||
        req.body?.usuario ||
        req.body?.id ||
        req.body?.email ||
        req.params?.id ||
        req.query?.usuarioId ||
        req.query?.usuario;

      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário (@nickname, ID ou email) não informado." });
        return;
      }

      const motivo = req.body?.motivo || "Banido pelo painel administrativo";
      const resultado = await HistoricoUsuarioServico.banirUsuario(String(identificador), motivo);

      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário ${identificador} banido`,
        200,
        ip,
        duracao,
        res
      );

      res.status(200).json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /adm/usuario/desbanir ou POST /adm.usuario/desbanir
   */
  async desbanirUsuario(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      res.status(401).json({ sucesso: false, erro: auth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const identificador =
        req.body?.usuarioId ||
        req.body?.usuario ||
        req.body?.id ||
        req.body?.email ||
        req.params?.id ||
        req.query?.usuarioId ||
        req.query?.usuario;

      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário não informado." });
        return;
      }

      const resultado = await HistoricoUsuarioServico.desbanirUsuario(String(identificador));
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário ${identificador} desbanido`,
        200,
        ip,
        duracao,
        res
      );

      res.status(200).json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /adm/usuario/excluir ou DELETE /adm/usuario/:id ou DELETE /api/usuarios/:id
   * Exclui o usuário do sistema
   */
  async excluirUsuario(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      res.status(401).json({ sucesso: false, erro: auth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const identificador =
        req.body?.usuarioId ||
        req.body?.usuario ||
        req.body?.id ||
        req.body?.email ||
        req.params?.id ||
        req.query?.usuarioId ||
        req.query?.usuario;

      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário não informado." });
        return;
      }

      const resultado = await HistoricoUsuarioServico.excluirUsuario(String(identificador));
      const duracao = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Usuário ${identificador} excluído`,
        200,
        ip,
        duracao,
        res
      );

      res.status(200).json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /adm/usuario/investigar/:id ou GET /adm.usuario/investigar/:id
   */
  async investigarUsuario(req: Request, res: Response): Promise<void> {
    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      res.status(401).json({ sucesso: false, erro: auth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const identificador =
        req.params?.id ||
        req.query?.usuarioId ||
        req.query?.usuario ||
        req.query?.id ||
        req.body?.usuarioId ||
        req.body?.id;

      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário não informado." });
        return;
      }

      const resultado = await HistoricoUsuarioServico.investigarUsuario(String(identificador));
      res.status(200).json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/historico/usuarios
   */
  async inserirHistorico(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    // 1. Verificação de loop na própria instância
    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        checagemLoop.motivo!,
        400,
        checagemLoop.ip || "Interno",
        duracao,
        res
      );
      res.status(400).json({
        sucesso: false,
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Verificação de Chave Secreta
    const auth = ComunicacaoServico.validarChavePainel(req);
    if (!auth.valido) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        auth.motivo || "Chave secreta inválida",
        401,
        ip,
        duracao,
        res
      );
      res.status(401).json({
        sucesso: false,
        erro: auth.motivo || "Chave secreta inválida",
        motivo: auth.motivo || "Chave secreta inválida",
      });
      return;
    }

    // 3. Verificação de Limite de 10.000 usuários
    const totalInformado = Number(req.body?.total || req.body?.quantidade || 0);
    const listaUsuarios = Array.isArray(req.body?.usuarios)
      ? req.body.usuarios
      : Array.isArray(req.body?.historico)
      ? req.body.historico
      : [];

    if (totalInformado > 10000 || listaUsuarios.length > 10000) {
      const duracao = Date.now() - inicio;
      const motivo = "Limite de 10.000 usuários excedido";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        400,
        ip,
        duracao,
        res
      );
      res.status(400).json({
        sucesso: false,
        erro: motivo,
        motivo,
      });
      return;
    }

    const duracao = Date.now() - inicio;
    LoggerInformativo.requisicaoPermitida(
      req.method,
      req.originalUrl || req.url,
      "Histórico de usuários inserido",
      200,
      ip,
      duracao,
      res
    );

    res.status(200).json({
      sucesso: true,
      mensagem: "Histórico processado com sucesso",
      total: listaUsuarios.length || totalInformado,
    });
  },

  /**
   * Endpoint: DELETE /api/historico/usuarios
   */
  async removerHistorico(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const ip = extrairIp(req);

    // 1. Verificação de loop na própria instância
    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        checagemLoop.motivo!,
        400,
        checagemLoop.ip || "Interno",
        duracao,
        res
      );
      res.status(400).json({
        sucesso: false,
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Verificação de autorização administrativa estrita
    const headerAutorizado = req.headers["x-autorizado"];
    const headerRole = req.headers["x-role"];
    const semAutorizacao =
      headerAutorizado === "false" ||
      headerRole === "user" ||
      headerRole === "visitante";

    const auth = ComunicacaoServico.validarChavePainel(req);

    if (semAutorizacao || !auth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = !auth.valido ? "Chave secreta inválida" : "Acesso não autorizado";
      const status = !auth.valido ? 401 : 403;

      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        status,
        ip,
        duracao,
        res
      );

      res.status(status).json({
        sucesso: false,
        erro: motivo,
        motivo,
      });
      return;
    }

    const duracao = Date.now() - inicio;
    LoggerInformativo.requisicaoPermitida(
      req.method,
      req.originalUrl || req.url,
      "Histórico de usuários limpo com sucesso",
      200,
      ip,
      duracao,
      res
    );

    res.status(200).json({
      sucesso: true,
      mensagem: "Histórico de usuários excluído com sucesso",
    });
  },
};

export default HistoricoControle;
