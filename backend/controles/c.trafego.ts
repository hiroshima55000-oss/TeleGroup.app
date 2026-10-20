import { Request, Response } from "express";
import { RepositorioCampanhas } from "../repositorios/repositorio.campanhas";
import {
  LeilaoAdRankServico,
  RelatoriosMetricasServico,
  SimuladorLeilaoServico,
  SlotExibicao,
} from "../servicos/CampanhasPagas";

export const TrafegoControle = {
  /**
   * Endpoint: GET /api/trafego/leilao
   * Executa o leilão em tempo real e retorna os anúncios vencedores para os slots nobres
   */
  async buscarAnuncioLeilao(req: Request, res: Response): Promise<void> {
    try {
      const categoria = req.query.categoria as string;
      const busca = req.query.busca as string;
      const slot = (req.query.slot as SlotExibicao) || "feed_inline";
      const limite = parseInt(req.query.limite as string, 10) || 3;
      const usuarioId =
        (req.query.usuarioId as string) ||
        (req.headers["x-user-id"] as string) ||
        undefined;

      const campanhas = await RepositorioCampanhas.buscarTodas();

      const vencedores = LeilaoAdRankServico.executarLeilao(campanhas, {
        usuarioId,
        categoria,
        busca,
        slot,
        limite,
      });

      res.json({
        sucesso: true,
        total: vencedores.length,
        slot,
        dados: vencedores,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/trafego/evento
   * Registra impressões ou cliques em anúncios pagos, deduzindo do saldo do anunciante
   */
  async registrarEvento(req: Request, res: Response): Promise<void> {
    try {
      const { tipo, campanhaId } = req.body;
      if (!tipo || !campanhaId) {
        res.status(400).json({ sucesso: false, erro: "Parâmetros 'tipo' e 'campanhaId' são obrigatórios." });
        return;
      }

      const atribuido = await RelatoriosMetricasServico.registrarEvento(tipo, campanhaId);
      res.json({ sucesso: true, atribuido });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/trafego/metricas
   * Consolida métricas da plataforma, eCPM, lucro e volume do leilão
   */
  async obterMetricas(req: Request, res: Response): Promise<void> {
    try {
      const dados = await RelatoriosMetricasServico.obterMetricasAlgoritmo();
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: GET /api/trafego/campanha/:id/diagnostico
   * Retorna diagnóstico de saúde, pacing e posição competitiva da campanha
   */
  async obterDiagnosticoCampanha(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados = await RelatoriosMetricasServico.gerarDiagnostico(id);
      if (!dados) {
        res.status(404).json({ sucesso: false, erro: "Campanha não encontrada para diagnóstico." });
        return;
      }
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/trafego/simulador
   * Simula capacidade de absorção de orçamento e lucratividade em escala
   */
  async simularCenario(req: Request, res: Response): Promise<void> {
    try {
      const dados = SimuladorLeilaoServico.simular(req.body || {});
      res.json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default TrafegoControle;
