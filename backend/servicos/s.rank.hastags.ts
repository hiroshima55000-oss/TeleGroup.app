import { RepositorioPublicacoes } from "../repositorios/repositorio.publicacoes";
import { RepositorioCampanhas } from "../repositorios/repositorio.campanhas";

export interface TagItem {
  rank: number;
  nome: string;
  slug: string;
  nicho: string;
  contagemBase: number;
  contagemReal: number;
  contagemTotal: number;
  contagemFormatada: string;
  popular: boolean;
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

export interface FiltrosRankingTags {
  nicho?: string;
  busca?: string;
  pagina?: number;
  limite?: number;
  ordenarPor?: "ranking" | "alfabetica" | "recentes";
}

export interface RespostaRankingTags {
  sucesso: boolean;
  totalTagsExistentes: number;
  totalFiltradas: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  temMais: boolean;
  dados: TagItem[];
  nichos: NichoItem[];
  timestamp: string;
}

// Catálogo base de hashtags do ecossistema Telegram (contagens 100% reais)
const CATALOGO_BASE_TAGS: Array<{ slug: string; nicho: string; contagemBase: number }> = [
  // Tecnologia & IA
  { slug: "tecnologia", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "programacao", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "ia", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "inteligenciaartificial", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "python", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "javascript", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "cybersecurity", nicho: "Tecnologia", contagemBase: 0 },
  { slug: "chatgpt", nicho: "Tecnologia", contagemBase: 0 },

  // Marketing & Negócios
  { slug: "marketing", nicho: "Marketing", contagemBase: 0 },
  { slug: "marketingdigital", nicho: "Marketing", contagemBase: 0 },
  { slug: "empreendedorismo", nicho: "Marketing", contagemBase: 0 },
  { slug: "vendas", nicho: "Marketing", contagemBase: 0 },
  { slug: "trafego", nicho: "Marketing", contagemBase: 0 },
  { slug: "dropshipping", nicho: "Marketing", contagemBase: 0 },
  { slug: "afiliados", nicho: "Marketing", contagemBase: 0 },
  { slug: "negocios", nicho: "Marketing", contagemBase: 0 },

  // Finanças & Cripto
  { slug: "cripto", nicho: "Finanças", contagemBase: 0 },
  { slug: "bitcoin", nicho: "Finanças", contagemBase: 0 },
  { slug: "investimentos", nicho: "Finanças", contagemBase: 0 },
  { slug: "financas", nicho: "Finanças", contagemBase: 0 },
  { slug: "rendaextra", nicho: "Finanças", contagemBase: 0 },
  { slug: "daytrade", nicho: "Finanças", contagemBase: 0 },
  { slug: "bolsadevalores", nicho: "Finanças", contagemBase: 0 },

  // Educação & Concursos
  { slug: "cursos", nicho: "Educação", contagemBase: 0 },
  { slug: "livros", nicho: "Educação", contagemBase: 0 },
  { slug: "concursos", nicho: "Educação", contagemBase: 0 },
  { slug: "estudos", nicho: "Educação", contagemBase: 0 },
  { slug: "idiomas", nicho: "Educação", contagemBase: 0 },
  { slug: "ingles", nicho: "Educação", contagemBase: 0 },

  // Entretenimento & Mídia
  { slug: "humor", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "memes", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "filmes", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "series", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "animes", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "games", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "musica", nicho: "Entretenimento", contagemBase: 0 },
  { slug: "futebol", nicho: "Entretenimento", contagemBase: 0 },

  // Utilidades, Ofertas e Notícias
  { slug: "promocoes", nicho: "Ofertas", contagemBase: 0 },
  { slug: "cupons", nicho: "Ofertas", contagemBase: 0 },
  { slug: "descontos", nicho: "Ofertas", contagemBase: 0 },
  { slug: "vagas", nicho: "Utilidades", contagemBase: 0 },
  { slug: "noticias", nicho: "Notícias", contagemBase: 0 },
  { slug: "telegram", nicho: "Geral", contagemBase: 0 },
  { slug: "canais", nicho: "Geral", contagemBase: 0 },
  { slug: "grupos", nicho: "Geral", contagemBase: 0 },
];

const NICHOS_ESTRUTURADOS: NichoItem[] = [
  {
    id: "tecnologia",
    nome: "Tecnologia",
    icone: "💻",
    descricao: "Programação, Inteligência Artificial, TI e Inovação",
    tagsPrincipais: ["tecnologia", "programacao", "ia", "python", "javascript"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "marketing",
    nome: "Marketing",
    icone: "📈",
    descricao: "Marketing Digital, Tráfego Pago, Vendas e Empreendedorismo",
    tagsPrincipais: ["marketing", "marketingdigital", "vendas", "empreendedorismo", "trafego"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "financas",
    nome: "Finanças",
    icone: "💰",
    descricao: "Investimentos, Criptomoedas, Bitcoin, Renda Extra e Ações",
    tagsPrincipais: ["cripto", "bitcoin", "investimentos", "financas", "rendaextra"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "educacao",
    nome: "Educação",
    icone: "📚",
    descricao: "Cursos gratuitos, Livros, Concursos Públicos e Estudos",
    tagsPrincipais: ["cursos", "livros", "concursos", "estudos", "idiomas"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "entretenimento",
    nome: "Entretenimento",
    icone: "🎬",
    descricao: "Filmes, Séries, Memes, Humor, Animes, Games e Futebol",
    tagsPrincipais: ["humor", "memes", "filmes", "series", "games", "animes"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "ofertas",
    nome: "Ofertas",
    icone: "🏷️",
    descricao: "Promoções diárias, Cupons de desconto e Achadinhos",
    tagsPrincipais: ["promocoes", "cupons", "descontos"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
  {
    id: "geral",
    nome: "Geral",
    icone: "📢",
    descricao: "Comunidades abertas e canais diversos do Telegram",
    tagsPrincipais: ["telegram", "canais", "grupos"],
    totalPublicacoes: 0,
    totalPublicacoesFormatado: "0 comunidades",
  },
];

function normalizarTag(tag: string): string {
  return (tag || "")
    .toLowerCase()
    .trim()
    .replace(/^#+/, "")
    .replace(/[^\w\d_áàâãéêíóôõúç-]/gi, "");
}

function adivinharNicho(slug: string, categoria?: string): string {
  const s = slug.toLowerCase();
  const c = (categoria || "").toLowerCase();

  if (s.includes("prog") || s.includes("dev") || s.includes("tec") || s.includes("ia") || s.includes("code") || c.includes("tec")) {
    return "Tecnologia";
  }
  if (s.includes("mark") || s.includes("vend") || s.includes("traf") || s.includes("afili") || s.includes("drop") || c.includes("mark")) {
    return "Marketing";
  }
  if (s.includes("cript") || s.includes("btc") || s.includes("invest") || s.includes("dinheiro") || s.includes("finan") || c.includes("finan")) {
    return "Finanças";
  }
  if (s.includes("curs") || s.includes("livro") || s.includes("estud") || s.includes("concurs") || c.includes("educ")) {
    return "Educação";
  }
  if (s.includes("humor") || s.includes("meme") || s.includes("film") || s.includes("serie") || s.includes("game") || s.includes("fut") || c.includes("entre")) {
    return "Entretenimento";
  }
  if (s.includes("promo") || s.includes("cupom") || s.includes("descont") || c.includes("oferta")) {
    return "Ofertas";
  }
  return "Geral";
}

let cacheTimestamp = 0;
let cacheListaTags: TagItem[] = [];
let cacheNichos: NichoItem[] = [];
const TEMPO_CACHE_MS = 60 * 1000; // 1 minuto de cache em memória

export const RankHashtagsServico = {
  /**
   * Coleta todas as tags cadastradas nas publicações e campanhas da plataforma
   * e as consolida com o ranking geral de popularidade.
   */
  async compilarRanking(): Promise<{ tags: TagItem[]; nichos: NichoItem[] }> {
    const agora = Date.now();
    if (cacheListaTags.length > 0 && agora - cacheTimestamp < TEMPO_CACHE_MS) {
      return { tags: cacheListaTags, nichos: cacheNichos };
    }

    // Mapa para agregar contagens reais de publicações e campanhas
    const contagensReais = new Map<string, { contagem: number; nichoDetectado?: string }>();

    try {
      const { itens: publicacoes } = await RepositorioPublicacoes.buscarComFiltros({ limite: 10000 });
      for (const pub of publicacoes) {
        const tagsDaPub = new Set<string>();

        // Tags do campo array
        if (Array.isArray(pub.tags)) {
          pub.tags.forEach((t) => {
            const limpa = normalizarTag(t);
            if (limpa) tagsDaPub.add(limpa);
          });
        }

        // Tags extraídas da descrição (#palavra)
        if (pub.descricao) {
          const matches = pub.descricao.match(/#([\w\d_áàâãéêíóôõúç-]+)/gi);
          if (matches) {
            matches.forEach((m) => {
              const limpa = normalizarTag(m);
              if (limpa) tagsDaPub.add(limpa);
            });
          }
        }

        // Tag da própria categoria
        if (pub.categoria) {
          const limpaCat = normalizarTag(pub.categoria);
          if (limpaCat) tagsDaPub.add(limpaCat);
        }

        for (const t of tagsDaPub) {
          const atual = contagensReais.get(t) || { contagem: 0, nichoDetectado: adivinharNicho(t, pub.categoria) };
          atual.contagem += 1;
          contagensReais.set(t, atual);
        }
      }
    } catch (err) {
      console.warn("[RankHashtagsServico] Aviso ao ler publicações para ranking de tags:", err);
    }

    try {
      const campanhas = await RepositorioCampanhas.buscarTodas();
      for (const camp of campanhas) {
        if (Array.isArray(camp.tags)) {
          camp.tags.forEach((t) => {
            const limpa = normalizarTag(t);
            if (limpa) {
              const atual = contagensReais.get(limpa) || { contagem: 0, nichoDetectado: adivinharNicho(limpa, camp.categoria) };
              atual.contagem += 1;
              contagensReais.set(limpa, atual);
            }
          });
        }
      }
    } catch {}

    // Monta mapa geral unindo catálogo base e ocorrências reais
    const mapaGeral = new Map<string, { slug: string; nicho: string; contagemBase: number; contagemReal: number }>();

    for (const item of CATALOGO_BASE_TAGS) {
      mapaGeral.set(item.slug, {
        slug: item.slug,
        nicho: item.nicho,
        contagemBase: item.contagemBase,
        contagemReal: 0,
      });
    }

    for (const [slug, info] of contagensReais.entries()) {
      const existente = mapaGeral.get(slug);
      if (existente) {
        existente.contagemReal += info.contagem;
      } else {
        mapaGeral.set(slug, {
          slug,
          nicho: info.nichoDetectado || adivinharNicho(slug),
          contagemBase: 0,
          contagemReal: info.contagem,
        });
      }
    }

    // Transforma em array e ordena por contagem total decrescente
    const listaOrdenada = Array.from(mapaGeral.values())
      .map((item) => {
        const contagemTotal = item.contagemReal;
        return {
          rank: 0,
          nome: item.slug,
          slug: item.slug,
          nicho: item.nicho,
          contagemBase: 0,
          contagemReal: item.contagemReal,
          contagemTotal,
          contagemFormatada: contagemTotal === 1 ? "1 uso" : `${contagemTotal.toLocaleString("pt-BR")} usos`,
          popular: false,
        };
      })
      .sort((a, b) => b.contagemTotal - a.contagemTotal)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        popular: idx < 15 && item.contagemTotal > 0,
      }));

    // Atualiza contadores dos nichos
    const nichosAtualizados = NICHOS_ESTRUTURADOS.map((nicho) => {
      const tagsDoNicho = listaOrdenada.filter(
        (t) => t.nicho.toLowerCase() === nicho.nome.toLowerCase() || nicho.tagsPrincipais.includes(t.slug)
      );
      const somaPublicacoes = tagsDoNicho.reduce((acc, cur) => acc + cur.contagemReal, 0);
      return {
        ...nicho,
        totalPublicacoes: somaPublicacoes,
        totalPublicacoesFormatado: somaPublicacoes === 1 ? "1 comunidade" : `${somaPublicacoes.toLocaleString("pt-BR")} comunidades`,
      };
    });

    cacheListaTags = listaOrdenada;
    cacheNichos = nichosAtualizados;
    cacheTimestamp = agora;

    return { tags: listaOrdenada, nichos: nichosAtualizados };
  },

  /**
   * Obtém lista de tags paginada com suporte a filtros de busca e nicho
   * Consumido diretamente pela tela de usuário /tags (TelaRankingTags)
   */
  async obterRanking(filtros: FiltrosRankingTags = {}): Promise<RespostaRankingTags> {
    const { tags: todas, nichos } = await this.compilarRanking();

    let filtradas = [...todas];

    // Filtro por nicho
    if (filtros.nicho && filtros.nicho !== "todos") {
      const nichoAlvo = filtros.nicho.toLowerCase().trim();
      filtradas = filtradas.filter((t) => t.nicho.toLowerCase() === nichoAlvo);
    }

    // Filtro por busca textual (nome, slug ou nicho)
    if (filtros.busca && filtros.busca.trim()) {
      const termo = normalizarTag(filtros.busca);
      filtradas = filtradas.filter(
        (t) => t.slug.includes(termo) || t.nicho.toLowerCase().includes(termo)
      );
    }

    // Ordenação
    if (filtros.ordenarPor === "alfabetica") {
      filtradas.sort((a, b) => a.slug.localeCompare(b.slug));
    } else {
      filtradas.sort((a, b) => a.rank - b.rank);
    }

    const totalTagsExistentes = todas.length;
    const totalFiltradas = filtradas.length;
    const pagina = Math.max(1, Number(filtros.pagina) || 1);
    const limite = Math.max(1, Math.min(100, Number(filtros.limite) || 50));
    const offset = (pagina - 1) * limite;
    const totalPaginas = Math.ceil(totalFiltradas / limite) || 1;
    const dadosPaginados = filtradas.slice(offset, offset + limite);
    const temMais = pagina < totalPaginas;

    return {
      sucesso: true,
      totalTagsExistentes,
      totalFiltradas,
      pagina,
      limite,
      totalPaginas,
      temMais,
      dados: dadosPaginados,
      nichos,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Consulta a contagem e nicho de uma hashtag específica
   */
  async consultarUsoTag(tagParam: string): Promise<{
    nome: string;
    contagem: number;
    contagemFormatada: string;
    nicho: string;
  }> {
    const slug = normalizarTag(tagParam);
    const { tags } = await this.compilarRanking();
    const encontrada = tags.find((t) => t.slug === slug);

    if (encontrada) {
      return {
        nome: encontrada.slug,
        contagem: encontrada.contagemTotal,
        contagemFormatada: encontrada.contagemFormatada,
        nicho: encontrada.nicho,
      };
    }

    return {
      nome: slug,
      contagem: 1,
      contagemFormatada: "1 uso",
      nicho: adivinharNicho(slug),
    };
  },

  /**
   * Retorna os nichos estruturados
   */
  async obterNichos(): Promise<NichoItem[]> {
    const { nichos } = await this.compilarRanking();
    return nichos;
  },

  /**
   * Força a invalidação do cache para recálculo imediato de contagens
   */
  async sincronizar(): Promise<{ totalTags: number; timestamp: string }> {
    cacheTimestamp = 0;
    const { tags } = await this.compilarRanking();
    return {
      totalTags: tags.length,
      timestamp: new Date().toISOString(),
    };
  },
};

export default RankHashtagsServico;
