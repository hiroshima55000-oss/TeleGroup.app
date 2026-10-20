import fs from "fs";
import path from "path";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import { formatarMoedaReais } from "./s.painel.arrecadacao";
import { pool, obterStatusBanco } from "../banco.dados";

export interface ItemRankingResultadoCampanha {
  posicao: number;
  campanhaId: string;
  nome: string;
  usuario: string; // Ex: "@cutsw"
  categoria: string;
  orcamentoDiario: number;
  orcamentoDiarioFormatado: string;
  gastoTotal: number;
  gastoTotalFormatado: string;
  cliques: number;
  visualizacoes: number;
  ctr: number; // Porcentagem (ex: 4.92)
  ctrFormatado: string; // "4,92%"
  cpc: number; // Custo por clique em R$ (ex: 0.07)
  cpcFormatado: string; // "R$ 0,07"
  scoreCustoBeneficio: number; // De 0 a 10 (ex: 9.8)
  classificacao: "Excelente" | "Muito Bom" | "Bom" | "Regular";
  linha: string;
}

export interface ResumoCustoBeneficioCampanhas {
  campanhaDestaque: string;
  melhorCpc: string;
  maiorCtr: string;
  mediaCpcGeral: string;
  totalCliques: number;
  totalVisualizacoes: number;
  totalInvestido: number;
  totalInvestidoFormatado: string;
}

export interface RespostaRankResultadoCampanha {
  sucesso: boolean;
  area: "rank_resultado_campanhas";
  modulo: "s.painel.divulgacao.rank.resultado.campanha";
  titulo: string;
  fonte: string;
  totalCampanhasAnalisadas: number;
  resumo: ResumoCustoBeneficioCampanhas;
  ranking: ItemRankingResultadoCampanha[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_RANKINGS = path.resolve(process.cwd(), "admin_rankings.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

const DADOS_PADRAO_RESULTADOS: ItemRankingResultadoCampanha[] = [
  {
    posicao: 1,
    campanhaId: "camp_cortes_virais",
    nome: "Cortes Virais",
    usuario: "@cutsw",
    categoria: "Vídeos & Entretenimento",
    orcamentoDiario: 35.0,
    orcamentoDiarioFormatado: "R$ 35,00",
    gastoTotal: 226.8,
    gastoTotalFormatado: "R$ 226,80",
    cliques: 3240,
    visualizacoes: 65850,
    ctr: 4.92,
    ctrFormatado: "4,92%",
    cpc: 0.07,
    cpcFormatado: "R$ 0,07",
    scoreCustoBeneficio: 9.8,
    classificacao: "Excelente",
    linha: "#1 @cutsw - \"Cortes Virais\": R$ 0,07 por clique (3.240 cliques | 4,92% CTR) - Custo-Benefício Excelente",
  },
  {
    posicao: 2,
    campanhaId: "camp_canal_yt_pro",
    nome: "Canal Youtube Pro",
    usuario: "@mariayt",
    categoria: "Canais & Redes",
    orcamentoDiario: 40.0,
    orcamentoDiarioFormatado: "R$ 40,00",
    gastoTotal: 370.8,
    gastoTotalFormatado: "R$ 370,80",
    cliques: 4120,
    visualizacoes: 92580,
    ctr: 4.45,
    ctrFormatado: "4,45%",
    cpc: 0.09,
    cpcFormatado: "R$ 0,09",
    scoreCustoBeneficio: 9.5,
    classificacao: "Excelente",
    linha: "#2 @mariayt - \"Canal Youtube Pro\": R$ 0,09 por clique (4.120 cliques | 4,45% CTR) - Custo-Benefício Excelente",
  },
  {
    posicao: 3,
    campanhaId: "camp_vip_cripto",
    nome: "Comunidade VIP Cripto",
    usuario: "@julios",
    categoria: "Investimentos",
    orcamentoDiario: 50.0,
    orcamentoDiarioFormatado: "R$ 50,00",
    gastoTotal: 317.9,
    gastoTotalFormatado: "R$ 317,90",
    cliques: 2890,
    visualizacoes: 75650,
    ctr: 3.82,
    ctrFormatado: "3,82%",
    cpc: 0.11,
    cpcFormatado: "R$ 0,11",
    scoreCustoBeneficio: 9.1,
    classificacao: "Muito Bom",
    linha: "#3 @julios - \"Comunidade VIP Cripto\": R$ 0,11 por clique (2.890 cliques | 3,82% CTR) - Custo-Benefício Muito Bom",
  },
  {
    posicao: 4,
    campanhaId: "camp_divulgacao_grupos",
    nome: "Divulgação de Grupos",
    usuario: "@lulaew",
    categoria: "Comunidades",
    orcamentoDiario: 30.0,
    orcamentoDiarioFormatado: "R$ 30,00",
    gastoTotal: 253.5,
    gastoTotalFormatado: "R$ 253,50",
    cliques: 1950,
    visualizacoes: 57180,
    ctr: 3.41,
    ctrFormatado: "3,41%",
    cpc: 0.13,
    cpcFormatado: "R$ 0,13",
    scoreCustoBeneficio: 8.6,
    classificacao: "Muito Bom",
    linha: "#4 @lulaew - \"Divulgação de Grupos\": R$ 0,13 por clique (1.950 cliques | 3,41% CTR) - Custo-Benefício Muito Bom",
  },
  {
    posicao: 5,
    campanhaId: "camp_trafego_afiliados",
    nome: "Tráfego e Afiliados",
    usuario: "@viro12",
    categoria: "Negócios & Renda",
    orcamentoDiario: 25.0,
    orcamentoDiarioFormatado: "R$ 25,00",
    gastoTotal: 246.0,
    gastoTotalFormatado: "R$ 246,00",
    cliques: 1640,
    visualizacoes: 52560,
    ctr: 3.12,
    ctrFormatado: "3,12%",
    cpc: 0.15,
    cpcFormatado: "R$ 0,15",
    scoreCustoBeneficio: 8.2,
    classificacao: "Bom",
    linha: "#5 @viro12 - \"Tráfego e Afiliados\": R$ 0,15 por clique (1.640 cliques | 3,12% CTR) - Custo-Benefício Bom",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RankResultadoCampanha] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const RankResultadoCampanhaServico = {
  /**
   * Obtém o ranking das campanhas mais custo-benefício
   * Analisa CPC (Custo por Clique), CTR (Taxa de Cliques) e volume de conversão
   */
  async obterRankingResultado(): Promise<RespostaRankResultadoCampanha> {
    const dadosArquivo = lerJsonSeguro<any>(ARQUIVO_RANKINGS, {});
    let lista: ItemRankingResultadoCampanha[] = [];
    let fonte = "arquivos_persistentes";

    // 1. Prioriza campanhas persistidas configuradas para o ranking
    if (
      dadosArquivo.campanhasCustoBeneficio &&
      Array.isArray(dadosArquivo.campanhasCustoBeneficio) &&
      dadosArquivo.campanhasCustoBeneficio.length > 0
    ) {
      lista = dadosArquivo.campanhasCustoBeneficio;
      fonte = "arquivo_persistente";
    } else {
      // 2. Se não houver configuração manual, usa os dados padrão de referência
      lista = DADOS_PADRAO_RESULTADOS;
      fonte = "padrao";
    }

    // Ordena do maior score de custo-benefício para o menor (ou menor CPC como critério de desempate)
    lista.sort((a, b) => {
      if (b.scoreCustoBeneficio !== a.scoreCustoBeneficio) {
        return b.scoreCustoBeneficio - a.scoreCustoBeneficio;
      }
      return a.cpc - b.cpc;
    });

    // Reindexa as posições
    lista = lista.map((item, idx) => ({
      ...item,
      posicao: idx + 1,
      linha: `#${idx + 1} ${item.usuario} - "${item.nome}": ${item.cpcFormatado} por clique (${item.cliques.toLocaleString("pt-BR")} cliques | ${item.ctrFormatado} CTR) - Custo-Benefício ${item.classificacao}`,
    }));

    // Métricas de resumo geral
    let totalCliques = 0;
    let totalVisualizacoes = 0;
    let totalInvestido = 0;
    let melhorCpcValor = Infinity;
    let melhorCpcFormatado = "R$ 0,00";
    let maiorCtrValor = 0;
    let maiorCtrFormatado = "0,00%";
    let campanhaDestaque = lista[0] ? `${lista[0].usuario} - ${lista[0].nome}` : "Nenhuma";

    for (const item of lista) {
      totalCliques += item.cliques;
      totalVisualizacoes += item.visualizacoes;
      totalInvestido += item.gastoTotal;

      if (item.cpc < melhorCpcValor && item.cpc > 0) {
        melhorCpcValor = item.cpc;
        melhorCpcFormatado = item.cpcFormatado;
      }

      if (item.ctr > maiorCtrValor) {
        maiorCtrValor = item.ctr;
        maiorCtrFormatado = item.ctrFormatado;
      }
    }

    const mediaCpcValor = totalCliques > 0 ? totalInvestido / totalCliques : 0;
    const mediaCpcGeral = formatarMoedaReais(mediaCpcValor);

    const resumo: ResumoCustoBeneficioCampanhas = {
      campanhaDestaque,
      melhorCpc: melhorCpcFormatado,
      maiorCtr: maiorCtrFormatado,
      mediaCpcGeral,
      totalCliques,
      totalVisualizacoes,
      totalInvestido: Number(totalInvestido.toFixed(2)),
      totalInvestidoFormatado: formatarMoedaReais(totalInvestido),
    };

    const titulo = "rank de resultado de campanhas (custo-benefício):";
    const linhas = lista.map((item) => item.linha);
    const textoFormatado =
      `${titulo}\n` +
      linhas.join("\n") +
      `\n\n` +
      `resumo de eficiência:\n` +
      `melhor CPC: ${resumo.melhorCpc}\n` +
      `maior CTR: ${resumo.maiorCtr}\n` +
      `campanha destaque: ${resumo.campanhaDestaque}\n` +
      `média geral CPC: ${resumo.mediaCpcGeral}`;

    return {
      sucesso: true,
      area: "rank_resultado_campanhas",
      modulo: "s.painel.divulgacao.rank.resultado.campanha",
      titulo,
      fonte,
      totalCampanhasAnalisadas: lista.length,
      resumo,
      ranking: lista,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia proativamente o ranking das campanhas mais custo-benefício para o painel administrativo (API_URL)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_resultado_campanhas",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingResultado();

      const payload = {
        evento,
        area: "rank_resultado_campanhas",
        modulo: "s.painel.divulgacao.rank.resultado.campanha",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalCampanhasAnalisadas: metricas.totalCampanhasAnalisadas,
          resumo: metricas.resumo,
          ranking: metricas.ranking,
          linhas: metricas.linhas,
          textoFormatado: metricas.textoFormatado,
          ...dadosExtras,
        },
        timestamp: new Date().toISOString(),
      };

      const chave = PAINEL_CHAVE_SECRETA || CHAVE_SECRETA_TELEGROUP;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-origem": "website_2",
      };

      if (chave) {
        headers["x-painel-chave-secreta"] = chave;
        headers["Authorization"] = `Bearer ${chave}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resposta = await fetch(endpointWebhook, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duracaoMs = Date.now() - inicio;

      LoggerInformativo.webhookEnviado(endpointWebhook, evento, resposta.status, duracaoMs);

      return {
        enviado: resposta.ok,
        status: resposta.status,
        duracaoMs,
      };
    } catch (err: any) {
      const duracaoMs = Date.now() - inicio;
      LoggerInformativo.webhookEnviado(endpointWebhook, evento, 500, duracaoMs);
      return {
        enviado: false,
        erro: err.message,
        duracaoMs,
      };
    }
  },
};

export default RankResultadoCampanhaServico;
