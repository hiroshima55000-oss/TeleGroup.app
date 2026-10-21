import {
  EventoColetado,
  PerfilInteressesBaseDados,
  EntregaInteressePayload,
  MetricasCicloBaseDados,
  TipoAcaoBaseDados,
} from "./tipos.base.dados";
import { ColetaDadosServico } from "./ep.1.coleta.dados";
import { OtimizacaoInteressesServico } from "./ep.2.otimizacao.interesses";
import { EntregaInteressesServico } from "./ep.3.entrega.interesses";
import { ColetaContinuaServico } from "./ep.4.coleta.continua";

let ciclosCompletados = 0;
let totalOtimizacoesRealizadas = 0;
let totalEntregasRealizadas = 0;
let etapaAtual: 1 | 2 | 3 | 4 = 1;
const historicoCicloLog: string[] = [];

function registrarLogCiclo(mensagem: string) {
  const linha = `[${new Date().toISOString()}] ${mensagem}`;
  historicoCicloLog.unshift(linha);
  if (historicoCicloLog.length > 50) {
    historicoCicloLog.pop();
  }
}

export const CicloBaseDadosServico = {
  /**
   * Executa uma iteração completa ou avança as etapas do ciclo:
   * 1 (Coleta) -> 2 (Otimização) -> 3 (Entrega) -> 4 (Mais Coleta) -> 1
   */
  async executarPassoCiclo(params: {
    usuarioId: string;
    nickname?: string;
    tipo?: TipoAcaoBaseDados;
    publicacaoId?: string;
    tag?: string;
    nicho?: string;
    duracaoSegundos?: number;
    reacao?: "clique" | "like" | "ignorado" | "dwell";
  }): Promise<{
    etapaExecutada: 1 | 2 | 3 | 4;
    proximaEtapa: 1 | 2 | 3 | 4;
    evento?: EventoColetado;
    perfilOtimizado?: PerfilInteressesBaseDados;
    entrega?: EntregaInteressePayload;
    cicloCompleto: boolean;
  }> {
    const usuarioId = params.usuarioId || "usr_anonimo";

    // ETAPA 1: Coletar dados de usuários
    etapaAtual = 1;
    const evento = ColetaDadosServico.coletar({
      usuarioId,
      nickname: params.nickname,
      tipo: params.tipo || "visualizacao",
      publicacaoId: params.publicacaoId,
      tag: params.tag,
      nicho: params.nicho,
      duracaoSegundos: params.duracaoSegundos,
      etapaOrigem: 1,
    });
    registrarLogCiclo(`Etapa 1: Dados coletados para o usuário ${usuarioId} (ação: ${evento.tipo})`);

    // ETAPA 2: Pegar dados e otimizar interesses
    etapaAtual = 2;
    const eventosDoUsuario = ColetaDadosServico.obterEventosDoUsuario(usuarioId);
    const perfilOtimizado = OtimizacaoInteressesServico.otimizarPerfil(
      usuarioId,
      eventosDoUsuario,
      ciclosCompletados + 1
    );
    totalOtimizacoesRealizadas++;
    registrarLogCiclo(`Etapa 2: Interesses otimizados para ${usuarioId} (${perfilOtimizado.classificacaoPublico})`);

    // ETAPA 3: Entregar interesses otimizados
    etapaAtual = 3;
    const entrega = EntregaInteressesServico.entregar(usuarioId);
    totalEntregasRealizadas++;
    registrarLogCiclo(`Etapa 3: Interesses entregues para ${usuarioId} (${entrega.nichosRecomendados.join(", ")})`);

    // ETAPA 4: Coletar mais dados a partir do consumo
    etapaAtual = 4;
    ColetaContinuaServico.coletarMaisDados({
      usuarioId,
      publicacaoId: params.publicacaoId,
      reacao: params.reacao || (params.tipo === "like" ? "like" : params.tipo === "clique_link" ? "clique" : "dwell"),
      tag: params.tag,
      nicho: params.nicho,
      duracaoSegundos: params.duracaoSegundos,
    });
    registrarLogCiclo(`Etapa 4: Mais dados coletados via feedback loop. Retornando à Etapa 1`);

    // Conclusão da volta e retorno à Etapa 1
    ciclosCompletados++;
    etapaAtual = 1;

    return {
      etapaExecutada: 4,
      proximaEtapa: 1,
      evento,
      perfilOtimizado,
      entrega,
      cicloCompleto: true,
    };
  },

  /**
   * Obtém as métricas gerais do motor cíclico BaseDados
   */
  obterMetricas(): MetricasCicloBaseDados {
    const metColeta = ColetaDadosServico.obterMetricas();
    const metFeed = ColetaContinuaServico.obterMetricas();

    return {
      etapaAtual,
      ciclosCompletados,
      totalEventosColetados: metColeta.totalEventosArmazenados,
      totalOtimizacoesRealizadas,
      totalEntregasRealizadas,
      totalFeedbacksCapturados: metFeed.totalFeedbacksProcessados,
      usuariosAtivosNoCiclo: metColeta.totalUsuariosAtivos,
      ultimoCicloData: new Date().toISOString(),
      historicoCiclo: historicoCicloLog.slice(0, 15),
    };
  },

  /**
   * Atalho para obter o perfil de um usuário diretamente da base otimizada
   */
  obterPerfil(usuarioId: string): PerfilInteressesBaseDados {
    const perfil = OtimizacaoInteressesServico.obterPerfil(usuarioId);
    if (perfil) return perfil;

    // Se não existir, gera a partir da coleta inicial
    const eventos = ColetaDadosServico.obterEventosDoUsuario(usuarioId);
    return OtimizacaoInteressesServico.otimizarPerfil(usuarioId, eventos);
  },

  /**
   * Atalho para obter entrega pronta para feed ou anúncios
   */
  obterEntrega(usuarioId: string): EntregaInteressePayload {
    return EntregaInteressesServico.entregar(usuarioId);
  },
};

export default CicloBaseDadosServico;
