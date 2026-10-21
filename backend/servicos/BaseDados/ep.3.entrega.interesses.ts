import { PerfilInteressesBaseDados, EntregaInteressePayload } from "./tipos.base.dados";
import { OtimizacaoInteressesServico } from "./ep.2.otimizacao.interesses";

// Registro de entregas ativas para medição do feedback loop na Etapa 4
const entregasRealizadas = new Map<string, EntregaInteressePayload>();

export const EntregaInteressesServico = {
  /**
   * ETAPA 3 DO CICLO:
   * Entrega interesses otimizados para o Feed Orgânico, Leilão de Anúncios e APIs de Recomendação
   */
  entregar(usuarioId: string): EntregaInteressePayload {
    // 1. Recupera perfil otimizado da Etapa 2
    let perfil = OtimizacaoInteressesServico.obterPerfil(usuarioId);
    if (!perfil) {
      // Se ainda não foi processado, otimiza com histórico vazio ou neutro
      perfil = OtimizacaoInteressesServico.otimizarPerfil(usuarioId, []);
    }

    // 2. Extrai nichos prioritários (top nichos por percentual)
    const nichosRecomendados = perfil.distribuicaoGrupos
      .slice(0, 3)
      .map((g) => g.grupoNome);

    // 3. Extrai hashtags prioritárias
    const tagsRecomendadas = Object.keys(perfil.topHashtags || {}).slice(0, 8);

    // 4. Calcula multiplicador de afinidade por tag e por grupo (para uso no feed e no AdRank)
    const multiplicadorAfinidade: Record<string, number> = {};

    for (const grupo of perfil.distribuicaoGrupos) {
      // Converte percentual (ex: 35%) em fator multiplicador entre 1.0 e 2.2
      const fator = Number((1.0 + (grupo.percentual / 100) * 1.2).toFixed(2));
      multiplicadorAfinidade[`nicho:${grupo.grupoNome}`] = fator;
    }

    for (const [tag, dados] of Object.entries(perfil.topHashtags || {})) {
      const fator = Number((1.0 + (dados.percentual / 100) * 1.5).toFixed(2));
      multiplicadorAfinidade[`tag:${tag}`] = fator;
    }

    const payload: EntregaInteressePayload = {
      usuarioId,
      perfil,
      nichosRecomendados,
      tagsRecomendadas,
      multiplicadorAfinidade,
      timestampEntrega: new Date().toISOString(),
      etapa: 3,
    };

    // Armazena entrega no buffer para conectar com Etapa 4
    entregasRealizadas.set(usuarioId, payload);

    return payload;
  },

  /**
   * Consulta a última entrega realizada para um usuário
   */
  obterUltimaEntrega(usuarioId: string): EntregaInteressePayload | null {
    return entregasRealizadas.get(usuarioId) || null;
  },

  /**
   * Retorna métricas da etapa de entrega
   */
  obterMetricas(): { totalEntregasAtivas: number; usuariosAtendidos: string[] } {
    return {
      totalEntregasAtivas: entregasRealizadas.size,
      usuariosAtendidos: Array.from(entregasRealizadas.keys()),
    };
  },
};

export default EntregaInteressesServico;
