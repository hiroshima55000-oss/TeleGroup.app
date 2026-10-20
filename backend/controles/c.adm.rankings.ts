import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { RankPublicadoresServico } from "../servicos/s.painel.divulgacoes.rank.publicadores";
import { RankAnunciantesServico } from "../servicos/s.painel.divulgacoes.rank.anunciantes";
import { RankInvestidoresServico } from "../servicos/s.painel.divulgacoes.rank.investidores";
import { RankSaldoServico } from "../servicos/s.painel.divulgacoes.rank.saldo";

/**
 * =========================================================
 * CONTROLADOR: adm.rankings
 * Processa e expõe os rankings requisitados para o painel administrativo:
 * - rank de publicadores
 * - rank de anunciantes
 * - rank de investidores
 * - rank de saldos disponíveis
 * =========================================================
 */
export const AdmRankingsControle = {
  /**
   * Retorna o rank de publicadores:
   * rank de publicadores:
   * 507 publicações de @mariayt
   * 501 publicações de @cutsw
   * 487 publicações de @lulaew
   * 322 publicações de @viro12
   */
  async obterRankPublicadores(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, checagemLoop.motivo!, 400, checagemLoop.ip || "Interno", 0, res);
      res.status(400).json({ sucesso: false, area: "rank_publicadores", erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracaoMs = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, motivo, 401, clientIp, duracaoMs, res);
      res.status(401).json({ sucesso: false, area: "rank_publicadores", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const dados = await RankPublicadoresServico.obterRankingPublicadores();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Rank de publicadores obtido", 200, clientIp, duracaoMs, res);

      if (formato === "texto" || formato === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, err.message, 500, clientIp, duracaoMs, res);
      res.status(500).json({ sucesso: false, area: "rank_publicadores", erro: err.message });
    }
  },

  /**
   * Retorna o rank de anunciantes:
   * rank de anunciantes:
   * 507 campanhas de @mariayt
   * 501 campanhas de @cutsw
   * 487 campanhas de @lulaew
   * 322 campanhas de @viro12
   */
  async obterRankAnunciantes(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, checagemLoop.motivo!, 400, checagemLoop.ip || "Interno", 0, res);
      res.status(400).json({ sucesso: false, area: "rank_anunciantes", erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracaoMs = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, motivo, 401, clientIp, duracaoMs, res);
      res.status(401).json({ sucesso: false, area: "rank_anunciantes", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const dados = await RankAnunciantesServico.obterRankingAnunciantes();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Rank de anunciantes obtido", 200, clientIp, duracaoMs, res);

      if (formato === "texto" || formato === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, err.message, 500, clientIp, duracaoMs, res);
      res.status(500).json({ sucesso: false, area: "rank_anunciantes", erro: err.message });
    }
  },

  /**
   * Retorna o rank de investidores:
   * rank de investidores:
   * foi investido 12.301,90 por @julios
   * foi investido 12.136,87 por @viro12
   * foi investido 11.321,76 por @julios
   * foi investido 10.376,65 por @lulaew
   * foi investido 2.37,30 por @luldd
   * foi investido 1.327,35 por @lulaew12
   */
  async obterRankInvestidores(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, checagemLoop.motivo!, 400, checagemLoop.ip || "Interno", 0, res);
      res.status(400).json({ sucesso: false, area: "rank_investidores", erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracaoMs = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, motivo, 401, clientIp, duracaoMs, res);
      res.status(401).json({ sucesso: false, area: "rank_investidores", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const dados = await RankInvestidoresServico.obterRankingInvestidores();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Rank de investidores obtido", 200, clientIp, duracaoMs, res);

      if (formato === "texto" || formato === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, err.message, 500, clientIp, duracaoMs, res);
      res.status(500).json({ sucesso: false, area: "rank_investidores", erro: err.message });
    }
  },

  /**
   * Retorna o rank de saldos disponíveis:
   * rank de saldos disponíveis:
   * saldo de 12.877,90 de @lucas
   * saldo de 11.989,90 de @zebra
   * saldo de 11.503,90 de @will
   * saldo de 10.433,90 de @talon
   * saldo de 10.271,90 de @juba
   */
  async obterRankSaldo(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, checagemLoop.motivo!, 400, checagemLoop.ip || "Interno", 0, res);
      res.status(400).json({ sucesso: false, area: "rank_saldo", erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracaoMs = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, motivo, 401, clientIp, duracaoMs, res);
      res.status(401).json({ sucesso: false, area: "rank_saldo", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const dados = await RankSaldoServico.obterRankingSaldos();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Rank de saldo obtido", 200, clientIp, duracaoMs, res);

      if (formato === "texto" || formato === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(req.method, req.originalUrl || req.url, err.message, 500, clientIp, duracaoMs, res);
      res.status(500).json({ sucesso: false, area: "rank_saldo", erro: err.message });
    }
  },

  /**
   * Retorna o rank de resultado de campanhas (custo-benefício)
   */
  async obterRankResultadoCampanhas(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemLoop = ComunicacaoServico.checarLoopInstancia(req);
    if (checagemLoop.loop) {
      res.status(400).json({ sucesso: false, area: "rank_resultado_campanhas", erro: checagemLoop.motivo });
      return;
    }

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, area: "rank_resultado_campanhas", erro: checagemAuth.motivo || "Chave secreta inválida" });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const { RankResultadoCampanhaServico } = await import("../servicos/s.painel.divulgacoes.rank.resultado.campanha");
      const dados = await RankResultadoCampanhaServico.obterRankingResultado();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(req.method, req.originalUrl || req.url, "Rank de resultado de campanhas obtido", 200, clientIp, duracaoMs, res);

      if (formato === "texto" || formato === "txt") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(dados.textoFormatado);
        return;
      }

      res.status(200).json(dados);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, area: "rank_resultado_campanhas", erro: err.message });
    }
  },

  /**
   * Retorna o rank de denunciados
   */
  async obterRankDenunciados(req: Request, res: Response): Promise<void> {
    const { AdmModeracaoControle } = await import("./c.adm.moderacao");
    return AdmModeracaoControle.obterRankDenunciados(req, res);
  },

  /**
   * Retorna o histórico de banidos
   */
  async obterHistoricoBanidos(req: Request, res: Response): Promise<void> {
    const { AdmModeracaoControle } = await import("./c.adm.moderacao");
    return AdmModeracaoControle.obterHistoricoBanidos(req, res);
  },

  /**
   * Envia qualquer rank para o painel via webhook
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    const area = String(req.query.area || req.body?.area || req.params.tipo || "").toLowerCase();
    const evento = req.body?.evento || `sincronizacao_${area || "rankings"}`;

    let resultado: any;
    if (area.includes("publicador")) {
      resultado = await RankPublicadoresServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("anunciante")) {
      resultado = await RankAnunciantesServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("investidor")) {
      resultado = await RankInvestidoresServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("saldo")) {
      resultado = await RankSaldoServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("denuncia") || area.includes("denunciado")) {
      const { RankDenunciadosServico } = await import("../servicos/s.painel.moderacao.rank.denunciados");
      resultado = await RankDenunciadosServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("ban") || area.includes("banido")) {
      const { HistoricoBanidoServico } = await import("../servicos/s.painel.moderacao.historico.banido");
      resultado = await HistoricoBanidoServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else if (area.includes("resultado") || area.includes("custo_beneficio") || area.includes("campanha")) {
      const { RankResultadoCampanhaServico } = await import("../servicos/s.painel.divulgacoes.rank.resultado.campanha");
      resultado = await RankResultadoCampanhaServico.enviarParaPainel(evento, req.body?.dadosExtras);
    } else {
      // Dispara todos
      const { RankResultadoCampanhaServico } = await import("../servicos/s.painel.divulgacoes.rank.resultado.campanha");
      const [rPub, rAnun, rInv, rSaldo, rCamp] = await Promise.all([
        RankPublicadoresServico.enviarParaPainel(`${evento}_publicadores`),
        RankAnunciantesServico.enviarParaPainel(`${evento}_anunciantes`),
        RankInvestidoresServico.enviarParaPainel(`${evento}_investidores`),
        RankSaldoServico.enviarParaPainel(`${evento}_saldo`),
        RankResultadoCampanhaServico.enviarParaPainel(`${evento}_resultado_campanhas`),
      ]);
      resultado = {
        publicadores: rPub,
        anunciantes: rAnun,
        investidores: rInv,
        saldo: rSaldo,
        resultadoCampanhas: rCamp,
      };
    }

    res.status(200).json({ sucesso: true, area: area || "todos_rankings", resultado });
  },
};

export default AdmRankingsControle;
