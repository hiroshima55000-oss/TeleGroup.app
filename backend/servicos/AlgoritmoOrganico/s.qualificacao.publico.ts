import { ClassificacaoPublico } from "./tipos.interesses";

export interface DiagnosticoQualificacao {
  classificacao: ClassificacaoPublico;
  taxaCliquesCTR: number; // CTR = (cliques / visualizações) * 100
  taxaEngajamentoSocial: number; // Likes / visualizações * 100
  descricao: string;
  pontosFortes: string[];
  recomendacaoSegmentacao: string;
}

export const QualificacaoPublicoServico = {
  /**
   * Avalia o perfil comportamental do usuário com base no volume de cliques,
   * curtidas e visualizações, diferenciando claramente CTR (cliques/views) de conversão.
   */
  avaliar(metricas: {
    visualizacoes: number;
    likes: number;
    cliques: number;
    totalInteracoes: number;
    tempoRetencaoEstimadoSegundos?: number;
  }): DiagnosticoQualificacao {
    const views = Math.max(1, metricas.visualizacoes || 0);
    const likes = metricas.likes || 0;
    const cliques = metricas.cliques || 0;
    const total = metricas.totalInteracoes || views + likes + cliques;

    // CTR é estritamente a taxa de cliques por visualização
    const ctr = Number(((cliques / views) * 100).toFixed(2));
    const socialRate = Number(((likes / views) * 100).toFixed(2));

    // 1. Público de Alto Clique (Tráfego Focado):
    // Usuário focado em clicar nos links e ingressar nas comunidades (alto CTR real).
    if (cliques >= 3 && (ctr >= 8.0 || cliques >= likes * 0.8)) {
      return {
        classificacao: "Público de Alto Clique (Tráfego Focado)",
        taxaCliquesCTR: ctr,
        taxaEngajamentoSocial: socialRate,
        descricao:
          "Perfil focado em ação direta: consome o card e clica para ingressar nos canais e grupos.",
        pontosFortes: [
          "Alta taxa de cliques por visualização (CTR elevado)",
          "Gera tráfego direto e qualificado para os destinos",
          "Interesse focado com pouca dispersão",
        ],
        recomendacaoSegmentacao:
          "Ideal para campanhas de aquisição de membros, canais temáticos e produtos de nicho.",
      };
    }

    // 2. Engajador Social:
    // Usuário que apoia o feed com curtidas e tempo de tela, gerando prova social.
    if (likes >= 5 && (socialRate >= 6.0 || likes > cliques * 2)) {
      return {
        classificacao: "Engajador Social",
        taxaCliquesCTR: ctr,
        taxaEngajamentoSocial: socialRate,
        descricao:
          "Perfil comunitário: valida publicações com curtidas e alimenta a prova social do feed.",
        pontosFortes: [
          "Forte impulsionador de reputação e validação social",
          "Aumenta a autoridade das publicações",
        ],
        recomendacaoSegmentacao:
          "Ideal para comunidades que buscam engajamento inicial e fortalecimento de marca.",
      };
    }

    // 3. Explorador:
    // Usuário em jornada de descoberta ampla, clicando em tags e testando categorias variadas.
    if (total >= 4 || views >= 10) {
      return {
        classificacao: "Explorador",
        taxaCliquesCTR: ctr,
        taxaEngajamentoSocial: socialRate,
        descricao:
          "Perfil exploratório: navega por múltiplas hashtags e categorias antes de fixar preferência.",
        pontosFortes: [
          "Excelente receptividade a novos nichos e conteúdos alternativos",
          "Sensível à diversidade do feed",
        ],
        recomendacaoSegmentacao:
          "Ideal para descoberta de novas comunidades e campanhas de topo de funil.",
      };
    }

    // 4. Passivo:
    return {
      classificacao: "Passivo",
      taxaCliquesCTR: ctr,
      taxaEngajamentoSocial: socialRate,
      descricao:
        "Perfil novo ou de navegação esporádica com baixo volume de ações registradas.",
      pontosFortes: ["Em formação de histórico"],
      recomendacaoSegmentacao:
        "Exibir os conteúdos mais bem avaliados e grupos de maior alcance da plataforma.",
    };
  },
};
