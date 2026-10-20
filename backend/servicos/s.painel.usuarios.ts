import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import {
  PainelUsuariosHistoricoServico,
  ItemHistoricoUsuario,
} from "./s.painel.usuarios.historico";

export interface MetricasUsuariosEntradas {
  hoje: number;
  ontem: number;
  ultimos_10_dias: number;
  ultimos_30_dias: number;
}

export interface MetricasUsuariosStatus {
  nao_cadastrados: number;
  cadastrados: number;
  publicadores: number;
  anunciantes: number;
  denunciados: number;
  banidos: number;
}

export interface MetricasUsuariosValores {
  entradas: MetricasUsuariosEntradas;
  usuarios: MetricasUsuariosStatus;
}

export interface RespostaPainelUsuarios {
  sucesso: boolean;
  area: "usuarios";
  fonte: string;
  total: number;
  totalUsuarios: number;
  entradas: MetricasUsuariosEntradas;
  usuarios: MetricasUsuariosStatus;
  dados: MetricasUsuariosValores;
  metricas: {
    acessos: {
      hoje: number;
      ontem: number;
      em10Dias: number;
      em30Dias: number;
    };
    cadastro: {
      naoCadastrados: number;
      cadastrados: number;
    };
    papeis: {
      publicadores: number;
      anunciantes: number;
    };
    moderacao: {
      denunciados: number;
      banidos: number;
    };
  };
  hoje: number;
  ontem: number;
  em10Dias: number;
  em30Dias: number;
  naoCadastrados: number;
  cadastrados: number;
  publicadores: number;
  anunciantes: number;
  denunciados: number;
  banidos: number;
  lista: ItemHistoricoUsuario[];
  historico: ItemHistoricoUsuario[];
  cardsTexto: string[];
  historicoTexto: string;
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
    console.warn(`[PainelUsuarios] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

/**
 * Constrói as linhas de texto padronizadas para exibição no painel administrativo
 */
export function formatarLinhasMetricas(
  entradas: MetricasUsuariosEntradas,
  usuarios: MetricasUsuariosStatus
): string[] {
  return [
    `Entrou ${entradas.hoje} usuários hoje`,
    `Entrou ${entradas.ontem} usuários ontem`,
    `Entrou ${entradas.ultimos_10_dias} usuários em 10 dias`,
    `Entrou ${entradas.ultimos_30_dias} usuários em 30 dias`,
    `São ${usuarios.nao_cadastrados} usuários não cadastrados`,
    `São ${usuarios.cadastrados} usuários cadastrados`,
    `São ${usuarios.publicadores} usuários publicadores`,
    `São ${usuarios.anunciantes} usuários anunciantes`,
    `São ${usuarios.denunciados} usuários denunciados`,
    `São ${usuarios.banidos} usuários banidos`,
  ];
}

/**
 * Constrói o bloco de texto formatado completo da área de usuários
 */
export function formatarTextoMetricas(
  entradas: MetricasUsuariosEntradas,
  usuarios: MetricasUsuariosStatus
): string {
  return (
    `area : usuarios\n\n` +
    `Entrou ${entradas.hoje} usuários hoje\n` +
    `Entrou ${entradas.ontem} usuários ontem\n` +
    `Entrou ${entradas.ultimos_10_dias} usuários em 10 dias\n` +
    `Entrou ${entradas.ultimos_30_dias} usuários em 30 dias\n\n` +
    `São ${usuarios.nao_cadastrados} usuários não cadastrados\n` +
    `São ${usuarios.cadastrados} usuários cadastrados\n\n` +
    `São ${usuarios.publicadores} usuários publicadores\n` +
    `São ${usuarios.anunciantes} usuários anunciantes\n\n` +
    `São ${usuarios.denunciados} usuários denunciados\n` +
    `São ${usuarios.banidos} usuários banidos`
  );
}

export const PainelUsuariosServico = {
  /**
   * Consolida métricas 100% REAIS de usuários para o painel administrativo:
   * - Entradas: hoje, ontem, 10 dias, 30 dias
   * - Usuários: cadastrados, não cadastrados, publicadores, anunciantes, denunciados, banidos
   * - Histórico completo com cartões formatados
   */
  async obterMetricasCompletas(filtros: { busca?: string; limite?: number } = {}): Promise<RespostaPainelUsuarios> {
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
      console.warn("[PainelUsuarios] PostgreSQL indisponível, usando arquivos reais:", errPostgres.message);
    }

    // 2. Se não utilizou o PostgreSQL, calcula com base nos arquivos persistentes reais
    if (!usouBanco) {
      fonte = "arquivos_persistentes";
      const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
      const listaUsuarios = Object.values(dadosUsuarios.visitas || {}) as any[];
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
        if (u.cadastrado) {
          cadastrados++;
        } else {
          nao_cadastrados++;
        }

        const dataRef = u.ultimoAcesso || u.primeiroAcesso;
        if (dataRef) {
          const d = new Date(dataRef);
          const refIso = d.toISOString().split("T")[0];
          const diffMs = agoraMs - d.getTime();

          if (refIso === hojeIso) hoje++;
          if (refIso === ontemIso) ontem++;
          if (diffMs <= dezDiasMs) ultimos_10_dias++;
          if (diffMs <= trintaDiasMs) ultimos_30_dias++;
        }
      }

      // Publicadores
      const pubs = lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []);
      const setPublicadores = new Set(pubs.map((p) => p.usuarioId || p.usuario).filter(Boolean));
      publicadores = setPublicadores.size;

      // Anunciantes
      const camps = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
      const setAnunciantes = new Set(camps.map((c) => c.usuarioId || c.usuario).filter(Boolean));
      anunciantes = setAnunciantes.size;

      // Banidos
      const bans = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
      banidos = bans.length;

      // Denunciados
      const dens = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
      const setDenunciados = new Set(dens.map((d) => d.usuario || d.usuarioId || d.autor).filter(Boolean));
      denunciados = setDenunciados.size;
    }

    const entradas: MetricasUsuariosEntradas = {
      hoje,
      ontem,
      ultimos_10_dias,
      ultimos_30_dias,
    };

    const usuarios: MetricasUsuariosStatus = {
      nao_cadastrados,
      cadastrados,
      publicadores,
      anunciantes,
      denunciados,
      banidos,
    };

    const linhas = formatarLinhasMetricas(entradas, usuarios);
    const textoFormatado = formatarTextoMetricas(entradas, usuarios);

    // Carrega histórico de usuários formatado
    const resHistorico = await PainelUsuariosHistoricoServico.obterHistoricoCompleto({
      busca: filtros.busca,
      limite: filtros.limite || 100,
    });

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
      metricas: {
        acessos: {
          hoje,
          ontem,
          em10Dias: ultimos_10_dias,
          em30Dias: ultimos_30_dias,
        },
        cadastro: {
          naoCadastrados: nao_cadastrados,
          cadastrados,
        },
        papeis: {
          publicadores,
          anunciantes,
        },
        moderacao: {
          denunciados,
          banidos,
        },
      },
      hoje,
      ontem,
      em10Dias: ultimos_10_dias,
      em30Dias: ultimos_30_dias,
      naoCadastrados: nao_cadastrados,
      cadastrados,
      publicadores,
      anunciantes,
      denunciados,
      banidos,
      lista: resHistorico.historico,
      historico: resHistorico.historico,
      cardsTexto: resHistorico.cardsTexto,
      historicoTexto: resHistorico.textoFormatado,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Dispara proativamente as métricas atualizadas de usuários para o Website 1
   */
  async enviarParaPainel(): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    const { ComunicacaoServico } = await import("./s.painel.comunicacao");
    const metricas = await this.obterMetricasCompletas();
    return await ComunicacaoServico.dispararWebhookParaWebsite1("atualizacao_painel_usuarios", "usuarios", {
      total: metricas.total,
      entradas: metricas.entradas,
      usuarios: metricas.usuarios,
      linhas: metricas.linhas,
      textoFormatado: metricas.textoFormatado,
    });
  },
};

export default PainelUsuariosServico;
