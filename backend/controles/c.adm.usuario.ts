import { Request, Response } from "express";
import { ComunicacaoServico } from "../servicos/s.painel.comunicacao";
import { HistoricoUsuarioServico } from "../servicos/s.painel.usuarios.historico";
import { LoggerInformativo, extrairIp } from "../servicos/s.comunicacao";
import { HistoricoControle } from "./c.historico";

/**
 * =========================================================
 * CONTROLADOR: adm.usuario
 * Responsável exclusivo por processar e enviar dados
 * consolidados de usuários para o painel administrativo.
 * =========================================================
 */
export const AdmUsuarioControle = {
  /**
   * Envia dados, métricas e o histórico completo de usuários:
   * - Entradas: hoje, ontem, 10 dias, 30 dias
   * - Usuários: cadastrados, não cadastrados, anunciantes, publicadores, denunciados, banidos
   * - Histórico de usuários com cartões organizados conforme o painel administrativo
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
        modulo: "adm.usuario",
        area: "usuarios",
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
        modulo: "adm.usuario",
        area: "usuarios",
        erro: motivo,
      });
      return;
    }

    try {
      const { formato, busca } = req.query;
      const [metricas, dadosHistorico] = await Promise.all([
        ComunicacaoServico.obterMetricasCompletas(),
        HistoricoUsuarioServico.obterHistoricoCompleto({
          busca: busca ? String(busca) : undefined,
        }),
      ]);
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.requisicaoPermitida(
        req.method,
        req.originalUrl || req.url,
        `[adm.usuario] Dados consolidados e histórico de ${dadosHistorico.total} usuários enviados`,
        200,
        clientIp,
        duracaoMs,
        res
      );

      // Formato em texto puro caso solicitado
      if (formato === "texto" || req.headers.accept === "text/plain") {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        const textoCompleto = [
          metricas.textoFormatado,
          "========================================",
          "HISTÓRICO DE USUÁRIOS (ENTRADAS NO APP)",
          "========================================",
          dadosHistorico.textoFormatado,
        ].join("\n\n");
        res.status(200).send(textoCompleto);
        return;
      }

      // Resposta padronizada para o painel
      res.status(200).json({
        sucesso: true,
        modulo: "adm.usuario",
        area: "usuarios",
        fonte: metricas.fonte,
        total: metricas.total,
        totalUsuarios: metricas.totalUsuarios,
        entradas: metricas.entradas,
        usuarios: metricas.usuarios,
        dados: {
          entradas: metricas.entradas,
          usuarios: metricas.usuarios,
        },
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

        // Histórico de usuários organizado para exibição no painel administrativo
        historico: dadosHistorico.historico,
        historicoCards: dadosHistorico.cardsTexto,
        historicoTexto: dadosHistorico.textoFormatado,
        totalHistorico: dadosHistorico.total,

        lista: dadosHistorico.historico,
        duracaoMs,
        timestamp: new Date().toISOString(),
      });
    } catch (erro: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.erro(`[adm.usuario] Erro ao consolidar dados de usuários: ${erro.message}`);
      res.status(500).json({
        sucesso: false,
        modulo: "adm.usuario",
        area: "usuarios",
        erro: erro.message || "Erro ao consultar dados de usuários",
      });
    }
  },

  // Atalhos para histórico de usuários
  obterHistorico: HistoricoControle.obterHistorico,
  inserirHistorico: HistoricoControle.inserirHistorico,
  removerHistorico: HistoricoControle.removerHistorico,

  // Ações de moderação e gerenciamento solicitadas pelo painel
  banirUsuario: HistoricoControle.banirUsuario,
  desbanirUsuario: HistoricoControle.desbanirUsuario,
  excluirUsuario: HistoricoControle.excluirUsuario,
  investigarUsuario: HistoricoControle.investigarUsuario,

  /**
   * Dispara proativamente o histórico completo de usuários para a API_URL
   */
  async enviarParaPainel(req: Request, res: Response): Promise<void> {
    try {
      const historicoRes = await HistoricoUsuarioServico.obterHistoricoCompleto();
      const resultado = await ComunicacaoServico.dispararWebhookParaWebsite1("sincronizacao_historico_usuarios", "usuarios", {
        total: historicoRes.total,
        historico: historicoRes.historico,
        cardsTexto: historicoRes.cardsTexto,
        textoFormatado: historicoRes.textoFormatado,
      });

      res.status(resultado.enviado ? 200 : 502).json({
        sucesso: resultado.enviado,
        mensagem: resultado.enviado
          ? "Histórico e cartões de usuários enviados com sucesso para a API_URL"
          : `Falha ao enviar para API_URL: ${resultado.erro || "Sem resposta"}`,
        status: resultado.status,
        duracaoMs: resultado.duracaoMs,
      });
    } catch (e: any) {
      res.status(500).json({ sucesso: false, erro: e.message });
    }
  },
};

export default AdmUsuarioControle;
