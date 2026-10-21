import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import {
  Usuario,
  RegistroVisitaInput,
  DDL_TABELA_USUARIOS,
} from "../schemas/schema.usuario";

const ARQUIVO_USUARIOS_METRICAS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");
const ARQUIVO_BANIDOS = path.resolve(process.cwd(), "admin_banidos.dados.json");

function lerJson<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[RepositorioUsuario] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

function salvarJson(caminho: string, dados: any): void {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error(`[RepositorioUsuario] Erro ao salvar ${caminho}:`, err);
  }
}

export const RepositorioUsuario = {
  /**
   * Inicializa tabelas no PostgreSQL caso o banco esteja ativo
   */
  async inicializarTabelas(): Promise<void> {
    const status = await obterStatusBanco();
    if (!status.conectado) return;
    try {
      await pool.query(DDL_TABELA_USUARIOS);
      console.log("📦 [RepositorioUsuario] Tabelas de usuários e banidos verificadas no PostgreSQL.");
    } catch (err: any) {
      console.warn("⚠️ [RepositorioUsuario] Aviso na inicialização de tabelas:", err.message);
    }
  },

  /**
   * Verifica se o identificador ou email está banido
   */
  async checarBanido(identificador: string): Promise<{ banido: boolean; motivo?: string }> {
    const termo = identificador.trim().toLowerCase();
    if (!termo) return { banido: false };

    // 1. Tenta consulta no PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query(
          "SELECT motivo FROM admin_banidos WHERE LOWER(usuario) = $1 OR LOWER(email) = $1 OR LOWER(usuario_id) = $1 LIMIT 1",
          [termo]
        );
        if (res.rows.length > 0) {
          return {
            banido: true,
            motivo: res.rows[0].motivo || "Violação das regras da comunidade",
          };
        }
      }
    } catch {}

    // 2. Consulta no arquivo JSON persistente
    const banidos = lerJson<any[]>(ARQUIVO_BANIDOS, []);
    const encontrado = banidos.find(
      (b) =>
        b.usuario?.toLowerCase() === termo ||
        b.email?.toLowerCase() === termo ||
        b.usuarioId?.toLowerCase() === termo
    );

    if (encontrado) {
      return {
        banido: true,
        motivo: encontrado.motivo || "Violação das diretrizes da comunidade",
      };
    }

    return { banido: false };
  },

  /**
   * Registra ou atualiza o acesso de um usuário
   */
  async registrarAcesso(dados: RegistroVisitaInput): Promise<Usuario> {
    const usuarioId = dados.usuarioId || `usr_${Date.now()}`;
    const agora = new Date().toISOString();

    // 1. Tenta atualizar no PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `INSERT INTO usuarios (id, email, nome, nickname, foto, google_id, cadastrado, total_requisicoes, primeiro_acesso, ultimo_acesso)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             ultimo_acesso = NOW(),
             total_requisicoes = usuarios.total_requisicoes + 1,
             email = COALESCE($2, usuarios.email),
             nome = COALESCE($3, usuarios.nome),
             nickname = COALESCE($4, usuarios.nickname),
             foto = COALESCE($5, usuarios.foto),
             google_id = COALESCE($6, usuarios.google_id),
             cadastrado = COALESCE($7, usuarios.cadastrado)`,
          [
            usuarioId,
            dados.email || null,
            dados.nome || null,
            dados.nickname || null,
            dados.foto || null,
            dados.googleId || null,
            dados.cadastrado ?? Boolean(dados.email),
          ]
        );
      }
    } catch {}

    // 2. Mantém sincronizado no JSON de métricas
    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    if (!metricas.visitas) metricas.visitas = {};

    let usuarioAtual: Usuario;
    if (!metricas.visitas[usuarioId]) {
      usuarioAtual = {
        usuarioId,
        primeiroAcesso: agora,
        ultimoAcesso: agora,
        cadastrado: Boolean(dados.cadastrado || dados.email),
        totalRequisicoes: 1,
        email: dados.email,
        nome: dados.nome,
        nickname: dados.nickname,
        foto: dados.foto,
        googleId: dados.googleId,
      };
    } else {
      usuarioAtual = metricas.visitas[usuarioId];
      usuarioAtual.ultimoAcesso = agora;
      usuarioAtual.totalRequisicoes = (usuarioAtual.totalRequisicoes || 0) + 1;
      if (dados.cadastrado !== undefined) usuarioAtual.cadastrado = Boolean(dados.cadastrado);
      if (dados.email) usuarioAtual.email = dados.email;
      if (dados.nome) usuarioAtual.nome = dados.nome;
      if (dados.nickname) usuarioAtual.nickname = dados.nickname;
      if (dados.foto) usuarioAtual.foto = dados.foto;
      if (dados.googleId) usuarioAtual.googleId = dados.googleId;
    }

    metricas.visitas[usuarioId] = usuarioAtual;
    metricas.ultimaAtualizacao = agora;
    salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);

    return usuarioAtual;
  },

  /**
   * Salva ou atualiza os dados completos de uma conta vinculada ao Google
   */
  async salvarOuAtualizarGoogle(dados: Partial<Usuario> & { email: string }): Promise<Usuario> {
    const agora = new Date().toISOString();
    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    if (!metricas.visitas) metricas.visitas = {};

    const emailAlvo = dados.email.toLowerCase().trim();
    const prefixoEmail = emailAlvo.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    const nicknameGoogle = `@${prefixoEmail || "usuario"}`;

    // Procura se já existe algum usuário com este email cadastrado OU com o idAnonimo
    const usuariosExistentes = Object.entries(metricas.visitas) as [string, any][];
    const match = usuariosExistentes.find(([id, u]) => {
      const uEmail = (u.email || "").toLowerCase().trim();
      const uId = (u.usuarioId || id || "").toLowerCase().trim();

      return (
        uEmail === emailAlvo ||
        (dados.usuarioId && uId === dados.usuarioId.toLowerCase().trim())
      );
    });

    const existente = match ? match[1] : null;
    const usuarioId = existente?.usuarioId || match?.[0] || dados.usuarioId || `usr_cad_${Date.now()}`;

    const usuarioAtualizado: any = {
      ...existente,
      usuarioId,
      email: emailAlvo,
      nome: dados.nome || existente?.nome || emailAlvo.split("@")[0],
      foto: dados.foto || existente?.foto,
      googleId: dados.googleId || existente?.googleId,
      nickname: nicknameGoogle, // Sempre atualiza para o @ derivado da conta Google (ex: @deepweb3036)
      cadastrado: true,
      primeiroAcesso: existente?.primeiroAcesso || agora,
      ultimoAcesso: agora,
      totalRequisicoes: (existente?.totalRequisicoes || 0) + 1,
      saldo: Number(existente?.saldo ?? existente?.saldoCampanhas ?? 0),
      saldoCampanhas: Number(existente?.saldoCampanhas ?? existente?.saldo ?? 0),
      investido: Number(existente?.investido || 0),
      campanhas: Number(existente?.campanhas || 0),
      publicacoes: Number(existente?.publicacoes || 0),
    };

    metricas.visitas[usuarioId] = usuarioAtualizado;

    // Se o ID da conta for diferente do ID anônimo temporário, limpa o nó anônimo
    if (dados.usuarioId && dados.usuarioId !== usuarioId && metricas.visitas[dados.usuarioId]) {
      delete metricas.visitas[dados.usuarioId];
    }

    metricas.ultimaAtualizacao = agora;
    salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);

    // Tenta atualizar no PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `INSERT INTO usuarios (id, email, nome, foto, google_id, nickname, cadastrado, ultimo_acesso)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             nome = EXCLUDED.nome,
             foto = COALESCE(EXCLUDED.foto, usuarios.foto),
             google_id = COALESCE(EXCLUDED.google_id, usuarios.google_id),
             nickname = EXCLUDED.nickname,
             cadastrado = TRUE,
             ultimo_acesso = NOW()`,
          [
            usuarioId,
            usuarioAtualizado.email,
            usuarioAtualizado.nome,
            usuarioAtualizado.foto || null,
            usuarioAtualizado.googleId || null,
            usuarioAtualizado.nickname || null,
          ]
        );
      }
    } catch (err: any) {
      console.warn("[RepositorioUsuario] Falha ao sincronizar com PostgreSQL:", err.message);
    }

    return usuarioAtualizado;
  },

  /**
   * Atualiza perfil (nome e/ou nickname)
   */
  async atualizarPerfil(usuarioId: string, dados: { nickname?: string; nome?: string }): Promise<Usuario | null> {
    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    if (!metricas.visitas || !metricas.visitas[usuarioId]) {
      return null;
    }

    const usuario = metricas.visitas[usuarioId];
    if (dados.nickname) usuario.nickname = dados.nickname;
    if (dados.nome) usuario.nome = dados.nome;
    usuario.ultimoAcesso = new Date().toISOString();

    salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);

    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `UPDATE usuarios SET nickname = COALESCE($1, nickname), nome = COALESCE($2, nome) WHERE id = $3`,
          [dados.nickname || null, dados.nome || null, usuarioId]
        );
      }
    } catch {}

    return usuario;
  },

  /**
   * Obtém totais consolidados de usuários
   */
  async obterMetricas(): Promise<{ totalUsuarios: number; cadastrados: number; anonimos: number }> {
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE cadastrado = TRUE) as cadastrados,
            COUNT(*) FILTER (WHERE cadastrado = FALSE OR cadastrado IS NULL) as anonimos
          FROM usuarios
        `);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            totalUsuarios: Number(row.total || 0),
            cadastrados: Number(row.cadastrados || 0),
            anonimos: Number(row.anonimos || 0),
          };
        }
      }
    } catch {}

    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    const lista = Object.values(metricas.visitas || {}) as any[];
    const cadastrados = lista.filter((u) => u.cadastrado).length;
    return {
      totalUsuarios: lista.length,
      cadastrados,
      anonimos: lista.length - cadastrados,
    };
  },

  /**
   * Busca um usuário pelo ID ou email
   */
  async buscarPorId(identificador: string): Promise<Usuario | null> {
    const termo = identificador.trim().toLowerCase();
    
    // Tenta PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query(
          `SELECT id as "usuarioId", email, nome, foto, google_id as "googleId", nickname, cadastrado, primeiro_acesso as "primeiroAcesso", ultimo_acesso as "ultimoAcesso", total_requisicoes as "totalRequisicoes"
           FROM usuarios WHERE id = $1 OR LOWER(email) = $2 LIMIT 1`,
          [identificador, termo]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      }
    } catch {}

    // Arquivo JSON
    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    const visitas = metricas.visitas || {};
    if (visitas[identificador]) return visitas[identificador];

    const encontrado = Object.values(visitas).find(
      (u: any) => u.email && u.email.toLowerCase() === termo
    );
    return (encontrado as Usuario) || null;
  },

  /**
   * Lista todos os usuários registrados
   */
  async listarTodos(): Promise<Usuario[]> {
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        const res = await pool.query(
          `SELECT id as "usuarioId", email, nome, foto, google_id as "googleId", nickname, cadastrado, primeiro_acesso as "primeiroAcesso", ultimo_acesso as "ultimoAcesso", total_requisicoes as "totalRequisicoes"
           FROM usuarios ORDER BY ultimo_acesso DESC`
        );
        if (res.rows.length > 0) {
          return res.rows;
        }
      }
    } catch {}

    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    return Object.values(metricas.visitas || {}) as Usuario[];
  },

  /**
   * Cadastra ou atualiza um usuário real recebido via API (Push do Website 1)
   */
  async cadastrarOuAtualizar(dados: Partial<Usuario> & { id?: string; usuarioId?: string }): Promise<Usuario> {
    const usuarioId = dados.id || dados.usuarioId || `usr_${Date.now()}`;
    const agora = new Date().toISOString();

    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    if (!metricas.visitas) metricas.visitas = {};

    const existente = metricas.visitas[usuarioId] || {};
    const usuarioFinal: Usuario = {
      usuarioId,
      email: dados.email || existente.email,
      nome: dados.nome || existente.nome || (dados.email ? dados.email.split("@")[0] : `Usuário ${usuarioId.slice(-4)}`),
      foto: dados.foto || existente.foto,
      nickname: dados.nickname || existente.nickname || (dados.email ? `@${dados.email.split("@")[0]}` : undefined),
      googleId: dados.googleId || existente.googleId,
      cadastrado: dados.cadastrado !== undefined ? Boolean(dados.cadastrado) : (existente.cadastrado ?? true),
      primeiroAcesso: existente.primeiroAcesso || agora,
      ultimoAcesso: agora,
      totalRequisicoes: (existente.totalRequisicoes || 0) + 1,
    };

    metricas.visitas[usuarioId] = usuarioFinal;
    metricas.ultimaAtualizacao = agora;
    salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);

    // Sincroniza no PostgreSQL se ativo
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(
          `INSERT INTO usuarios (id, email, nome, foto, google_id, nickname, cadastrado, primeiro_acesso, ultimo_acesso)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             email = COALESCE(EXCLUDED.email, usuarios.email),
             nome = COALESCE(EXCLUDED.nome, usuarios.nome),
             foto = COALESCE(EXCLUDED.foto, usuarios.foto),
             nickname = COALESCE(EXCLUDED.nickname, usuarios.nickname),
             cadastrado = EXCLUDED.cadastrado,
             ultimo_acesso = NOW()`,
          [
            usuarioId,
            usuarioFinal.email || null,
            usuarioFinal.nome || null,
            usuarioFinal.foto || null,
            usuarioFinal.googleId || null,
            usuarioFinal.nickname || null,
            usuarioFinal.cadastrado,
          ]
        );
      }
    } catch (err: any) {
      console.warn("[RepositorioUsuario] Erro ao sincronizar cadastrarOuAtualizar no PostgreSQL:", err.message);
    }

    return usuarioFinal;
  },

  /**
   * Altera status, banimento ou dados de perfil do usuário (PATCH /api/usuarios/:id)
   */
  async atualizarStatus(
    id: string,
    alteracoes: {
      banido?: boolean;
      motivo?: string;
      cadastrado?: boolean;
      nome?: string;
      email?: string;
      nickname?: string;
    }
  ): Promise<{ usuario: Usuario; banido: boolean; motivo?: string }> {
    const agora = new Date().toISOString();
    let usuario = await this.buscarPorId(id);

    if (!usuario) {
      // Se não existia ainda, cria com base nas informações recebidas
      usuario = await this.cadastrarOuAtualizar({
        usuarioId: id,
        nome: alteracoes.nome,
        email: alteracoes.email,
        nickname: alteracoes.nickname,
        cadastrado: alteracoes.cadastrado ?? true,
      });
    } else {
      // Atualiza campos cadastrais se informados
      const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
      if (!metricas.visitas) metricas.visitas = {};
      const u = metricas.visitas[usuario.usuarioId] || usuario;

      if (alteracoes.nome !== undefined) u.nome = alteracoes.nome;
      if (alteracoes.email !== undefined) u.email = alteracoes.email;
      if (alteracoes.nickname !== undefined) u.nickname = alteracoes.nickname;
      if (alteracoes.cadastrado !== undefined) u.cadastrado = Boolean(alteracoes.cadastrado);
      u.ultimoAcesso = agora;

      metricas.visitas[usuario.usuarioId] = u;
      metricas.ultimaAtualizacao = agora;
      salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);
      usuario = u;

      try {
        const status = await obterStatusBanco();
        if (status.conectado) {
          await pool.query(
            `UPDATE usuarios SET
              nome = COALESCE($1, nome),
              email = COALESCE($2, email),
              nickname = COALESCE($3, nickname),
              cadastrado = COALESCE($4, cadastrado),
              ultimo_acesso = NOW()
             WHERE id = $5`,
            [alteracoes.nome || null, alteracoes.email || null, alteracoes.nickname || null, alteracoes.cadastrado ?? null, usuario.usuarioId]
          );
        }
      } catch {}
    }

    // Processamento do status de banimento
    let banido = false;
    let motivoFinal = alteracoes.motivo;

    if (alteracoes.banido === true) {
      banido = true;
      const banidos = lerJson<any[]>(ARQUIVO_BANIDOS, []);
      const jaExiste = banidos.find((b) => b.usuarioId === usuario!.usuarioId || (usuario!.email && b.email === usuario!.email));
      
      if (!jaExiste) {
        banidos.push({
          id: `ban-${Date.now()}`,
          usuario: usuario.nickname || usuario.nome || usuario.usuarioId,
          usuarioId: usuario.usuarioId,
          email: usuario.email || "",
          motivo: alteracoes.motivo || "Banido via Website 1 / Painel",
          dataBanimento: agora,
        });
        salvarJson(ARQUIVO_BANIDOS, banidos);
      }

      try {
        const status = await obterStatusBanco();
        if (status.conectado) {
          await pool.query(
            `INSERT INTO admin_banidos (id, usuario, usuario_id, email, motivo, data_banimento)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT DO NOTHING`,
            [`ban-${Date.now()}`, usuario.nickname || usuario.nome, usuario.usuarioId, usuario.email || null, alteracoes.motivo || "Banido via painel"]
          );
        }
      } catch {}
    } else if (alteracoes.banido === false) {
      banido = false;
      const banidos = lerJson<any[]>(ARQUIVO_BANIDOS, []);
      const filtrados = banidos.filter(
        (b) => b.usuarioId !== usuario!.usuarioId && (!usuario!.email || b.email !== usuario!.email)
      );
      salvarJson(ARQUIVO_BANIDOS, filtrados);

      try {
        const status = await obterStatusBanco();
        if (status.conectado) {
          await pool.query(
            `DELETE FROM admin_banidos WHERE usuario_id = $1 OR (email IS NOT NULL AND email = $2)`,
            [usuario.usuarioId, usuario.email || null]
          );
        }
      } catch {}
    } else {
      // Se não especificou alteração de banimento, verifica o status atual
      const statusBan = await this.checarBanido(usuario.usuarioId);
      banido = statusBan.banido;
      motivoFinal = statusBan.motivo;
    }

    return { usuario, banido, motivo: motivoFinal };
  },

  /**
   * Remove o usuário no Website 2 (DELETE /api/usuarios/:id)
   */
  async removerUsuario(id: string): Promise<boolean> {
    const usuario = await this.buscarPorId(id);
    const usuarioId = usuario?.usuarioId || id;

    // 1. Remove do JSON de métricas
    const metricas = lerJson<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    let alterou = false;
    if (metricas.visitas && metricas.visitas[usuarioId]) {
      delete metricas.visitas[usuarioId];
      alterou = true;
    }

    // Também verifica se a chave era o id direto
    if (metricas.visitas && metricas.visitas[id]) {
      delete metricas.visitas[id];
      alterou = true;
    }

    if (alterou) {
      metricas.ultimaAtualizacao = new Date().toISOString();
      salvarJson(ARQUIVO_USUARIOS_METRICAS, metricas);
    }

    // 2. Remove de banidos caso esteja
    const banidos = lerJson<any[]>(ARQUIVO_BANIDOS, []);
    const banidosFiltrados = banidos.filter((b) => b.usuarioId !== usuarioId && b.usuarioId !== id);
    if (banidosFiltrados.length !== banidos.length) {
      salvarJson(ARQUIVO_BANIDOS, banidosFiltrados);
    }

    // 3. Remove do PostgreSQL
    try {
      const status = await obterStatusBanco();
      if (status.conectado) {
        await pool.query(`DELETE FROM usuarios WHERE id = $1`, [usuarioId]);
        await pool.query(`DELETE FROM admin_banidos WHERE usuario_id = $1`, [usuarioId]);
      }
    } catch (err: any) {
      console.warn("[RepositorioUsuario] Erro ao remover usuário do PostgreSQL:", err.message);
    }

    return true;
  },
};

export default RepositorioUsuario;

