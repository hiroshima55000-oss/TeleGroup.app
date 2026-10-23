import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";

export interface ItemHistoricoBanido {
  id: string;
  posicao: number;
  usuario: string; // Ex: "@bot_fake"
  usuarioId?: string;
  nome?: string;
  email?: string;
  motivo: string;
  banidoEm: string;
  dataBanimentoFormatada: string;
  tempoBanidoTexto: string;
  status: "banido" | "desbanido";
  acoes: string[];
  linha: string;
  cardFormatado: string;
}

export interface RespostaHistoricoBanido {
  sucesso: boolean;
  area: "historico_banido";
  titulo: string;
  fonte: string;
  totalBanidos: number;
  historico: ItemHistoricoBanido[];
  ranking: ItemHistoricoBanido[];
  cardsTexto: string[];
  linhas: string[];
  textoFormatado: string;
  timestamp: string;
}

const ARQUIVO_BANIDOS = path.resolve(process.cwd(), "admin_banidos.dados.json");
const ARQUIVO_USUARIOS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");

const DADOS_PADRAO_BANIDOS: ItemHistoricoBanido[] = [
  {
    id: "ban_001",
    posicao: 1,
    usuario: "@spammer99",
    usuarioId: "usr_spammer_99",
    nome: "Spammer 99",
    email: "spammer99@email.com",
    motivo: "Disparo excessivo de spam e autopromoção não autorizada",
    banidoEm: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dataBanimentoFormatada: "18/10/2026 às 15:40",
    tempoBanidoTexto: "banido há 2 dias",
    status: "banido",
    acoes: ["Desbanir", "Investigar", "Excluir"],
    linha: "@spammer99 banido por: Disparo excessivo de spam e autopromoção não autorizada",
    cardFormatado: [
      "usuário : @spammer99",
      "status : banido",
      "data : banido em 18/10/2026 às 15:40",
      "tempo : banido há 2 dias",
      "motivo : Disparo excessivo de spam e autopromoção não autorizada",
      "",
      "Desbanir | Investigar | Excluir",
    ].join("\n"),
  },
  {
    id: "ban_002",
    posicao: 2,
    usuario: "@bot_clones",
    usuarioId: "usr_bot_clones_02",
    nome: "Clone Automator",
    email: "clonebot@mail.org",
    motivo: "Uso de scripts automatizados para inflar visualizações",
    banidoEm: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dataBanimentoFormatada: "15/10/2026 às 09:12",
    tempoBanidoTexto: "banido há 5 dias",
    status: "banido",
    acoes: ["Desbanir", "Investigar", "Excluir"],
    linha: "@bot_clones banido por: Uso de scripts automatizados para inflar visualizações",
    cardFormatado: [
      "usuário : @bot_clones",
      "status : banido",
      "data : banido em 15/10/2026 às 09:12",
      "tempo : banido há 5 dias",
      "motivo : Uso de scripts automatizados para inflar visualizações",
      "",
      "Desbanir | Investigar | Excluir",
    ].join("\n"),
  },
  {
    id: "ban_003",
    posicao: 3,
    usuario: "@fake_news_br",
    usuarioId: "usr_fake_news_03",
    nome: "Notícias Brasil",
    email: "noticiasfake@globo.net",
    motivo: "Veiculação de desinformação e links maliciosos",
    banidoEm: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    dataBanimentoFormatada: "12/10/2026 às 21:05",
    tempoBanidoTexto: "banido há 8 dias",
    status: "banido",
    acoes: ["Desbanir", "Investigar", "Excluir"],
    linha: "@fake_news_br banido por: Veiculação de desinformação e links maliciosos",
    cardFormatado: [
      "usuário : @fake_news_br",
      "status : banido",
      "data : banido em 12/10/2026 às 21:05",
      "tempo : banido há 8 dias",
      "motivo : Veiculação de desinformação e links maliciosos",
      "",
      "Desbanir | Investigar | Excluir",
    ].join("\n"),
  },
];

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "[]");
    }
  } catch (err) {
    console.warn(`[HistoricoBanido] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

function salvarJsonSeguro(caminho: string, dados: any): void {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error(`[HistoricoBanido] Erro ao salvar ${caminho}:`, err);
  }
}

export function formatarDataHora(dataIso?: string | Date): string {
  const d = dataIso ? new Date(dataIso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${data} às ${hora}`;
}

export function formatarTempoDecorrido(dataIso?: string | Date): string {
  const agora = Date.now();
  const data = dataIso ? new Date(dataIso).getTime() : agora;
  const diffMs = Math.max(0, agora - data);
  const mins = Math.floor(diffMs / (1000 * 60));

  if (mins < 1) return "banido agora mesmo";
  if (mins < 60) return `banido há ${mins} mins`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `banido há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `banido há ${dias} dias`;
}

export function construirCardBanido(item: {
  usuario: string;
  dataBanimentoFormatada: string;
  tempoBanidoTexto: string;
  motivo: string;
  status?: string;
}): string {
  const statusTexto = item.status === "desbanido" ? "desbanido" : "banido";
  const acao = item.status === "desbanido" ? "Banir" : "Desbanir";

  return [
    `usuário : ${item.usuario}`,
    `status : ${statusTexto}`,
    `data : banido em ${item.dataBanimentoFormatada}`,
    `tempo : ${item.tempoBanidoTexto}`,
    `motivo : ${item.motivo}`,
    "",
    `${acao} | Investigar | Excluir`,
  ].join("\n");
}

export const HistoricoBanidoServico = {
  /**
   * Obtém o histórico completo e formatado de usuários banidos
   */
  async obterHistoricoBanidos(filtros: { busca?: string; limite?: number } = {}): Promise<RespostaHistoricoBanido> {
    let fonte = "arquivos_persistentes";
    let listaBanidosRaw: any[] = [];

    // 1. Tenta buscar no PostgreSQL se conectado
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        // Assegura criação de tabela de banidos caso não exista
        await pool.query(`
          CREATE TABLE IF NOT EXISTS admin_banidos (
            id VARCHAR(100) PRIMARY KEY,
            usuario VARCHAR(150),
            usuario_id VARCHAR(100),
            email VARCHAR(255),
            motivo TEXT,
            data_banimento TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        const res = await pool.query<{
          id: string;
          usuario: string;
          usuario_id?: string;
          email?: string;
          motivo?: string;
          data_banimento?: Date;
        }>(`
          SELECT 
            id,
            usuario,
            usuario_id,
            email,
            motivo,
            data_banimento
          FROM admin_banidos
          ORDER BY data_banimento DESC
        `);

        if (res.rows.length > 0) {
          fonte = "banco_postgresql";
          listaBanidosRaw = res.rows.map((row) => ({
            id: row.id,
            usuario: row.usuario,
            usuarioId: row.usuario_id,
            email: row.email,
            motivo: row.motivo,
            dataBanimento: row.data_banimento ? new Date(row.data_banimento).toISOString() : new Date().toISOString(),
          }));
          usouPostgres = true;
        }
      }
    } catch (err: any) {
      console.warn("[HistoricoBanido] PostgreSQL indisponível para banidos:", err.message);
    }

    // 2. Se não utilizou PostgreSQL, consulta no arquivo JSON persistente
    if (!usouPostgres) {
      const dadosJson = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
      if (Array.isArray(dadosJson) && dadosJson.length > 0) {
        listaBanidosRaw = dadosJson;
      }
    }

    // 3. Verifica também em usuarios_metricas.dados.json se há marcados como banidos
    const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS, { visitas: {} });
    const visitas = Object.values(dadosUsuarios.visitas || {}) as any[];
    for (const u of visitas) {
      if (u.banido) {
        const uId = u.usuarioId || u.id;
        const uNick = u.nickname || u.nome || uId;
        const jaExiste = listaBanidosRaw.some(
          (b) =>
            b.usuarioId === uId ||
            (b.usuario && b.usuario.toLowerCase() === uNick.toLowerCase())
        );
        if (!jaExiste) {
          listaBanidosRaw.push({
            id: `ban_${uId}`,
            usuario: uNick,
            usuarioId: uId,
            email: u.email,
            motivo: u.motivoBanimento || "Banido por infração de termos",
            dataBanimento: u.ultimoAcesso || new Date().toISOString(),
          });
        }
      }
    }

    let historico: ItemHistoricoBanido[] = [];

    if (listaBanidosRaw.length > 0) {
      // Ordena decrescente pela data de banimento (mais recente primeiro)
      listaBanidosRaw.sort((a, b) => {
        const tA = new Date(a.dataBanimento || a.banidoEm || 0).getTime();
        const tB = new Date(b.dataBanimento || b.banidoEm || 0).getTime();
        return tB - tA;
      });

      historico = listaBanidosRaw.map((b, index) => {
        let nick = String(b.usuario || b.usuarioId || "usuário").trim();
        if (!nick.startsWith("@")) nick = `@${nick}`;

        const banidoEm = b.dataBanimento || b.banidoEm || new Date().toISOString();
        const dataBanimentoFormatada = formatarDataHora(banidoEm);
        const tempoBanidoTexto = formatarTempoDecorrido(banidoEm);
        const motivo = b.motivo || "Violação das regras da comunidade";
        const linha = `${nick} banido por: ${motivo}`;

        const cardFormatado = construirCardBanido({
          usuario: nick,
          dataBanimentoFormatada,
          tempoBanidoTexto,
          motivo,
          status: "banido",
        });

        return {
          id: b.id || `ban_${index + 1}`,
          posicao: index + 1,
          usuario: nick,
          usuarioId: b.usuarioId,
          nome: b.nome || nick.replace(/^@/, ""),
          email: b.email,
          motivo,
          banidoEm,
          dataBanimentoFormatada,
          tempoBanidoTexto,
          status: "banido",
          acoes: ["Desbanir", "Investigar", "Excluir"],
          linha,
          cardFormatado,
        };
      });
    } else {
      historico = [];
      fonte = "banco_real";
    }

    // Filtro por busca
    if (filtros.busca && filtros.busca.trim()) {
      const b = filtros.busca.trim().toLowerCase();
      historico = historico.filter(
        (item) =>
          item.usuario.toLowerCase().includes(b) ||
          (item.usuarioId && item.usuarioId.toLowerCase().includes(b)) ||
          (item.email && item.email.toLowerCase().includes(b)) ||
          item.motivo.toLowerCase().includes(b)
      );
    }

    // Limite opcional
    if (filtros.limite && filtros.limite > 0) {
      historico = historico.slice(0, filtros.limite);
    }

    const titulo = "histórico de banidos:";
    const linhas = historico.map((item) => item.linha);
    const cardsTexto = historico.map((item) => item.cardFormatado);

    const textoFormatado =
      `${titulo}\n` +
      `${linhas.join("\n")}\n\n` +
      `----------------------------------------\n\n` +
      cardsTexto.join("\n\n----------------------------------------\n\n");

    return {
      sucesso: true,
      area: "historico_banido",
      titulo,
      fonte,
      totalBanidos: historico.length,
      historico,
      ranking: historico,
      cardsTexto,
      linhas,
      textoFormatado,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Bane um usuário e adiciona ao histórico de banidos
   */
  async banirUsuario(
    identificador: string,
    motivo: string = "Banido pelo painel administrativo"
  ): Promise<{ sucesso: boolean; mensagem: string; banido: ItemHistoricoBanido }> {
    let termo = identificador.trim();
    if (!termo) {
      throw new Error("Identificador do usuário a ser banido não informado.");
    }
    if (!termo.startsWith("@") && !termo.startsWith("usr_") && !termo.includes("@")) {
      termo = `@${termo}`;
    }

    const agora = new Date().toISOString();
    const idBan = `ban_${Date.now()}`;

    // 1. Salva no JSON
    const lista = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const jaExiste = lista.find(
      (b) =>
        (b.usuario && b.usuario.toLowerCase() === termo.toLowerCase()) ||
        b.usuarioId === termo ||
        (b.email && b.email.toLowerCase() === termo.toLowerCase())
    );

    let registroFinal: any;
    if (!jaExiste) {
      registroFinal = {
        id: idBan,
        usuario: termo,
        usuarioId: termo.startsWith("usr_") ? termo : null,
        motivo,
        dataBanimento: agora,
      };
      lista.unshift(registroFinal);
      salvarJsonSeguro(ARQUIVO_BANIDOS, lista);
    } else {
      jaExiste.motivo = motivo;
      jaExiste.dataBanimento = agora;
      registroFinal = jaExiste;
      salvarJsonSeguro(ARQUIVO_BANIDOS, lista);
    }

    // 2. Salva no PostgreSQL se conectado
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `INSERT INTO admin_banidos (id, usuario, usuario_id, email, motivo, data_banimento)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET motivo = EXCLUDED.motivo, data_banimento = NOW()`,
          [registroFinal.id || idBan, termo, registroFinal.usuarioId, null, motivo]
        );
      }
    } catch (err: any) {
      console.warn("[HistoricoBanido] Erro ao salvar banimento no PostgreSQL:", err.message);
    }

    // 3. Atualiza também no RepositorioUsuario
    try {
      const { RepositorioUsuario } = await import("../repositorios/repositorio.usuario");
      await RepositorioUsuario.atualizarStatus(termo, { banido: true, motivo });
    } catch {}

    const banidoItem: ItemHistoricoBanido = {
      id: registroFinal.id || idBan,
      posicao: 1,
      usuario: termo,
      motivo,
      banidoEm: agora,
      dataBanimentoFormatada: formatarDataHora(agora),
      tempoBanidoTexto: "banido agora mesmo",
      status: "banido",
      acoes: ["Desbanir", "Investigar", "Excluir"],
      linha: `${termo} banido por: ${motivo}`,
      cardFormatado: construirCardBanido({
        usuario: termo,
        dataBanimentoFormatada: formatarDataHora(agora),
        tempoBanidoTexto: "banido agora mesmo",
        motivo,
        status: "banido",
      }),
    };

    // Notifica o Website 1 proativamente
    this.enviarParaPainel("usuario_banido", {
      usuario: termo,
      motivo,
    }).catch(() => {});

    return {
      sucesso: true,
      mensagem: `Usuário ${termo} banido com sucesso.`,
      banido: banidoItem,
    };
  },

  /**
   * Desbane um usuário removendo do histórico ativo
   */
  async desbanirUsuario(
    identificador: string
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    let termo = identificador.trim();
    if (!termo) {
      throw new Error("Identificador do usuário a ser desbanido não informado.");
    }
    const puro = termo.replace(/^@/, "").toLowerCase();

    // 1. Remove do JSON
    const lista = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const filtrados = lista.filter(
      (b) =>
        b.usuarioId !== termo &&
        (!b.usuario || b.usuario.replace(/^@/, "").toLowerCase() !== puro) &&
        (!b.email || b.email.toLowerCase() !== termo.toLowerCase())
    );
    salvarJsonSeguro(ARQUIVO_BANIDOS, filtrados);

    // 2. Remove do PostgreSQL
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `DELETE FROM admin_banidos 
           WHERE usuario_id = $1 
              OR LOWER(REPLACE(usuario, '@', '')) = $2
              OR LOWER(email) = $2`,
          [termo, puro]
        );
      }
    } catch (err: any) {
      console.warn("[HistoricoBanido] Erro ao remover banimento no PostgreSQL:", err.message);
    }

    // 3. Atualiza no RepositorioUsuario
    try {
      const { RepositorioUsuario } = await import("../repositorios/repositorio.usuario");
      await RepositorioUsuario.atualizarStatus(termo, { banido: false });
    } catch {}

    // Notifica o Website 1 proativamente
    this.enviarParaPainel("usuario_desbanido", {
      usuario: termo,
    }).catch(() => {});

    return {
      sucesso: true,
      mensagem: `Usuário ${termo} foi desbanido com sucesso.`,
    };
  },

  /**
   * Envia proativamente o histórico de banidos para a API_URL (Painel Administrativo)
   */
  async enviarParaPainel(
    evento: string = "sincronizacao_historico_banidos",
    dadosExtras: any = {}
  ): Promise<{ enviado: boolean; status?: number; erro?: string; duracaoMs?: number }> {
    if (!API_URL || !API_URL.trim()) {
      return { enviado: false, erro: "API_URL não configurada no ambiente" };
    }

    const inicio = Date.now();
    const endpointWebhook = `${API_URL.replace(/\/$/, "")}/api/webhook`;

    try {
      const metricas = await this.obterHistoricoBanidos();

      const payload = {
        evento,
        area: "historico_banido",
        origem: "website_2",
        dados: {
          titulo: metricas.titulo,
          totalBanidos: metricas.totalBanidos,
          historico: metricas.historico,
          cardsTexto: metricas.cardsTexto,
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

export const PainelModeracaoHistoricoBanidoServico = HistoricoBanidoServico;
export default HistoricoBanidoServico;
