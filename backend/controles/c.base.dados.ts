import { Request, Response } from "express";
import { CicloBaseDadosServico } from "../servicos/BaseDados";

export const BaseDadosControle = {
  /**
   * Endpoint: GET /api/basedados/status ou GET /api/basedados/ciclo
   * Retorna métricas do ciclo contínuo 1-2-3-4-1
   */
  async obterStatusCiclo(req: Request, res: Response): Promise<void> {
    try {
      const metricas = CicloBaseDadosServico.obterMetricas();
      res.json({
        sucesso: true,
        dados: metricas,
        ciclo: "1 (Coletar) -> 2 (Otimizar) -> 3 (Entregar) -> 4 (Coletar Mais) -> 1",
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/basedados/evento ou POST /api/basedados/ciclo
   * Alimenta o ciclo com uma ação do usuário e avança o loop
   */
  async registrarEventoNoCiclo(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, nickname, tipo, publicacaoId, tag, nicho, duracaoSegundos, reacao } = req.body;
      const resultado = await CicloBaseDadosServico.executarPassoCiclo({
        usuarioId: usuarioId || (req.headers["x-user-id"] as string) || "usr_anonimo",
        nickname,
        tipo,
        publicacaoId,
        tag,
        nicho,
        duracaoSegundos,
        reacao,
      });

      res.json({
        sucesso: true,
        dados: resultado,
      });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/basedados/perfil/:usuarioId
   * Retorna o perfil de interesses otimizado pelo ciclo
   */
  async obterPerfilOtimizado(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.params.usuarioId || (req.query.usuarioId as string) || "usr_anonimo";
      const perfil = CicloBaseDadosServico.obterPerfil(usuarioId);
      res.json({
        sucesso: true,
        dados: perfil,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/basedados/entrega/:usuarioId
   * Retorna a entrega de interesses pronta para consumo do feed e anúncios
   */
  async obterEntrega(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = req.params.usuarioId || (req.query.usuarioId as string) || "usr_anonimo";
      const entrega = CicloBaseDadosServico.obterEntrega(usuarioId);
      res.json({
        sucesso: true,
        dados: entrega,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default BaseDadosControle;
