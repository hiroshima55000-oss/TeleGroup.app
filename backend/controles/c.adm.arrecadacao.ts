import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { ArrecadacaoServico } from "../servicos/s.painel.arrecadacao";

/**
 * =========================================================
 * CONTROLADOR: adm.arrecadação
 * Responsável exclusivo por processar e enviar dados
 * consolidados de quanto a plataforma arrecadou para o painel (API_URL).
 * =========================================================
 */
export const AdmArrecadacaoControle = {
  /**
   * Envia dados e métricas consolidadas de arrecadação financeira:
   * - Valores exatos: hoje, ontem, 10 dias, 30 dias, 60 dias, 90 dias, 1 ano, total
   * - Valores formatados em R$ (Real brasileiro)
   * - Linhas formatadas e texto completo
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
        modulo: "adm.arrecadacao",
        area: "arrecadacao",
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
        modulo: "adm.arrecadacao",
        area: "arrecadacao",
        erro: motivo,
      });
      return;
    }

    try {
      const { formato, tipo, subtipo } = req.query;
      const filtroTipo = String(tipo || subtipo || req.body?.tipo || req.body?.subtipo || "").toLowerCase();

      if (filtroTipo === "transferencias" || filtroTipo === "transferências" || filtroTipo === "historico" || filtroTipo === "h_transferencias") {
        return AdmArrecadacaoControle.obterHistoricoTransferencias(req, res);
      }
      if (filtroTipo === "ano" || filtroTipo === "total_ano" || filtroTipo === "anos") {
        return AdmArrecadacaoControle.obterTotalAno(req, res);
      }
      if (filtroTipo === "mes" || filtroTipo === "total_mes" || filtroTipo === "meses") {
        return AdmArrecadacaoControle.obterTotalMes(req, res);
      }
      if (filtroTipo === "dia" || filtroTipo === "total_dia" || filtroTipo === "dias") {
        return AdmArrecadacaoControle.obterTotalDia(req, res);
      }

      const metricas = await ArrecadacaoServico.obterMetricasCompletas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "[adm.arrecadacao] Dados consolidados de arrecadação enviados",
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
        modulo: "adm.arrecadacao",
        area: "arrecadacao",
        titulo: "ÁREA: ARRECADAÇÃO",
        fonte: metricas.fonte,
        valores: metricas.valores,
        valoresFormatados: metricas.valoresFormatados,
        dados: metricas.dados,
        linhas: metricas.linhas,
        textoFormatado: metricas.textoFormatado,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`[adm.arrecadacao] Erro ao consolidar arrecadação: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        modulo: "adm.arrecadacao",
        area: "arrecadacao",
        erro: erro.message || "Erro ao consultar dados de arrecadação",
      });
    }
  },

  /**
   * Histórico detalhado de transferências:
   * histórico de transferências.
   * histórico de transferências :
   * intervalo entre transferências
   * intervalo max : 30 mins
   * intervalo min : 1 mins e 54s
   * @acbdwsa transferiu +35,90 às 12:40 em 21/10/2026
   */
  async obterHistoricoTransferencias(req: Request, res: Response): Promise<void> {
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
      const dados = await ArrecadacaoServico.obterHistoricoTransferencias();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Histórico de transferências obtido", 200, clientIp, duracaoMs, res);

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
   * Arrecadação por ano (2005 a 2026):
   * Por ano :
   * acessar 2005 total: 8.432,50
   */
  async obterTotalAno(req: Request, res: Response): Promise<void> {
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
      const dados = await ArrecadacaoServico.obterTotalPorAno();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Arrecadação total por ano obtida", 200, clientIp, duracaoMs, res);

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
   * Arrecadação por mês:
   * Por mês.
   * acessar 2026 jan foi 1.293,90
   * 2026 total : 23.556,60.
   */
  async obterTotalMes(req: Request, res: Response): Promise<void> {
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
      const anoParam = Number(req.query.ano || req.body?.ano) || 2026;
      const dados = await ArrecadacaoServico.obterTotalPorMes(anoParam);
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Arrecadação total por mês obtida", 200, clientIp, duracaoMs, res);

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
   * Arrecadação por dia:
   * Por dia.
   * Dia 01 foi 98,50
   * Total foi 3.125,40
   */
  async obterTotalDia(req: Request, res: Response): Promise<void> {
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
      const dados = await ArrecadacaoServico.obterTotalPorDia();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Arrecadação total por dia obtida", 200, clientIp, duracaoMs, res);

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
   * Dispara proativamente o envio dos dados de arrecadação para a API_URL (Painel)
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }

    try {
      const { tipo, area, evento, dadosExtras } = req.body || {};
      const eventoFinal = evento || "disparo_manual_arrecadacao";
      const tipoFinal = String(tipo || area || req.query.tipo || "").toLowerCase();

      let resultado: any;
      if (tipoFinal === "transferencias" || tipoFinal === "historico_transferencias" || tipoFinal === "historico") {
        resultado = await ArrecadacaoServico.historicoTransferencias.enviarParaPainel(eventoFinal, dadosExtras);
      } else if (tipoFinal === "ano" || tipoFinal === "total_ano") {
        resultado = await ArrecadacaoServico.totalAno.enviarParaPainel(eventoFinal, dadosExtras);
      } else if (tipoFinal === "mes" || tipoFinal === "total_mes") {
        resultado = await ArrecadacaoServico.totalMes.enviarParaPainel(eventoFinal, dadosExtras);
      } else if (tipoFinal === "dia" || tipoFinal === "total_dia") {
        resultado = await ArrecadacaoServico.totalDia.enviarParaPainel(eventoFinal, dadosExtras);
      } else {
        resultado = await ArrecadacaoServico.enviarParaPainel(eventoFinal, dadosExtras || {});
      }

      res.status(resultado.enviado ? 200 : 502).json({
        sucesso: resultado.enviado,
        modulo: "adm.arrecadacao",
        tipo: tipoFinal || "geral",
        mensagem: resultado.enviado
          ? "Dados de arrecadação despachados para API_URL com sucesso"
          : `Falha ao despachar dados para API_URL: ${resultado.erro || "Status não OK"}`,
        status: resultado.status,
        duracaoMs: resultado.duracaoMs,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Permite atualizar ajustes manuais de arrecadação diretamente pelo painel
   */
  async atualizarAjustes(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }
    try {
      const resultado = await ArrecadacaoServico.atualizarAjustesManuais(req.body);
      res.json({
        sucesso: true,
        modulo: "adm.arrecadacao",
        mensagem: "Ajustes de arrecadação atualizados com sucesso",
        dados: resultado,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Permite registrar uma transação financeira de arrecadação
   */
  async registrarTransacao(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }
    try {
      const { valor, origem, descricao, data } = req.body;
      if (valor === undefined || isNaN(Number(valor))) {
        res.status(400).json({ sucesso: false, erro: "Valor monetário inválido" });
        return;
      }
      const resultado = await ArrecadacaoServico.registrarTransacao({
        valor: Number(valor),
        origem,
        descricao,
        data,
      });
      res.json({
        sucesso: true,
        modulo: "adm.arrecadacao",
        mensagem: "Transação de arrecadação registrada com sucesso",
        dados: resultado,
      });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },
};

export default AdmArrecadacaoControle;
