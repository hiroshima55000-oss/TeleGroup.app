import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import {
  DDL_TABELAS_INTERESSES,
  PerfilInteresseBanco,
  RegistroInteracaoBanco,
} from "../schemas/schema.interesses";
import {
  PerfilInteresseUsuario,
  AfinidadeHashtag,
  GrupoInteressePercentual,
  ItemSequenciaSessao,
} from "../servicos/AlgoritmoOrganico/tipos.interesses";
import { RegistroInteracaoItem } from "./repositorio.interacoes.usuario";

const ARQUIVO_INTERESSES = path.resolve(process.cwd(), "usuarios_interesses.dados.json");
const ARQUIVO_INTERACOES = path.resolve(process.cwd(), "usuarios_interacoes_detalhadas.dados.json");

let cachePerfis: Record<string, PerfilInteresseUsuario> | null = null;
let timerSalvarPerfis: NodeJS.Timeout | null = null;

function lerPerfisArquivo(): Record<string, PerfilInteresseUsuario> {
  if (cachePerfis) {
    return cachePerfis;
  }
  try {
    if (fs.existsSync(ARQUIVO_INTERESSES)) {
      const conteudo = fs.readFileSync(ARQUIVO_INTERESSES, "utf-8");
      cachePerfis = JSON.parse(conteudo || "{}");
      return cachePerfis || {};
    }
  } catch (err) {
    console.warn("[RepositorioInteresses] Falha ao ler usuarios_interesses.dados.json:", err);
  }
  cachePerfis = {};
  return cachePerfis;
}

function salvarPerfisArquivo(dados: Record<string, PerfilInteresseUsuario>): void {
  cachePerfis = dados;
  if (timerSalvarPerfis) {
    clearTimeout(timerSalvarPerfis);
  }
  timerSalvarPerfis = setTimeout(() => {
    try {
      fs.writeFileSync(ARQUIVO_INTERESSES, JSON.stringify(dados, null, 2), "utf-8");
    } catch (err) {
      console.error("[RepositorioInteresses] Falha ao salvar usuarios_interesses.dados.json:", err);
    }
  }, 100);
}

function mapearLinhaParaPerfil(row: PerfilInteresseBanco): PerfilInteresseUsuario {
  const hashtags: Record<string, AfinidadeHashtag> =
    typeof row.hashtags === "string" ? JSON.parse(row.hashtags) : row.hashtags || {};
  const distribuicaoGrupos: GrupoInteressePercentual[] =
    typeof row.distribuicao_grupos === "string"
      ? JSON.parse(row.distribuicao_grupos)
      : row.distribuicao_grupos || [];
  const distribuicaoPercentual: Record<string, number> =
    typeof row.distribuicao_percentual === "string"
      ? JSON.parse(row.distribuicao_percentual)
      : row.distribuicao_percentual || {};
  const sequenciaSessao: ItemSequenciaSessao[] =
    typeof row.sequencia_sessao === "string"
      ? JSON.parse(row.sequencia_sessao)
      : row.sequencia_sessao || [];

  return {
    usuarioId: row.usuario_id,
    nickname: row.nickname || `@${row.usuario_id}`,
    totalInteracoes: Number(row.total_interacoes || 0),
    totalLikes: Number(row.total_likes || 0),
    totalCliques: Number(row.total_cliques || 0),
    totalVisualizacoes: Number(row.total_visualizacoes || 0),
    tempoRetencaoEstimadoSegundos: Number(row.tempo_retencao_segundos || 0),
    classificacaoPublico: (row.classificacao_publico as any) || "Passivo",
    taxaCliquesCTR: Number(row.taxa_cliques_ctr || 0),
    descricaoQualificacao: row.descricao_qualificacao || "",
    hashtags,
    distribuicaoGrupos,
    distribuicaoPercentual,
    sequenciaSessao,
    primeiraInteracao: row.primeira_interacao
      ? new Date(row.primeira_interacao).toISOString()
      : new Date().toISOString(),
    ultimaAtualizacao: row.ultima_atualizacao
      ? new Date(row.ultima_atualizacao).toISOString()
      : new Date().toISOString(),
  };
}

export const RepositorioInteresses = {
  /**
   * Inicializa as tabelas de interesses e interações no PostgreSQL
   */
  async inicializarTabelas(): Promise<void> {
    const status = await obterStatusBanco();
    if (!status.conectado) return;
    try {
      await pool.query(DDL_TABELAS_INTERESSES);
      console.log("📦 [RepositorioInteresses] Tabelas de interesses e interações verificadas no PostgreSQL.");
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Aviso na inicialização de tabelas:", err.message);
    }
  },

  /**
   * Salva ou atualiza perfil de interesses do usuário no banco de dados
   */
  async salvarPerfil(perfil: PerfilInteresseUsuario, dadosBaseDados: any = {}): Promise<void> {
    const idLimpo = (perfil.usuarioId || "usr_anonimo").trim();
    perfil.usuarioId = idLimpo;

    // 1. Persiste no banco de dados PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `INSERT INTO usuarios_interesses (
            usuario_id,
            nickname,
            total_interacoes,
            total_likes,
            total_cliques,
            total_visualizacoes,
            tempo_retencao_segundos,
            classificacao_publico,
            taxa_cliques_ctr,
            descricao_qualificacao,
            hashtags,
            distribuicao_grupos,
            distribuicao_percentual,
            sequencia_sessao,
            dados_base_dados,
            primeira_interacao,
            ultima_atualizacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16, NOW())
          ON CONFLICT (usuario_id) DO UPDATE SET
            nickname = EXCLUDED.nickname,
            total_interacoes = EXCLUDED.total_interacoes,
            total_likes = EXCLUDED.total_likes,
            total_cliques = EXCLUDED.total_cliques,
            total_visualizacoes = EXCLUDED.total_visualizacoes,
            tempo_retencao_segundos = EXCLUDED.tempo_retencao_segundos,
            classificacao_publico = EXCLUDED.classificacao_publico,
            taxa_cliques_ctr = EXCLUDED.taxa_cliques_ctr,
            descricao_qualificacao = EXCLUDED.descricao_qualificacao,
            hashtags = EXCLUDED.hashtags,
            distribuicao_grupos = EXCLUDED.distribuicao_grupos,
            distribuicao_percentual = EXCLUDED.distribuicao_percentual,
            sequencia_sessao = EXCLUDED.sequencia_sessao,
            dados_base_dados = EXCLUDED.dados_base_dados,
            ultima_atualizacao = NOW()`,
          [
            idLimpo,
            perfil.nickname || `@${idLimpo}`,
            perfil.totalInteracoes || 0,
            perfil.totalLikes || 0,
            perfil.totalCliques || 0,
            perfil.totalVisualizacoes || 0,
            perfil.tempoRetencaoEstimadoSegundos || 0,
            perfil.classificacaoPublico || "Passivo",
            perfil.taxaCliquesCTR || 0,
            perfil.descricaoQualificacao || "",
            JSON.stringify(perfil.hashtags || {}),
            JSON.stringify(perfil.distribuicaoGrupos || []),
            JSON.stringify(perfil.distribuicaoPercentual || {}),
            JSON.stringify(perfil.sequenciaSessao || []),
            JSON.stringify(dadosBaseDados || {}),
            perfil.primeiraInteracao || new Date().toISOString(),
          ]
        );
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao persistir perfil no PostgreSQL:", err.message);
    }

    // 2. Mantém sincronizado no arquivo JSON local para persistência redundante
    const arquivo = lerPerfisArquivo();
    arquivo[idLimpo] = perfil;
    salvarPerfisArquivo(arquivo);
  },

  /**
   * Obtém o perfil de interesses de um usuário do banco de dados PostgreSQL
   */
  async obterPerfil(usuarioId: string): Promise<PerfilInteresseUsuario | null> {
    const idLimpo = (usuarioId || "").trim();
    if (!idLimpo) return null;

    // 1. Tenta carregar do PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query<PerfilInteresseBanco>(
          `SELECT * FROM usuarios_interesses WHERE usuario_id = $1 LIMIT 1`,
          [idLimpo]
        );
        if (res.rows.length > 0) {
          const perfil = mapearLinhaParaPerfil(res.rows[0]);
          // Atualiza cache em memória
          const arquivo = lerPerfisArquivo();
          arquivo[idLimpo] = perfil;
          return perfil;
        }
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao buscar perfil no PostgreSQL:", err.message);
    }

    // 2. Consulta no arquivo JSON local se não encontrou no banco
    const arquivo = lerPerfisArquivo();
    return arquivo[idLimpo] || null;
  },

  /**
   * Obtém todos os perfis de interesses cadastrados no banco de dados
   */
  async obterTodosPerfis(): Promise<PerfilInteresseUsuario[]> {
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query<PerfilInteresseBanco>(
          `SELECT * FROM usuarios_interesses ORDER BY ultima_atualizacao DESC`
        );
        if (res.rows.length > 0) {
          return res.rows.map(mapearLinhaParaPerfil);
        }
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao listar perfis do PostgreSQL:", err.message);
    }

    const arquivo = lerPerfisArquivo();
    return Object.values(arquivo);
  },

  /**
   * Registra um evento individual de interação na tabela usuarios_interacoes no PostgreSQL
   */
  async registrarInteracaoBanco(evento: RegistroInteracaoItem): Promise<void> {
    const id = evento.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const usuarioId = (evento.usuarioId || "usr_anonimo").trim();
    const publicacaoId = (evento.publicacaoId || "").trim();
    const tipo = evento.tipo || "visualizacao";
    const tagsJson = JSON.stringify(evento.tags || []);
    const duracao = evento.duracaoSegundos || 0;

    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `INSERT INTO usuarios_interacoes (
            id, usuario_id, publicacao_id, tipo, tags, categoria, nicho, duracao_segundos, criado_em
          ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING`,
          [
            id,
            usuarioId,
            publicacaoId,
            tipo,
            tagsJson,
            evento.categoria || null,
            evento.nicho || null,
            duracao,
            evento.timestamp ? new Date(evento.timestamp) : new Date(),
          ]
        );
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao registrar interação no PostgreSQL:", err.message);
    }
  },

  /**
   * Obtém os eventos de interação de um usuário gravados no banco de dados
   */
  async obterInteracoesDoUsuarioBanco(
    usuarioId: string,
    limite = 5000
  ): Promise<RegistroInteracaoItem[]> {
    const uid = (usuarioId || "usr_anonimo").trim();
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query<RegistroInteracaoBanco>(
          `SELECT id, usuario_id, publicacao_id, tipo, tags, categoria, nicho, duracao_segundos, criado_em
           FROM usuarios_interacoes
           WHERE usuario_id = $1
           ORDER BY criado_em DESC
           LIMIT $2`,
          [uid, limite]
        );

        if (res.rows.length > 0) {
          return res.rows.map((r) => ({
            id: r.id,
            usuarioId: r.usuario_id,
            publicacaoId: r.publicacao_id,
            tipo: r.tipo as any,
            timestamp: new Date(r.criado_em).toISOString(),
            tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags || [],
            categoria: r.categoria,
            nicho: r.nicho,
            duracaoSegundos: r.duracao_segundos,
          }));
        }
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao consultar interações no PostgreSQL:", err.message);
    }

    return [];
  },

  /**
   * Migra interesses e interações de conta anônima para conta Google autenticada
   */
  async migrarInteressesBanco(
    idAnonimo: string,
    idFinal: string,
    novoNickname: string
  ): Promise<void> {
    const anonimo = (idAnonimo || "").trim();
    const final = (idFinal || "").trim();
    if (!anonimo || !final || anonimo === final) return;

    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        // 1. Atualiza interações registradas
        await pool.query(
          `UPDATE usuarios_interacoes SET usuario_id = $1 WHERE usuario_id = $2`,
          [final, anonimo]
        );

        // 2. Atualiza perfil de interesses se o final ainda não tiver
        await pool.query(
          `UPDATE usuarios_interesses 
           SET usuario_id = $1, nickname = $2, ultima_atualizacao = NOW()
           WHERE usuario_id = $3
           AND NOT EXISTS (SELECT 1 FROM usuarios_interesses WHERE usuario_id = $1)`,
          [final, novoNickname, anonimo]
        );

        // 3. Se ambos existiam, remove o anônimo antigo do banco
        await pool.query(`DELETE FROM usuarios_interesses WHERE usuario_id = $1`, [anonimo]);
      }
    } catch (err: any) {
      console.warn("⚠️ [RepositorioInteresses] Erro ao migrar interesses no PostgreSQL:", err.message);
    }
  },
};

export default RepositorioInteresses;
