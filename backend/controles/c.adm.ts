import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { ArrecadacaoServico } from "../servicos/s.painel.arrecadacao";
import { DivulgacoesServico } from "../servicos/s.painel.divulgacoes";
import { RankingCampanhasServico, CampanhasAtivasServico } from "../servicos/s.painel.divulgacoes.campanhas.ativas";
import { AdmUsuarioControle } from "./c.adm.usuario";
import { AdmArrecadacaoControle } from "./c.adm.arrecadacao";
import { AdmDivulgacoesControle } from "./c.adm.divulgacoes";
import { AdmRankingCampanhasControle, AdmCampanhasAtivasControle } from "./c.adm.campanhas.ativas";
import { AdmSaldoControle } from "./c.adm.saldo";
import { AdmRankingsControle } from "./c.adm.rankings";
import { AdmModeracaoControle } from "./c.adm.moderacao";

export const AdmControle = {
  usuario: AdmUsuarioControle,
  arrecadacao: AdmArrecadacaoControle,
  divulgacoes: AdmDivulgacoesControle,
  campanhasAtivas: AdmCampanhasAtivasControle,
  rankingCampanhas: AdmRankingCampanhasControle,
  saldo: AdmSaldoControle,
  adicionarSaldo: AdmSaldoControle.adicionarSaldo,
  rankings: AdmRankingsControle,
  moderacao: AdmModeracaoControle,
  rankDenunciados: AdmModeracaoControle.obterRankDenunciados,
  historicoBanidos: AdmModeracaoControle.obterHistoricoBanidos,
  rankPublicadores: AdmRankingsControle.obterRankPublicadores,
  rankAnunciantes: AdmRankingsControle.obterRankAnunciantes,
  rankInvestidores: AdmRankingsControle.obterRankInvestidores,
  rankSaldo: AdmRankingsControle.obterRankSaldo,
  arrecadacaoHistoricoTransferencias: AdmArrecadacaoControle.obterHistoricoTransferencias,
  arrecadacaoTotalAno: AdmArrecadacaoControle.obterTotalAno,
  arrecadacaoTotalMes: AdmArrecadacaoControle.obterTotalMes,
  arrecadacaoTotalDia: AdmArrecadacaoControle.obterTotalDia,

  /**
   * Obtém as métricas consolidadas 100% REAIS da área de usuários.
   * Atende:
   * - GET /api/adm, GET /api/adm/usuarios, GET /adm/usuarios
   * - POST /api/dados/usuarios
   * - POST /api/comunicacao
   */
  async obterMetricasUsuarios(req: Request, res: Response): Promise<void> {
    const areaParam = String(req.query.area || req.body?.area || req.headers["x-area"] || "").toLowerCase();
    if (areaParam === "arrecadacao" || areaParam === "arrecadação" || areaParam === "financeiro") {
      return AdmControle.obterMetricasArrecadacao(req, res);
    }
    if (areaParam === "divulgacoes" || areaParam === "divulgações" || areaParam === "publicacoes") {
      return AdmControle.obterMetricasDivulgacoes(req, res);
    }
    if (
      areaParam === "campanhas_ativas" ||
      areaParam === "campanhas-ativas" ||
      areaParam === "ranking_campanhas" ||
      areaParam === "ranking-campanhas" ||
      areaParam === "rank_campanhas" ||
      areaParam === "campanhas" ||
      areaParam === "ranking"
    ) {
      return AdmControle.obterMetricasCampanhasAtivas(req, res);
    }

    const inicio = Date.now();
    const clientIp = extrairIp(req);

    // 1. Prevenção de loop da própria instância
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
        area: "usuarios",
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta
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
        area: "usuarios",
        erro: motivo,
        motivo,
      });
      return;
    }

    try {
      const { formato } = req.query;
      const metricas = await ComunicacaoServico.obterMetricasCompletas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "Métricas consolidadas de usuários enviadas",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Se solicitado como texto plano (via ?formato=texto ou Accept: text/plain)
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta completa estruturada no formato esperado pelo Website 1
      res.status(200).json({
        sucesso: true,
        area: "usuarios",
        fonte: metricas.fonte,
        total: metricas.total,
        totalUsuarios: metricas.totalUsuarios,
        // Schema estruturado de entradas e usuários para Website 1
        entradas: metricas.entradas,
        usuarios: metricas.usuarios,
        dados: {
          entradas: metricas.entradas,
          usuarios: metricas.usuarios,
        },
        // Compatibilidade legada com agrupamento antigo
        metricas: {
          acessos: {
            hoje: metricas.entradas.hoje,
            ontem: metricas.entradas.ontem,
            em10Dias: metricas.entradas.ultimos_10_dias,
            em30Dias: metricas.entradas.ultimos_30_dias,
          },
          cadastro: {
            naoCadastrados: metricas.usuarios.nao_cadastrados,
            cadastrados: metricas.usuarios.cadastrados,
          },
          papeis: {
            publicadores: metricas.usuarios.publicadores,
            anunciantes: metricas.usuarios.anunciantes,
          },
          moderacao: {
            denunciados: metricas.usuarios.denunciados,
            banidos: metricas.usuarios.banidos,
          },
        },
        // Campos diretos
        hoje: metricas.entradas.hoje,
        ontem: metricas.entradas.ontem,
        em10Dias: metricas.entradas.ultimos_10_dias,
        em30Dias: metricas.entradas.ultimos_30_dias,
        naoCadastrados: metricas.usuarios.nao_cadastrados,
        cadastrados: metricas.usuarios.cadastrados,
        publicadores: metricas.usuarios.publicadores,
        anunciantes: metricas.usuarios.anunciantes,
        denunciados: metricas.usuarios.denunciados,
        banidos: metricas.usuarios.banidos,
        linhas: metricas.linhas,
        textoFormatado: metricas.textoFormatado,
        lista: metricas.lista,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`Erro ao consolidar métricas reais: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        area: "usuarios",
        erro: erro.message || "Erro ao consultar dados reais de usuários",
      });
    }
  },

  /**
   * Obtém as métricas consolidadas 100% REAIS da ÁREA: ARRECADAÇÃO.
   * Atende:
   * - GET /adm/arrecadacao, POST /adm/arrecadacao
   * - GET /api/adm/arrecadacao, POST /api/adm/arrecadacao
   * - GET /api/dados/arrecadacao, POST /api/dados/arrecadacao
   */
  async obterMetricasArrecadacao(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    // 1. Prevenção de loop da própria instância
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
        area: "arrecadacao",
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta
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
        area: "arrecadacao",
        erro: motivo,
        motivo,
      });
      return;
    }

    try {
      const { formato } = req.query;
      const metricas = await ArrecadacaoServico.obterMetricasCompletas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "Métricas consolidadas de arrecadação enviadas",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Se solicitado como texto plano (via ?formato=texto ou Accept: text/plain)
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta completa estruturada no formato esperado pelo Website 1 (Painel)
      res.status(200).json({
        sucesso: true,
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
      LoggerInformativo.erro(`Erro ao consolidar métricas de arrecadação: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        area: "arrecadacao",
        erro: erro.message || "Erro ao consultar dados de arrecadação",
      });
    }
  },

  /**
   * Obtém as métricas consolidadas 100% REAIS da ÁREA: DIVULGAÇÕES (divulgações, publicações e campanhas).
   * Atende:
   * - GET /adm/divulgacoes, POST /adm/divulgacoes
   * - GET /api/adm/divulgacoes, POST /api/adm/divulgacoes
   * - GET /api/dados/divulgacoes, POST /api/dados/divulgacoes
   */
  async obterMetricasDivulgacoes(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    // 1. Prevenção de loop da própria instância
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
        area: "divulgacoes",
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta
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
        area: "divulgacoes",
        erro: motivo,
        motivo,
      });
      return;
    }

    try {
      const { formato } = req.query;
      const metricas = await DivulgacoesServico.obterMetricasCompletas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "Métricas consolidadas de divulgações enviadas",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Se solicitado como texto plano (via ?formato=texto ou Accept: text/plain)
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta completa estruturada no formato esperado pelo Website 1 (Painel)
      res.status(200).json({
        sucesso: true,
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
      LoggerInformativo.erro(`Erro ao consolidar métricas de divulgações: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        area: "divulgacoes",
        erro: erro.message || "Erro ao consultar dados de divulgações",
      });
    }
  },

  /**
   * Dispara proativamente o envio de métricas de arrecadação para a API_URL
   */
  async enviarArrecadacaoParaPainel(req: Request, res: Response): Promise<void> {
    return AdmArrecadacaoControle.enviarParaPainel(req, res);
  },

  /**
   * Dispara proativamente o envio de métricas de divulgações para a API_URL
   */
  async enviarDivulgacoesParaPainel(req: Request, res: Response): Promise<void> {
    return AdmDivulgacoesControle.enviarParaPainel(req, res);
  },

  /**
   * Obtém as métricas consolidadas 100% REAIS da ÁREA: CAMPANHAS ATIVAS (ranking por quantidade agrupadas por orçamento diário).
   * Atende:
   * - GET /adm/campanhas-ativas, POST /adm/campanhas-ativas
   * - GET /api/adm/campanhas-ativas, POST /api/adm/campanhas-ativas
   * - GET /api/dados/campanhas-ativas, POST /api/dados/campanhas-ativas
   */
  async obterMetricasCampanhasAtivas(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    // 1. Prevenção de loop da própria instância
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
        area: "campanhas_ativas",
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta
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
        area: "campanhas_ativas",
        erro: motivo,
        motivo,
      });
      return;
    }

    try {
      const { formato } = req.query;
      const metricas = await RankingCampanhasServico.obterRankingCampanhasAtivas();
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        "Ranking de campanhas ativas enviado",
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Se solicitado como texto plano (via ?formato=texto ou Accept: text/plain)
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(200).send(metricas.textoFormatado);
        return;
      }

      // Resposta completa estruturada no formato esperado pelo Website 1 (Painel)
      res.status(200).json({
        sucesso: true,
        area: "campanhas_ativas",
        titulo: metricas.titulo,
        fonte: metricas.fonte,
        totalCampanhasAtivas: metricas.totalCampanhasAtivas,
        totalFaixas: metricas.totalFaixas,
        ranking: metricas.ranking,
        linhas: metricas.linhas,
        textoFormatado: metricas.textoFormatado,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`Erro ao consolidar ranking de campanhas ativas: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        area: "campanhas_ativas",
        erro: erro.message || "Erro ao consultar ranking de campanhas ativas",
      });
    }
  },

  /**
   * Dispara proativamente o envio do ranking de campanhas ativas para a API_URL
   */
  async enviarCampanhasAtivasParaPainel(req: Request, res: Response): Promise<void> {
    return AdmRankingCampanhasControle.enviarParaPainel(req, res);
  },

  /**
   * Roteia dinamicamente a requisição de acordo com a área informada
   */
  async rotearPorArea(req: Request, res: Response): Promise<void> {
    const area = String(req.query.area || req.body?.area || req.headers["x-area"] || "").toLowerCase();
    if (area === "arrecadacao" || area === "arrecadação" || area === "financeiro") {
      return AdmControle.obterMetricasArrecadacao(req, res);
    }
    if (area === "divulgacoes" || area === "divulgações" || area === "publicacoes") {
      return AdmControle.obterMetricasDivulgacoes(req, res);
    }
    if (
      area === "campanhas_ativas" ||
      area === "campanhas-ativas" ||
      area === "ranking_campanhas" ||
      area === "ranking-campanhas" ||
      area === "rank_campanhas" ||
      area === "campanhas" ||
      area === "ranking"
    ) {
      return AdmControle.obterMetricasCampanhasAtivas(req, res);
    }
    if (area === "rank_publicadores" || area === "rank-publicadores" || area === "publicadores") {
      return AdmRankingsControle.obterRankPublicadores(req, res);
    }
    if (area === "rank_anunciantes" || area === "rank-anunciantes" || area === "anunciantes") {
      return AdmRankingsControle.obterRankAnunciantes(req, res);
    }
    if (area === "rank_investidores" || area === "rank-investidores" || area === "investidores") {
      return AdmRankingsControle.obterRankInvestidores(req, res);
    }
    if (
      area === "historico_transferencias" ||
      area === "historico-transferencias" ||
      area === "transferencias" ||
      area === "transferências"
    ) {
      return AdmArrecadacaoControle.obterHistoricoTransferencias(req, res);
    }
    if (area === "total_ano" || area === "total-ano" || area === "arrecadacao_ano" || area === "ano") {
      return AdmArrecadacaoControle.obterTotalAno(req, res);
    }
    if (area === "total_mes" || area === "total-mes" || area === "arrecadacao_mes" || area === "mes" || area === "mês") {
      return AdmArrecadacaoControle.obterTotalMes(req, res);
    }
    if (area === "total_dia" || area === "total-dia" || area === "arrecadacao_dia" || area === "dia") {
      return AdmArrecadacaoControle.obterTotalDia(req, res);
    }
    if (
      area === "rank_resultado_campanhas" ||
      area === "rank-resultado-campanhas" ||
      area === "resultado_campanhas" ||
      area === "resultado-campanhas" ||
      area === "campanhas_custo_beneficio" ||
      area === "campanhas-custo-beneficio" ||
      area === "custo_beneficio" ||
      area === "custo-benefício" ||
      area === "divulgacao_rank_resultado_campanha"
    ) {
      return AdmRankingsControle.obterRankResultadoCampanhas(req, res);
    }
    if (
      area === "rank_denunciados" ||
      area === "rank-denunciados" ||
      area === "denunciados" ||
      area === "moderacao_rank_denunciados" ||
      area === "moderacao-rank-denunciados"
    ) {
      return AdmModeracaoControle.obterRankDenunciados(req, res);
    }
    if (
      area === "historico_banido" ||
      area === "historico-banido" ||
      area === "historico_banidos" ||
      area === "historico-banidos" ||
      area === "banidos" ||
      area === "moderacao_historico_banido" ||
      area === "moderacao-historico-banido"
    ) {
      return AdmModeracaoControle.obterHistoricoBanidos(req, res);
    }
    return AdmControle.obterMetricasUsuarios(req, res);
  },

  /**
   * Atualiza ajustes manuais e baseline de arrecadação
   */
  async atualizarAjusteArrecadacao(req: Request, res: Response): Promise<void> {
    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      res.status(401).json({ sucesso: false, erro: "Chave secreta inválida" });
      return;
    }
    try {
      const resultado = await ArrecadacaoServico.atualizarAjustesManuais(req.body);
      res.json({ sucesso: true, mensagem: "Ajustes de arrecadação atualizados com sucesso", dados: resultado });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Registra uma nova transação financeira na arrecadação
   */
  async registrarTransacaoArrecadacao(req: Request, res: Response): Promise<void> {
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
      res.json({ sucesso: true, mensagem: "Transação de arrecadação registrada com sucesso", dados: resultado });
    } catch (erro: any) {
      res.status(500).json({ sucesso: false, erro: erro.message });
    }
  },

  /**
   * Endpoint: POST /api/webhook e POST /webhook
   * Recebe notificações em tempo real proativas do Website 1
   */
  async receberWebhook(req: Request, res: Response): Promise<void> {
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
        0
      );
      res.status(400).json({
        sucesso: false,
        erro: checagemLoop.motivo,
        motivo: checagemLoop.motivo,
      });
      return;
    }

    // 2. Valida token de autenticação
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
        erro: motivo,
        motivo,
      });
      return;
    }

    try {
      const resultado = await ComunicacaoServico.processarWebhookRecebido(req.body, clientIp);
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.webhookRecebido(
        req.method,
        req.originalUrl || req.url,
        resultado.evento || "evento",
        200,
        clientIp,
        duracaoMs,
        res
      );

      res.status(200).json({
        sucesso: true,
        mensagem: resultado.mensagem,
        evento: resultado.evento,
        duracaoMs,
        recebidoEm: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        erro.message || "Falha ao processar webhook",
        500,
        clientIp,
        duracaoMs,
        res
      );
      res.status(500).json({
        sucesso: false,
        erro: erro.message || "Falha ao processar webhook",
        duracaoMs,
      });
    }
  },

  /**
   * Endpoint: POST /api/controle/requisicao
   * Despacha qualquer verbo HTTP (GET, POST, PATCH, DELETE) para qualquer rota da API_URL
   */
  async despacharRequisicao(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        clientIp,
        duracao,
        res
      );
      res.status(401).json({ sucesso: false, erro: motivo, motivo });
      return;
    }

    try {
      const config = {
        metodo: req.body.metodo || req.body.method,
        url: req.body.url,
        rota: req.body.rota || req.body.path,
        headers: req.body.headers,
        body: req.body.body || req.body.dados,
      };

      const resultado = await ComunicacaoServico.despacharRequisicao(config);
      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Despachado para ${config.url || config.rota}`,
        resultado.status,
        clientIp,
        duracao,
        res
      );
      res.status(resultado.status).json(resultado.dados);
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      const motivo = erro.message.includes("loop")
        ? "Requisição para a própria instância bloqueada para evitar loop"
        : erro.message;
      const status = erro.message.includes("loop") ? 400 : 500;
      const ip = erro.message.includes("loop") ? "Interno" : clientIp;

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
    }
  },

  /**
   * Endpoint: ALL /api/proxy/*
   * Repassa requisições para a API_URL
   */
  async proxy(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido) {
      const duracao = Date.now() - inicio;
      const motivo = checagemAuth.motivo || "Chave secreta inválida";
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        motivo,
        401,
        clientIp,
        duracao,
        res
      );
      res.status(401).json({ sucesso: false, erro: motivo, motivo });
      return;
    }

    try {
      const subcaminho = req.params[0] ? `/${req.params[0]}` : "";
      const queryString = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
      const rotaCompleta = `${subcaminho}${queryString}`;

      const resultado = await ComunicacaoServico.despacharRequisicao({
        metodo: req.method,
        rota: rotaCompleta,
        body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      });

      const duracao = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Proxy reverso para ${rotaCompleta}`,
        resultado.status,
        clientIp,
        duracao,
        res
      );

      res.status(resultado.status).json(resultado.dados);
    } catch (erro: any) {
      const duracao = Date.now() - inicio;
      const motivo = erro.message.includes("loop")
        ? "Requisição para a própria instância bloqueada para evitar loop"
        : erro.message;
      const status = erro.message.includes("loop") ? 400 : 500;
      const ip = erro.message.includes("loop") ? "Interno" : clientIp;

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
    }
  },
};

export default AdmControle;
