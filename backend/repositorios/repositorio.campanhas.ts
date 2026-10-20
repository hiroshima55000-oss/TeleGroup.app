import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import {
  Campanha,
  StatusCampanha,
  DDL_TABELA_CAMPANHAS,
} from "../schemas/schema.campanhas";

const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");

function lerCampanhas(): Campanha[] {
  try {
    if (fs.existsSync(ARQUIVO_CAMPANHAS)) {
      const conteudo = fs.readFileSync(ARQUIVO_CAMPANHAS, "utf-8");
      return JSON.parse(conteudo || "[]");
    }
  } catch (err) {
    console.warn("[RepositorioCampanhas] Falha ao ler campanhas.dados.json:", err);
  }
  return [];
}

function salvarCampanhas(lista: Campanha[]): void {
  try {
    fs.writeFileSync(ARQUIVO_CAMPANHAS, JSON.stringify(lista, null, 2), "utf-8");
  } catch (err) {
    console.error("[RepositorioCampanhas] Falha ao salvar campanhas.dados.json:", err);
  }
}

export const RepositorioCampanhas = {
  /**
   * Inicializa a tabela de campanhas no PostgreSQL
   */
  async inicializarTabelas(): Promise<void> {
    const status = await obterStatusBanco();
    if (!status.conectado) return;
    try {
      await pool.query(DDL_TABELA_CAMPANHAS);
      console.log("📦 [RepositorioCampanhas] Tabela de campanhas verificada no PostgreSQL.");
    } catch (err: any) {
      console.warn("⚠️ [RepositorioCampanhas] Aviso na inicialização de tabela:", err.message);
    }
  },

  /**
   * Busca todas as campanhas com filtros opcionais
   */
  async buscarTodas(filtros: {
    usuarioId?: string;
    busca?: string;
    status?: string;
  } = {}): Promise<Campanha[]> {
    // 1. Tenta PostgreSQL se disponível
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        let querySql = `
          SELECT 
            id, usuario_id as "usuarioId", nome, texto, orcamento_diario as "orcamentoDiario",
            link, status, visualizacoes, cliques, gasto_total as "gastoTotal",
            alcance_estimado as "alcanceEstimado", data_criacao as "dataCriacao",
            codigo_pix as "codigoPix", categoria, data_inicio as "dataInicio",
            hora_inicio as "horaInicio", imagem, tags, saldo_creditos as "saldoCreditos",
            saldo_consumido as "saldoConsumido"
          FROM campanhas
          WHERE 1=1
        `;
        const params: any[] = [];
        let contador = 1;

        if (filtros.usuarioId) {
          querySql += ` AND usuario_id = $${contador++}`;
          params.push(filtros.usuarioId);
        }

        if (filtros.status) {
          querySql += ` AND status = $${contador++}`;
          params.push(filtros.status);
        }

        if (filtros.busca) {
          querySql += ` AND (LOWER(nome) LIKE $${contador} OR LOWER(texto) LIKE $${contador} OR LOWER(categoria) LIKE $${contador})`;
          params.push(`%${filtros.busca.toLowerCase()}%`);
          contador++;
        }

        querySql += " ORDER BY data_criacao DESC";
        const res = await pool.query(querySql, params);
        if (res.rows.length > 0) {
          return res.rows.map((row) => ({
            ...row,
            orcamentoDiario: Number(row.orcamentoDiario),
            gastoTotal: Number(row.gastoTotal),
            saldoCreditos: Number(row.saldoCreditos || 0),
            saldoConsumido: Number(row.saldoConsumido || 0),
          }));
        }
      }
    } catch {}

    // 2. Consulta no arquivo JSON persistente
    let lista = lerCampanhas();

    if (filtros.usuarioId) {
      lista = lista.filter((c) => c.usuarioId === filtros.usuarioId);
    }
    if (filtros.status) {
      lista = lista.filter((c) => c.status === filtros.status);
    }
    if (filtros.busca) {
      const b = filtros.busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.nome.toLowerCase().includes(b) ||
          (c.texto && c.texto.toLowerCase().includes(b)) ||
          (c.categoria && c.categoria.toLowerCase().includes(b))
      );
    }

    return lista;
  },

  /**
   * Busca uma campanha pelo seu identificador único
   */
  async buscarPorId(id: string): Promise<Campanha | null> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          `SELECT 
            id, usuario_id as "usuarioId", nome, texto, orcamento_diario as "orcamentoDiario",
            link, status, visualizacoes, cliques, gasto_total as "gastoTotal",
            alcance_estimado as "alcanceEstimado", data_criacao as "dataCriacao",
            codigo_pix as "codigoPix", categoria, data_inicio as "dataInicio",
            hora_inicio as "horaInicio", imagem, tags, saldo_creditos as "saldoCreditos",
            saldo_consumido as "saldoConsumido"
          FROM campanhas WHERE id = $1 LIMIT 1`,
          [id]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            ...row,
            orcamentoDiario: Number(row.orcamentoDiario),
            gastoTotal: Number(row.gastoTotal),
            saldoCreditos: Number(row.saldoCreditos || 0),
            saldoConsumido: Number(row.saldoConsumido || 0),
          };
        }
      }
    } catch {}

    const lista = lerCampanhas();
    return lista.find((c) => c.id === id) || null;
  },

  /**
   * Salva uma nova campanha
   */
  async salvar(campanha: Campanha): Promise<Campanha> {
    // 1. Tenta inserir no PostgreSQL
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `INSERT INTO campanhas (
            id, usuario_id, nome, texto, orcamento_diario, link, status,
            visualizacoes, cliques, gasto_total, alcance_estimado, data_criacao,
            codigo_pix, categoria, data_inicio, hora_inicio, imagem, tags,
            saldo_creditos, saldo_consumido
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            campanha.id,
            campanha.usuarioId,
            campanha.nome,
            campanha.texto || null,
            campanha.orcamentoDiario,
            campanha.link,
            campanha.status,
            campanha.visualizacoes || 0,
            campanha.cliques || 0,
            campanha.gastoTotal || 0,
            campanha.alcanceEstimado || 0,
            campanha.dataCriacao,
            campanha.codigoPix,
            campanha.categoria || "Geral",
            campanha.dataInicio || null,
            campanha.horaInicio || null,
            campanha.imagem || null,
            campanha.tags || [],
            campanha.saldoCreditos || 0,
            campanha.saldoConsumido || 0,
          ]
        );
      }
    } catch (err: any) {
      console.warn("[RepositorioCampanhas] Falha ao salvar no PostgreSQL:", err.message);
    }

    // 2. Salva no JSON persistente
    const lista = lerCampanhas();
    lista.unshift(campanha);
    salvarCampanhas(lista);

    return campanha;
  },

  /**
   * Atualiza o status de uma campanha
   */
  async atualizarStatus(id: string, status: StatusCampanha): Promise<Campanha | null> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query("UPDATE campanhas SET status = $1 WHERE id = $2", [status, id]);
      }
    } catch {}

    const lista = lerCampanhas();
    const index = lista.findIndex((c) => c.id === id);
    if (index === -1) return null;

    lista[index].status = status;
    salvarCampanhas(lista);
    return lista[index];
  },

  /**
   * Remove uma campanha pelo ID
   */
  async excluir(id: string): Promise<boolean> {
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query("DELETE FROM campanhas WHERE id = $1", [id]);
      }
    } catch {}

    let lista = lerCampanhas();
    const tamanhoOriginal = lista.length;
    lista = lista.filter((c) => c.id !== id);

    if (lista.length !== tamanhoOriginal) {
      salvarCampanhas(lista);
      return true;
    }
    return false;
  },
};

export default RepositorioCampanhas;
