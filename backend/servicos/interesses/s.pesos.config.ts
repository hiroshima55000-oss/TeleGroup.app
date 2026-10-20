/**
 * Configurações de Pesos, Fórmulas de Decaimento, Normalização e Regras de Distribuição
 */

export const CONFIG_INTERESSES = {
  // 1. Escala Universal dos 4 Scores:
  // Todos os 4 scores são normalizados no intervalo estrito de [0.0, 1.0].
  ESCALA_MINIMA_SCORE: 0.0,
  ESCALA_MAXIMA_SCORE: 1.0,

  // 2. Pesos por Tipo de Ação do Usuário no Feed
  PESOS_ACAO: {
    visualizacao: 0.1,    // Rolagem no feed (baixo comprometimento)
    dwell: 0.5,           // Leitura retida por > 4 segundos (tempo de atenção)
    like: 1.2,            // Concordância e validação social
    clique_tag: 2.2,      // Busca ativa deliberada
    clique_link: 5.0,     // Ação de clique de entrada no canal de destino
    descurtir: -1.2,      // Remoção da curtida
  },

  // 3. Decaimento Temporal com Meia-Vida (Time Decay Factor)
  // Fórmula: peso_efetivo = peso_base / (1 + LAMBDA_DECAIMENTO_DIAS * deltaDias)
  LAMBDA_DECAIMENTO_DIAS: 0.05,

  // 4. Composição Estrita dos 4 Scores do Feed (Total = 1.00 ou 100%)
  PESO_SCORE_HASHTAGS: 0.40,   // 40% — Afinidade acumulada por hashtags [0.0 a 1.0]
  PESO_SCORE_RECENCIA: 0.25,   // 25% — Recência da publicação/grupo [0.0 a 1.0]
  PESO_SCORE_SEQUENCIA: 0.20,  // 20% — Sequência imediata da sessão atual [0.0 a 1.0]
  PESO_SCORE_QUALIDADE: 0.15,  // 15% — Qualidade orgânica da publicação [0.0 a 1.0]

  // 5. Regularização da Qualidade Orgânica (Suavização Bayesiana + Desconto de Posição)
  // Evita viés de pequenas amostras (ex: 1 view e 1 clique não gera 100%)
  QUALIDADE_PRIOR_CLIQUES: 2,
  QUALIDADE_PRIOR_VIEWS: 50,

  // 6. Regra Independente de Distribuição (Exploração Anti-Bolha)
  // Interleaving de slots no feed: a cada 5 posições, reserva 1 slot para grupo alternativo
  INTERVALO_SLOT_EXPLORACAO: 5, // 1 slot alternativo a cada 5 posições (20% dos slots)

  // 7. Controle da Sequência de Sessão
  MAX_ITENS_SEQUENCIA_SESSAO: 10,
  JANELA_SEQUENCIA_MINUTOS: 30, // 30 minutos de inatividade reduzem a influência da sessão
  TETO_BOOST_SEQUENCIA: 0.85,   // Teto máximo interpretável: limita a sessão a 85% do seu peso de 20%

  // 8. Limites de Tags por Grupo & Bônus Controlado de Coocorrência
  MIN_TAGS_POR_GRUPO: 1,
  MAX_TAGS_POR_GRUPO: 5,
  BONUS_COOCORRENCIA_LIMITADO: 0.05, // Bônus aditivo moderado (+0.05 com teto máximo de 1.0)
};
