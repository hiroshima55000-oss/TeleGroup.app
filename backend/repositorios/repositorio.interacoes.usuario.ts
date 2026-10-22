import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { RepositorioPublicacoes } from "./repositorio.publicacoes";
import { Publicacao } from "../schemas/schema.publicacoes";

export interface RegistroInteracaoItem {
  id: string;
  usuarioId: string;
  publicacaoId: string;
  tipo: "visualizacao" | "like" | "clique";
  timestamp: string; // ISO string
  tags?: string[];
  categoria?: string;
  nicho?: string;
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

export interface CalculoInteressePeriodo {
  periodo: "ontem" | "10d" | "30d";
  label: string;
  dataInicio: string;
  dataFim: string;
  totalAcoes: number;
  totalPontos: number;
  totalVisualizacoes: number;
  totalLikes: number;
  totalCliques: number;
  taxaCTR: number;
  classificacao: string;
  distribuicao: Record<string, number>; // { "marketing": 45.2, "tecnologia": 30.1 }
  distribuicaoGrupos: Array<{
    grupoNome: string;
    percentual: number;
    pontos: number;
    acoes: number;
  }>;
  topTags: string[];
  tagsRankeadas: TagRankeadaInteresse[];
}

const ARQUIVO_INTERACOES = path.resolve(
  process.cwd(),
  "usuarios_interacoes_detalhadas.dados.json"
);

interface DadosPersistidosInteracoes {
  curtidasPorUsuario: Record<string, string[]>; // usuarioId -> [pubId1, pubId2]
  visualizadosPorUsuario: Record<string, string[]>; // usuarioId -> [pubId1, pubId2]
  clicadosPorUsuario: Record<string, string[]>; // usuarioId -> [pubId1, pubId2]
  historicoEventos: RegistroInteracaoItem[]; // Todos os eventos com timestamps
}

function lerDadosInteracoes(): DadosPersistidosInteracoes {
  try {
    if (fs.existsSync(ARQUIVO_INTERACOES)) {
      const conteudo = fs.readFileSync(ARQUIVO_INTERACOES, "utf-8");
      const parsed = JSON.parse(conteudo || "{}");
      return {
        curtidasPorUsuario: parsed.curtidasPorUsuario || {},
        visualizadosPorUsuario: parsed.visualizadosPorUsuario || {},
        clicadosPorUsuario: parsed.clicadosPorUsuario || {},
        historicoEventos: Array.isArray(parsed.historicoEventos)
          ? parsed.historicoEventos
          : [],
      };
    }
  } catch (err) {
    console.warn("[RepositorioInteracoes] Erro ao ler interações:", err);
  }
  return {
    curtidasPorUsuario: {},
    visualizadosPorUsuario: {},
    clicadosPorUsuario: {},
    historicoEventos: [],
  };
}

function salvarDadosInteracoes(dados: DadosPersistidosInteracoes): void {
  try {
    // Mantém no máximo os últimos 15.000 eventos detalhados para não inflar o disco
    if (dados.historicoEventos.length > 15000) {
      dados.historicoEventos = dados.historicoEventos.slice(0, 15000);
    }
    fs.writeFileSync(
      ARQUIVO_INTERACOES,
      JSON.stringify(dados, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("[RepositorioInteracoes] Erro ao salvar interações:", err);
  }
}

export const RepositorioInteracoesUsuario = {
  /**
   * =========================================================
   * GESTÃO DE CURTIDAS (IMPEDE MÚLTIPLOS LIKES POR USUÁRIO)
   * =========================================================
   */
  jaCurtiu(usuarioId: string, publicacaoId: string): boolean {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return false;

    const dados = lerDadosInteracoes();
    const lista = dados.curtidasPorUsuario[uid] || [];
    return lista.includes(pid);
  },

  registrarCurtida(
    usuarioId: string,
    publicacaoId: string,
    tags?: string[],
    categoria?: string,
    nicho?: string
  ): boolean {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return false;

    const dados = lerDadosInteracoes();
    if (!dados.curtidasPorUsuario[uid]) {
      dados.curtidasPorUsuario[uid] = [];
    }

    if (dados.curtidasPorUsuario[uid].includes(pid)) {
      return false; // Já curtiu anteriormente
    }

    dados.curtidasPorUsuario[uid].push(pid);

    // Registra evento no histórico com timestamp
    const evento: RegistroInteracaoItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuarioId: uid,
      publicacaoId: pid,
      tipo: "like",
      timestamp: new Date().toISOString(),
      tags,
      categoria,
      nicho,
    };
    dados.historicoEventos.unshift(evento);

    salvarDadosInteracoes(dados);
    return true;
  },

  removerCurtida(usuarioId: string, publicacaoId: string): boolean {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return false;

    const dados = lerDadosInteracoes();
    const lista = dados.curtidasPorUsuario[uid] || [];
    const index = lista.indexOf(pid);
    if (index === -1) {
      return false; // Não estava curtido
    }

    lista.splice(index, 1);
    dados.curtidasPorUsuario[uid] = lista;

    // Registra no histórico remoção ou apenas atualiza
    salvarDadosInteracoes(dados);
    return true;
  },

  obterIdsCurtidos(usuarioId: string): Set<string> {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    return new Set(dados.curtidasPorUsuario[uid] || []);
  },

  /**
   * =========================================================
   * GESTÃO DE VISUALIZAÇÕES (NÃO REPETE CONTEÚDO ORGÂNICO VISTO)
   * =========================================================
   */
  jaViu(usuarioId: string, publicacaoId: string): boolean {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return false;

    const dados = lerDadosInteracoes();
    const lista = dados.visualizadosPorUsuario[uid] || [];
    return lista.includes(pid);
  },

  registrarVisualizacao(
    usuarioId: string,
    publicacaoId: string,
    tags?: string[],
    categoria?: string,
    nicho?: string
  ): boolean {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return false;

    const dados = lerDadosInteracoes();
    if (!dados.visualizadosPorUsuario[uid]) {
      dados.visualizadosPorUsuario[uid] = [];
    }

    const jaVisto = dados.visualizadosPorUsuario[uid].includes(pid);
    if (!jaVisto) {
      dados.visualizadosPorUsuario[uid].push(pid);
    }

    // Registra evento com timestamp (útil para o calculador de interesses)
    const evento: RegistroInteracaoItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuarioId: uid,
      publicacaoId: pid,
      tipo: "visualizacao",
      timestamp: new Date().toISOString(),
      tags,
      categoria,
      nicho,
    };
    dados.historicoEventos.unshift(evento);

    salvarDadosInteracoes(dados);
    return !jaVisto;
  },

  obterIdsVistos(usuarioId: string): Set<string> {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    return new Set(dados.visualizadosPorUsuario[uid] || []);
  },

  limparVisualizacoes(usuarioId: string): void {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    dados.visualizadosPorUsuario[uid] = [];
    salvarDadosInteracoes(dados);
  },

  /**
   * =========================================================
   * GESTÃO DE CLIQUES
   * =========================================================
   */
  registrarClique(
    usuarioId: string,
    publicacaoId: string,
    tags?: string[],
    categoria?: string,
    nicho?: string
  ): void {
    const uid = (usuarioId || "usr_anonimo").trim();
    const pid = (publicacaoId || "").trim();
    if (!pid) return;

    const dados = lerDadosInteracoes();
    if (!dados.clicadosPorUsuario[uid]) {
      dados.clicadosPorUsuario[uid] = [];
    }

    if (!dados.clicadosPorUsuario[uid].includes(pid)) {
      dados.clicadosPorUsuario[uid].push(pid);
    }

    const evento: RegistroInteracaoItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuarioId: uid,
      publicacaoId: pid,
      tipo: "clique",
      timestamp: new Date().toISOString(),
      tags,
      categoria,
      nicho,
    };
    dados.historicoEventos.unshift(evento);

    salvarDadosInteracoes(dados);
  },

  obterIdsClicados(usuarioId: string): Set<string> {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    return new Set(dados.clicadosPorUsuario[uid] || []);
  },

  /**
   * =========================================================
   * OBTENÇÃO COMPLETA DE CONTEÚDOS COM DADOS DAS PUBLICAÇÕES
   * =========================================================
   */
  async obterConteudosDoUsuario(usuarioId: string): Promise<{
    visualizados: Publicacao[];
    curtidos: Publicacao[];
    clicados: Publicacao[];
    totalVisualizados: number;
    totalCurtidos: number;
    totalClicados: number;
  }> {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();

    const idsVistos = dados.visualizadosPorUsuario[uid] || [];
    const idsCurtidos = dados.curtidasPorUsuario[uid] || [];
    const idsClicados = dados.clicadosPorUsuario[uid] || [];

    const todas = await RepositorioPublicacoes.buscarTodas();
    const mapaPubs = new Map<string, Publicacao>();
    for (const p of todas) {
      mapaPubs.set(p.id, p);
    }

    // Marca curtido com precisão baseada no id do usuário
    const setCurtidos = new Set(idsCurtidos);

    const pubsVisualizadas = idsVistos
      .map((id) => mapaPubs.get(id))
      .filter((p): p is Publicacao => Boolean(p))
      .map((p) => ({ ...p, curtido: setCurtidos.has(p.id) }));

    const pubsCurtidas = idsCurtidos
      .map((id) => mapaPubs.get(id))
      .filter((p): p is Publicacao => Boolean(p))
      .map((p) => ({ ...p, curtido: true }));

    const pubsClicadas = idsClicados
      .map((id) => mapaPubs.get(id))
      .filter((p): p is Publicacao => Boolean(p))
      .map((p) => ({ ...p, curtido: setCurtidos.has(p.id) }));

    return {
      visualizados: pubsVisualizadas,
      curtidos: pubsCurtidas,
      clicados: pubsClicadas,
      totalVisualizados: pubsVisualizadas.length,
      totalCurtidos: pubsCurtidas.length,
      totalClicados: pubsClicadas.length,
    };
  },

  /**
   * =========================================================
   * CALCULADOR DE INTERESSES (ONTEM, 10 DIAS, 30 DIAS)
   * =========================================================
   */
  async calcularInteresses(
    usuarioId: string,
    periodo: "ontem" | "10d" | "30d",
    mapaPubsExterno?: Map<string, Publicacao>
  ): Promise<CalculoInteressePeriodo> {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    const agora = Date.now();

    // Carrega mapa de publicações para resolver tags completas de cada post interagido
    let mapaPubs = mapaPubsExterno;
    if (!mapaPubs) {
      try {
        const todas = await RepositorioPublicacoes.buscarTodas();
        mapaPubs = new Map<string, Publicacao>();
        for (const p of todas) {
          mapaPubs.set(p.id, p);
        }
      } catch {
        mapaPubs = new Map<string, Publicacao>();
      }
    }

    let inicioMs = 0;
    let fimMs = agora;
    let label = "";

    const MS_POR_DIA = 24 * 60 * 60 * 1000;

    if (periodo === "ontem") {
      // Ontem: janela de 24h a 48h atrás (ou dia anterior completo)
      inicioMs = agora - 2 * MS_POR_DIA;
      fimMs = agora - MS_POR_DIA;
      label = "Interesse de Ontem";
    } else if (periodo === "10d") {
      // Últimos 10 dias
      inicioMs = agora - 10 * MS_POR_DIA;
      label = "Interesse dos Últimos 10 Dias";
    } else {
      // Últimos 30 dias
      inicioMs = agora - 30 * MS_POR_DIA;
      label = "Interesse dos Últimos 30 Dias";
    }

    // Filtra eventos do usuário no período
    const eventosFiltrados = dados.historicoEventos.filter((ev) => {
      if (ev.usuarioId !== uid) return false;
      const ts = new Date(ev.timestamp).getTime();
      return ts >= inicioMs && ts <= fimMs;
    });

    // Se o usuário não teve eventos no dia de ontem, estende para as últimas 24h
    // para não entregar um resultado vazio se ele interagiu hoje/ontem
    let eventosParaCalculo = eventosFiltrados;
    if (periodo === "ontem" && eventosFiltrados.length === 0) {
      const inicio24h = agora - 1 * MS_POR_DIA;
      eventosParaCalculo = dados.historicoEventos.filter((ev) => {
        if (ev.usuarioId !== uid) return false;
        const ts = new Date(ev.timestamp).getTime();
        return ts >= inicio24h;
      });
    }

    // Pesos do algoritmo de engajamento
    const PESO_VISUALIZACAO = 1.0;
    const PESO_LIKE = 4.0;
    const PESO_CLIQUE = 6.0;

    let totalPontos = 0;
    let totalVis = 0;
    let totalLikes = 0;
    let totalCliques = 0;

    const mapaCategorias: Record<string, { pontos: number; acoes: number }> = {};
    const mapaTagsDetalhe: Record<
      string,
      {
        pontos: number;
        totalAcoes: number;
        visualizacoes: number;
        likes: number;
        cliques: number;
      }
    > = {};

    function computarTags(tags: string[] | undefined, peso: number, tipo: "visualizacao" | "like" | "clique") {
      if (!Array.isArray(tags)) return;
      for (const t of tags) {
        const tLimpa = (t || "").toLowerCase().replace(/^#+/, "").trim();
        if (!tLimpa) continue;
        if (!mapaTagsDetalhe[tLimpa]) {
          mapaTagsDetalhe[tLimpa] = {
            pontos: 0,
            totalAcoes: 0,
            visualizacoes: 0,
            likes: 0,
            cliques: 0,
          };
        }
        mapaTagsDetalhe[tLimpa].pontos += peso;
        mapaTagsDetalhe[tLimpa].totalAcoes += 1;
        if (tipo === "like") {
          mapaTagsDetalhe[tLimpa].likes += 1;
        } else if (tipo === "clique") {
          mapaTagsDetalhe[tLimpa].cliques += 1;
        } else {
          mapaTagsDetalhe[tLimpa].visualizacoes += 1;
        }
      }
    }

    for (const ev of eventosParaCalculo) {
      let peso = PESO_VISUALIZACAO;
      if (ev.tipo === "like") {
        peso = PESO_LIKE;
        totalLikes++;
      } else if (ev.tipo === "clique") {
        peso = PESO_CLIQUE;
        totalCliques++;
      } else {
        totalVis++;
      }

      totalPontos += peso;

      // Categoria ou nicho
      const cat = (ev.categoria || ev.nicho || "Geral").toLowerCase().trim();
      if (!mapaCategorias[cat]) {
        mapaCategorias[cat] = { pontos: 0, acoes: 0 };
      }
      mapaCategorias[cat].pontos += peso;
      mapaCategorias[cat].acoes += 1;

      // Tags: utiliza as do evento ou busca na publicação vinculada
      let tagsParaProcessar = ev.tags;
      if (!tagsParaProcessar || tagsParaProcessar.length === 0) {
        const pubRef = mapaPubs?.get(ev.publicacaoId);
        if (pubRef?.tags && pubRef.tags.length > 0) {
          tagsParaProcessar = pubRef.tags;
        }
      }
      computarTags(tagsParaProcessar, peso, ev.tipo);
    }

    // Se ainda não houver eventos registrados no intervalo exato, injeta dados
    // com base nas curtidas, cliques e visualizações já salvas do usuário
    if (totalPontos === 0) {
      const vistos = dados.visualizadosPorUsuario[uid] || [];
      const curtidos = dados.curtidasPorUsuario[uid] || [];
      const clicados = dados.clicadosPorUsuario[uid] || [];

      totalVis = vistos.length;
      totalLikes = curtidos.length;
      totalCliques = clicados.length;
      totalPontos =
        totalVis * PESO_VISUALIZACAO +
        totalLikes * PESO_LIKE +
        totalCliques * PESO_CLIQUE;

      // Processa tags das publicações interagidas
      for (const pid of curtidos) {
        const pub = mapaPubs?.get(pid);
        if (pub) {
          const cat = (pub.categoria || pub.nicho || "Geral").toLowerCase().trim();
          mapaCategorias[cat] = mapaCategorias[cat] || { pontos: 0, acoes: 0 };
          mapaCategorias[cat].pontos += PESO_LIKE;
          mapaCategorias[cat].acoes += 1;
          computarTags(pub.tags, PESO_LIKE, "like");
        }
      }
      for (const pid of clicados) {
        const pub = mapaPubs?.get(pid);
        if (pub) {
          const cat = (pub.categoria || pub.nicho || "Geral").toLowerCase().trim();
          mapaCategorias[cat] = mapaCategorias[cat] || { pontos: 0, acoes: 0 };
          mapaCategorias[cat].pontos += PESO_CLIQUE;
          mapaCategorias[cat].acoes += 1;
          computarTags(pub.tags, PESO_CLIQUE, "clique");
        }
      }
      for (const pid of vistos) {
        const pub = mapaPubs?.get(pid);
        if (pub) {
          const cat = (pub.categoria || pub.nicho || "Geral").toLowerCase().trim();
          mapaCategorias[cat] = mapaCategorias[cat] || { pontos: 0, acoes: 0 };
          mapaCategorias[cat].pontos += PESO_VISUALIZACAO;
          mapaCategorias[cat].acoes += 1;
          computarTags(pub.tags, PESO_VISUALIZACAO, "visualizacao");
        }
      }

      if (totalPontos === 0) {
        totalPontos = 1;
        mapaCategorias["comunidades"] = { pontos: 1, acoes: 1 };
      }
    }

    // Se as tags ainda estiverem vazias mas o usuário tem itens curtidos/vistos globais,
    // calcula também para garantir que as tags ranqueadas por interesse sejam sempre exibidas
    if (Object.keys(mapaTagsDetalhe).length === 0) {
      const curtidos = dados.curtidasPorUsuario[uid] || [];
      const clicados = dados.clicadosPorUsuario[uid] || [];
      const vistos = dados.visualizadosPorUsuario[uid] || [];

      for (const pid of curtidos) {
        const pub = mapaPubs?.get(pid);
        if (pub?.tags) computarTags(pub.tags, PESO_LIKE, "like");
      }
      for (const pid of clicados) {
        const pub = mapaPubs?.get(pid);
        if (pub?.tags) computarTags(pub.tags, PESO_CLIQUE, "clique");
      }
      for (const pid of vistos) {
        const pub = mapaPubs?.get(pid);
        if (pub?.tags) computarTags(pub.tags, PESO_VISUALIZACAO, "visualizacao");
      }
    }

    // Distribuição percentual por grupo / categoria
    const distribuicao: Record<string, number> = {};
    const distribuicaoGrupos: Array<{
      grupoNome: string;
      percentual: number;
      pontos: number;
      acoes: number;
    }> = [];

    for (const [cat, dadosCat] of Object.entries(mapaCategorias)) {
      const pct = Number(((dadosCat.pontos / totalPontos) * 100).toFixed(1));
      distribuicao[cat] = pct;
      distribuicaoGrupos.push({
        grupoNome: cat.charAt(0).toUpperCase() + cat.slice(1),
        percentual: pct,
        pontos: Number(dadosCat.pontos.toFixed(1)),
        acoes: dadosCat.acoes,
      });
    }

    distribuicaoGrupos.sort((a, b) => b.percentual - a.percentual);

    // Constrói o ranking de tags por afinidade e peso de interesse do usuário
    const totalPontosTags = Object.values(mapaTagsDetalhe).reduce(
      (acc, cur) => acc + cur.pontos,
      0
    );

    const tagsRankeadas: TagRankeadaInteresse[] = Object.entries(mapaTagsDetalhe)
      .map(([slug, dadosTag]) => {
        const pct =
          totalPontosTags > 0
            ? Number(((dadosTag.pontos / totalPontosTags) * 100).toFixed(1))
            : 0;
        return {
          posicao: 0,
          tag: slug,
          slug,
          pontos: Number(dadosTag.pontos.toFixed(1)),
          percentual: pct,
          totalAcoes: dadosTag.totalAcoes,
          visualizacoes: dadosTag.visualizacoes,
          likes: dadosTag.likes,
          cliques: dadosTag.cliques,
          nivelAfinidade: "Em Alta" as const,
        };
      })
      .sort((a, b) => b.pontos - a.pontos || b.totalAcoes - a.totalAcoes)
      .map((item, idx) => {
        let nivelAfinidade: "Alta" | "Média" | "Em Alta" = "Em Alta";
        if (idx < 3 || item.percentual >= 25) {
          nivelAfinidade = "Alta";
        } else if (idx < 7 || item.percentual >= 10) {
          nivelAfinidade = "Média";
        }
        return {
          ...item,
          posicao: idx + 1,
          nivelAfinidade,
        };
      });

    const topTags = tagsRankeadas.map((t) => t.slug).slice(0, 8);

    const taxaCTR =
      totalVis > 0 ? Number(((totalCliques / totalVis) * 100).toFixed(1)) : 0;

    let classificacao = "Explorador";
    if (taxaCTR >= 25 || totalCliques > 5) {
      classificacao = "Público de Alto Clique (Tráfego Focado)";
    } else if (totalLikes > totalVis * 0.4 || totalLikes >= 4) {
      classificacao = "Engajador Social";
    } else if (totalVis === 0 && totalLikes === 0 && totalCliques === 0) {
      classificacao = "Novo Visitante";
    }

    return {
      periodo,
      label,
      dataInicio: new Date(inicioMs).toISOString(),
      dataFim: new Date(fimMs).toISOString(),
      totalAcoes: totalVis + totalLikes + totalCliques,
      totalPontos: Number(totalPontos.toFixed(1)),
      totalVisualizacoes: totalVis,
      totalLikes,
      totalCliques,
      taxaCTR,
      classificacao,
      distribuicao,
      distribuicaoGrupos,
      topTags,
      tagsRankeadas,
    };
  },
};

export default RepositorioInteracoesUsuario;
