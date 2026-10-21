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
  calcularInteresses(
    usuarioId: string,
    periodo: "ontem" | "10d" | "30d"
  ): CalculoInteressePeriodo {
    const uid = (usuarioId || "usr_anonimo").trim();
    const dados = lerDadosInteracoes();
    const agora = Date.now();

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

    // Pesos do algoritmo
    const PESO_VISUALIZACAO = 1.0;
    const PESO_LIKE = 4.0;
    const PESO_CLIQUE = 6.0;

    let totalPontos = 0;
    let totalVis = 0;
    let totalLikes = 0;
    let totalCliques = 0;

    const mapaCategorias: Record<string, { pontos: number; acoes: number }> =
      {};
    const mapaTags: Record<string, number> = {};

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

      // Tags
      if (Array.isArray(ev.tags)) {
        for (const t of ev.tags) {
          const tLimpa = t.toLowerCase().replace(/^#/, "").trim();
          if (tLimpa) {
            mapaTags[tLimpa] = (mapaTags[tLimpa] || 0) + peso;
          }
        }
      }
    }

    // Se ainda não houver eventos registrados, injeta dados com base nos grupos vistos
    // ou curtidos para que o calculador demonstre valores reais do usuário
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

      if (totalPontos === 0) {
        totalPontos = 1;
        mapaCategorias["comunidades"] = { pontos: 1, acoes: 1 };
      }
    }

    // Distribuição percentual
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

    // Top tags ordenadas
    const topTags = Object.entries(mapaTags)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 6);

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
    };
  },
};

export default RepositorioInteracoesUsuario;
