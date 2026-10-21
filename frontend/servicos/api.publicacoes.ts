import { obterUsuarioId, estaLogadoGoogle, obterGoogleUsuario } from "./usuario";

export interface PublicacaoItem {
  id: string;
  usuarioId: string;
  nome: string;
  categoria: string;
  descricao: string;
  link: string;
  imagens: string[];
  tipo: "foto" | "texto";
  destaque: boolean;
  isAnuncio?: boolean;
  visualizacoes: number;
  likes: number;
  cliques: number;
  status: "Publicado" | "Pendente" | "Encerrado";
  dataCriacao: string;
  membros: string;
  curtido?: boolean;
  tags?: string[];
  nicho?: string;
  nomeNicho?: string;
  iconeNicho?: string;
}

export interface TagItem {
  rank?: number;
  nome: string;
  slug: string;
  nicho: string;
  contagemBase?: number;
  contagemTotal: number;
  contagemFormatada: string;
  popular?: boolean;
}

export interface NichoItem {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  tagsPrincipais: string[];
  totalPublicacoes: number;
  totalPublicacoesFormatado: string;
}

export interface PerfilInteresseItem {
  usuarioId: string;
  pontosPorNicho: Record<string, number>;
  distribuicaoPercentual: Record<string, number>;
  nichoPredominante: string;
  nichosSecundarios: string[];
  totalInteracoes: number;
  ultimaAtualizacao: string;
}

export async function converterArquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.readAsDataURL(arquivo);
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = (error) => reject(error);
  });
}

const CHAVE_VISUALIZACOES_LOCAL = "flux_vistos_ids";
const CHAVE_CLIQUES_LOCAL = "flux_cliques_ids";
const CHAVE_CURTIDAS_LOCAL = "flux_curtidas_ids";

function obterConjuntoLocal(chave: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const local = localStorage.getItem(chave);
    if (local) return new Set(JSON.parse(local));
    const session = sessionStorage.getItem(chave);
    if (session) return new Set(JSON.parse(session));
    return new Set();
  } catch {
    return new Set();
  }
}

function salvarConjuntoLocal(chave: string, conjunto: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(Array.from(conjunto));
    localStorage.setItem(chave, json);
    sessionStorage.setItem(chave, json);
  } catch {}
}

export function jaCurtiuLocal(id: string): boolean {
  return obterConjuntoLocal(CHAVE_CURTIDAS_LOCAL).has(id);
}

export function definirCurtidaLocal(id: string, curtido: boolean): void {
  const conj = obterConjuntoLocal(CHAVE_CURTIDAS_LOCAL);
  if (curtido) {
    conj.add(id);
  } else {
    conj.delete(id);
  }
  salvarConjuntoLocal(CHAVE_CURTIDAS_LOCAL, conj);
}

export interface RespostaPublicacoesPaginadas {
  dados: PublicacaoItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  temMais: boolean;
  categoriasDisponiveis?: string[];
}

export interface FiltrosPublicacoes {
  busca?: string;
  categoria?: string;
  tag?: string;
  nicho?: string;
  modo?: string;
  apenasComImagem?: boolean;
  pagina?: number;
  limite?: number;
}

export async function buscarPublicacoesPaginadas(
  apenasMinhas: boolean = false,
  filtros: FiltrosPublicacoes = {}
): Promise<RespostaPublicacoesPaginadas> {
  try {
    const usuarioId = obterUsuarioId();
    const params = new URLSearchParams();
    params.append("usuarioId", usuarioId);
    if (apenasMinhas) {
      params.append("apenasMinhas", "true");
    }

    if (filtros.busca && filtros.busca.trim()) {
      params.append("busca", filtros.busca.trim());
    }
    if (filtros.categoria && filtros.categoria !== "Todos" && filtros.categoria.trim()) {
      params.append("categoria", filtros.categoria.trim());
    }
    if (filtros.tag && filtros.tag.trim()) {
      params.append("tag", filtros.tag.trim());
    }
    if (filtros.nicho && filtros.nicho !== "todos" && filtros.nicho.trim()) {
      params.append("nicho", filtros.nicho.trim());
    }
    if (filtros.modo) {
      params.append("modo", filtros.modo);
    }
    if (filtros.apenasComImagem) {
      params.append("apenasComImagem", "true");
    }
    if (filtros.pagina && filtros.pagina >= 1) {
      params.append("pagina", String(filtros.pagina));
    }
    if (filtros.limite && filtros.limite >= 1) {
      params.append("limite", String(filtros.limite));
    }

    const url = `/api/publicacoes?${params.toString()}`;
    const resposta = await fetch(url, {
      headers: {
        "x-user-id": usuarioId,
      },
    });

    if (!resposta.ok) {
      throw new Error(`Erro ao buscar publicações paginadas: ${resposta.statusText}`);
    }
    const json = await resposta.json();
    const lista: PublicacaoItem[] = Array.isArray(json.dados) ? json.dados : [];

    // Sincroniza curtidas conhecidas no cache local persistente
    if (typeof window !== "undefined") {
      const jaCurtidos = obterConjuntoLocal(CHAVE_CURTIDAS_LOCAL);
      for (const item of lista) {
        if (item.curtido) {
          jaCurtidos.add(item.id);
        } else {
          jaCurtidos.delete(item.id);
        }
      }
      salvarConjuntoLocal(CHAVE_CURTIDAS_LOCAL, jaCurtidos);
    }

    return {
      dados: lista,
      total: typeof json.total === "number" ? json.total : lista.length,
      pagina: typeof json.pagina === "number" ? json.pagina : filtros.pagina || 1,
      limite: typeof json.limite === "number" ? json.limite : filtros.limite || lista.length,
      totalPaginas: typeof json.totalPaginas === "number" ? json.totalPaginas : 1,
      temMais: Boolean(json.temMais),
      categoriasDisponiveis: Array.isArray(json.categoriasDisponiveis) ? json.categoriasDisponiveis : [],
    };
  } catch (err) {
    console.error("Falha ao buscar publicações paginadas:", err);
    throw err;
  }
}

export async function buscarPublicacoes(
  apenasMinhas: boolean = false,
  buscaOuFiltros?: string | { busca?: string; categoria?: string; tag?: string; nicho?: string; modo?: string }
): Promise<PublicacaoItem[]> {
  try {
    const filtros: FiltrosPublicacoes = {};
    if (typeof buscaOuFiltros === "string" && buscaOuFiltros.trim()) {
      filtros.busca = buscaOuFiltros.trim();
    } else if (typeof buscaOuFiltros === "object" && buscaOuFiltros !== null) {
      if (buscaOuFiltros.busca) filtros.busca = buscaOuFiltros.busca;
      if (buscaOuFiltros.categoria && buscaOuFiltros.categoria !== "Todos") filtros.categoria = buscaOuFiltros.categoria;
      if (buscaOuFiltros.tag) filtros.tag = buscaOuFiltros.tag;
      if (buscaOuFiltros.nicho && buscaOuFiltros.nicho !== "todos") filtros.nicho = buscaOuFiltros.nicho;
      if (buscaOuFiltros.modo) filtros.modo = buscaOuFiltros.modo;
    }

    const resultado = await buscarPublicacoesPaginadas(apenasMinhas, filtros);
    return resultado.dados;
  } catch (err) {
    console.error("Falha ao buscar publicações da API:", err);
    throw err;
  }
}

export async function criarPublicacao(dados: {
  nome: string;
  categoria: string;
  descricao: string;
  link: string;
  imagens: string[];
  tags?: string[];
}): Promise<PublicacaoItem> {
  if (!estaLogadoGoogle()) {
    throw new Error("Você precisa estar conectado com sua conta Google para postar.");
  }

  const usuarioId = obterUsuarioId();
  const google = obterGoogleUsuario();

  const resposta = await fetch("/api/publicacoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
      "x-google-auth": "true",
      "x-google-email": google?.email || "",
      "x-google-nome": encodeURIComponent(google?.nome || ""),
    },
    body: JSON.stringify({
      ...dados,
      usuarioId,
      googleEmail: google?.email,
      googleNome: google?.nome,
    }),
  });

  const json = await resposta.json();
  if (!resposta.ok || !json.sucesso) {
    if (json.banido || resposta.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "telegroup_status_banido",
          JSON.stringify({
            banido: true,
            motivo: json.motivo || "Violação das regras e diretrizes da comunidade",
          })
        );
        window.location.href = `/banido?motivo=${encodeURIComponent(json.motivo || "")}`;
      }
    }
    throw new Error(json.erro || "Falha ao criar publicação");
  }

  return json.dados;
}

/**
 * Consulta catálogo completo de tags com contagens abreviadas e paginação
 */
export async function obterTags(
  nicho?: string,
  busca?: string,
  pagina: number = 1,
  limite: number = 30,
  ordenarPor: string = "ranking"
): Promise<{
  totalTagsExistentes: number;
  totalFiltradas: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  temMais: boolean;
  tags: TagItem[];
  nichos: NichoItem[];
}> {
  try {
    const params = new URLSearchParams();
    if (nicho && nicho !== "todos") params.append("nicho", nicho);
    if (busca && busca.trim()) params.append("busca", busca.trim());
    if (pagina) params.append("pagina", String(pagina));
    if (limite) params.append("limite", String(limite));
    if (ordenarPor) params.append("ordenarPor", ordenarPor);

    const res = await fetch(`/api/tags?${params.toString()}`);
    const json = await res.json();
    return {
      totalTagsExistentes: json.totalTagsExistentes || 0,
      totalFiltradas: json.totalFiltradas || json.totalTagsExistentes || 0,
      pagina: json.pagina || pagina,
      limite: json.limite || limite,
      totalPaginas: json.totalPaginas || 1,
      temMais: Boolean(json.temMais),
      tags: json.dados || [],
      nichos: json.nichos || [],
    };
  } catch {
    return {
      totalTagsExistentes: 0,
      totalFiltradas: 0,
      pagina: 1,
      limite,
      totalPaginas: 1,
      temMais: false,
      tags: [],
      nichos: [],
    };
  }
}

/**
 * Consulta a contagem real de uso de uma tag específica no banco de dados
 */
export async function consultarUsoTag(tag: string): Promise<{
  nome: string;
  contagem: number;
  contagemFormatada: string;
  nicho: string;
}> {
  try {
    const res = await fetch(`/api/tags/consultar?tag=${encodeURIComponent(tag.toLowerCase().trim())}`);
    const json = await res.json();
    return json.dados;
  } catch {
    return {
      nome: tag.toLowerCase().trim(),
      contagem: 0,
      contagemFormatada: "0 usos",
      nicho: "geral",
    };
  }
}

/**
 * Consulta lista estruturada de nichos da plataforma
 */
export async function obterNichos(): Promise<NichoItem[]> {
  try {
    const res = await fetch("/api/nichos");
    const json = await res.json();
    return json.dados || [];
  } catch {
    return [];
  }
}

/**
 * Identifica em tempo real o nicho ao qual um conjunto de tags pertence
 */
export async function identificarNichoConteudo(dados: {
  tags?: string[];
  texto?: string;
  categoria?: string;
}): Promise<{
  nichoPrincipal: string;
  nomeNicho: string;
  icone: string;
  nichosSecundarios: string[];
  confianca: number;
  distribuicao: Record<string, number>;
}> {
  try {
    const res = await fetch("/api/tags/identificar-nicho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const json = await res.json();
    return json.dados;
  } catch {
    return {
      nichoPrincipal: "geral",
      nomeNicho: "Geral",
      icone: "💬",
      nichosSecundarios: [],
      confianca: 60,
      distribuicao: { geral: 100 },
    };
  }
}

/**
 * Obtém o perfil dinâmico de interesses e distribuição de afinidades do usuário
 */
export async function obterPerfilInteresses(): Promise<PerfilInteresseItem | null> {
  try {
    const usuarioId = obterUsuarioId();
    const res = await fetch("/api/usuario/interesses", {
      headers: { "x-user-id": usuarioId },
    });
    const json = await res.json();
    return json.perfil || null;
  } catch {
    return null;
  }
}

/**
 * Registra interesse do usuário ao interagir com tags ou nichos
 */
export async function registrarInteresseNicho(dados: {
  tipo: "curtida" | "clique" | "visualizacao";
  nicho?: string;
  tags?: string[];
}): Promise<void> {
  try {
    const usuarioId = obterUsuarioId();
    await fetch("/api/usuario/interesses/interagir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioId,
      },
      body: JSON.stringify(dados),
    });
  } catch {}
}

export async function deletarPublicacao(id: string): Promise<boolean> {
  const usuarioId = obterUsuarioId();
  const resposta = await fetch(`/api/publicacoes/${id}`, {
    method: "DELETE",
    headers: {
      "x-user-id": usuarioId,
    },
  });
  const json = await resposta.json();
  return json.sucesso === true;
}

export async function alternarCurtidaPublicacao(
  id: string,
  forcarStatus?: boolean
): Promise<{
  pub: PublicacaoItem | null;
  curtido: boolean;
  totalLikes: number;
  incrementou: boolean;
  jaCurtiu: boolean;
}> {
  try {
    const usuarioId = obterUsuarioId();
    const params = new URLSearchParams();
    params.set("usuarioId", usuarioId);
    if (forcarStatus !== undefined) {
      params.set("acao", forcarStatus ? "curtir" : "descurtir");
    }

    const url = `/api/publicacoes/${encodeURIComponent(id)}/like?${params.toString()}`;
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioId,
      },
      body: JSON.stringify({
        usuarioId,
        acao:
          forcarStatus !== undefined
            ? forcarStatus
              ? "curtir"
              : "descurtir"
            : "alternar",
      }),
    });

    const json = await resposta.json();
    if (json.sucesso) {
      const estaCurtido = Boolean(json.curtido ?? json.dados?.curtido);
      definirCurtidaLocal(id, estaCurtido);
      const totalLikes =
        typeof json.totalLikes === "number"
          ? json.totalLikes
          : typeof json.likes === "number"
          ? json.likes
          : typeof json.dados?.likes === "number"
          ? json.dados.likes
          : 0;

      return {
        pub: json.dados ? { ...json.dados, curtido: estaCurtido, likes: totalLikes } : null,
        curtido: estaCurtido,
        totalLikes,
        incrementou: estaCurtido,
        jaCurtiu: estaCurtido,
      };
    }
    return { pub: null, curtido: false, totalLikes: 0, incrementou: false, jaCurtiu: false };
  } catch (err) {
    console.error("Erro ao alternar curtida da publicação:", err);
    return { pub: null, curtido: false, totalLikes: 0, incrementou: false, jaCurtiu: false };
  }
}

export async function curtirPublicacao(
  id: string,
  forcarStatus?: boolean
): Promise<{
  pub: PublicacaoItem | null;
  curtido: boolean;
  totalLikes: number;
  incrementou: boolean;
  jaCurtiu: boolean;
}> {
  return alternarCurtidaPublicacao(id, forcarStatus);
}

export async function descurtirPublicacao(id: string): Promise<{
  pub: PublicacaoItem | null;
  curtido: boolean;
  totalLikes: number;
  incrementou: boolean;
  jaCurtiu: boolean;
}> {
  return alternarCurtidaPublicacao(id, false);
}

export async function registrarCliqueLink(id: string): Promise<void> {
  try {
    const usuarioId = obterUsuarioId();
    const jaClicados = obterConjuntoLocal(CHAVE_CLIQUES_LOCAL);
    if (jaClicados.has(id)) {
      return; // Já clicou nesta sessão (1 vez por usuário)
    }
    jaClicados.add(id);
    salvarConjuntoLocal(CHAVE_CLIQUES_LOCAL, jaClicados);

    await fetch(`/api/publicacoes/${id}/clique`, {
      method: "POST",
      headers: {
        "x-user-id": usuarioId,
      },
    });
  } catch {
    // silencioso para não interromper navegação do usuário
  }
}

export async function registrarVisualizacao(id: string): Promise<void> {
  try {
    const usuarioId = obterUsuarioId();
    const jaVistos = obterConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL);
    if (jaVistos.has(id)) {
      return; // Já visualizou (1 vez por usuário)
    }
    jaVistos.add(id);
    salvarConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL, jaVistos);

    await fetch(`/api/publicacoes/${id}/visualizacao`, {
      method: "POST",
      headers: {
        "x-user-id": usuarioId,
      },
    });
  } catch {}
}

export async function registrarVisualizacoesEmLote(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const usuarioId = obterUsuarioId();
    const jaVistos = obterConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL);
    const pendentes = ids.filter((id) => !jaVistos.has(id));

    if (pendentes.length === 0) return;

    for (const id of pendentes) {
      jaVistos.add(id);
    }
    salvarConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL, jaVistos);

    await fetch("/api/publicacoes/visualizacoes-em-lote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioId,
      },
      body: JSON.stringify({ ids: pendentes }),
    });
  } catch {}
}

export interface DadosDenunciaInput {
  motivo: string;
  categoria?: string;
  detalhes?: string;
  denunciante?: string;
  usuarioId?: string;
  usuario?: string;
}

/**
 * Envia uma denúncia funcional contra a publicação para o sistema de moderação
 */
export async function enviarDenunciaPublicacao(
  publicacaoId: string,
  dados: DadosDenunciaInput
): Promise<{ sucesso: boolean; mensagem?: string; erro?: string }> {
  try {
    const usuarioLogado = obterUsuarioId();
    const endpoint = publicacaoId
      ? `/api/publicacoes/${encodeURIComponent(publicacaoId)}/denunciar`
      : `/api/publicacoes/denunciar`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioLogado,
      },
      body: JSON.stringify({
        publicacaoId,
        motivo: dados.motivo,
        categoria: dados.categoria || "Moderação de Comunidade",
        detalhes: dados.detalhes,
        denunciante: dados.denunciante || usuarioLogado,
        usuarioId: dados.usuarioId,
        usuario: dados.usuario,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.erro || json.mensagem || `Erro ao registrar denúncia (${res.status})`);
    }

    return {
      sucesso: true,
      mensagem: json.mensagem || "Denúncia registrada com sucesso para moderação.",
    };
  } catch (err: any) {
    console.error("Erro ao enviar denúncia:", err);
    return {
      sucesso: false,
      erro: err.message || "Não foi possível registrar sua denúncia no momento.",
    };
  }
}

export interface CalculoInteressePeriodoItem {
  periodo: "ontem" | "10d" | "30d";
  label: string;
  totalAcoes: number;
  totalPontos: number;
  totalVisualizacoes: number;
  totalLikes: number;
  totalCliques: number;
  taxaCTR: number;
  classificacao: string;
  distribuicao: Record<string, number>;
  distribuicaoGrupos: Array<{
    grupoNome: string;
    percentual: number;
    pontos: number;
    acoes: number;
  }>;
  topTags: string[];
}

export interface RespostaHistoricoUsuario {
  sucesso: boolean;
  usuarioId: string;
  conteudos: {
    visualizados: PublicacaoItem[];
    curtidos: PublicacaoItem[];
    clicados: PublicacaoItem[];
    totalVisualizados: number;
    totalCurtidos: number;
    totalClicados: number;
  };
  calculadorInteresses: {
    ontem: CalculoInteressePeriodoItem;
    dezDias: CalculoInteressePeriodoItem;
    trintaDias: CalculoInteressePeriodoItem;
  };
}

/**
 * Consulta todos os conteúdos visualizados, curtidos, clicados e o calculador de interesses (ontem, 10d, 30d)
 */
export async function obterHistoricoUsuarioApi(
  usuarioId?: string
): Promise<RespostaHistoricoUsuario | null> {
  try {
    const uid = usuarioId || obterUsuarioId();
    const res = await fetch(
      `/api/publicacoes/historico/usuario?usuarioId=${encodeURIComponent(uid)}`,
      {
        headers: { "x-user-id": uid },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Erro ao obter histórico do usuário:", err);
    return null;
  }
}

/**
 * Reseta o histórico de publicações já vistas pelo usuário para que voltem a aparecer no feed orgânico
 */
export async function resetarVisualizadosApi(usuarioId?: string): Promise<boolean> {
  try {
    const uid = usuarioId || obterUsuarioId();
    const res = await fetch("/api/publicacoes/historico/reset-vistos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": uid,
      },
      body: JSON.stringify({ usuarioId: uid }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

