import { FeedbackEntrega, EventoColetado } from "./tipos.base.dados";
import { ColetaDadosServico } from "./ep.1.coleta.dados";
import { EntregaInteressesServico } from "./ep.3.entrega.interesses";

const historicoFeedbacks: FeedbackEntrega[] = [];
let totalFeedbacksProcessados = 0;

export const ColetaContinuaServico = {
  /**
   * ETAPA 4 DO CICLO:
   * Coleta mais dados a partir do consumo da entrega (Etapa 3) e fecha o ciclo contínuo (retroalimentando Etapa 1)
   */
  coletarMaisDados(dados: {
    usuarioId: string;
    publicacaoId?: string;
    reacao: "clique" | "like" | "ignorado" | "dwell";
    tag?: string;
    nicho?: string;
    duracaoSegundos?: number;
  }): { feedback: FeedbackEntrega; proximoEventoEtapa1: EventoColetado; cicloReiniciado: boolean } {
    const agora = Date.now();
    const ultimaEntrega = EntregaInteressesServico.obterUltimaEntrega(dados.usuarioId);

    const feedback: FeedbackEntrega = {
      entregaId: `ent_${dados.usuarioId}_${agora}`,
      usuarioId: dados.usuarioId,
      conteudoEntregueId: dados.publicacaoId || "geral",
      reacao: dados.reacao,
      tempoDecorridoMs: ultimaEntrega
        ? Math.max(0, agora - new Date(ultimaEntrega.timestampEntrega).getTime())
        : 0,
      timestamp: agora,
    };

    historicoFeedbacks.unshift(feedback);
    if (historicoFeedbacks.length > 1000) {
      historicoFeedbacks.pop();
    }
    totalFeedbacksProcessados++;

    // Mapeia a reação em ação da Etapa 1
    const tipoAcao =
      dados.reacao === "clique"
        ? "clique_link"
        : dados.reacao === "like"
        ? "like"
        : dados.reacao === "dwell"
        ? "dwell"
        : "visualizacao";

    // FECHA O CICLO: Reinjeta imediatamente os novos dados na Etapa 1 com carimbo etapaOrigem: 4
    const proximoEventoEtapa1 = ColetaDadosServico.coletar({
      usuarioId: dados.usuarioId,
      tipo: tipoAcao,
      publicacaoId: dados.publicacaoId,
      tag: dados.tag,
      nicho: dados.nicho,
      duracaoSegundos: dados.duracaoSegundos,
      etapaOrigem: 4,
    });

    return {
      feedback,
      proximoEventoEtapa1,
      cicloReiniciado: true,
    };
  },

  /**
   * Retorna métricas da etapa de coleta contínua
   */
  obterMetricas(): {
    totalFeedbacksProcessados: number;
    ultimosFeedbacks: FeedbackEntrega[];
  } {
    return {
      totalFeedbacksProcessados,
      ultimosFeedbacks: historicoFeedbacks.slice(0, 10),
    };
  },
};

export default ColetaContinuaServico;
