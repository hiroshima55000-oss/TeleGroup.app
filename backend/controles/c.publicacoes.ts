import { Request, Response } from "express";
import { PublicacoesServico } from "../servicos/s.criacao.publicacoes";

export const PublicacoesControle = {
  /**
   * Endpoint: GET /api/publicacoes
   */
  async listarPublicacoes(req: Request, res: Response): Promise<void> {
    try {
      const busca = (req.query.busca as string)?.trim();
      const categoria = req.query.categoria as string;
      const tag = (req.query.tag as string)?.trim();
      const nicho = (req.query.nicho as string)?.trim();
      const apenasComImagem = req.query.apenasComImagem === "true";
      const apenasMinhas = req.query.apenasMinhas === "true";
      const usuarioId =
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const pagina = parseInt(req.query.pagina as string, 10);
      const limite = parseInt(req.query.limite as string, 10);

      const resultado = await PublicacoesServico.listar({
        busca,
        categoria,
        tag,
        nicho,
        apenasComImagem,
        apenasMinhas,
        usuarioId,
        pagina: isNaN(pagina) ? 1 : pagina,
        limite: isNaN(limite) ? 4 : limite,
      });

      res.json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/publicacoes/:id
   */
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await PublicacoesServico.buscarPorId(id);
      res.json({ sucesso: true, dados: item });
    } catch (erro: any) {
      res.status(404).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes
   */
  async criarPublicacao(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        req.body.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        `user_${Date.now()}`;

      const novaPublicacao = await PublicacoesServico.criar({
        ...req.body,
        usuarioId,
      });

      res.status(201).json({
        sucesso: true,
        mensagem: "Publicação criada com sucesso!",
        dados: novaPublicacao,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/:id/like e POST /api/publicacoes/:id/curtir
   */
  async curtirPublicacao(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const descurtir = req.body?.descurtir === true || req.body?.acao === "descurtir";
      const usuarioId =
        req.body?.usuarioId ||
        (req.query?.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const resultado = await PublicacoesServico.curtir(id, descurtir, usuarioId);
      res.json({
        sucesso: true,
        ...resultado,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/:id/clique
   */
  async registrarClique(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId =
        req.body?.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const totalCliques = await PublicacoesServico.registrarClique(id, usuarioId);
      res.json({ sucesso: true, cliques: totalCliques });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/:id/visualizacao
   */
  async registrarVisualizacao(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId =
        req.body?.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const totalVisualizacoes = await PublicacoesServico.registrarVisualizacao(id, usuarioId);
      res.json({ sucesso: true, visualizacoes: totalVisualizacoes });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/visualizacoes-em-lote
   */
  async registrarVisualizacoesEmLote(req: Request, res: Response): Promise<void> {
    try {
      const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const usuarioId =
        req.body?.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      for (const id of ids) {
        await PublicacoesServico.registrarVisualizacao(id, usuarioId);
      }

      res.json({ sucesso: true, processados: ids.length });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/publicacoes/interesses/:usuarioId ou GET /api/publicacoes/interesses
   */
  async obterPerfilInteresses(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        req.params.usuarioId ||
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const { RepositorioInteresses } = await import(
        "../repositorios/repositorio.interesses"
      );
      let perfil = await RepositorioInteresses.obterPerfil(usuarioId);
      if (!perfil) {
        perfil = PublicacoesServico.obterPerfilInteresses(usuarioId);
      }
      res.json({
        sucesso: true,
        perfil,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/interesses/evento
   */
  async registrarEventoInteresse(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        req.body.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const tipo = req.body.tipo || "dwell";
      const perfilAtualizado = await PublicacoesServico.registrarEventoInteresse({
        usuarioId,
        tipo,
        publicacaoId: req.body.publicacaoId,
        tag: req.body.tag,
        nicho: req.body.nicho,
        duracaoSegundos: req.body.duracaoSegundos,
      });

      res.json({
        sucesso: true,
        perfil: perfilAtualizado,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: DELETE /api/publicacoes/:id
   */
  async remover(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PublicacoesServico.remover(id);
      res.json({ sucesso: true, mensagem: "Publicação removida com sucesso" });
    } catch (erro: any) {
      res.status(404).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/:id/denunciar e POST /api/publicacoes/denunciar
   * Registra uma denúncia contra a publicação no sistema de moderação
   */
  async denunciarPublicacao(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.body.publicacaoId || req.body.id;
      const { motivo, denunciante, categoria, detalhes, usuario, usuarioId } = req.body;

      let alvo = usuario || usuarioId;
      let pub: any = null;
      if (id) {
        pub = await PublicacoesServico.buscarPorId(id).catch(() => null);
        if (!alvo && pub) {
          alvo = pub.usuarioId || pub.nome || `@pub_${id}`;
        }
      }
      if (!alvo) {
        alvo = `@conteudo_${id || "desconhecido"}`;
      }

      const motivoCompleto = detalhes && String(detalhes).trim()
        ? `${motivo || "Denúncia de publicação"}: ${String(detalhes).trim()}`
        : (motivo || "Violação das regras da comunidade");

      const { RankDenunciadosServico } = await import("../servicos/s.painel.moderacao.rank.denunciados");
      const resultado = await RankDenunciadosServico.registrarDenuncia({
        usuario: alvo,
        usuarioId: pub?.usuarioId || usuarioId,
        motivo: motivoCompleto,
        denunciante: denunciante || "@anonimo",
        categoria: categoria || "Conteúdo impróprio",
        publicacaoId: id,
      });

      res.status(200).json({
        sucesso: true,
        mensagem: "Denúncia registrada com sucesso. A publicação foi sinalizada para a equipe de moderação.",
        dados: resultado,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/publicacoes/historico/usuario
   * Retorna todos os conteúdos visualizados, curtidos, clicados e o calculador de interesses (ontem, 10d, 30d)
   */
  async obterHistoricoUsuario(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const { RepositorioInteracoesUsuario } = await import(
        "../repositorios/repositorio.interacoes.usuario"
      );

      const conteudos = await RepositorioInteracoesUsuario.obterConteudosDoUsuario(usuarioId);

      const calcOntem = await RepositorioInteracoesUsuario.calcularInteresses(usuarioId, "ontem");
      const calc10d = await RepositorioInteracoesUsuario.calcularInteresses(usuarioId, "10d");
      const calc30d = await RepositorioInteracoesUsuario.calcularInteresses(usuarioId, "30d");

      res.status(200).json({
        sucesso: true,
        usuarioId,
        conteudos,
        calculadorInteresses: {
          ontem: calcOntem,
          dezDias: calc10d,
          trintaDias: calc30d,
        },
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/publicacoes/historico/reset-vistos
   * Permite resetar as publicações visualizadas para vê-las novamente no feed orgânico
   */
  async resetarVisualizados(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        req.body?.usuarioId ||
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        "usr_anonimo";

      const { RepositorioInteracoesUsuario } = await import(
        "../repositorios/repositorio.interacoes.usuario"
      );
      RepositorioInteracoesUsuario.limparVisualizacoes(usuarioId);

      res.status(200).json({
        sucesso: true,
        mensagem: "Histórico de visualizações resetado com sucesso.",
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default PublicacoesControle;
