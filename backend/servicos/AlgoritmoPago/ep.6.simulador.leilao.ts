import { ParametrosSimulacaoItem, ResultadoSimulacaoItem } from "./tipos.campanhas.pagas";
import { CONFIG_VANTAGEM_PAGA } from "./ep.1.pesos.vantagem";

export const SimuladorLeilaoServico = {
  /**
   * Simula cenários de escala de tráfego, capacidade de consumo financeiro e ROI
   */
  simular(params: ParametrosSimulacaoItem): ResultadoSimulacaoItem {
    const usuarios = Math.max(10, params.faixaUsuarios || 1000);
    const postsVistos = params.postsVistosPorUsuarioDia || 15;
    const taxaLikes = (params.taxaLikesPercentual || 8.0) / 100;
    const taxaCliques = (params.taxaCliquesPercentual || 4.5) / 100;
    const propAnuncios = (params.proporcaoAnunciosPercentual || 20.0) / 100;
    const orcamentoMedio = params.orcamentoMedioPorCampanha || 25.0;

    const viewsTotaisDia = usuarios * postsVistos;
    const likesDia = Math.round(viewsTotaisDia * taxaLikes);
    const cliquesTotaisDia = Math.round(viewsTotaisDia * taxaCliques);

    // Slots patrocinados reservados
    const slotsAnunciosDia = Math.round(viewsTotaisDia * propAnuncios);
    const maxImpressoesUsuarioDia = Math.round(postsVistos * propAnuncios);

    // Economia e Faturamento
    const cpmEstimado = 14.5;
    const cpcEstimado = 0.32;

    const faturamentoBrutoDia = Number(((slotsAnunciosDia / 1000) * cpmEstimado).toFixed(2));
    const faturamentoBrutoMes = Number((faturamentoBrutoDia * 30).toFixed(2));

    const margem = CONFIG_VANTAGEM_PAGA.MARGEM_PLATAFORMA_PERCENTUAL;
    const lucroPlataformaDia = Number((faturamentoBrutoDia * margem).toFixed(2));
    const lucroPlataformaMes = Number((faturamentoBrutoMes * margem).toFixed(2));

    const capacidadeConsumoDia = faturamentoBrutoDia;
    const capacidadeConsumoMes = faturamentoBrutoMes;

    const campanhasSustentaveis = Math.max(1, Math.round(capacidadeConsumoDia / orcamentoMedio));
    const anunciantesRecomendados = Math.round(campanhasSustentaveis * 1.25);

    // Pressão de Leilão
    const anunciantesAtivos = params.totalAnunciantesAtivos || Math.min(10, campanhasSustentaveis);
    const pressao = Math.min(100, Math.round((anunciantesAtivos / campanhasSustentaveis) * 100));

    let statusLeilao: "Subutilizado" | "Equilibrado" | "Superaquecido" = "Equilibrado";
    let diagnostico = "Leilão em equilíbrio ideal entre demanda de anunciantes e inventário de impressões.";

    if (pressao < 60) {
      statusLeilao = "Subutilizado";
      diagnostico = "Há espaço de sobra para novos anunciantes com eCPM altamente competitivo.";
    } else if (pressao > 120) {
      statusLeilao = "Superaquecido";
      diagnostico = "Alta concorrência por espaço: o eCPM sobe, gerando maior faturamento por impressão.";
    }

    const custoRedeServidoresMes = Number(Math.max(40, usuarios * 0.008).toFixed(2));

    return {
      usuariosBase: usuarios,
      labelFaixa: `${usuarios.toLocaleString("pt-BR")} usuários ativos`,
      visualizacoesTotaisDia: viewsTotaisDia,
      likesEstimadosDia: likesDia,
      cliquesTotaisEstimadosDia: cliquesTotaisDia,
      slotsAnunciosDisponiveisDia: slotsAnunciosDia,
      maxImpressoesPorUsuarioDia: maxImpressoesUsuarioDia,
      capacidadeConsumoFinanceiroDia: capacidadeConsumoDia,
      capacidadeConsumoFinanceiroMes: capacidadeConsumoMes,
      anunciantesRecomendados,
      campanhasSustentaveisSimultaneas: campanhasSustentaveis,
      statusLeilao,
      diagnosticoLeilao: diagnostico,
      pressaoLeilaoPercentual: pressao,
      cpmEstimado,
      cpcEstimado,
      faturamentoBrutoEstimadoDia: faturamentoBrutoDia,
      faturamentoBrutoEstimadoMes: faturamentoBrutoMes,
      lucroRetidoPlataformaDia: lucroPlataformaDia,
      lucroRetidoPlataformaMes: lucroPlataformaMes,
      custoRedeServidoresEstimadoMes: custoRedeServidoresMes,
      impactoPorNicho: [
        { nichoOuHashtag: "Marketing & Vendas", impressoesDiariasNicho: Math.round(slotsAnunciosDia * 0.35), concorrenciaEstimada: "Alta" },
        { nichoOuHashtag: "Moda & Estilo", impressoesDiariasNicho: Math.round(slotsAnunciosDia * 0.25), concorrenciaEstimada: "Média" },
        { nichoOuHashtag: "Negócios & Startups", impressoesDiariasNicho: Math.round(slotsAnunciosDia * 0.22), concorrenciaEstimada: "Média" },
        { nichoOuHashtag: "Oficina & Automotivo", impressoesDiariasNicho: Math.round(slotsAnunciosDia * 0.18), concorrenciaEstimada: "Baixa" },
      ],
    };
  },
};
