import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { RepositorioUsuario } from "../repositorios/repositorio.usuario";
import { ComunicacaoServico } from "./s.painel.comunicacao";

export interface ItemHistoricoUsuario {
  usuarioId: string;
  usuario: string; // Ex: "@lira"
  nome: string;
  email?: string;
  foto?: string;
  cadastrado: boolean;
  statusCadastroTexto: "usuário cadastrado" | "usuário não cadastrado";
  
  // Datas e tempos
  primeiroAcesso: string;
  ultimoAcesso: string;
  horarioEntradaTexto: string; // Ex: "usuário entrou às 23:11 em 20/12/2026"
  tempoDeContaTexto: string; // Ex: "usuário tem : 15D 22h e 37 mins"
  tempoOnlineTexto: string; // Ex: "usuário estava online há 20 mins"
  minutosOnlineHa: number;
  
  // Métricas de Conteúdo e Investimento
  publicacoes: number;
  publicacoesTexto: string; // Ex: "usuário tem : 12 publicações"
  
  campanhas: number;
  campanhasTexto: string; // Ex: "usuário tem : 3  campanhas"
  
  investido: number;
  investidoTexto: string; // Ex: "usuário investiu : 35,00"
  
  // Métricas de Engajamento
  visualizacoes: number;
  visualizacoesTexto: string; // Ex: "usuário tem : 129 visualizações"
  
  likes: number;
  likesTexto: string; // Ex: "usuário tem : 101 likes"
  
  cliques: number;
  cliquesTexto: string; // Ex: "usuário tem : 57 cliques"
  
  // Moderação
  denuncias: number;
  denunciasTexto: string; // Ex: "usuário tem : 4  denúncias"
  
  banido: boolean;
  motivoBanimento?: string;
  acoes: string[]; // ["Banir", "Investigar", "Excluir"] ou ["Desbanir", "Investigar", "Excluir"]
  
  // Matriz de Interesses & Comportamento (Para o Painel Administrativo)
  classificacaoPublico?: string;
  taxaCliquesCTR?: number;
  interessesDistribuicao?: Record<string, number>;
  interessesFormatadosTexto?: string;

  // Bloco formatado exatamente conforme o padrão do painel administrativo
  cardFormatado: string;
}

const ARQUIVO_USUARIOS_METRICAS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");
const ARQUIVO_PUBLICACOES = path.resolve(process.cwd(), "publicacoes.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");
const ARQUIVO_BANIDOS = path.resolve(process.cwd(), "admin_banidos.dados.json");
const ARQUIVO_DENUNCIAS = path.resolve(process.cwd(), "admin_denuncias.dados.json");
const ARQUIVO_TRANSACOES = path.resolve(process.cwd(), "transacoes_pix.dados.json");

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[HistoricoUsuario] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

function salvarJsonSeguro(caminho: string, dados: any): void {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error(`[HistoricoUsuario] Erro ao salvar ${caminho}:`, err);
  }
}

/**
 * Formata o horário de entrada no formato exato:
 * "usuário entrou às 23:11 em 20/12/2026"
 */
export function formatarEntrada(dataStr?: string | Date): { hora: string; data: string; texto: string } {
  const d = dataStr ? new Date(dataStr) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return {
    hora,
    data,
    texto: `usuário entrou às ${hora} em ${data}`,
  };
}

/**
 * Formata a idade da conta do usuário no formato exato:
 * "usuário tem : 15D 22h e 37 mins"
 */
export function formatarTempoDeConta(dataPrimeiroAcesso?: string | Date): { dias: number; horas: number; minutos: number; texto: string } {
  const agora = Date.now();
  const inicio = dataPrimeiroAcesso ? new Date(dataPrimeiroAcesso).getTime() : agora;
  const diffMs = Math.max(0, agora - inicio);
  const totalMinutos = Math.floor(diffMs / (1000 * 60));
  const dias = Math.floor(totalMinutos / (60 * 24));
  const horas = Math.floor((totalMinutos % (60 * 24)) / 60);
  const minutos = totalMinutos % 60;
  return {
    dias,
    horas,
    minutos,
    texto: `usuário tem : ${dias}D ${horas}h e ${minutos} mins`,
  };
}

/**
 * Formata há quanto tempo o usuário esteve online no formato exato:
 * "usuário estava online há 20 mins"
 */
export function formatarTempoOnline(dataUltimoAcesso?: string | Date): { minutos: number; texto: string } {
  const agora = Date.now();
  const ultimo = dataUltimoAcesso ? new Date(dataUltimoAcesso).getTime() : agora;
  const diffMs = Math.max(0, agora - ultimo);
  const mins = Math.floor(diffMs / (1000 * 60));
  
  let texto = "";
  if (mins < 1) {
    texto = "usuário estava online agora mesmo";
  } else if (mins < 60) {
    texto = `usuário estava online há ${mins} mins`;
  } else {
    const horas = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (horas < 24) {
      texto = remMins > 0 ? `usuário estava online há ${horas}h e ${remMins} mins` : `usuário estava online há ${horas}h`;
    } else {
      const dias = Math.floor(horas / 24);
      texto = `usuário estava online há ${dias} dias`;
    }
  }

  return { minutos: mins, texto };
}

/**
 * Formata valor monetário com vírgula e 2 casas decimais: "35,00"
 */
export function formatarMoeda(val: number): string {
  return Number(val || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Gera o texto do card de informações do usuário no formato exato solicitado:
 */
export function construirCardTexto(item: {
  usuario: string;
  horarioEntradaTexto: string;
  statusCadastroTexto: string;
  tempoDeContaTexto: string;
  publicacoesTexto: string;
  campanhasTexto: string;
  investidoTexto: string;
  visualizacoesTexto: string;
  likesTexto: string;
  cliquesTexto: string;
  denunciasTexto: string;
  tempoOnlineTexto: string;
  banido: boolean;
}): string {
  const acaoBan = item.banido ? "Desbanir" : "Banir";
  return [
    `usuário : ${item.usuario}`,
    `${item.horarioEntradaTexto}`,
    "",
    `${item.statusCadastroTexto}`,
    `${item.tempoDeContaTexto}`,
    "",
    `${item.publicacoesTexto}`,
    `${item.campanhasTexto}`,
    `${item.investidoTexto}`,
    "",
    `${item.visualizacoesTexto}`,
    `${item.likesTexto}`,
    `${item.cliquesTexto}`,
    "",
    `${item.denunciasTexto}`,
    "",
    `${item.tempoOnlineTexto}`,
    "",
    `${acaoBan} | Investigar | Excluir`,
  ].join("\n");
}

export const HistoricoUsuarioServico = {
  /**
   * Constrói as informações e métricas consolidadas de um único usuário
   */
  async construirItemUsuario(
    usuarioRaw: any,
    dadosAuxiliares?: {
      publicacoes?: any[];
      campanhas?: any[];
      banidos?: any[];
      denuncias?: any[];
      transacoes?: Record<string, any>;
    }
  ): Promise<ItemHistoricoUsuario> {
    const usuarioId = usuarioRaw.usuarioId || usuarioRaw.id || `usr_${Date.now()}`;
    let nickname = (usuarioRaw.nickname || usuarioRaw.nome || "").trim();
    if (!nickname) {
      nickname = `@usuario_${usuarioId.slice(-6)}`;
    } else if (!nickname.startsWith("@")) {
      nickname = `@${nickname}`;
    }

    const cadastrado = Boolean(
      usuarioRaw.cadastrado === true ||
      usuarioRaw.email ||
      usuarioRaw.googleId
    );

    const primeiroAcesso = usuarioRaw.primeiroAcesso || usuarioRaw.criadoEm || new Date().toISOString();
    const ultimoAcesso = usuarioRaw.ultimoAcesso || primeiroAcesso;

    // Carrega dados auxiliares em lote caso não fornecidos
    const pubs = dadosAuxiliares?.publicacoes || lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []);
    const camps = dadosAuxiliares?.campanhas || lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
    const bans = dadosAuxiliares?.banidos || lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const dens = dadosAuxiliares?.denuncias || lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
    const trans = dadosAuxiliares?.transacoes || lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {});

    // Filtra publicações do usuário
    const pubsUsuario = pubs.filter(
      (p) =>
        p.usuarioId === usuarioId ||
        p.usuario === usuarioId ||
        (p.usuario && p.usuario.toLowerCase() === nickname.toLowerCase())
    );

    // Filtra campanhas do usuário
    const campsUsuario = camps.filter(
      (c) =>
        c.usuarioId === usuarioId ||
        c.usuario === usuarioId ||
        (c.usuario && c.usuario.toLowerCase() === nickname.toLowerCase())
    );

    // Calcula publicações, visualizações, likes e cliques
    const totalPublicacoes = pubsUsuario.length;
    let totalVisualizacoes = 0;
    let totalLikes = 0;
    let totalCliques = 0;

    for (const p of pubsUsuario) {
      totalVisualizacoes += Number(p.visualizacoes || 0);
      totalLikes += Number(p.likes || 0);
      totalCliques += Number(p.cliques || 0);
    }

    // Soma métricas de campanhas
    const totalCampanhas = campsUsuario.length;
    let totalInvestidoCampanhas = 0;

    for (const c of campsUsuario) {
      totalVisualizacoes += Number(c.visualizacoes || 0);
      totalCliques += Number(c.cliques || 0);
      totalInvestidoCampanhas += Number(c.gastoTotal || c.orcamentoDiario || 0);
    }

    // Soma transações PIX aprovadas
    let totalInvestidoPix = 0;
    for (const t of Object.values(trans)) {
      if (
        (t.usuarioId === usuarioId || t.cliente?.email === usuarioRaw.email) &&
        t.status === "PAID"
      ) {
        totalInvestidoPix += Number(t.valor || 0);
      }
    }

    // Se o usuário possuir métrica manual ou fixa configurada
    const investidoTotal = Math.max(
      totalInvestidoCampanhas,
      totalInvestidoPix,
      Number(usuarioRaw.investido || 0)
    );

    if (usuarioRaw.visualizacoes) totalVisualizacoes = Math.max(totalVisualizacoes, Number(usuarioRaw.visualizacoes));
    if (usuarioRaw.likes) totalLikes = Math.max(totalLikes, Number(usuarioRaw.likes));
    if (usuarioRaw.cliques) totalCliques = Math.max(totalCliques, Number(usuarioRaw.cliques));
    if (usuarioRaw.publicacoesCount) {
      // suporte a override
    }

    // Denúncias registradas contra o usuário
    const denunciasUsuario = dens.filter(
      (d) =>
        d.usuarioId === usuarioId ||
        d.usuario === usuarioId ||
        (d.usuario && d.usuario.toLowerCase() === nickname.toLowerCase()) ||
        (usuarioRaw.email && d.email && d.email.toLowerCase() === usuarioRaw.email.toLowerCase())
    );
    const totalDenuncias = Math.max(denunciasUsuario.length, Number(usuarioRaw.denuncias || 0));

    // Status de banimento
    const registroBan = bans.find(
      (b) =>
        b.usuarioId === usuarioId ||
        (b.usuario && b.usuario.toLowerCase() === nickname.toLowerCase()) ||
        (usuarioRaw.email && b.email && b.email.toLowerCase() === usuarioRaw.email.toLowerCase())
    );
    const banido = Boolean(registroBan || usuarioRaw.banido === true);
    const motivoBanimento = registroBan?.motivo || usuarioRaw.motivoBanimento;

    // Textos formatados
    const infoEntrada = formatarEntrada(ultimoAcesso || primeiroAcesso);
    const infoTempoConta = formatarTempoDeConta(primeiroAcesso);
    const infoOnline = formatarTempoOnline(ultimoAcesso);
    const statusCadastroTexto = cadastrado ? "usuário cadastrado" : "usuário não cadastrado";

    const publicacoesTexto = `usuário tem : ${totalPublicacoes} publicações`;
    const campanhasTexto = `usuário tem : ${totalCampanhas}  campanhas`;
    const investidoTexto = `usuário investiu : ${formatarMoeda(investidoTotal)}`;
    const visualizacoesTexto = `usuário tem : ${totalVisualizacoes} visualizações`;
    const likesTexto = `usuário tem : ${totalLikes} likes`;
    const cliquesTexto = `usuário tem : ${totalCliques} cliques`;
    const denunciasTexto = `usuário tem : ${totalDenuncias}  denúncias`;

    const acoes = [banido ? "Desbanir" : "Banir", "Investigar", "Excluir"];

    const cardFormatado = construirCardTexto({
      usuario: nickname,
      horarioEntradaTexto: infoEntrada.texto,
      statusCadastroTexto,
      tempoDeContaTexto: infoTempoConta.texto,
      publicacoesTexto,
      campanhasTexto,
      investidoTexto,
      visualizacoesTexto,
      likesTexto,
      cliquesTexto,
      denunciasTexto,
      tempoOnlineTexto: infoOnline.texto,
      banido,
    });

    // Consulta o perfil de interesses e classificação do usuário para o painel administrativo
    let classificacaoPublico = "Passivo";
    let taxaCliquesCTR = totalVisualizacoes > 0 ? Number(((totalCliques / totalVisualizacoes) * 100).toFixed(2)) : 0;
    let interessesDistribuicao: Record<string, number> = {};
    let interessesFormatadosTexto = "";

    try {
      const { PerfilInteressesServico } = await import("./AlgoritmoOrganico/s.perfil.interesses");
      const perfilInt = PerfilInteressesServico.obterPerfil(usuarioId, nickname);
      classificacaoPublico = perfilInt.classificacaoPublico;
      taxaCliquesCTR = perfilInt.taxaCliquesCTR || taxaCliquesCTR;
      interessesDistribuicao = perfilInt.distribuicaoPercentual || {};

      if (perfilInt.distribuicaoGrupos && perfilInt.distribuicaoGrupos.length > 0) {
        interessesFormatadosTexto = perfilInt.distribuicaoGrupos
          .map((g) => `${g.percentual.toFixed(2)}% em grupo de ${g.grupoNome}`)
          .join("\n");
      }
    } catch {}

    return {
      usuarioId,
      usuario: nickname,
      nome: usuarioRaw.nome || nickname,
      email: usuarioRaw.email,
      foto: usuarioRaw.foto,
      cadastrado,
      statusCadastroTexto,
      primeiroAcesso,
      ultimoAcesso,
      horarioEntradaTexto: infoEntrada.texto,
      tempoDeContaTexto: infoTempoConta.texto,
      tempoOnlineTexto: infoOnline.texto,
      minutosOnlineHa: infoOnline.minutos,
      publicacoes: totalPublicacoes,
      publicacoesTexto,
      campanhas: totalCampanhas,
      campanhasTexto,
      investido: investidoTotal,
      investidoTexto,
      visualizacoes: totalVisualizacoes,
      visualizacoesTexto,
      likes: totalLikes,
      likesTexto,
      cliques: totalCliques,
      cliquesTexto,
      denuncias: totalDenuncias,
      denunciasTexto,
      banido,
      motivoBanimento,
      acoes,
      classificacaoPublico,
      taxaCliquesCTR,
      interessesDistribuicao,
      interessesFormatadosTexto,
      cardFormatado,
    };
  },

  /**
   * Obtém todo o histórico de usuários para o Painel Administrativo.
   * Os usuários que acabaram de entrar no app aparecem no topo da lista.
   */
  async obterHistoricoCompleto(filtros: { busca?: string; limite?: number } = {}): Promise<{
    sucesso: boolean;
    total: number;
    historico: ItemHistoricoUsuario[];
    cardsTexto: string[];
    textoFormatado: string;
  }> {
    // 1. Tenta obter usuários do PostgreSQL ou dos arquivos
    let listaUsuariosRaw: any[] = [];
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          `SELECT id as "usuarioId", email, nome, foto, google_id as "googleId", nickname, cadastrado, primeiro_acesso as "primeiroAcesso", ultimo_acesso as "ultimoAcesso", total_requisicoes as "totalRequisicoes"
           FROM usuarios
           ORDER BY ultimo_acesso DESC`
        );
        listaUsuariosRaw = res.rows;
      }
    } catch {}

    if (listaUsuariosRaw.length === 0) {
      const dadosJson = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
      listaUsuariosRaw = Object.values(dadosJson.visitas || {});
    }

    // Carrega dados auxiliares uma única vez para performance otimizada
    const publicacoes = lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []);
    const campanhas = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const denuncias = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []);
    const transacoes = lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {});

    // Constrói cada item enriquecido
    const itensPromessas = listaUsuariosRaw.map((u) =>
      this.construirItemUsuario(u, {
        publicacoes,
        campanhas,
        banidos,
        denuncias,
        transacoes,
      })
    );

    let historico = await Promise.all(itensPromessas);

    // Ordena por último acesso decrescente (o mais recente primeiro)
    historico.sort((a, b) => {
      const timeA = new Date(a.ultimoAcesso).getTime() || 0;
      const timeB = new Date(b.ultimoAcesso).getTime() || 0;
      return timeB - timeA;
    });

    // Filtro opcional de busca
    if (filtros.busca && filtros.busca.trim()) {
      const b = filtros.busca.trim().toLowerCase();
      historico = historico.filter(
        (item) =>
          item.usuario.toLowerCase().includes(b) ||
          item.usuarioId.toLowerCase().includes(b) ||
          (item.email && item.email.toLowerCase().includes(b)) ||
          item.nome.toLowerCase().includes(b)
      );
    }

    if (filtros.limite && filtros.limite > 0) {
      historico = historico.slice(0, filtros.limite);
    }

    const cardsTexto = historico.map((h) => h.cardFormatado);
    const textoFormatado = cardsTexto.join("\n\n----------------------------------------\n\n");

    return {
      sucesso: true,
      total: historico.length,
      historico,
      cardsTexto,
      textoFormatado,
    };
  },

  /**
   * Bane um usuário por ID, Nickname ou Email
   */
  async banirUsuario(
    identificador: string,
    motivo: string = "Banido pelo painel administrativo"
  ): Promise<{ sucesso: boolean; mensagem: string; usuario?: ItemHistoricoUsuario }> {
    const termo = identificador.trim();
    if (!termo) {
      throw new Error("Identificador do usuário não fornecido.");
    }

    // Busca o usuário correspondente
    const usuario = await RepositorioUsuario.buscarPorId(termo);
    const usuarioId = usuario?.usuarioId || termo;
    const nickname = usuario?.nickname || (termo.startsWith("@") ? termo : `@${termo}`);
    const email = usuario?.email;
    const agora = new Date().toISOString();

    // 1. Salva no admin_banidos.dados.json
    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const jaBanido = banidos.find(
      (b) =>
        b.usuarioId === usuarioId ||
        (b.usuario && b.usuario.toLowerCase() === nickname.toLowerCase()) ||
        (email && b.email && b.email.toLowerCase() === email.toLowerCase())
    );

    if (!jaBanido) {
      banidos.push({
        id: `ban_${Date.now()}`,
        usuario: nickname,
        usuarioId,
        email: email || null,
        motivo,
        dataBanimento: agora,
      });
      salvarJsonSeguro(ARQUIVO_BANIDOS, banidos);
    }

    // 2. Salva no PostgreSQL se conectado
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `INSERT INTO admin_banidos (id, usuario, usuario_id, email, motivo, data_banimento)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT DO NOTHING`,
          [`ban_${Date.now()}`, nickname, usuarioId, email || null, motivo]
        );
      }
    } catch {}

    // Notifica o Website 1 (Painel) em tempo real
    ComunicacaoServico.dispararWebhookParaWebsite1("usuario_banido", "usuarios", {
      usuarioId,
      usuario: nickname,
      motivo,
    }).catch(() => {});

    // Retorna item de histórico atualizado
    const itemAtualizado = await this.construirItemUsuario(
      usuario || { usuarioId, nickname, cadastrado: false, primeiroAcesso: agora, ultimoAcesso: agora }
    );

    return {
      sucesso: true,
      mensagem: `Usuário ${nickname} foi banido com sucesso.`,
      usuario: itemAtualizado,
    };
  },

  /**
   * Desbane um usuário por ID, Nickname ou Email
   */
  async desbanirUsuario(
    identificador: string
  ): Promise<{ sucesso: boolean; mensagem: string; usuario?: ItemHistoricoUsuario }> {
    const termo = identificador.trim();
    if (!termo) {
      throw new Error("Identificador do usuário não fornecido.");
    }

    const usuario = await RepositorioUsuario.buscarPorId(termo);
    const usuarioId = usuario?.usuarioId || termo;
    const nickname = usuario?.nickname || (termo.startsWith("@") ? termo : `@${termo}`);
    const email = usuario?.email;

    // 1. Remove do arquivo JSON
    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const banidosRestantes = banidos.filter(
      (b) =>
        b.usuarioId !== usuarioId &&
        b.usuarioId !== termo &&
        (!b.usuario || b.usuario.toLowerCase() !== nickname.toLowerCase()) &&
        (!email || !b.email || b.email.toLowerCase() !== email.toLowerCase())
    );
    salvarJsonSeguro(ARQUIVO_BANIDOS, banidosRestantes);

    // 2. Remove do PostgreSQL
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        await pool.query(
          `DELETE FROM admin_banidos 
           WHERE usuario_id = $1 OR LOWER(usuario) = $2 OR (email IS NOT NULL AND LOWER(email) = $3)`,
          [usuarioId, nickname.toLowerCase(), email?.toLowerCase() || ""]
        );
      }
    } catch {}

    // Notifica o Website 1
    ComunicacaoServico.dispararWebhookParaWebsite1("usuario_desbanido", "usuarios", {
      usuarioId,
      usuario: nickname,
    }).catch(() => {});

    const itemAtualizado = await this.construirItemUsuario(
      usuario || { usuarioId, nickname, cadastrado: false, primeiroAcesso: new Date().toISOString() }
    );

    return {
      sucesso: true,
      mensagem: `Usuário ${nickname} foi desbanido com sucesso.`,
      usuario: itemAtualizado,
    };
  },

  /**
   * Exclui um usuário e limpa seus registros
   */
  async excluirUsuario(
    identificador: string
  ): Promise<{ sucesso: boolean; mensagem: string; usuarioId: string }> {
    const termo = identificador.trim();
    if (!termo) {
      throw new Error("Identificador do usuário não fornecido.");
    }

    const usuario = await RepositorioUsuario.buscarPorId(termo);
    const usuarioId = usuario?.usuarioId || termo;
    const nickname = usuario?.nickname || (termo.startsWith("@") ? termo : `@${termo}`);

    // Executa remoção
    await RepositorioUsuario.removerUsuario(usuarioId);

    // Também limpa do arquivo de banidos se houver
    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []);
    const banidosFiltrados = banidos.filter(
      (b) => b.usuarioId !== usuarioId && b.usuarioId !== termo && b.usuario?.toLowerCase() !== nickname.toLowerCase()
    );
    salvarJsonSeguro(ARQUIVO_BANIDOS, banidosFiltrados);

    // Notifica o Website 1
    ComunicacaoServico.dispararWebhookParaWebsite1("usuario_removido", "usuarios", {
      usuarioId,
      usuario: nickname,
    }).catch(() => {});

    return {
      sucesso: true,
      mensagem: `Usuário ${nickname} (${usuarioId}) foi excluído com sucesso do sistema.`,
      usuarioId,
    };
  },

  /**
   * Retorna os detalhes de investigação de um usuário
   */
  async investigarUsuario(identificador: string): Promise<{
    sucesso: boolean;
    detalhes: any;
    card: ItemHistoricoUsuario;
  }> {
    const termo = identificador.trim();
    const usuario = await RepositorioUsuario.buscarPorId(termo);
    const usuarioId = usuario?.usuarioId || termo;

    const card = await this.construirItemUsuario(
      usuario || { usuarioId, nickname: termo, cadastrado: false, primeiroAcesso: new Date().toISOString() }
    );

    const publicacoes = lerJsonSeguro<any[]>(ARQUIVO_PUBLICACOES, []).filter(
      (p) => p.usuarioId === usuarioId || p.usuario === usuarioId || p.usuario === card.usuario
    );

    const campanhas = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []).filter(
      (c) => c.usuarioId === usuarioId || c.usuario === usuarioId || c.usuario === card.usuario
    );

    const denuncias = lerJsonSeguro<any[]>(ARQUIVO_DENUNCIAS, []).filter(
      (d) => d.usuarioId === usuarioId || d.usuario === usuarioId || d.usuario === card.usuario
    );

    const transacoes = Object.values(lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {})).filter(
      (t) => t.usuarioId === usuarioId || (usuario?.email && t.cliente?.email === usuario.email)
    );

    const banidos = lerJsonSeguro<any[]>(ARQUIVO_BANIDOS, []).filter(
      (b) => b.usuarioId === usuarioId || b.usuario === card.usuario
    );

    return {
      sucesso: true,
      detalhes: {
        usuarioId,
        nickname: card.usuario,
        nome: card.nome,
        email: card.email,
        cadastrado: card.cadastrado,
        primeiroAcesso: card.primeiroAcesso,
        ultimoAcesso: card.ultimoAcesso,
        totalPublicacoes: publicacoes.length,
        publicacoes,
        totalCampanhas: campanhas.length,
        campanhas,
        totalDenuncias: denuncias.length,
        denuncias,
        totalTransacoes: transacoes.length,
        transacoes,
        historicoBanimento: banidos,
        perfilInteresses: {
          classificacao: card.classificacaoPublico,
          taxaCliquesCTR: card.taxaCliquesCTR,
          distribuicaoPercentual: card.interessesDistribuicao,
        },
      },
      card,
    };
  },
};

export const PainelUsuariosHistoricoServico = {
  ...HistoricoUsuarioServico,
  obterHistorico: (filtros?: any) => HistoricoUsuarioServico.obterHistoricoCompleto(filtros),
};

export default PainelUsuariosHistoricoServico;
