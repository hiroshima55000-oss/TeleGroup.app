import { EventoColetado, TipoAcaoBaseDados } from "./tipos.base.dados";

// Buffer de eventos coletados por usuário
const bufferEventosPorUsuario = new Map<string, EventoColetado[]>();
const historicoGeralEventos: EventoColetado[] = [];
const LIMITE_BUFFER_USUARIO = 500;
const LIMITE_HISTORICO_GERAL = 5000;

export const ColetaDadosServico = {
  /**
   * ETAPA 1 DO CICLO:
   * Coleta dados brutos de navegação e intenção do usuário no ecossistema (Feed, Tags, Links, Buscas)
   */
  coletar(dados: {
    usuarioId: string;
    nickname?: string;
    tipo: TipoAcaoBaseDados;
    publicacaoId?: string;
    tag?: string;
    nicho?: string;
    termoBusca?: string;
    duracaoSegundos?: number;
    etapaOrigem?: 1 | 4;
  }): EventoColetado {
    const agora = Date.now();
    const id = `evt_${agora}_${Math.random().toString(36).substring(2, 8)}`;

    const evento: EventoColetado = {
      id,
      usuarioId: dados.usuarioId.trim(),
      nickname: dados.nickname ? dados.nickname.trim() : undefined,
      tipo: dados.tipo,
      publicacaoId: dados.publicacaoId,
      tag: dados.tag ? dados.tag.toLowerCase().replace(/^#+/, "").trim() : undefined,
      nicho: dados.nicho ? dados.nicho.trim() : undefined,
      termoBusca: dados.termoBusca ? dados.termoBusca.toLowerCase().trim() : undefined,
      duracaoSegundos: dados.duracaoSegundos ? Math.max(0, dados.duracaoSegundos) : undefined,
      timestamp: agora,
      dataIso: new Date(agora).toISOString(),
      etapaOrigem: dados.etapaOrigem || 1,
    };

    // Insere no buffer do usuário
    const listaUsuario = bufferEventosPorUsuario.get(evento.usuarioId) || [];
    listaUsuario.unshift(evento);
    if (listaUsuario.length > LIMITE_BUFFER_USUARIO) {
      listaUsuario.pop();
    }
    bufferEventosPorUsuario.set(evento.usuarioId, listaUsuario);

    // Insere no histórico geral
    historicoGeralEventos.unshift(evento);
    if (historicoGeralEventos.length > LIMITE_HISTORICO_GERAL) {
      historicoGeralEventos.pop();
    }

    return evento;
  },

  /**
   * Obtém os eventos pendentes/coletados de um usuário
   */
  obterEventosDoUsuario(usuarioId: string): EventoColetado[] {
    return bufferEventosPorUsuario.get(usuarioId) || [];
  },

  /**
   * Retorna todos os IDs de usuários com dados coletados no buffer
   */
  obterUsuariosComEventos(): string[] {
    return Array.from(bufferEventosPorUsuario.keys());
  },

  /**
   * Retorna métricas da etapa de coleta
   */
  obterMetricas(): {
    totalUsuariosAtivos: number;
    totalEventosArmazenados: number;
    ultimosEventos: EventoColetado[];
  } {
    let total = 0;
    for (const lista of bufferEventosPorUsuario.values()) {
      total += lista.length;
    }
    return {
      totalUsuariosAtivos: bufferEventosPorUsuario.size,
      totalEventosArmazenados: total,
      ultimosEventos: historicoGeralEventos.slice(0, 10),
    };
  },

  /**
   * Limpa buffer caso necessário
   */
  limparBuffer(usuarioId?: string): void {
    if (usuarioId) {
      bufferEventosPorUsuario.delete(usuarioId);
    } else {
      bufferEventosPorUsuario.clear();
      historicoGeralEventos.length = 0;
    }
  },

  /**
   * Transfere buffer de eventos de usuário anônimo para conta autenticada
   */
  migrarUsuario(idAnonimo: string, idFinal: string, novoNickname?: string): void {
    if (!idAnonimo || !idFinal || idAnonimo === idFinal) return;
    const eventosAnonimos = bufferEventosPorUsuario.get(idAnonimo) || [];
    if (eventosAnonimos.length > 0) {
      const eventosFinal = bufferEventosPorUsuario.get(idFinal) || [];
      eventosAnonimos.forEach((e) => {
        e.usuarioId = idFinal;
        if (novoNickname) e.nickname = novoNickname;
      });
      bufferEventosPorUsuario.set(
        idFinal,
        [...eventosAnonimos, ...eventosFinal].slice(0, LIMITE_BUFFER_USUARIO)
      );
      bufferEventosPorUsuario.delete(idAnonimo);
    }
  },
};

export default ColetaDadosServico;
