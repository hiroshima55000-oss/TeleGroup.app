import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { CampanhasAtivasServico } from "../servicos/s.painel.divulgacoes.campanhas.ativas";

/**
 * =========================================================
 * CONTROLADOR: adm.campanhas.ativas
 * Responsável exclusivo por processar e enviar dados de
 * quantas campanhas de quantos valores diferentes estão ativas
 * para o painel administrativo (Website 1 / API_URL).
 * =========================================================
 */
export const AdmCampanhasAtivasControle = {
  /**
   * Envia dados reais de campanhas ativas por valor de orçamento diário:
   * campanhas ativas:
   * são 15.320 campanhas de R$ 23,90 diário
   * ...
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
        modulo: "adm.campanhas.ativas",
        area: "campanhas_ativas",
        erro: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação de autenticação pela chave secreta do painel
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
        modulo: "adm.campanhas.ativas",
        area: "campanhas_ativas",
        erro: motivo,
      });
      return;
    }

    try {
      const { formato } = req.query;
      const metricas = await CampanhasAtivasServico.obterCampanhasAtivas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "[adm.campanhas.ativas] Dados de campanhas ativas por valor enviados com sucesso",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Formato em texto puro
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta padronizada em JSON para o painel
      res.status(200).json({
        sucesso: true,
        modulo: "adm.campanhas.ativas",
        area: "campanhas_ativas",
        titulo: metricas.titulo,
        fonte: metricas.fonte,
        totalCampanhasAtivas: metricas.totalCampanhasAtivas,
        totalValoresDiferentes: metricas.totalValoresDiferentes,
        totalFaixas: metricas.totalFaixas,
        valoresDiferentes: metricas.valoresDiferentes,
        ranking: metricas.ranking,
        linhas: metricas.linhas,
        textoFormatado: metricas.textoFormatado,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`[adm.campanhas.ativas] Erro ao consolidar campanhas ativas: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        modulo: "adm.campanhas.ativas",
        area: "campanhas_ativas",
        erro: erro.message || "Erro ao consultar dados de campanhas ativas",
      });
    }
  },

  /**
   * Dispara proativamente o envio do levantamento de campanhas ativas para a API_URL
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }

    try {
      const evento = req.body?.evento || "disparo_manual_campanhas_ativas";
      const resultado = await CampanhasAtivasServico.enviarParaPainel(
        evento,
        req.body?.dadosExtras || {}
      );

      res.status(resultado.enviado ? 200 : 502).json({
        sucesso: resultado.enviado,
        modulo: "adm.campanhas.ativas",
        mensagem: resultado.enviado
          ? "Dados de campanhas ativas despachados para API_URL com sucesso"
          : `Falha ao despachar dados para API_URL: ${resultado.erro || "Status não OK"}`,
        status: resultado.status,
        duracaoMs: resultado.duracaoMs,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export const AdmRankingCampanhasControle = AdmCampanhasAtivasControle;
export default AdmCampanhasAtivasControle;
