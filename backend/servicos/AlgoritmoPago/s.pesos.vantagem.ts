/**
 * Configurações de Vantagem Paga, Elegibilidade de Qualidade e Leilão GSP (Generalized Second Price)
 * Modelo alinhado aos padrões industriais (Google Ads / Meta Ads) para equilibrar ROI do anunciante
 * e retenção orgânica dos usuários.
 */

export const CONFIG_VANTAGEM_PAGA = {
  // 1. Critérios de Elegibilidade de Qualidade (Filtro Anti-Spam / Anti-Irrelevância)
  // Anúncios com qualidade ruim não entram no feed mesmo pagando lance alto.
  ADRANK_PISO_GERAL: 1.5, // AdRank mínimo para qualquer exibição na rede
  ADRANK_PISO_TOPO: 7.5, // AdRank exigido para competir pelo Slot Nobre de Topo
  SCORE_QUALIDADE_MINIMO_TOPO: 0.65, // Exige qualidade >= 6.5/10 para disputar o topo
  BOOST_COINCIDENCIA_TAG: 0.8, // Bônus de relevância contextual por tags coincidentes
  BOOST_PUBLICO_QUALIFICADO: 1.25, // Bônus para usuário identificado como alto clique / tráfego qualificado

  // 1.1. Tratamento de Cold Start para Novas Campanhas (Sem histórico prévio)
  AMOSTRAS_MINIMAS_COLD_START: 30, // Volume de impressões de aprendizagem/exploração
  PRIOR_QUALIDADE_COLD_START: 0.60, // Nota neutra 6.0/10 para competir no inline sem punição precoce

  // 2. Política de Topo Flexível (Não Obrigatória)
  // O Slot de Topo NÃO é reservado compulsoriamente para anúncio.
  // Se nenhuma campanha ativa atingir alta relevância e qualidade mínima, o topo permanece 100% orgânico.
  EXIGIR_QUALIDADE_ESTRITA_TOPO: true,

  // 3. Frequência Saudável no Feed (Espaçamento e Saturação Máxima)
  INTERVALO_SLOT_INLINE_PATROCINADO: 5, // 1 anúncio a cada 5 posts orgânicos
  TETO_SATURACAO_ANUNCIOS_FEED: 0.20, // No máximo 20% do feed exibido (garantia matemática)
  MIN_ITENS_FEED_PARA_ANUNCIO: 5, // Feeds menores que 5 itens NÃO recebem anúncios (mantém <= 20%)

  // 4. Mecânica Econômica e Leilão de Segundo Preço Ponderado (GSP)
  MARGEM_PLATAFORMA_PERCENTUAL: 0.20, // 20% retido pela plataforma na intermediação de mídia
  FATOR_ENTREGA_LIQUIDA: 0.80, // 80% do lance é entregue em mídia efetiva
  CPM_MINIMO_PISO: 2.5, // R$ 2,50 por 1.000 impressões
  CPC_MINIMO_PISO: 0.12, // R$ 0,12 por clique válido
  LIMIAR_ORCAMENTO_PREMIUM: 50.0, // Orçamento diário a partir do qual recebe prioridade de pacing acelerado

  // 5. Proteção de Qualidade de Tráfego e Anti-Fraude Multicamada
  JANELA_DEBOUNCE_CLIQUES_SEGUNDOS: 15, // Cliques repetidos em menos de 15s são unificados sem cobrança
  TEMPO_MINIMO_REACAO_HUMANA_MS: 800, // Rejeita cliques abaixo de 800ms (bots ou cliques acidentais)
  LIMITE_CLIQUES_POR_USUARIO_HORA: 3, // Máximo de 3 cliques cobrados por usuário/anúncio a cada hora
  DWELL_TIME_VISITA_VALIDA_SEGUNDOS: 3, // Tempo mínimo no destino para classificar como "Visita Válida"

  // 6. Ritmos de Pacing (Distribuição do Orçamento no Tempo)
  PACING: {
    ACELERADO: {
      nome: "Acelerado" as const,
      fatorVelocidade: 1.6,
      descricao: "Entrega prioritária para gerar volume de visitas no menor tempo possível.",
    },
    OTIMIZADO: {
      nome: "Otimizado" as const,
      fatorVelocidade: 1.0,
      descricao: "Equilibra a entrega ao longo do dia nos horários de maior pico de atividade.",
    },
    CADENCIADO: {
      nome: "Cadenciado" as const,
      fatorVelocidade: 0.75,
      descricao: "Consumo suave e contínuo mantendo presença constante na rede.",
    },
  },
};

