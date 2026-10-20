import pg from "pg";
const { Pool } = pg;
import { DATABASE_URL } from "./configuracao/variaveis";

export interface StatusBanco {
  conectado: boolean;
  tipo: "PostgreSQL";
  configurado: boolean;
  versao?: string;
  horaBanco?: string;
  erro?: string;
  tempoRespostaMs?: number;
  ultimaVerificacao: string;
}

// Configuração do pool de conexões utilizando exclusivamente a DATABASE_URL
const configuracaoPool: pg.PoolConfig = {
  connectionString: DATABASE_URL || undefined,
  ssl:
    DATABASE_URL &&
    !DATABASE_URL.includes("localhost") &&
    !DATABASE_URL.includes("127.0.0.1") &&
    !DATABASE_URL.includes("sslmode=disable")
      ? { rejectUnauthorized: false }
      : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Instância do pool ou mock in-memory caso DATABASE_URL não esteja configurada ou ocorra erro
let poolInstancia: pg.Pool;
try {
  poolInstancia = DATABASE_URL
    ? new Pool(configuracaoPool)
    : ({
        query: async () => ({ rows: [], command: "SELECT", rowCount: 0, oid: 0, fields: [] }),
        connect: async () => ({
          query: async () => ({ rows: [], command: "SELECT", rowCount: 0, oid: 0, fields: [] }),
          release: () => {},
        }),
        on: () => poolInstancia,
        end: async () => {},
      } as unknown as pg.Pool);
} catch (e: any) {
  console.warn("⚠️ [PostgreSQL] Erro ao instanciar Pool — usando fallback:", e?.message);
  poolInstancia = {
    query: async () => ({ rows: [], command: "SELECT", rowCount: 0, oid: 0, fields: [] }),
    connect: async () => ({
      query: async () => ({ rows: [], command: "SELECT", rowCount: 0, oid: 0, fields: [] }),
      release: () => {},
    }),
    on: () => poolInstancia,
    end: async () => {},
  } as unknown as pg.Pool;
}

export const pool: pg.Pool = poolInstancia;

// Tratamento de erros inesperados em clientes do pool
if (DATABASE_URL && pool && typeof pool.on === "function") {
  pool.on("error", (err: Error) => {
    console.error("❌ [PostgreSQL] Erro inesperado no cliente do pool:", err.message);
  });
}

let ultimoStatus: StatusBanco | null = null;

/**
 * Inicia a conexão com o PostgreSQL utilizando a DATABASE_URL
 */
export async function iniciarBancoDeDados(): Promise<StatusBanco> {
  const inicio = Date.now();

  if (!DATABASE_URL) {
    console.warn("⚠️ [PostgreSQL] Variável DATABASE_URL não configurada no painel de hospedagem.");
    ultimoStatus = {
      conectado: false,
      tipo: "PostgreSQL",
      configurado: false,
      erro: "DATABASE_URL não definida nas variáveis de ambiente.",
      tempoRespostaMs: 0,
      ultimaVerificacao: new Date().toISOString(),
    };
    return ultimoStatus;
  }

  console.log("🔄 [PostgreSQL] Conectando ao banco de dados via DATABASE_URL...");

  try {
    const res = await pool.query<{ agora: Date; versao: string }>(
      "SELECT NOW() as agora, version() as versao"
    );
    const latencia = Date.now() - inicio;
    const primeiraLinha = res.rows[0];
    const versaoTexto = primeiraLinha?.versao
      ? primeiraLinha.versao.split(" on ")[0]
      : "PostgreSQL";
    const horaBanco = primeiraLinha?.agora
      ? new Date(primeiraLinha.agora).toISOString()
      : new Date().toISOString();

    console.log("✅ [PostgreSQL] Conectado com sucesso via DATABASE_URL!");
    console.log(`📡 [PostgreSQL] Versão: ${versaoTexto} | Latência: ${latencia}ms`);

    // Inicializa as tabelas automaticamente se conectado
    import("./repositorios").then((r) => r.inicializarTodasTabelas()).catch(() => {});

    ultimoStatus = {
      conectado: true,
      tipo: "PostgreSQL",
      configurado: true,
      versao: versaoTexto,
      horaBanco,
      tempoRespostaMs: latencia,
      ultimaVerificacao: new Date().toISOString(),
    };

    return ultimoStatus;
  } catch (err: any) {
    const latencia = Date.now() - inicio;

    console.warn(`⚠️ [PostgreSQL] Falha ao conectar via DATABASE_URL: ${err.message}`);

    ultimoStatus = {
      conectado: false,
      tipo: "PostgreSQL",
      configurado: true,
      erro: err.message,
      tempoRespostaMs: latencia,
      ultimaVerificacao: new Date().toISOString(),
    };

    return ultimoStatus;
  }
}

/**
 * Retorna o status atual da conexão
 */
export async function obterStatusBanco(forcarAtualizacao = false): Promise<StatusBanco> {
  if (forcarAtualizacao || !ultimoStatus) {
    return await iniciarBancoDeDados();
  }
  return ultimoStatus;
}

/**
 * Executa uma consulta SQL parametrizada
 */
export async function executarQuery<T = any>(
  textoSql: string,
  parametros: any[] = []
): Promise<pg.QueryResult<T>> {
  if (!DATABASE_URL) {
    console.warn("⚠️ [PostgreSQL] executarQuery chamado sem DATABASE_URL. Retornando resultado simulado.");
    return {
      rows: [],
      command: "SELECT",
      rowCount: 0,
      oid: 0,
      fields: [],
    } as any;
  }
  try {
    return await pool.query<T>(textoSql, parametros);
  } catch (err: any) {
    console.warn("⚠️ [PostgreSQL] Erro ao executar query:", err.message);
    return {
      rows: [],
      command: "SELECT",
      rowCount: 0,
      oid: 0,
      fields: [],
    } as any;
  }
}

/**
 * Encerra o pool de conexões
 */
export async function fecharBanco(): Promise<void> {
  await pool.end();
  console.log("🛑 [PostgreSQL] Pool de conexões finalizado.");
}

export default {
  pool,
  iniciarBancoDeDados,
  obterStatusBanco,
  executarQuery,
  fecharBanco,
};
