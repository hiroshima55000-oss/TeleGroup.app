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
  // Otimização de Performance: Se for imagem, redimensiona no navegador para max 1280px e comprime em JPEG
  // Reduz drasticamente o payload de 10-15MB para ~150-250KB sem nenhuma perda perceptível
  if (arquivo.type.startsWith("image/") && typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const blobUrl = URL.createObjectURL(arquivo);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao carregar"));
        img.src = blobUrl;
      });

      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(blobUrl);
        return canvas.toDataURL("image/jpeg", 0.82);
      }
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback seguro caso ocorra erro no canvas
    }
  }

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

const CHAVE_FEED_CACHE_LOCAL = "telegroup_feed_cache_v1";
const CHAVE_MINHAS_PUBS_CACHE = "telegroup_minhas_pubs_v1";
const CHAVE_TAGS_CACHE_LOCAL = "telegroup_tags_cache_v1";
const CHAVE_HISTORICO_CACHE_LOCAL = "telegroup_historico_cache_v1";
const CHAVE_PESQUISA_CACHE_LOCAL = "telegroup_pesquisa_cache_v1";

let feedCacheEmMemoria: PublicacaoItem[] | null = null;
let minhasPubsCacheEmMemoria: PublicacaoItem[] | null = null;
let tagsCacheEmMemoria: TagItem[] | null = null;
let historicoCacheEmMemoria: RespostaHistoricoUsuario | null = null;
let pesquisaCacheEmMemoria: { dados: PublicacaoItem[]; categorias: string[] } | null = null;

export const LIMITE_CACHE_PUBLICACOES = 6;

/**
 * Limpa completamente o cache de publicações da memória RAM, sessionStorage e localStorage.
 * Chamado a cada 6 publicações carregadas para garantir que o navegador não fique sobrecarregado.
 */
export function limparFeedCacheLocal(): void {
  feedCacheEmMemoria = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAVE_FEED_CACHE_LOCAL);
    localStorage.removeItem(CHAVE_FEED_CACHE_LOCAL);
  } catch (err) {
    console.warn("[Cache] Falha ao limpar cache local de publicações:", err);
  }
}

/**
 * Limpa o cache temporário de pesquisa
 */
export function limparPesquisaCacheLocal(): void {
  pesquisaCacheEmMemoria = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAVE_PESQUISA_CACHE_LOCAL);
  } catch {}
}

/**
 * Limpa todos os caches de dados voláteis do navegador para liberação imediata de memória
 */
export function limparTodoCacheNavegador(): void {
  limparFeedCacheLocal();
  limparPesquisaCacheLocal();
  minhasPubsCacheEmMemoria = null;
  tagsCacheEmMemoria = null;
  historicoCacheEmMemoria = null;
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHAVE_MINHAS_PUBS_CACHE);
    sessionStorage.removeItem(CHAVE_TAGS_CACHE_LOCAL);
    sessionStorage.removeItem(CHAVE_HISTORICO_CACHE_LOCAL);
    localStorage.removeItem(CHAVE_MINHAS_PUBS_CACHE);
    localStorage.removeItem(CHAVE_TAGS_CACHE_LOCAL);
    localStorage.removeItem(CHAVE_HISTORICO_CACHE_LOCAL);
  } catch {}
}

export function obterFeedCacheLocal(): PublicacaoItem[] {
  if (feedCacheEmMemoria && feedCacheEmMemoria.length > 0) {
    return feedCacheEmMemoria.slice(0, LIMITE_CACHE_PUBLICACOES);
  }
  if (typeof window === "undefined") return [];
  try {
    const salvo = sessionStorage.getItem(CHAVE_FEED_CACHE_LOCAL) || localStorage.getItem(CHAVE_FEED_CACHE_LOCAL);
    if (salvo) {
      const lista: PublicacaoItem[] = JSON.parse(salvo);
      if (Array.isArray(lista) && lista.length > 0) {
        const lote = lista.slice(0, LIMITE_CACHE_PUBLICACOES);
        feedCacheEmMemoria = lote;
        return lote;
      }
    }
  } catch {}
  return [];
}

export function salvarFeedCacheLocal(dados: PublicacaoItem[]): void {
  // Limpa rigorosamente o cache anterior a cada lote para impedir sobrecarga de memória e cota
  limparFeedCacheLocal();

  if (!Array.isArray(dados) || dados.length === 0) return;

  // Retém no máximo 6 publicações (o lote mais recente carregado)
  const lote6 = dados.slice(-LIMITE_CACHE_PUBLICACOES);
  feedCacheEmMemoria = lote6;

  if (typeof window === "undefined") return;
  try {
    // Sanitiza base64 excessivamente pesado para proteger o navegador contra travamento
    const loteOtimizado = lote6.map((item) => {
      const imagensLeves = (item.imagens || []).map((img) =>
        img && img.length > 350_000 ? "" : img
      ).filter(Boolean);

      return {
        ...item,
        imagens: imagensLeves.length > 0 ? imagensLeves : item.imagens,
      };
    });

    const json = JSON.stringify(loteOtimizado);
    sessionStorage.setItem(CHAVE_FEED_CACHE_LOCAL, json);
    localStorage.setItem(CHAVE_FEED_CACHE_LOCAL, json);
  } catch (err) {
    console.warn("[Cache] Armazenamento do navegador cheio. Limpando cache do feed:", err);
    limparFeedCacheLocal();
  }
}

export function obterMinhasPubsCacheLocal(): PublicacaoItem[] {
  if (minhasPubsCacheEmMemoria) {
    return minhasPubsCacheEmMemoria;
  }
  if (typeof window === "undefined") return [];
  try {
    const salvo = sessionStorage.getItem(CHAVE_MINHAS_PUBS_CACHE) || localStorage.getItem(CHAVE_MINHAS_PUBS_CACHE);
    if (salvo) {
      const lista: PublicacaoItem[] = JSON.parse(salvo);
      if (Array.isArray(lista)) {
        minhasPubsCacheEmMemoria = lista;
        return lista;
      }
    }
  } catch {}
  return [];
}

export function salvarMinhasPubsCacheLocal(dados: PublicacaoItem[]): void {
  minhasPubsCacheEmMemoria = dados;
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(dados);
    sessionStorage.setItem(CHAVE_MINHAS_PUBS_CACHE, json);
    localStorage.setItem(CHAVE_MINHAS_PUBS_CACHE, json);
  } catch {}
}

export function obterTagsCacheLocal(): TagItem[] {
  if (tagsCacheEmMemoria && tagsCacheEmMemoria.length > 0) {
    return tagsCacheEmMemoria;
  }
  if (typeof window === "undefined") return [];
  try {
    const salvo = sessionStorage.getItem(CHAVE_TAGS_CACHE_LOCAL) || localStorage.getItem(CHAVE_TAGS_CACHE_LOCAL);
    if (salvo) {
      const lista: TagItem[] = JSON.parse(salvo);
      if (Array.isArray(lista) && lista.length > 0) {
        tagsCacheEmMemoria = lista;
        return lista;
      }
    }
  } catch {}
  return [];
}

export function salvarTagsCacheLocal(tags: TagItem[]): void {
  if (!Array.isArray(tags)) return;
  tagsCacheEmMemoria = tags;
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(tags.slice(0, 100));
    sessionStorage.setItem(CHAVE_TAGS_CACHE_LOCAL, json);
    localStorage.setItem(CHAVE_TAGS_CACHE_LOCAL, json);
  } catch {}
}

export function obterHistoricoCacheLocal(): RespostaHistoricoUsuario | null {
  if (historicoCacheEmMemoria) return historicoCacheEmMemoria;
  if (typeof window === "undefined") return null;
  try {
    const salvo = sessionStorage.getItem(CHAVE_HISTORICO_CACHE_LOCAL) || localStorage.getItem(CHAVE_HISTORICO_CACHE_LOCAL);
    if (salvo) {
      const parsed: RespostaHistoricoUsuario = JSON.parse(salvo);
      if (parsed && parsed.sucesso) {
        historicoCacheEmMemoria = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
}

export function salvarHistoricoCacheLocal(dados: RespostaHistoricoUsuario): void {
  if (!dados) return;
  historicoCacheEmMemoria = dados;
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(dados);
    sessionStorage.setItem(CHAVE_HISTORICO_CACHE_LOCAL, json);
    localStorage.setItem(CHAVE_HISTORICO_CACHE_LOCAL, json);
  } catch {}
}

export function obterPesquisaCacheLocal(): { dados: PublicacaoItem[]; categorias: string[] } | null {
  if (pesquisaCacheEmMemoria) return pesquisaCacheEmMemoria;
  if (typeof window === "undefined") return null;
  try {
    const salvo = sessionStorage.getItem(CHAVE_PESQUISA_CACHE_LOCAL);
    if (salvo) {
      pesquisaCacheEmMemoria = JSON.parse(salvo);
      return pesquisaCacheEmMemoria;
    }
  } catch {}
  return null;
}

export function salvarPesquisaCacheLocal(dados: PublicacaoItem[], categorias: string[]): void {
  const lote6 = (dados || []).slice(0, LIMITE_CACHE_PUBLICACOES);
  pesquisaCacheEmMemoria = { dados: lote6, categorias };
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHAVE_PESQUISA_CACHE_LOCAL, JSON.stringify({ dados: lote6, categorias }));
  } catch {}
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

    if (apenasMinhas && !filtros.limite) {
      filtros.limite = 1000;
    }

    const resultado = await buscarPublicacoesPaginadas(apenasMinhas, filtros);
    if (apenasMinhas && (!buscaOuFiltros || typeof buscaOuFiltros !== "string")) {
      salvarMinhasPubsCacheLocal(resultado.dados);
    }
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
    const tagsRetornadas = json.dados || [];
    if (!nicho && !busca && pagina === 1 && tagsRetornadas.length > 0) {
      salvarTagsCacheLocal(tagsRetornadas);
    }
    return {
      totalTagsExistentes: json.totalTagsExistentes || 0,
      totalFiltradas: json.totalFiltradas || json.totalTagsExistentes || 0,
      pagina: json.pagina || pagina,
      limite: json.limite || limite,
      totalPaginas: json.totalPaginas || 1,
      temMais: Boolean(json.temMais),
      tags: tagsRetornadas,
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

const filaVisualizacoesLote: Set<string> = new Set();
let timerFlushVisualizacoes: ReturnType<typeof setTimeout> | null = null;

function descarregarFilaVisualizacoes(): void {
  if (filaVisualizacoesLote.size === 0) return;
  const idsParaEnviar = Array.from(filaVisualizacoesLote);
  filaVisualizacoesLote.clear();
  const usuarioId = obterUsuarioId();
  fetch("/api/publicacoes/visualizacoes-em-lote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
    },
    body: JSON.stringify({ ids: idsParaEnviar }),
  }).catch(() => {});
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", descarregarFilaVisualizacoes);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      descarregarFilaVisualizacoes();
    }
  });
}

export async function registrarVisualizacao(id: string): Promise<void> {
  try {
    const jaVistos = obterConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL);
    if (jaVistos.has(id)) {
      return; // Já visualizou (1 vez por usuário)
    }
    jaVistos.add(id);
    salvarConjuntoLocal(CHAVE_VISUALIZACOES_LOCAL, jaVistos);

    filaVisualizacoesLote.add(id);
    // Se acumulou 6 ou mais, descarrega imediatamente
    if (filaVisualizacoesLote.size >= 6) {
      if (timerFlushVisualizacoes) clearTimeout(timerFlushVisualizacoes);
      descarregarFilaVisualizacoes();
    } else if (!timerFlushVisualizacoes) {
      // Caso contrário, consolida em janela de 1.5s
      timerFlushVisualizacoes = setTimeout(() => {
        timerFlushVisualizacoes = null;
        descarregarFilaVisualizacoes();
      }, 1500);
    }
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

export interface TagRankeadaInteresse {
  posicao: number;
  tag: string;
  slug: string;
  pontos: number;
  percentual: number;
  totalAcoes: number;
  visualizacoes: number;
  likes: number;
  cliques: number;
  nivelAfinidade: "Alta" | "Média" | "Em Alta";
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
  tagsRankeadas?: TagRankeadaInteresse[];
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
  tagsRankeadasGerais?: TagRankeadaInteresse[];
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
    const json = await res.json();
    if (json && json.sucesso) {
      salvarHistoricoCacheLocal(json);
    }
    return json;
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

