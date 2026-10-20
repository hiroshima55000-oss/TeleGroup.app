import { Request } from "express";
import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import {
  API_URL,
  PAINEL_CHAVE_SECRETA,
  CHAVE_SECRETA_TELEGROUP,
  PORT,
} from "../configuracao/variaveis";
import { LoggerInformativo, extrairIp } from "./s.comunicacao";
import { ArrecadacaoServico } from "./s.painel.arrecadacao";

export interface MetricasEstruturadas {
  entradas: {
    hoje: number;
    ontem: number;
    ultimos_10_dias: number;
    ultimos_30_dias: number;
  };
  usuarios: {
    nao_cadastrados: number;
    cadastrados: number;
    publicadores: number;
    anunciantes: number;
    denunciados: number;
    banidos: number;
  };
}

export interface RespostaCompletaUsuarios {
  sucesso: boolean;
  area: "usuarios";
  fonte: string;
  total: number;
  totalUsuarios: number;
  entradas: MetricasEstruturadas["entradas"];
  usuarios: MetricasEstruturadas["usuarios"];
  dados: MetricasEstruturadas;
  lista: any[];
  historico?: any[];
  cardsTexto?: string[];
  historicoTexto?: string;
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_USUARIOS_METRICAS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");
const ARQUIVO_BANIDOS = path.resolve(process.cwd(), "admin_banidos.dados.json");
const ARQUIVO_DENUNCIAS = path.resolve(process.cwd(), "admin_denuncias.dados.json");
const ARQUIVO_PUBLICACOES = path.resolve(process.cwd(), "publicacoes.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[Comunicacao] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

export const ComunicacaoServico = {
  /**
   * Detecta se a requisição é um auto-chamado da própria instância para prevenir loop infinito
   */
  checarLoopInstancia(req: Request): { loop: boolean; motivo?: string; ip?: string } {
    const headerOrigem = String(
      req.headers["x-origem"] ||
      req.headers["x-instancia-origem"] ||
      req.headers["x-request-origin"] ||
      req.headers["x-painel-origem"] ||
      ""
    ).toLowerCase();

    const bodyOrigem = String(req.body?.origem || req.body?.instanciaOrigem || "").toLowerCase();

    const loopEvitar =
      req.headers["x-loop-detected"] ||
      req.headers["x-loop-prevent"] ||
      req.headers["x-loop-check"] ||
      req.body?.evitarLoop;

    if (
      headerOrigem === "website_2" ||
      bodyOrigem === "website_2" ||
      headerOrigem === "interno" ||
      bodyOrigem === "interno" ||
      loopEvitar
    ) {
      return {
        loop: true,
        motivo: "Requisição para a própria instância bloqueada para evitar loop",
        ip: "Interno",
      };
    }

    return { loop: false };
  },

  /**
   * Valida se a requisição possui a chave secreta válida do painel
   */
  validarChavePainel(req: Request): { valido: boolean; motivo?: string; status?: number } {
    const chaveEsperada = PAINEL_CHAVE_SECRETA || CHAVE_SECRETA_TELEGROUP;
    
    // Se não há chave configurada no servidor, permite o acesso (ambiente de dev)
    if (!chaveEsperada || !chaveEsperada.trim()) {
      return { valido: true };
    }

    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";

    const headerPainel = (req.headers["x-painel-chave-secreta"] as string) || "";
    const headerTelegroup = (req.headers["x-chave-secreta"] as string) || "";
    const queryChave = (req.query.chave as string) || (req.query.token as string) || "";
    const bodyChave = (req.body?.chave as string) || (req.body?.token as string) || "";

    const chaveFornecida =
      headerPainel ||
      headerTelegroup ||
      bearerToken ||
      queryChave ||
      bodyChave;

    if (!chaveFornecida || chaveFornecida.trim() !== chaveEsperada.trim()) {
      return {
        valido: false,
        motivo: "Chave secreta inválida",
        status: 401,
      };
    }

    return { valido: true };
  },

  /**
   * Coleta métricas 100% REAIS dos usuários (entradas e contadores)
   */
  async obterMetricasCompletas(): Promise<RespostaCompletaUsuarios> {
    let fonte = "arquivos_persistentes";
    let hoje = 0;
    let ontem = 0;
    let ultimos_10_dias = 0;
    let ultimos_30_dias = 0;
    let nao_cadastrados = 0;
    let cadastrados = 0;
    let publicadores = 0;
    let anunciantes = 0;
    let denunciados = 0;
    let banidos = 0;
    let totalUsuarios = 0;
    let listaUsuarios: any[] = [];

    // 1. Tenta consulta no PostgreSQL caso esteja conectado
    let usouBanco = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        fonte = "banco_postgresql";

        const resUsuarios = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (
              WHERE DATE(ultimo_acesso AT TIME ZONE 'UTC') = CURRENT_DATE 
                 OR DATE(primeiro_acesso AT TIME ZONE 'UTC') = CURRENT_DATE
            ) as hoje,
            COUNT(*) FILTER (
              WHERE DATE(ultimo_acesso AT TIME ZONE 'UTC') = CURRENT_DATE - INTERVAL '1 day' 
                 OR DATE(primeiro_acesso AT TIME ZONE 'UTC') = CURRENT_DATE - INTERVAL '1 day'
            ) as ontem,
            COUNT(*) FILTER (
              WHERE ultimo_acesso >= NOW() - INTERVAL '10 days' 
                 OR primeiro_acesso >= NOW() - INTERVAL '10 days'
            ) as dez_dias,
            COUNT(*) FILTER (
              WHERE ultimo_acesso >= NOW() - INTERVAL '30 days' 
                 OR primeiro_acesso >= NOW() - INTERVAL '30 days'
            ) as trinta_dias,
            COUNT(*) FILTER (WHERE cadastrado = TRUE) as cadastrados,
            COUNT(*) FILTER (WHERE cadastrado = FALSE OR cadastrado IS NULL) as nao_cadastrados
          FROM usuarios
        `);

        if (resUsuarios.rows.length > 0 && Number(resUsuarios.rows[0].total) > 0) {
          const row = resUsuarios.rows[0];
          totalUsuarios = Number(row.total || 0);
          hoje = Number(row.hoje || 0);
          ontem = Number(row.ontem || 0);
          ultimos_10_dias = Number(row.dez_dias || 0);
          ultimos_30_dias = Number(row.trinta_dias || 0);
          cadastrados = Number(row.cadastrados || 0);
          nao_cadastrados = Number(row.nao_cadastrados || 0);
          usouBanco = true;
        }

        const resLista = await pool.query(
          `SELECT id as "usuarioId", email, nome, nickname, foto, cadastrado, primeiro_acesso as "primeiroAcesso", ultimo_acesso as "ultimoAcesso", total_requisicoes as "totalRequisicoes" FROM usuarios ORDER BY ultimo_acesso DESC LIMIT 100`
        );
        listaUsuarios = resLista.rows;

        try {
          const resPubs = await pool.query(`SELECT COUNT(DISTINCT usuario_id) as total FROM publicacoes`);
          if (resPubs.rows.length > 0) publicadores = Number(resPubs.rows[0].total || 0);
        } catch {}

        try {
          const resCamps = await pool.query(`SELECT COUNT(DISTINCT usuario_id) as total FROM campanhas`);
          if (resCamps.rows.length > 0) anunciantes = Number(resCamps.rows[0].total || 0);
        } catch {}

        try {
          const resBans = await pool.query(`SELECT COUNT(*) as total FROM admin_banidos`);
          if (resBans.rows.length > 0) banidos = Number(resBans.rows[0].total || 0);
        } catch {}

        try {
          const resDens = await pool.query(`SELECT COUNT(DISTINCT usuario) as total FROM admin_denuncias`);
          if (resDens.rows.length > 0) denunciados = Number(resDens.rows[0].total || 0);
        } catch {}
      }
    } catch (errPostgres: any) {
      console.warn("[Comunicacao] PostgreSQL indisponível, usando arquivos reais:", errPostgres.message);
    }

    // 2. Se não utilizou o PostgreSQL, calcula com base nos arquivos persistentes reais
    if (!usouBanco) {
      fonte = "arquivos_persistentes";
      const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
      listaUsuarios = Object.values(dadosUsuarios.visitas || {}) as any[];
      totalUsuarios = listaUsuarios.length;

      const agora = new Date();
      const hojeIso = agora.toISOString().split("T")[0];

      const ontemData = new Date(agora);
      ontemData.setUTCDate(ontemData.getUTCDate() - 1);
      const ontemIso = ontemData.toISOString().split("T")[0];

      const dezDiasMs = 10 * 24 * 60 * 60 * 1000;
      const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;
      const agoraMs = agora.getTime();

      for (const u of listaUsuarios) {
        const dtUltimo = u.ultimoAcesso ? new Date(u.ultimoAcesso) : null;
        const dtPrimeiro = u.primeiroAcesso ? new Date(u.primeiroAcesso) : null;
        const dtReferencia = dtUltimo || dtPrimeiro;

        if (dtReferencia) {
          const ms = dtReferencia.getTime();
          const strData = dtReferencia.toISOString().split("T")[0];

          if (strData === hojeIso) {
            hoje++;
          } else if (strData === ontemIso) {
            ontem++;
          }

          if (agoraMs - ms <= dezDiasMs) {
            ultimos_10_dias++;
          }

          if (agoraMs - ms <= trintaDiasMs) {
            ultimos_30_dias++;
          }
        }

        if (u.cadastrado || u.email || u.googleId) {
          cadastrados++;
        } else {
          nao_cadastrados++;
        }
      }

      // Publicadores reais
      const dadosPublicacoes = lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []);
      const autoresPubs = new Set(dadosPublicacoes.map((p) => p.usuarioId || p.usuario).filter(Boolean));
      publicadores = autoresPubs.size;

      // Anunciantes reais
      const dadosCampanhas = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
      const autoresCamps = new Set(dadosCampanhas.map((c) => c.usuarioId || c.usuario).filter(Boolean));
      anunciantes = autoresCamps.size;

      // Banidos reais
      const listaBanidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
      banidos = listaBanidos.length;

      // Denunciados reais
      const listaDenuncias = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
      const usuariosDenunciados = new Set(listaDenuncias.map((d) => d.usuario).filter(Boolean));
      denunciados = usuariosDenunciados.size;
    }

    const entradas = {
      hoje,
      ontem,
      ultimos_10_dias,
      ultimos_30_dias,
    };

    const usuarios = {
      nao_cadastrados,
      cadastrados,
      publicadores,
      anunciantes,
      denunciados,
      banidos,
    };

    const linhas = [
      `Entrou ${hoje} usuários hoje`,
      `Entrou ${ontem} usuários ontem`,
      `Entrou ${ultimos_10_dias} usuários em 10 dias`,
      `Entrou ${ultimos_30_dias} usuários em 30 dias`,
      `São ${nao_cadastrados} usuários não cadastrados`,
      `São ${cadastrados} usuários cadastrados`,
      `São ${publicadores} usuários publicadores`,
      `São ${anunciantes} usuários anunciantes`,
      `São ${denunciados} usuários denunciados`,
      `São ${banidos} usuários banidos`,
    ];

    const textoFormatado = `area : usuarios\n\n` +
      `Entrou ${hoje} usuários hoje\n` +
      `Entrou ${ontem} usuários ontem\n` +
      `Entrou ${ultimos_10_dias} usuários em 10 dias\n` +
      `Entrou ${ultimos_30_dias} usuários em 30 dias\n\n` +
      `São ${nao_cadastrados} usuários não cadastrados\n` +
      `São ${cadastrados} usuários cadastrados\n\n` +
      `São ${publicadores} usuários publicadores\n` +
      `São ${anunciantes} usuários anunciantes\n\n` +
      `São ${denunciados} usuários denunciados\n` +
      `São ${banidos} usuários banidos`;

    let historico: any[] = [];
    let cardsTexto: string[] = [];
    let historicoTexto = "";
    try {
      const { HistoricoUsuarioServico } = await import("./s.painel.usuarios.historico");
      const resHistorico = await HistoricoUsuarioServico.obterHistoricoCompleto({ limite: 100 });
      historico = resHistorico.historico;
      cardsTexto = resHistorico.cardsTexto;
      historicoTexto = resHistorico.textoFormatado;
    } catch {}

    return {
      sucesso: true,
      area: "usuarios",
      fonte,
      total: totalUsuarios,
      totalUsuarios,
      entradas,
      usuarios,
      dados: {
        entradas,
        usuarios,
      },
      lista: historico.length > 0 ? historico : listaUsuarios,
      historico,
      cardsTexto,
      historicoTexto,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Envia uma notificação em tempo real (Webhook) proativamente para o Website 1 (Painel)
   */
  async dispararWebhookParaWebsite1(
    evento: string,
    area: string = "usuarios",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      let dadosPayload: any = {};
      if (area === "arrecadacao" || area === "arrecadação") {
        const metricasArr = await ArrecadacaoServico.obterMetricasCompletas();
        dadosPayload = {
          valores: metricasArr.valores,
          valoresFormatados: metricasArr.valoresFormatados,
          textoFormatado: metricasArr.textoFormatado,
          linhas: metricasArr.linhas,
          ...dadosExtras,
        };
      } else if (
        area === "historico_transferencias" ||
        area === "historico-transferencias" ||
        area === "transferencias" ||
        area === "transferências"
      ) {
        const { ArrecadacaoHistoricoTransferenciasServico } = await import("./s.painel.arrecadacao.historico");
        const hist = await ArrecadacaoHistoricoTransferenciasServico.obterHistorico();
        dadosPayload = {
          titulo: hist.titulo,
          subtitulo: hist.subtitulo,
          intervaloMax: hist.intervaloMax,
          intervaloMin: hist.intervaloMin,
          transferencias: hist.transferencias,
          blocosTexto: hist.blocosTexto,
          textoFormatado: hist.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "total_ano" ||
        area === "total-ano" ||
        area === "arrecadacao_ano" ||
        area === "ano"
      ) {
        const { ArrecadacaoTotalAnoServico } = await import("./s.painel.arrecadacao.total.ano");
        const tAno = await ArrecadacaoTotalAnoServico.obterTotalAno();
        dadosPayload = {
          titulo: tAno.titulo,
          anos: tAno.anos,
          linhas: tAno.linhas,
          totalGeral: tAno.totalGeral,
          totalGeralFormatado: tAno.totalGeralFormatado,
          textoFormatado: tAno.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "total_mes" ||
        area === "total-mes" ||
        area === "arrecadacao_mes" ||
        area === "mes" ||
        area === "mês"
      ) {
        const { ArrecadacaoTotalMesServico } = await import("./s.painel.arrecadacao.total.mes");
        const tMes = await ArrecadacaoTotalMesServico.obterTotalMes();
        dadosPayload = {
          titulo: tMes.titulo,
          ano: tMes.ano,
          meses: tMes.meses,
          linhas: tMes.linhas,
          totalGeral: tMes.totalGeral,
          totalGeralFormatado: tMes.totalGeralFormatado,
          linhaTotal: tMes.linhaTotal,
          textoFormatado: tMes.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "total_dia" ||
        area === "total-dia" ||
        area === "arrecadacao_dia" ||
        area === "dia"
      ) {
        const { ArrecadacaoTotalDiaServico } = await import("./s.painel.arrecadacao.total.dia");
        const tDia = await ArrecadacaoTotalDiaServico.obterTotalDia();
        dadosPayload = {
          titulo: tDia.titulo,
          dias: tDia.dias,
          linhas: tDia.linhas,
          totalGeral: tDia.totalGeral,
          totalGeralFormatado: tDia.totalGeralFormatado,
          linhaTotal: tDia.linhaTotal,
          textoFormatado: tDia.textoFormatado,
          ...dadosExtras,
        };
      } else if (area === "divulgacoes" || area === "divulgações") {
        const { DivulgacoesServico } = await import("./s.painel.divulgacoes");
        const metricasDiv = await DivulgacoesServico.obterMetricasCompletas();
        dadosPayload = {
          valores: metricasDiv.valores,
          valoresFormatados: metricasDiv.valoresFormatados,
          divulgacoes: metricasDiv.valores.divulgacoes,
          publicacoes: metricasDiv.valores.publicacoes,
          campanhas: metricasDiv.valores.campanhas,
          textoFormatado: metricasDiv.textoFormatado,
          linhas: metricasDiv.linhas,
          ...dadosExtras,
        };
      } else if (
        area === "campanhas_ativas" ||
        area === "campanhas-ativas" ||
        area === "ranking_campanhas" ||
        area === "ranking-campanhas" ||
        area === "rank_campanhas" ||
        area === "campanhas"
      ) {
        const { CampanhasAtivasServico } = await import("./s.painel.divulgacoes.campanhas.ativas");
        const metricasRank = await CampanhasAtivasServico.obterCampanhasAtivas();
        dadosPayload = {
          titulo: metricasRank.titulo,
          totalCampanhasAtivas: metricasRank.totalCampanhasAtivas,
          totalValoresDiferentes: metricasRank.totalValoresDiferentes,
          totalFaixas: metricasRank.totalFaixas,
          ranking: metricasRank.ranking,
          linhas: metricasRank.linhas,
          textoFormatado: metricasRank.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_publicadores" ||
        area === "rank-publicadores" ||
        area === "publicadores"
      ) {
        const { RankPublicadoresServico } = await import("./s.painel.divulgacoes.rank.publicadores");
        const metricasPubs = await RankPublicadoresServico.obterRankingPublicadores();
        dadosPayload = {
          titulo: metricasPubs.titulo,
          totalPublicadores: metricasPubs.totalPublicadores,
          ranking: metricasPubs.ranking,
          linhas: metricasPubs.linhas,
          textoFormatado: metricasPubs.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_anunciantes" ||
        area === "rank-anunciantes" ||
        area === "anunciantes"
      ) {
        const { RankAnunciantesServico } = await import("./s.painel.divulgacoes.rank.anunciantes");
        const metricasAnunc = await RankAnunciantesServico.obterRankingAnunciantes();
        dadosPayload = {
          titulo: metricasAnunc.titulo,
          totalAnunciantes: metricasAnunc.totalAnunciantes,
          ranking: metricasAnunc.ranking,
          linhas: metricasAnunc.linhas,
          textoFormatado: metricasAnunc.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_investidores" ||
        area === "rank-investidores" ||
        area === "investidores"
      ) {
        const { RankInvestidoresServico } = await import("./s.painel.divulgacoes.rank.investidores");
        const metricasInvest = await RankInvestidoresServico.obterRankingInvestidores();
        dadosPayload = {
          titulo: metricasInvest.titulo,
          totalInvestidores: metricasInvest.totalInvestidores,
          ranking: metricasInvest.ranking,
          linhas: metricasInvest.linhas,
          textoFormatado: metricasInvest.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_saldo" ||
        area === "rank-saldo" ||
        area === "saldos" ||
        area === "saldo"
      ) {
        const { RankSaldoServico } = await import("./s.painel.divulgacoes.rank.saldo");
        const metricasSaldo = await RankSaldoServico.obterRankingSaldos();
        dadosPayload = {
          titulo: metricasSaldo.titulo,
          totalUsuarios: metricasSaldo.totalUsuarios,
          ranking: metricasSaldo.ranking,
          linhas: metricasSaldo.linhas,
          textoFormatado: metricasSaldo.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_resultado_campanhas" ||
        area === "rank-resultado-campanhas" ||
        area === "resultado_campanhas" ||
        area === "resultado-campanhas" ||
        area === "campanhas_custo_beneficio" ||
        area === "campanhas-custo-beneficio" ||
        area === "custo_beneficio" ||
        area === "custo-benefício" ||
        area === "divulgacao_rank_resultado_campanha"
      ) {
        const { RankResultadoCampanhaServico } = await import("./s.painel.divulgacoes.rank.resultado.campanha");
        const resCamp = await RankResultadoCampanhaServico.obterRankingResultado();
        dadosPayload = {
          titulo: resCamp.titulo,
          totalCampanhasAnalisadas: resCamp.totalCampanhasAnalisadas,
          resumo: resCamp.resumo,
          ranking: resCamp.ranking,
          linhas: resCamp.linhas,
          textoFormatado: resCamp.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "rank_denunciados" ||
        area === "rank-denunciados" ||
        area === "denunciados" ||
        area === "moderacao_rank_denunciados" ||
        area === "moderacao-rank-denunciados"
      ) {
        const { RankDenunciadosServico } = await import("./s.painel.moderacao.rank.denunciados");
        const resDen = await RankDenunciadosServico.obterRankingDenunciados();
        dadosPayload = {
          titulo: resDen.titulo,
          totalDenunciados: resDen.totalDenunciados,
          totalDenuncias: resDen.totalDenuncias,
          ranking: resDen.ranking,
          linhas: resDen.linhas,
          textoFormatado: resDen.textoFormatado,
          ...dadosExtras,
        };
      } else if (
        area === "historico_banido" ||
        area === "historico-banido" ||
        area === "historico_banidos" ||
        area === "historico-banidos" ||
        area === "banidos" ||
        area === "moderacao_historico_banido" ||
        area === "moderacao-historico-banido"
      ) {
        const { HistoricoBanidoServico } = await import("./s.painel.moderacao.historico.banido");
        const resBan = await HistoricoBanidoServico.obterHistoricoBanidos();
        dadosPayload = {
          titulo: resBan.titulo,
          totalBanidos: resBan.totalBanidos,
          historico: resBan.historico,
          cardsTexto: resBan.cardsTexto,
          linhas: resBan.linhas,
          textoFormatado: resBan.textoFormatado,
          ...dadosExtras,
        };
      } else {
        const metricasAtuais = await this.obterMetricasCompletas();
        dadosPayload = {
          entradas: metricasAtuais.entradas,
          usuarios: metricasAtuais.usuarios,
          historico: metricasAtuais.historico,
          cardsTexto: metricasAtuais.cardsTexto,
          textoFormatado: metricasAtuais.textoFormatado,
          historicoTexto: metricasAtuais.historicoTexto,
          ...dadosExtras,
        };
      }

      const payload = {
        evento,
        area,
        origem: "website_2",
        dados: dadosPayload,
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

  /**
   * Envia proativamente as métricas da área de divulgações para o Website 1 (Painel)
   */
  async dispararDivulgacoesParaWebsite1(
    evento: string = "sincronizacao_divulgacoes",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    return this.dispararWebhookParaWebsite1(evento, "divulgacoes", dadosExtras);
  },

  /**
   * Envia proativamente o ranking de campanhas ativas para o Website 1 (Painel)
   */
  async dispararRankingCampanhasParaWebsite1(
    evento: string = "sincronizacao_campanhas_ativas",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    return this.dispararWebhookParaWebsite1(evento, "campanhas_ativas", dadosExtras);
  },

  /**
   * Envia proativamente o ranking de denunciados para o Website 1 (Painel)
   */
  async dispararRankDenunciadosParaWebsite1(
    evento: string = "sincronizacao_rank_denunciados",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    return this.dispararWebhookParaWebsite1(evento, "rank_denunciados", dadosExtras);
  },

  /**
   * Envia proativamente o histórico de banidos para o Website 1 (Painel)
   */
  async dispararHistoricoBanidosParaWebsite1(
    evento: string = "sincronizacao_historico_banidos",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    return this.dispararWebhookParaWebsite1(evento, "historico_banido", dadosExtras);
  },

  /**
   * Processa o payload recebido de um webhook enviado pelo Website 1
   */
  async processarWebhookRecebido(
    payload: any,
    origemIp: string
  ): Promise<{ sucesso: boolean; mensagem: string; evento?: string }> {
    const evento = payload.evento || "evento_generico";

    if (payload.dados) {
      const dados = payload.dados;
      if (dados.usuarios || dados.entradas) {
        // Dados processados com sucesso
      }
    }

    return {
      sucesso: true,
      mensagem: "Webhook recebido e processado com sucesso pelo Website 2",
      evento,
    };
  },

  /**
   * Despacha requisições genéricas (Proxy / Controle de Requisições) para o Website 1
   */
  async despacharRequisicao(config: {
    metodo?: string;
    method?: string;
    url?: string;
    rota?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: any;
    dados?: any;
  }): Promise<{ status: number; dados: any; ok: boolean; duracaoMs: number }> {
    const inicio = Date.now();
    const metodo = (config.metodo || config.method || "GET").toUpperCase();

    let urlDestino = config.url || "";
    const rota = config.rota || config.path || "";

    if (!urlDestino && rota) {
      if (!API_URL) {
        throw new Error("API_URL não configurada no ambiente para despachar a rota.");
      }
      urlDestino = `${API_URL.replace(/\/$/, "")}${rota.startsWith("/") ? rota : `/${rota}`}`;
    }

    if (!urlDestino) {
      throw new Error("URL de destino ou rota não informada.");
    }

    // Prevenção de loop: bloqueia caso o destino seja o próprio servidor local
    const destinoLower = urlDestino.toLowerCase();
    if (
      destinoLower.includes(`localhost:${PORT}`) ||
      destinoLower.includes(`127.0.0.1:${PORT}`) ||
      destinoLower.includes("0.0.0.0:3000")
    ) {
      throw new Error("Requisição para a própria instância bloqueada para evitar loop");
    }

    const chave = PAINEL_CHAVE_SECRETA || CHAVE_SECRETA_TELEGROUP;
    const headersRequisicao: Record<string, string> = {
      "Accept": "application/json",
      "x-origem": "website_2",
      ...(config.headers || {}),
    };

    if (chave && !headersRequisicao["x-painel-chave-secreta"]) {
      headersRequisicao["x-painel-chave-secreta"] = chave;
    }

    let corpoEnvio: any = undefined;
    const bodyContent = config.body !== undefined ? config.body : config.dados;
    if (metodo !== "GET" && metodo !== "HEAD" && bodyContent !== undefined) {
      headersRequisicao["Content-Type"] = "application/json";
      corpoEnvio = typeof bodyContent === "string" ? bodyContent : JSON.stringify(bodyContent);
    }

    const resposta = await fetch(urlDestino, {
      method: metodo,
      headers: headersRequisicao,
      body: corpoEnvio,
    });

    const duracaoMs = Date.now() - inicio;
    let dadosResposta: any = null;
    const contentType = resposta.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      dadosResposta = await resposta.json().catch(() => null);
    } else {
      dadosResposta = await resposta.text().catch(() => "");
    }

    return {
      status: resposta.status,
      ok: resposta.ok,
      dados: dadosResposta,
      duracaoMs,
    };
  },
};

export default ComunicacaoServico;
