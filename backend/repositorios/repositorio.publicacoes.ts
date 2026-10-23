import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import {
  Publicacao,
  FiltrosPublicacoes,
  DDL_TABELA_PUBLICACOES,
} from "../schemas/schema.publicacoes";

const ARQUIVO_PUBLICACOES = path.resolve(process.cwd(), "publicacoes.dados.json");

let cachePublicacoes: Publicacao[] | null = null;
let timerSalvarPublicacoes: NodeJS.Timeout | null = null;

function lerPublicacoes(): Publicacao[] {
  if (cachePublicacoes) {
    return cachePublicacoes;
  }
  try {
    if (fs.existsSync(ARQUIVO_PUBLICACOES)) {
      const conteudo = fs.readFileSync(ARQUIVO_PUBLICACOES, "utf-8");
      cachePublicacoes = JSON.parse(conteudo || "[]");
      return cachePublicacoes || [];
    }
  } catch (err) {
    console.warn("[RepositorioPublicacoes] Falha ao ler publicacoes.dados.json:", err);
  }
  cachePublicacoes = [];
  return cachePublicacoes;
}

function salvarPublicacoes(lista: Publicacao[]): void {
  cachePublicacoes = lista;
  if (timerSalvarPublicacoes) {
    clearTimeout(timerSalvarPublicacoes);
  }
  timerSalvarPublicacoes = setTimeout(() => {
    try {
      fs.writeFileSync(ARQUIVO_PUBLICACOES, JSON.stringify(lista, null, 2), "utf-8");
    } catch (err) {
      console.error("[RepositorioPublicacoes] Falha ao salvar publicacoes.dados.json:", err);
    }
  }, 100);
}

export const RepositorioPublicacoes = {
  /**
   * Inicializa a tabela de publicações no PostgreSQL
   */
  async inicializarTabelas(): Promise<void> {
    const status = await obterStatusBanco();
    if (!status.conectado) return;
    try {
      await pool.query(DDL_TABELA_PUBLICACOES);
      console.log("📦 [RepositorioPublicacoes] Tabela de publicações verificada no PostgreSQL.");
    } catch (err: any) {
      console.warn("⚠️ [RepositorioPublicacoes] Aviso na inicialização de tabela:", err.message);
    }
  },

  /**
   * Busca publicações aplicando paginação e filtros
   */
  async buscarComFiltros(filtros: FiltrosPublicacoes = {}): Promise<{
    itens: Publicacao[];
    total: number;
    categorias: string[];
  }> {
    const pagina = Math.max(1, filtros.pagina || 1);
    const limite = Math.max(1, filtros.limite || 15);
    const offset = (pagina - 1) * limite;

    // 1. Tenta consulta no PostgreSQL
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        let whereSql = " WHERE 1=1";
        const params: any[] = [];
        let contador = 1;

        if (filtros.apenasMinhas && filtros.usuarioId) {
          whereSql += ` AND usuario_id = $${contador++}`;
          params.push(filtros.usuarioId);
        }

        if (filtros.categoria && filtros.categoria !== "Todos") {
          whereSql += ` AND LOWER(categoria) = $${contador++}`;
          params.push(filtros.categoria.toLowerCase());
        }

        if (filtros.nicho && filtros.nicho !== "todos") {
          whereSql += ` AND (LOWER(nicho) = $${contador} OR LOWER(categoria) = $${contador})`;
          params.push(filtros.nicho.toLowerCase());
          contador++;
        }

        if (filtros.tag) {
          whereSql += ` AND $${contador++} = ANY(tags)`;
          params.push(filtros.tag.toLowerCase());
        }

        if (filtros.busca) {
          whereSql += ` AND (LOWER(nome) LIKE $${contador} OR LOWER(descricao) LIKE $${contador} OR LOWER(categoria) LIKE $${contador})`;
          params.push(`%${filtros.busca.toLowerCase()}%`);
          contador++;
        }

        const countRes = await pool.query(`SELECT COUNT(*) as total FROM publicacoes ${whereSql}`, params);
        const total = parseInt(countRes.rows[0]?.total || "0", 10);

        const dadosRes = await pool.query(
          `SELECT 
            id, usuario_id as "usuarioId", nome, categoria, descricao, link,
            imagens, tipo, destaque, is_anuncio as "isAnuncio", visualizacoes,
            likes, cliques, status, data_criacao as "dataCriacao", membros,
            tags, nicho, nome_nicho as "nomeNicho", icone_nicho as "iconeNicho"
          FROM publicacoes
          ${whereSql}
          ORDER BY destaque DESC, data_criacao DESC
          LIMIT $${contador++} OFFSET $${contador++}`,
          [...params, limite, offset]
        );

        const catRes = await pool.query("SELECT DISTINCT categoria FROM publicacoes WHERE categoria IS NOT NULL");
        const categorias = ["Todos", ...catRes.rows.map((r) => r.categoria)];

        return {
          itens: dadosRes.rows,
          total,
          categorias,
        };
      }
    } catch {}

    // 2. Consulta no arquivo JSON persistente
    let lista = lerPublicacoes();

    const categoriasSet = new Set<string>();
    lista.forEach((p) => {
      if (p.categoria) categoriasSet.add(p.categoria);
    });
    const categorias = ["Todos", ...Array.from(categoriasSet)];

    if (filtros.apenasMinhas && filtros.usuarioId) {
      lista = lista.filter((p) => p.usuarioId === filtros.usuarioId);
    }

    if (filtros.categoria && filtros.categoria !== "Todos") {
      lista = lista.filter((p) => p.categoria?.toLowerCase() === filtros.categoria!.toLowerCase());
    }

    if (filtros.nicho && filtros.nicho !== "todos") {
      const n = filtros.nicho.toLowerCase();
      lista = lista.filter((p) => p.nicho?.toLowerCase() === n || p.categoria?.toLowerCase() === n);
    }

    if (filtros.tag) {
      const t = filtros.tag.toLowerCase();
      lista = lista.filter((p) => Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(t)));
    }

    if (filtros.apenasComImagem) {
      lista = lista.filter((p) => Array.isArray(p.imagens) && p.imagens.length > 0);
    }

    if (filtros.busca) {
      const b = filtros.busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome?.toLowerCase().includes(b) ||
          p.descricao?.toLowerCase().includes(b) ||
          p.categoria?.toLowerCase().includes(b) ||
          (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(b)))
      );
    }

    const total = lista.length;
    const itens = lista.slice(offset, offset + limite);

    return { itens, total, categorias };
  },

  /**
   * Busca uma publicação por ID
   */
  async buscarPorId(id: string): Promise<Publicacao | null> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          `SELECT 
            id, usuario_id as "usuarioId", nome, categoria, descricao, link,
            imagens, tipo, destaque, is_anuncio as "isAnuncio", visualizacoes,
            likes, cliques, status, data_criacao as "dataCriacao", membros,
            tags, nicho, nome_nicho as "nomeNicho", icone_nicho as "iconeNicho"
          FROM publicacoes WHERE id = $1 LIMIT 1`,
          [id]
        );
        if (res.rows.length > 0) return res.rows[0];
      }
    } catch {}

    const lista = lerPublicacoes();
    return lista.find((p) => p.id === id) || null;
  },

  /**
   * Salva uma nova publicação
   */
  async salvar(publicacao: Publicacao): Promise<Publicacao> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `INSERT INTO publicacoes (
            id, usuario_id, nome, categoria, descricao, link,
            imagens, tipo, destaque, is_anuncio, visualizacoes,
            likes, cliques, status, data_criacao, membros,
            tags, nicho, nome_nicho, icone_nicho
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            publicacao.id,
            publicacao.usuarioId,
            publicacao.nome,
            publicacao.categoria,
            publicacao.descricao,
            publicacao.link,
            publicacao.imagens || [],
            publicacao.tipo,
            publicacao.destaque,
            Boolean(publicacao.isAnuncio),
            publicacao.visualizacoes || 0,
            publicacao.likes || 0,
            publicacao.cliques || 0,
            publicacao.status,
            publicacao.dataCriacao,
            publicacao.membros,
            publicacao.tags || [],
            publicacao.nicho || null,
            publicacao.nomeNicho || null,
            publicacao.iconeNicho || null,
          ]
        );
      }
    } catch (err: any) {
      console.warn("[RepositorioPublicacoes] Falha ao salvar no PostgreSQL:", err.message);
    }

    const lista = lerPublicacoes();
    lista.unshift(publicacao);
    salvarPublicacoes(lista);

    return publicacao;
  },

  /**
   * Atualiza número de curtidas (likes)
   */
  async incrementarCurtida(id: string, descurtir = false): Promise<number> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const delta = descurtir ? -1 : 1;
        const res = await pool.query(
          "UPDATE publicacoes SET likes = GREATEST(0, likes + $1) WHERE id = $2 RETURNING likes",
          [delta, id]
        );
        if (res.rows.length > 0) return res.rows[0].likes;
      }
    } catch {}

    const lista = lerPublicacoes();
    const item = lista.find((p) => p.id === id);
    if (!item) return 0;

    item.likes = descurtir ? Math.max(0, (item.likes || 1) - 1) : (item.likes || 0) + 1;
    salvarPublicacoes(lista);
    return item.likes;
  },

  /**
   * Incrementa visualizações
   */
  async incrementarVisualizacao(id: string): Promise<number> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          "UPDATE publicacoes SET visualizacoes = visualizacoes + 1 WHERE id = $1 RETURNING visualizacoes",
          [id]
        );
        if (res.rows.length > 0) return res.rows[0].visualizacoes;
      }
    } catch {}

    const lista = lerPublicacoes();
    const item = lista.find((p) => p.id === id);
    if (!item) return 0;

    item.visualizacoes = (item.visualizacoes || 0) + 1;
    salvarPublicacoes(lista);
    return item.visualizacoes;
  },

  /**
   * Incrementa cliques
   */
  async incrementarClique(id: string): Promise<number> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          "UPDATE publicacoes SET cliques = cliques + 1 WHERE id = $1 RETURNING cliques",
          [id]
        );
        if (res.rows.length > 0) return res.rows[0].cliques;
      }
    } catch {}

    const lista = lerPublicacoes();
    const item = lista.find((p) => p.id === id);
    if (!item) return 0;

    item.cliques = (item.cliques || 0) + 1;
    salvarPublicacoes(lista);
    return item.cliques;
  },

  /**
   * Remove uma publicação
   */
  async excluir(id: string): Promise<boolean> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query("DELETE FROM publicacoes WHERE id = $1", [id]);
      }
    } catch {}

    let lista = lerPublicacoes();
    const tamanhoOriginal = lista.length;
    lista = lista.filter((p) => p.id !== id);

    if (lista.length !== tamanhoOriginal) {
      salvarPublicacoes(lista);
      return true;
    }
    return false;
  },

  /**
   * Retorna todas as publicações cadastradas
   */
  async buscarTodas(): Promise<Publicacao[]> {
    const res = await this.buscarComFiltros({ limite: 10000 });
    return res.itens;
  },
};

export default RepositorioPublicacoes;
