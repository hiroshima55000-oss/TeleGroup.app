import { Request, Response } from "express";
import { RankHashtagsServico } from "../servicos/s.rank.hastags";

export const RankHashtagsControle = {
  /**
   * Endpoint: GET /api/tags
   * Retorna ranking público de hashtags para a tela de usuário (/tags)
   */
  async listarTags(req: Request, res: Response): Promise<void> {
    try {
      const nicho = req.query.nicho as string;
      const busca = req.query.busca as string;
      const pagina = parseInt(req.query.pagina as string, 10) || 1;
      const limite = parseInt(req.query.limite as string, 10) || 50;
      const ordenarPor = (req.query.ordenarPor as any) || "ranking";

      const resultado = await RankHashtagsServico.obterRanking({
        nicho,
        busca,
        pagina,
        limite,
        ordenarPor,
      });

      res.json(resultado);
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/tags/consultar
   * Retorna estatística de uso de uma hashtag específica
   */
  async consultarTag(req: Request, res: Response): Promise<void> {
    try {
      const tag = (req.query.tag as string) || "";
      if (!tag) {
        res.status(400).json({ sucesso: false, erro: "Parâmetro 'tag' é obrigatório." });
        return;
      }

      const dados = await RankHashtagsServico.consultarUsoTag(tag);
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/tags/sincronizar
   * Força a atualização do ranking recalculando as tags de publicações
   */
  async sincronizar(req: Request, res: Response): Promise<void> {
    try {
      const dados = await RankHashtagsServico.sincronizar();
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/nichos
   * Retorna lista de nichos temáticos com totais agregados
   */
  async listarNichos(req: Request, res: Response): Promise<void> {
    try {
      const dados = await RankHashtagsServico.obterNichos();
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default RankHashtagsControle;
