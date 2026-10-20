import { Request, Response } from "express";
import { CampanhasServico } from "../servicos/s.criacao.campanhas";
import { StatusCampanha } from "../schemas/schema.campanhas";

export const CampanhasControle = {
  /**
   * Endpoint: GET /api/campanhas
   */
  async listarCampanhas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req.query.usuarioId as string) || (req.headers["x-user-id"] as string);
      const busca = req.query.busca as string;
      const status = req.query.status as string;

      const dados = await CampanhasServico.listar({ usuarioId, busca, status });
      res.json({
        sucesso: true,
        total: dados.length,
        dados,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/campanhas/metricas
   */
  async obterMetricas(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = (req.query.usuarioId as string) || (req.headers["x-user-id"] as string);
      const metricas = await CampanhasServico.obterMetricasConsolidadas(usuarioId);
      res.json({
        sucesso: true,
        dados: metricas,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/campanhas/:id
   */
  async obterPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados = await CampanhasServico.buscarPorId(id);
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(404).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/campanhas
   */
  async criarCampanha(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId =
        req.body.usuarioId ||
        (req.headers["x-user-id"] as string) ||
        `user_anon_${Date.now()}`;
      const googleEmail =
        req.body.googleEmail ||
        (req.headers["x-google-email"] as string) ||
        undefined;
      const usuario =
        req.body.usuario ||
        (req.headers["x-usuario"] as string) ||
        undefined;

      const novaCampanha = await CampanhasServico.criarNovaCampanha({
        ...req.body,
        usuarioId,
        googleEmail,
        usuario,
      });

      res.status(201).json({
        sucesso: true,
        mensagem: novaCampanha.pagoComSaldo
          ? "Campanha ativada imediatamente com seu saldo disponível!"
          : "Campanha criada com sucesso!",
        dados: novaCampanha,
        pagoComSaldo: novaCampanha.pagoComSaldo,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: PATCH /api/campanhas/:id/status
   */
  async alterarStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const campanhaAtualizada = await CampanhasServico.atualizarStatusCampanha(
        id,
        status as StatusCampanha
      );

      res.json({
        sucesso: true,
        mensagem: `Status da campanha alterado para ${status}`,
        dados: campanhaAtualizada,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: DELETE /api/campanhas/:id
   */
  async remover(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await CampanhasServico.removerCampanha(id);
      res.json({ sucesso: true, mensagem: "Campanha removida com sucesso" });
    } catch (erro: any) {
      res.status(404).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default CampanhasControle;
