import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { DivulgacoesServico } from "../servicos/s.painel.divulgacoes";

/**
 * =========================================================
 * CONTROLADOR: adm.divulgações
 * Responsável exclusivo por processar e enviar dados
 * consolidados da área de divulgações (divulgações, publicações e campanhas)
 * para o painel administrativo (Website 1 / API_URL).
 * =========================================================
 */
export const AdmDivulgacoesControle = {
  /**
   * Envia dados e métricas consolidadas da área de divulgações:
   * - área : divulgações :
   * - são 190.585 divulgações
   * - são 176.987 publicações
   * - são 13.598 campanhas
   */
  async obterDados(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    // 1. Prevenção de loop
    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        checagemLoop.motivo!,
        400,
        checagemLoop.ip || "Interno",
        0,
        res
      );
      res.status(400).json({
        sucesso: false,
        modulo: "adm.divulgacoes",
        area: "divulgacoes",
        erro: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta do Painel
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracaoMs = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        clientIp,
        duracaoMs,
        res
      );
      res.status(401).json({
        sucesso: false,
        modulo: "adm.divulgacoes",
        area: "divulgacoes",
        erro: motivo,
      });
      return;
    }

    try {
      const { formato, tipo, subtipo } = req.query;
      const filtro = String(tipo || subtipo || req.body?.tipo || req.body?.subtipo || "").toLowerCase();

      if (filtro === "resultado" || filtro === "resultado_campanhas" || filtro === "custo_beneficio" || filtro === "rank_resultado") {
        return AdmDivulgacoesControle.obterRankResultadoCampanhas(req, res);
      }

      const metricas = await DivulgacoesServico.obterMetricasCompletas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "[adm.divulgacoes] Dados consolidados de divulgações enviados",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Formato em texto puro caso solicitado
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta padronizada para o painel
      res.status(200).json({
        sucesso: true,
        modulo: "adm.divulgacoes",
        area: "divulgacoes",
        titulo: metricas.titulo,
        fonte: metricas.fonte,
        valores: metricas.valores,
        valoresFormatados: metricas.valoresFormatados,
        dados: metricas.dados,
        divulgacoes: metricas.valores.divulgacoes,
        publicacoes: metricas.valores.publicacoes,
        campanhas: metricas.valores.campanhas,
        linhas: metricas.linhas,
        textoFormatado: metricas.textoFormatado,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`[adm.divulgacoes] Erro ao consolidar divulgações: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        modulo: "adm.divulgacoes",
        area: "divulgacoes",
        erro: erro.message || "Erro ao consultar dados de divulgações",
      });
    }
  },

  /**
   * Ranking das campanhas mais custo-benefício
   */
  async obterRankResultadoCampanhas(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      res.status(400).json({ sucesso: false, erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: checagemAuth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const { RankResultadoCampanhaServico } = await import("../servicos/s.painel.divulgacoes.rank.resultado.campanha");
      const dados = await RankResultadoCampanhaServico.obterRankingResultado();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "Rank de resultado de campanhas (custo-benefício) obtido",
        200,
        clientIp,
        duracaoMs,
        res
      );

      if (formato === "texto" || formato === "txt" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },

  /**
   * Dispara proativamente o envio dos dados de divulgações para a API_URL
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }

    try {
      const { tipo, evento, dadosExtras } = req.body || {};
      const eventoFinal = evento || "envio_manual_divulgacoes";
      const tipoFinal = String(tipo || req.query.tipo || "").toLowerCase();

      let resultado: any;
      if (tipoFinal === "resultado" || tipoFinal === "custo_beneficio" || tipoFinal === "rank_resultado") {
        const { RankResultadoCampanhaServico } = await import("../servicos/s.painel.divulgacoes.rank.resultado.campanha");
        resultado = await RankResultadoCampanhaServico.enviarParaPainel(eventoFinal, dadosExtras);
      } else {
        resultado = await DivulgacoesServico.enviarParaPainel(eventoFinal, dadosExtras || {});
      }

      res.status(resultado.enviado ? 200 : 502).json({
        sucesso: resultado.enviado,
        modulo: "adm.divulgacoes",
        area: "divulgacoes",
        tipo: tipoFinal || "geral",
        mensagem: resultado.enviado
          ? "Dados da área de divulgações despachados com sucesso para o painel"
          : `Falha ao despachar dados para API_URL: ${resultado.erro || "Status não OK"}`,
        detalhes: resultado,
      });
    } catch (erro: any) {
      res.status(500).json({
        sucesso: false,
        modulo: "adm.divulgacoes",
        erro: erro.message,
      });
    }
  },

  /**
   * Consulta os dados reais atualizados da área de divulgações
   */
  async atualizarAjustes(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }
    try {
      const metricas = await DivulgacoesServico.obterMetricasCompletas();
      res.json({
        sucesso: true,
        modulo: "adm.divulgacoes",
        mensagem: "Métricas reais de divulgações consultadas",
        dados: metricas.dados,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default AdmDivulgacoesControle;
