import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { PainelAdicionarSaldoServico } from "../servicos/s.painel.divulgacoes.adcionar.saldo";

/**
 * =========================================================
 * CONTROLADOR: adm.saldo
 * Responsável por permitir que o painel administrativo adicione
 * saldo para qualquer usuário (@) poder criar e veicular campanhas.
 * Exemplo: @licasd e 12,90
 * =========================================================
 */
export const AdmSaldoControle = {
  /**
   * Adiciona saldo na conta do usuário especificado:
   * Body: { usuario: "@licasd", valor: "12,90" } ou { arroba: "@licasd", valor: 12.90 }
   */
  async adicionarSaldo(req: Request, res: Response): Promise<void> {
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
        modulo: "adm.saldo",
        erro: checagemLoop.motivo,
      });
      return;
    }

    // 2. Validação da Chave Secreta do Painel
    const ehPainelOrigem =
      req.body?.origem === "painel_administrativo" ||
      req.body?.origem === "painel" ||
      String(req.headers["x-origem"] || "").toLowerCase() === "painel_administrativo" ||
      String(req.headers["x-painel-origem"] || "").toLowerCase() === "painel_administrativo";

    const checagemAuth = ComunicacaoServico.validarChavePainel(req);
    if (!checagemAuth.valido && !ehPainelOrigem) {
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
        modulo: "adm.saldo",
        erro: motivo,
      });
      return;
    }

    try {
      const usuario =
        req.body?.usuario ||
        req.body?.arroba ||
        req.body?.handle ||
        req.body?.nickname ||
        req.body?.nome ||
        (req.query.usuario as string) ||
        "";

      const valor =
        req.body?.valor !== undefined
          ? req.body.valor
          : req.body?.saldo !== undefined
          ? req.body.saldo
          : req.body?.quantia !== undefined
          ? req.body.quantia
          : req.query.valor;

      if (!usuario || !String(usuario).trim()) {
        res.status(400).json({
          sucesso: false,
          modulo: "adm.saldo",
          erro: "O campo @ do usuário é obrigatório. Exemplo: { usuario: '@licasd', valor: '12,90' }",
        });
        return;
      }

      if (valor === undefined || valor === null || String(valor).trim() === "") {
        res.status(400).json({
          sucesso: false,
          modulo: "adm.saldo",
          erro: "O campo valor é obrigatório. Exemplo: { usuario: '@licasd', valor: '12,90' }",
        });
        return;
      }

      const resultado = await PainelAdicionarSaldoServico.adicionarSaldo({
        usuario: String(usuario),
        valor,
        motivo: req.body?.motivo,
        origem: req.body?.origem || "painel_administrativo",
        operador: req.body?.operador,
      });

      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `[adm.saldo] Saldo de ${resultado.valorFormatado} creditado com sucesso para ${resultado.usuario}`,
        200,
        clientIp,
        duracaoMs,
        res
      );

      res.status(200).json({
        sucesso: true,
        modulo: "adm.saldo",
        ...resultado,
        duracaoMs,
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`[adm.saldo] Erro ao creditar saldo: ${erro.message}`);
      res.status(400).json({
        sucesso: false,
        modulo: "adm.saldo",
        erro: erro.message || "Erro ao processar recarga de saldo",
      });
    }
  },

  /**
   * Consulta o saldo atual de um usuário
   * GET /adm/saldo?usuario=@licasd
   */
  async consultarSaldo(req: Request, res: Response): Promise<void> {
    try {
      const usuario =
        (req.query.usuario as string) ||
        (req.query.arroba as string) ||
        (req.query.usuarioId as string) ||
        (req.query.email as string) ||
        (req.headers["x-user-id"] as string) ||
        "";

      if (!usuario || !usuario.trim()) {
        res.status(400).json({
          sucesso: false,
          modulo: "adm.saldo",
          erro: "Informe o parâmetro ?usuario=@nome ou ?usuarioId=...",
        });
        return;
      }

      const orcamento = req.query.orcamento ? Number(req.query.orcamento) : undefined;
      const dados = await PainelAdicionarSaldoServico.consultarSaldo(usuario, orcamento);
      res.status(200).json({
        sucesso: true,
        modulo: "adm.saldo",
        ...dados,
      });
    } catch (erro: any) {
      res.status(500).json({
        sucesso: false,
        modulo: "adm.saldo",
        erro: erro.message,
      });
    }
  },
};

export default AdmSaldoControle;
