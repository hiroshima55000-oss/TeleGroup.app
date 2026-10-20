import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemRankingDenunciado {
  posicao: number;
  usuario: string; // Ex: "@cutsw"
  usuarioId?: string;
  email?: string;
  quantidade: number;
  quantidadeFormatada: string;
  motivoMaisFrequente?: string;
  status: "ativo" | "investigando" | "banido";
  linha: string;
}

export interface RespostaRankingDenunciados {
  sucesso: boolean;
  area: "rank_denunciados";
  titulo: string;
  fonte: string;
  totalDenunciados: number;
  totalDenuncias: number;
  ranking: ItemRankingDenunciado[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_DENUNCIAS = path.resolve(process.cwd(), "admin_denuncias.dados.json");
const ARQUIVO_BANIDOS = path.resolve(process.cwd(), "admin_banidos.dados.json");
const ARQUIVO_USUARIOS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");

const DADOS_PADRAO_DENUNCIADOS: ItemRankingDenunciado[] = [
  {
    posicao: 1,
    usuario: "@cutsw",
    usuarioId: "usr_cutsw_01",
    quantidade: 4,
    quantidadeFormatada: "4",
    motivoMaisFrequente: "Spam em publicações",
    status: "investigando",
    linha: "4 denúncias de @cutsw",
  },
  {
    posicao: 2,
    usuario: "@lulaew",
    usuarioId: "usr_lulaew_02",
    quantidade: 3,
    quantidadeFormatada: "3",
    motivoMaisFrequente: "Conteúdo impróprio",
    status: "investigando",
    linha: "3 denúncias de @lulaew",
  },
  {
    posicao: 3,
    usuario: "@viro12",
    usuarioId: "usr_viro12_03",
    quantidade: 2,
    quantidadeFormatada: "2",
    motivoMaisFrequente: "Divulgação enganosa",
    status: "ativo",
    linha: "2 denúncias de @viro12",
  },
  {
    posicao: 4,
    usuario: "@mariayt",
    usuarioId: "usr_mariayt_04",
    quantidade: 1,
    quantidadeFormatada: "1",
    motivoMaisFrequente: "Violação de regras",
    status: "ativo",
    linha: "1 denúncia de @mariayt",
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "[]");
    }
  } catch (err) {
    console.warn(`[RankDenunciados] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

function salvarJsonSeguro(caminho: string, dados: any): void {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error(`[RankDenunciados] Erro ao salvar ${caminho}:`, err);
  }
}

export const RankDenunciadosServico = {
  /**
   * Obtém o ranking formatado de usuários denunciados
   * Formato padrão:
   * rank de denunciados:
   * 4 denúncias de @cutsw
   * 3 denúncias de @lulaew
   * 2 denúncias de @viro12
   * 1 denúncia de @mariayt
   */
  async obterRankingDenunciados(filtros: { limite?: number; busca?: string } = {}): Promise<RespostaRankingDenunciados> {
    let fonte = "arquivos_persistentes";
    const mapaDenuncias = new Map<string, {
      usuario: string;
      usuarioId?: string;
      email?: string;
      quantidade: number;
      motivos: string[];
    }>();

    // 1. Tenta buscar dados reais no PostgreSQL
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        // Assegura criação de tabela caso ainda não exista
        await pool.query(`
          CREATE TABLE IF NOT EXISTS admin_denuncias (
            id VARCHAR(100) PRIMARY KEY,
            usuario VARCHAR(150),
            usuario_id VARCHAR(100),
            email VARCHAR(255),
            denunciante VARCHAR(150),
            motivo TEXT,
            categoria VARCHAR(100),
            publicacao_id VARCHAR(100),
            campanha_id VARCHAR(100),
            data_denuncia TIMESTAMPTZ DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'pendente'
          );
        `);

        const res = await pool.query<{
          usuario: string;
          usuario_id?: string;
          email?: string;
          quantidade: string | number;
          motivo_comum?: string;
        }>(`
          SELECT 
            COALESCE(usuario, usuario_id) as usuario,
            usuario_id,
            email,
            COUNT(*)::int as quantidade,
            MODE() WITHIN GROUP (ORDER BY motivo) as motivo_comum
          FROM admin_denuncias
          GROUP BY COALESCE(usuario, usuario_id), usuario_id, email
          ORDER BY quantidade DESC
        `);

        if (res.rows.length > 0) {
          fonte = "banco_postgresql";
          for (const row of res.rows) {
            let u = String(row.usuario || "").trim();
            if (!u.startsWith("@")) u = `@${u}`;
            mapaDenuncias.set(u.toLowerCase(), {
              usuario: u,
              usuarioId: row.usuario_id || undefined,
              email: row.email || undefined,
              quantidade: Number(row.quantidade || 0),
              motivos: row.motivo_comum ? [row.motivo_comum] : [],
            });
          }
          usouPostgres = true;
        }
      }
    } catch (err: any) {
      console.warn("[RankDenunciados] PostgreSQL indisponível para denúncias:", err.message);
    }

    // 2. Se não utilizou PostgreSQL, analisa o arquivo JSON persistente
    if (!usouPostgres) {
      const listaDenuncias = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
      if (Array.isArray(listaDenuncias) && listaDenuncias.length > 0) {
        for (const item of listaDenuncias) {
          let u = String(item.usuario || item.usuarioId || item.alvo || "").trim();
          if (!u) continue;
          if (!u.startsWith("@")) u = `@${u}`;
          const key = u.toLowerCase();

          const existente = mapaDenuncias.get(key) || {
            usuario: u,
            usuarioId: item.usuarioId,
            email: item.email,
            quantidade: 0,
            motivos: [],
          };

          existente.quantidade += Number(item.quantidade || 1);
          if (item.motivo) existente.motivos.push(item.motivo);
          if (item.usuarioId && !existente.usuarioId) existente.usuarioId = item.usuarioId;
          if (item.email && !existente.email) existente.email = item.email;

          mapaDenuncias.set(key, existente);
        }
      }
    }

    // 3. Verifica também nos usuários se há denúncias atribuídas diretamente
    const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS, { visitas: {} });
    const visitas = Object.values(dadosUsuarios.visitas || {}) as any[];
    for (const u of visitas) {
      const qtdDen = Number(u.denuncias || 0);
      if (qtdDen > 0) {
        let nick = String(u.nickname || u.nome || u.usuarioId || "").trim();
        if (!nick.startsWith("@")) nick = `@${nick}`;
        const key = nick.toLowerCase();
        if (!mapaDenuncias.has(key)) {
          mapaDenuncias.set(key, {
            usuario: nick,
            usuarioId: u.usuarioId,
            email: u.email,
            quantidade: qtdDen,
            motivos: [u.motivoDenuncia || "Denúncia de usuário"],
          });
        }
      }
    }

    // Carrega banidos para marcar status de banido
    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const setBanidos = new Set(
      banidos.map((b) => String(b.usuario || b.usuarioId || "").toLowerCase().replace(/^@/, ""))
    );

    let ranking: ItemRankingDenunciado[] = [];

    if (mapaDenuncias.size > 0) {
      const listaOrdenada = Array.from(mapaDenuncias.values()).sort(
        (a, b) => b.quantidade - a.quantidade
      );

      ranking = listaOrdenada.map((item, index) => {
        const puro = item.usuario.replace(/^@/, "").toLowerCase();
        const estaBanido = setBanidos.has(puro) || (item.usuarioId && setBanidos.has(item.usuarioId.toLowerCase()));
        const status: "ativo" | "investigando" | "banido" = estaBanido
          ? "banido"
          : item.quantidade >= 3
          ? "investigando"
          : "ativo";

        const termoDenuncia = item.quantidade === 1 ? "denúncia" : "denúncias";
        const linha = `${item.quantidade} ${termoDenuncia} de ${item.usuario}`;

        return {
          posicao: index + 1,
          usuario: item.usuario,
          usuarioId: item.usuarioId,
          email: item.email,
          quantidade: item.quantidade,
          quantidadeFormatada: item.quantidade.toLocaleString("pt-BR"),
          motivoMaisFrequente: item.motivos[0] || "Denúncia da comunidade",
          status,
          linha,
        };
      });
    } else {
      // Se não há denúncias reais cadastradas, utiliza os dados padrão com status atualizado
      ranking = DADOS_PADRAO_DENUNCIADOS.map((item, index) => {
        const puro = item.usuario.replace(/^@/, "").toLowerCase();
        const estaBanido = setBanidos.has(puro);
        return {
          ...item,
          posicao: index + 1,
          status: estaBanido ? "banido" : item.status,
        };
      });
      fonte = "padrao";
    }

    // Filtro por busca se informado
    if (filtros.busca && filtros.busca.trim()) {
      const b = filtros.busca.trim().toLowerCase();
      ranking = ranking.filter(
        (item) =>
          item.usuario.toLowerCase().includes(b) ||
          (item.usuarioId && item.usuarioId.toLowerCase().includes(b)) ||
          (item.email && item.email.toLowerCase().includes(b)) ||
          (item.motivoMaisFrequente && item.motivoMaisFrequente.toLowerCase().includes(b))
      );
    }

    // Limite opcional
    if (filtros.limite && filtros.limite > 0) {
      ranking = ranking.slice(0, filtros.limite);
    }

    const totalDenuncias = ranking.reduce((acc, curr) => acc + curr.quantidade, 0);
    const titulo = "rank de denunciados:";
    const linhas = ranking.map((item) => item.linha);
    const textoFormatado = `${titulo}\n${linhas.join("\n")}`;

    return {
      sucesso: true,
      area: "rank_denunciados",
      titulo,
      fonte,
      totalDenunciados: ranking.length,
      totalDenuncias,
      ranking,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Registra uma denúncia contra um usuário
   */
  async registrarDenuncia(dados: {
    usuario: string;
    usuarioId?: string;
    email?: string;
    denunciante?: string;
    motivo?: string;
    categoria?: string;
    publicacaoId?: string;
    campanhaId?: string;
  }): Promise<{ sucesso: boolean; mensagem: string; denuncia: any }> {
    let u = (dados.usuario || dados.usuarioId || "").trim();
    if (!u) {
      throw new Error("Identificador do usuário denunciado é obrigatório.");
    }
    if (!u.startsWith("@")) u = `@${u}`;

    const agora = new Date().toISOString();
    const idDenuncia = `den_${Date.now()}`;

    const novaDenuncia = {
      id: idDenuncia,
      usuario: u,
      usuarioId: dados.usuarioId || null,
      email: dados.email || null,
      denunciante: dados.denunciante || "@anonimo",
      motivo: dados.motivo || "Violação de regras",
      categoria: dados.categoria || "Geral",
      publicacaoId: dados.publicacaoId || null,
      campanhaId: dados.campanhaId || null,
      dataDenuncia: agora,
      status: "pendente",
    };

    // 1. Salva no JSON
    const lista = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
    lista.unshift(novaDenuncia);
    salvarJsonSeguro(ARQUIVO_DENUNCIAS, lista);

    // 2. Salva no PostgreSQL se conectado
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `INSERT INTO admin_denuncias (id, usuario, usuario_id, email, denunciante, motivo, categoria, publicacao_id, campanha_id, data_denuncia, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)`,
          [
            idDenuncia,
            u,
            dados.usuarioId || null,
            dados.email || null,
            dados.denunciante || "@anonimo",
            dados.motivo || "Violação de regras",
            dados.categoria || "Geral",
            dados.publicacaoId || null,
            dados.campanhaId || null,
            "pendente",
          ]
        );
      }
    } catch (err: any) {
      console.warn("[RankDenunciados] Erro ao salvar denúncia no PostgreSQL:", err.message);
    }

    // Notifica o Website 1 proativamente
    this.enviarParaPainel("nova_denuncia_registrada", {
      usuarioDenunciado: u,
      motivo: dados.motivo,
      denunciante: dados.denunciante,
    }).catch(() => {});

    return {
      sucesso: true,
      mensagem: `Denúncia contra ${u} registrada com sucesso.`,
      denuncia: novaDenuncia,
    };
  },

  /**
   * Envia proativamente o ranking de denunciados para a API_URL (Painel Administrativo)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_rank_denunciados",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterRankingDenunciados();

      const payload = {
        evento,
        area: "rank_denunciados",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalDenunciados: metricas.totalDenunciados,
          totalDenuncias: metricas.totalDenuncias,
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

export default RankDenunciadosServico;
