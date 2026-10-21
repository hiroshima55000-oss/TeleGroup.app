import { Campanha } from "../../schemas/schema.campanhas";
import { ResultadoLeilaoItem, SlotExibicao } from "./tipos.campanhas.pagas";
import { CONFIG_VANTAGEM_PAGA } from "./ep.1.pesos.vantagem";
import { SegmentacaoAudienciaServico } from "./ep.2.segmentacao.audiencia";
import { EntregaPacingServico } from "./ep.3.entrega.pacing";

export const LeilaoAdRankServico = {
  /**
   * Calcula o AdRank competitivo de uma campanha com base em Lance, Qualidade e Relevância
   */
  calcularAdRank(
    campanha: Campanha,
    usuarioId?: string,
    slot: SlotExibicao = "feed_inline"
  ): {
    item: ResultadoLeilaoItem;
    adRankBruto: number;
    lanceMaximoEcpm: number;
    denominadorQualidade: number;
  } | null {
    // 1. Verificação de Pacing e Saldo
    const pacing = EntregaPacingServico.calcularPacing(campanha);
    if (!pacing.podeEntregar) {
      return null;
    }

    const orcamento = Number(campanha.orcamentoDiario || 10);
    const views = Math.max(0, campanha.visualizacoes || 0);
    const cliques = Math.max(0, campanha.cliques || 0);

    // 2. Score de Qualidade (Q) com Suavização Bayesiana e Suporte a Cold Start
    // Para campanhas novas (views < AMOSTRAS_MINIMAS_COLD_START), aplica prior neutro de aprendizado (0.60 = 6.0/10)
    // para dar chance de competir no feed inline sem punição precoce, mas sem dar acesso facilitado ao topo.
    let scoreQualidade: number;
    if (views < CONFIG_VANTAGEM_PAGA.AMOSTRAS_MINIMAS_COLD_START) {
      const priorPeso = CONFIG_VANTAGEM_PAGA.AMOSTRAS_MINIMAS_COLD_START - views;
      const ctrAmostrado = views > 0 ? cliques / views : 0.045;
      const ctrCombinado = (ctrAmostrado * views + 0.045 * priorPeso) / CONFIG_VANTAGEM_PAGA.AMOSTRAS_MINIMAS_COLD_START;
      scoreQualidade = Number(Math.min(1.0, Math.max(0.35, ctrCombinado / 0.075)).toFixed(3));
    } else {
      const ctrRegularizado = (cliques + 2) / (views + 50);
      scoreQualidade = Number(Math.min(1.0, Math.max(0.15, ctrRegularizado / 0.075)).toFixed(3));
    }

    // 3. Lance Máximo eCPM Declarado (teto financeiro do anunciante)
    const lanceMaximoEcpm = Math.max(CONFIG_VANTAGEM_PAGA.CPM_MINIMO_PISO, orcamento * 0.40);

    // 4. Segmentação de Audiência e Relevância Contextual (R)
    const segmentacao = SegmentacaoAudienciaServico.calcularAfinidadeAudiencia(campanha, usuarioId);

    // 5. AdRank Oficial do Leilão:
    // AdRank = Lance_eCPM * Score_Qualidade * Fator_Relevancia * Fator_Pacing
    const denominadorQualidade = Math.max(0.05, scoreQualidade * segmentacao.fatorRelevancia * pacing.fatorPacing);
    const adRankBruto = Number((lanceMaximoEcpm * denominadorQualidade).toFixed(4));

    // 6. Critérios de Elegibilidade Estrita
    if (adRankBruto < CONFIG_VANTAGEM_PAGA.ADRANK_PISO_GERAL) {
      return null; // Não qualificado para exibição na rede
    }

    // Se a disputa for pelo Slot Nobre de Topo, exige qualidade e AdRank elevados
    if (slot === "feed_topo") {
      if (
        adRankBruto < CONFIG_VANTAGEM_PAGA.ADRANK_PISO_TOPO ||
        scoreQualidade < CONFIG_VANTAGEM_PAGA.SCORE_QUALIDADE_MINIMO_TOPO
      ) {
        return null; // Não qualificado para o topo (o topo permanece orgânico)
      }
    }

    const motivo = [
      `Qualidade: ${(scoreQualidade * 10).toFixed(1)}/10`,
      `Relevância: ${segmentacao.fatorRelevancia.toFixed(2)}x`,
      `Pacing: ${pacing.ritmo}`,
    ].join(" | ");

    const item: ResultadoLeilaoItem = {
      campanha,
      scoreRankeamento: adRankBruto,
      ecpmEstimado: lanceMaximoEcpm, // Inicialmente lance máximo, reajustado no GSP
      fatorRelevancia: segmentacao.fatorRelevancia,
      scoreQualidade,
      multiplicadorVantagemPaga: Number(segmentacao.fatorRelevancia.toFixed(2)),
      ritmoPacing: pacing.ritmo,
      motivoVitoria: motivo,
      custoPorImpressaoEstimado: Number((lanceMaximoEcpm / 1000).toFixed(4)),
      custoPorCliqueEstimado: Number(Math.max(CONFIG_VANTAGEM_PAGA.CPC_MINIMO_PISO, lanceMaximoEcpm / 35).toFixed(2)),
      slotAtribuido: slot,
    };

    return {
      item,
      adRankBruto,
      lanceMaximoEcpm,
      denominadorQualidade,
    };
  },

  /**
   * Executa o Leilão de Segundo Preço Ponderado por Qualidade (GSP)
   * O preço a pagar é estritamente o valor mínimo para superar o AdRank do concorrente inferior.
   */
  executarLeilao(
    campanhas: Campanha[],
    params: {
      usuarioId?: string;
      categoria?: string;
      busca?: string;
      slot?: SlotExibicao;
      limite?: number;
    } = {}
  ): ResultadoLeilaoItem[] {
    const slot = params.slot || "feed_inline";
    const limite = params.limite || 3;

    // Filtra campanhas ativas
    let candidatas = campanhas.filter((c) => c.status === "Ativa");

    if (params.categoria && params.categoria !== "Todos") {
      const cat = params.categoria.toLowerCase().trim();
      candidatas = candidatas.filter(
        (c) =>
          (c.categoria && c.categoria.toLowerCase().includes(cat)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(cat)))
      );
    }

    if (params.busca && params.busca.trim()) {
      const b = params.busca.toLowerCase().trim();
      candidatas = candidatas.filter(
        (c) =>
          c.nome.toLowerCase().includes(b) ||
          (c.texto && c.texto.toLowerCase().includes(b)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(b)))
      );
    }

    const avaliadas: {
      item: ResultadoLeilaoItem;
      adRankBruto: number;
      lanceMaximoEcpm: number;
      denominadorQualidade: number;
    }[] = [];

    for (const c of candidatas) {
      const res = this.calcularAdRank(c, params.usuarioId, slot);
      if (res) {
        avaliadas.push(res);
      }
    }

    // Ordena decrescente por AdRank
    avaliadas.sort((a, b) => b.adRankBruto - a.adRankBruto);

    // Mecânica GSP (Generalized Second Price com Qualidade):
    // Preço_i = (AdRank_{i+1} / Qualidade_i) + 0.01
    // Com teto garantido: Preço_i <= LanceMaximo_i
    const resultadoFinal: ResultadoLeilaoItem[] = [];

    for (let i = 0; i < avaliadas.length; i++) {
      const atual = avaliadas[i];
      let ecpmCobrado: number;

      if (i + 1 < avaliadas.length) {
        // Há um concorrente logo abaixo
        const proximoAdRank = avaliadas[i + 1].adRankBruto;
        const ecpmNecessarioParaVencer = (proximoAdRank / atual.denominadorQualidade) + 0.01;
        ecpmCobrado = Math.min(atual.lanceMaximoEcpm, Math.max(CONFIG_VANTAGEM_PAGA.CPM_MINIMO_PISO, ecpmNecessarioParaVencer));
      } else {
        // Último concorrente ou concorrente único paga o piso de reserva
        ecpmCobrado = Math.min(atual.lanceMaximoEcpm, CONFIG_VANTAGEM_PAGA.CPM_MINIMO_PISO);
      }

      atual.item.ecpmEstimado = Number(ecpmCobrado.toFixed(2));
      atual.item.custoPorImpressaoEstimado = Number((ecpmCobrado / 1000).toFixed(4));
      atual.item.custoPorCliqueEstimado = Number(
        Math.max(CONFIG_VANTAGEM_PAGA.CPC_MINIMO_PISO, ecpmCobrado / Math.max(10, atual.item.scoreQualidade * 40)).toFixed(2)
      );

      resultadoFinal.push(atual.item);
    }

    return resultadoFinal.slice(0, limite);
  },
};
