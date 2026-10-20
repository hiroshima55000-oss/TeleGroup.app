import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { RankDenunciadosServico } from "../servicos/s.painel.moderacao.rank.denunciados";
import { HistoricoBanidoServico } from "../servicos/s.painel.moderacao.historico.banido";

/**
 * =========================================================
 * CONTROLADOR: adm.moderacao
 * Processa e expõe os dados da área de moderação para o painel:
 * - s.painel.moderacao.rank.denunciados (rank de denunciados)
 * - s.painel.moderacao.historico.banido (histórico de banidos)
 * =========================================================
 */
export const AdmModeracaoControle = {
  /**
   * Retorna o rank de denunciados:
   * rank de denunciados:
   * 4 denúncias de @cutsw
   * 3 denúncias de @lulaew
   * 2 denúncias de @viro12
   * 1 denúncia de @mariayt
   */
  async obterRankDenunciados(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

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
      res.status(400).json({ sucesso: false, area: "rank_denunciados", erro: checagemLoop.motivo });
      return;
    }

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
      res.status(401).json({ sucesso: false, area: "rank_denunciados", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const busca = req.query.busca || req.body?.busca;
      const limite = req.query.limite ? Number(req.query.limite) : undefined;

      const dados = await RankDenunciadosServico.obterRankingDenunciados({
        busca: busca ? String(busca) : undefined,
        limite,
      });
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Rank de denunciados obtido (${dados.totalDenunciados} usuários)`,
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
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        err.message,
        500,
        clientIp,
        duracaoMs,
        res
      );
      res.status(500).json({ sucesso: false, area: "rank_denunciados", erro: err.message });
    }
  },

  /**
   * Retorna o histórico de usuários banidos:
   * histórico de banidos:
   * @spammer99 banido por: Disparo excessivo de spam em 18/10/2026 às 15:40
   */
  async obterHistoricoBanidos(req: Request, res: Response): Promise<void> {
    const inicio = Date.now();
    const clientIp = extrairIp(req);

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
      res.status(400).json({ sucesso: false, area: "historico_banido", erro: checagemLoop.motivo });
      return;
    }

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
      res.status(401).json({ sucesso: false, area: "historico_banido", erro: motivo });
      return;
    }

    try {
      const formato = req.query.formato || req.body?.formato;
      const busca = req.query.busca || req.body?.busca;
      const limite = req.query.limite ? Number(req.query.limite) : undefined;

      const dados = await HistoricoBanidoServico.obterHistoricoBanidos({
        busca: busca ? String(busca) : undefined,
        limite,
      });
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `Histórico de banidos obtido (${dados.totalBanidos} registros)`,
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
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoBloqueada(
        req.method,
        req.originalUrl || req.url,
        err.message,
        500,
        clientIp,
        duracaoMs,
        res
      );
      res.status(500).json({ sucesso: false, area: "historico_banido", erro: err.message });
    }
  },

  /**
   * Registra uma nova denúncia
   */
  async registrarDenuncia(req: Request, res: Response): Promise<void> {
    try {
      const { usuario, usuarioId, email, motivo, denunciante, categoria, publicacaoId, campanhaId } = req.body;
      if (!usuario && !usuarioId) {
        res.status(400).json({ sucesso: false, erro: "Usuário denunciado é obrigatório." });
        return;
      }
      const resultado = await RankDenunciadosServico.registrarDenuncia({
        usuario: usuario || usuarioId,
        usuarioId,
        email,
        motivo,
        denunciante,
        categoria,
        publicacaoId,
        campanhaId,
      });
      res.status(200).json(resultado);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },

  /**
   * Bane um usuário
   */
  async banirUsuario(req: Request, res: Response): Promise<void> {
    try {
      const identificador = req.body?.usuarioId || req.body?.usuario || req.body?.id || req.body?.email || req.params?.id;
      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário a ser banido não informado." });
        return;
      }
      const motivo = req.body?.motivo || "Banido pelo painel de moderação";
      const resultado = await HistoricoBanidoServico.banirUsuario(String(identificador), motivo);
      res.status(200).json(resultado);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },

  /**
   * Desbane um usuário
   */
  async desbanirUsuario(req: Request, res: Response): Promise<void> {
    try {
      const identificador = req.body?.usuarioId || req.body?.usuario || req.body?.id || req.body?.email || req.params?.id;
      if (!identificador) {
        res.status(400).json({ sucesso: false, erro: "Identificador do usuário a ser desbanido não informado." });
        return;
      }
      const resultado = await HistoricoBanidoServico.desbanirUsuario(String(identificador));
      res.status(200).json(resultado);
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },

  /**
   * Envia dados de moderação proativamente para a API_URL
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    const area = String(req.query.area || req.body?.area || req.params?.tipo || "").toLowerCase();
    const evento = req.body?.evento;

    try {
      let resultado: any;
      if (area.includes("denuncia") || area.includes("denunciado")) {
        resultado = await RankDenunciadosServico.enviarParaPainel(
          evento || "sincronizacao_rank_denunciados",
          req.body?.dadosExtras
        );
      } else if (area.includes("ban") || area.includes("banido")) {
        resultado = await HistoricoBanidoServico.enviarParaPainel(
          evento || "sincronizacao_historico_banidos",
          req.body?.dadosExtras
        );
      } else {
        // Envia ambos
        const [rDen, rBan] = await Promise.all([
          RankDenunciadosServico.enviarParaPainel(evento || "sincronizacao_rank_denunciados"),
          HistoricoBanidoServico.enviarParaPainel(evento || "sincronizacao_historico_banidos"),
        ]);
        resultado = {
          rankDenunciados: rDen,
          historicoBanido: rBan,
        };
      }

      res.status(200).json({
        sucesso: true,
        area: area || "moderacao_completa",
        resultado,
      });
    } catch (err: any) {
      res.status(500).json({ sucesso: false, erro: err.message });
    }
  },
};

export default AdmModeracaoControle;
