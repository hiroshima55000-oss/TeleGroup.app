import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import { Campanha } from "../schemas/schema.campanhas";
import { formatarMoedaReais } from "./s.painel.arrecadacao";
import { formatarNumeroMilhar } from "./s.painel.divulgacoes";

export interface ItemCampanhaAtivaPorValor {
  posicao: number;
  orcamentoDiario: number;
  orcamentoFormatado: string;
  quantidade: number;
  quantidadeFormatada: string;
  linha: string;
}

export interface RespostaCampanhasAtivas {
  sucesso: boolean;
  area: "campanhas_ativas";
  titulo: string;
  fonte: string;
  totalCampanhasAtivas: number;
  totalValoresDiferentes: number;
  totalFaixas: number;
  valoresDiferentes: number[];
  ranking: ItemCampanhaAtivaPorValor[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

// Compatibilidade de interface com versões anteriores
export type ItemRankingCampanhaAtiva = ItemCampanhaAtivaPorValor;
export type RespostaCompletaRankingCampanhas = RespostaCampanhasAtivas;

const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "[]");
    }
  } catch (err) {
    console.warn(`[CampanhasAtivas] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const CampanhasAtivasServico = {
  /**
   * Identifica quantas campanhas de quantos valores diferentes estão ativas
   * utilizando dados 100% reais do PostgreSQL ou armazenamento local.
   * Ordena da maior quantidade de campanhas ativas para a menor.
   */
  async obterCampanhasAtivas(): Promise<RespostaCampanhasAtivas> {
    let fonte = "arquivos_persistentes";
    const mapaAgrupado = new Map<number, number>();
    let totalCampanhasAtivas = 0;

    // 1. Tenta consulta direta no PostgreSQL caso conectado
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        fonte = "banco_postgresql";

        const res = await pool.query<{ orcamento_diario: string | number; quantidade: string | number }>(`
          SELECT 
            orcamento_diario, 
            COUNT(*)::int as quantidade
          FROM campanhas
          WHERE status = 'Ativa'
          GROUP BY orcamento_diario
          ORDER BY quantidade DESC, orcamento_diario DESC
        `);

        for (const row of res.rows) {
          const orc = Number(row.orcamento_diario);
          const qtd = Number(row.quantidade);
          if (!isNaN(orc) && qtd > 0) {
            mapaAgrupado.set(orc, qtd);
            totalCampanhasAtivas += qtd;
          }
        }
        usouPostgres = true;
      }
    } catch (err: any) {
      console.warn("[CampanhasAtivas] PostgreSQL indisponível para consulta:", err.message);
    }

    // 2. Se não utilizou PostgreSQL, analisa o arquivo local de campanhas reais
    if (!usouPostgres) {
      const lista = lerJsonSeguro<Campanha[]>(ARQUIVO_CAMPANHAS, []);
      for (const c of lista) {
        if (c.status === "Ativa") {
          const orc = Number(c.orcamentoDiario);
          if (!isNaN(orc) && orc > 0) {
            const atual = mapaAgrupado.get(orc) || 0;
            mapaAgrupado.set(orc, atual + 1);
            totalCampanhasAtivas++;
          }
        }
      }
    }

    // Ordena as entradas: 1º por maior quantidade, 2º desempate por maior orçamento
    const entradasOrdenadas = Array.from(mapaAgrupado.entries()).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return b[0] - a[0];
    });

    const ranking: ItemCampanhaAtivaPorValor[] = entradasOrdenadas.map(([orcamento, quantidade], index) => {
      const orcamentoFormatado = formatarMoedaReais(orcamento);
      const quantidadeFormatada = formatarNumeroMilhar(quantidade);
      const linha = `são ${quantidadeFormatada} campanhas de ${orcamentoFormatado} diário`;

      return {
        posicao: index + 1,
        orcamentoDiario: orcamento,
        orcamentoFormatado,
        quantidade,
        quantidadeFormatada,
        linha,
      };
    });

    const titulo = "campanhas ativas:";
    const linhas = ranking.map((item) => item.linha);

    // Constrói o texto formatado exatamente no padrão exigido pelo painel
    let textoFormatado = titulo;
    if (linhas.length > 0) {
      textoFormatado += `\n${linhas.join("\n")}`;
    } else {
      textoFormatado += `\nnenhuma campanha ativa no momento`;
    }

    const valoresDiferentes = entradasOrdenadas.map(([orc]) => orc);

    return {
      sucesso: true,
      area: "campanhas_ativas",
      titulo,
      fonte,
      totalCampanhasAtivas,
      totalValoresDiferentes: ranking.length,
      totalFaixas: ranking.length,
      valoresDiferentes,
      ranking,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  // Alias para manter compatibilidade com métodos anteriores
  async obterRankingCampanhasAtivas(): Promise<RespostaCampanhasAtivas> {
    return this.obterCampanhasAtivas();
  },

  /**
   * Envia proativamente as informações reais de campanhas ativas para o painel (API_URL)
   * assim como os outros serviços s.painel fazem.
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_campanhas_ativas",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterCampanhasAtivas();

      const payload = {
        evento,
        area: "campanhas_ativas",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalCampanhasAtivas: metricas.totalCampanhasAtivas,
          totalValoresDiferentes: metricas.totalValoresDiferentes,
          totalFaixas: metricas.totalFaixas,
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

// Aliases para compatibilidade total
export const RankingCampanhasServico = CampanhasAtivasServico;
export default CampanhasAtivasServico;
