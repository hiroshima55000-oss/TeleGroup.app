import { RepositorioPublicacoes } from "../repositorios/repositorio.publicacoes";
import { RepositorioCampanhas } from "../repositorios/repositorio.campanhas";
import { RepositorioInteracoesUsuario } from "../repositorios/repositorio.interacoes.usuario";
import { LeilaoAdRankServico, CONFIG_VANTAGEM_PAGA } from "./AlgoritmoPago";
import {
  Publicacao,
  CriarPublicacaoInput,
  FiltrosPublicacoes,
  RespostaPaginadaPublicacoes,
  validarCriarPublicacao,
} from "../schemas/schema.publicacoes";
import {
  RanqueamentoFeedServico,
  RastreadorEventosServico,
  PerfilInteressesServico,
  PerfilInteresseUsuario,
  ScoreDetalhadoPublicacao,
  TipoAcaoInteresse,
} from "./AlgoritmoOrganico";

export const PublicacoesServico = {
  /**
   * Lista publicações paginadas e equilibradas pelo algoritmo de interesses
   */
  async listar(filtros: FiltrosPublicacoes): Promise<RespostaPaginadaPublicacoes & {
    scoresDetalhados?: Record<string, ScoreDetalhadoPublicacao>;
    perfilUsuario?: {
      classificacao: string;
      distribuicao: Record<string, number>;
    };
  }> {
    const pagina = Math.max(1, filtros.pagina || 1);
    const limite = Math.max(1, filtros.limite || 15);
    const offset = (pagina - 1) * limite;

    // Se for listagem privada do criador ("apenasMinhas"), mantém a busca direta sem ranqueamento de afinidade
    if (filtros.apenasMinhas) {
      const limiteMinhas = Math.max(1, filtros.limite || 1000);
      const { itens, total, categorias } = await RepositorioPublicacoes.buscarComFiltros({
        ...filtros,
        limite: limiteMinhas,
      });
      const totalPaginas = Math.ceil(total / limiteMinhas) || 1;
      return {
        sucesso: true,
        dados: itens,
        total,
        pagina,
        limite: limiteMinhas,
        totalPaginas,
        temMais: pagina < totalPaginas,
        categoriasDisponiveis: categorias,
      };
    }

    // 1. Busca todos os candidatos compatíveis com os filtros básicos de texto/categoria
    const { itens: todosCandidatos, categorias } = await RepositorioPublicacoes.buscarComFiltros({
      ...filtros,
      pagina: 1,
      limite: 1000, // Recupera pool para ranqueamento
    });

    // 2. NOVA REGRA DO FEED: O conteúdo orgânico só some quando a pessoa clica para entrar no grupo (gera clique). Visualizar mantém a publicação no feed para estimular cliques. Anúncios pagos continuam elegíveis.
    const usuarioId = (filtros.usuarioId || "usr_anonimo").trim();
    const idsClicados = RepositorioInteracoesUsuario.obterIdsClicados(usuarioId);
    const idsCurtidos = RepositorioInteracoesUsuario.obterIdsCurtidos(usuarioId);

    // Filtra para remover orgânicos em que o usuário já clicou para entrar (anúncios pagos sempre passam)
    const candidatosAExibir = todosCandidatos.filter((item) => {
      if (item.isAnuncio) return true;
      return !idsClicados.has(item.id);
    });

    // 3. Aplica o Ranqueamento Equilibrado (Recência, Sequência, Hashtags, Qualidade e Exploração Anti-Bolha)
    const { itensOrdenados, scoresPorId } = RanqueamentoFeedServico.ranquear(
      candidatosAExibir,
      filtros.usuarioId
    );

    const total = itensOrdenados.length;
    const totalPaginas = Math.ceil(total / limite) || 1;
    let paginados = itensOrdenados.slice(offset, offset + limite);
    const temMais = pagina < totalPaginas;

    // Sincroniza estado de curtido consistente com as curtidas reais do usuário
    paginados = paginados.map((p) => ({
      ...p,
      curtido: idsCurtidos.has(p.id),
    }));

    // 3. Vantagem Competitiva Paga Flexível (Condicionada à Relevância e Qualidade)
    if (!filtros.apenasMinhas) {
      try {
        const todasCampanhas = await RepositorioCampanhas.buscarTodas();

        // Limite estrito de saturação (máximo 20% do feed exibido)
        // Se o feed tem < 5 itens (ex: 3), floor(3 * 0.20) = 0 anúncios permitidos (100% orgânico).
        // Se o feed tem 5 itens, floor(5 * 0.20) = 1 anúncio permitido.
        // Se o feed tem 10 itens, floor(10 * 0.20) = 2 anúncios permitidos.
        const maxAnunciosPermitidos = Math.floor(
          paginados.length * (CONFIG_VANTAGEM_PAGA.TETO_SATURACAO_ANUNCIOS_FEED || 0.20)
        );
        let anunciosInseridos = 0;

        // 3.1. Topo Condicional: só recebe anúncio se:
        // a) Houver cota de saturação (feed com >= 5 itens)
        // b) Campanha ativa atingir AdRank >= 7.5 E Qualidade >= 6.5/10
        // Caso contrário, o topo permanece 100% ORGÂNICO.
        if (pagina === 1 && maxAnunciosPermitidos > 0) {
          const vencedoresTopo = LeilaoAdRankServico.executarLeilao(todasCampanhas, {
            usuarioId: filtros.usuarioId,
            categoria: filtros.categoria,
            busca: filtros.busca,
            slot: "feed_topo",
            limite: 1,
          });

          if (vencedoresTopo.length > 0) {
            const campVencedora = vencedoresTopo[0].campanha;
            const pubTopo: Publicacao = {
              id: campVencedora.id,
              usuarioId: campVencedora.usuarioId,
              nome: campVencedora.nome,
              categoria: campVencedora.categoria || "Destaque",
              descricao: campVencedora.texto || "Comunidade verificada com destaque premium.",
              link: campVencedora.link,
              imagens: campVencedora.imagem ? [campVencedora.imagem] : [],
              tipo: campVencedora.imagem ? "foto" : "texto",
              destaque: true,
              isAnuncio: true,
              visualizacoes: campVencedora.visualizacoes || 0,
              likes: Math.max(12, Math.round((campVencedora.cliques || 8) * 1.6)),
              cliques: campVencedora.cliques || 0,
              status: "Publicado",
              dataCriacao: campVencedora.dataCriacao,
              membros: "Comunidade VIP",
              tags: campVencedora.tags && campVencedora.tags.length > 0 ? campVencedora.tags : [campVencedora.categoria.toLowerCase()],
              nicho: campVencedora.categoria.toLowerCase(),
              nomeNicho: campVencedora.categoria,
              iconeNicho: "⭐",
            };

            paginados = [pubTopo, ...paginados.filter((p) => p.id !== pubTopo.id)];
            anunciosInseridos++;
          }
        }

        // 3.2. Slots Inline Saudáveis: só insere se o teto de 20% permitir e houver post orgânico suficiente
        if (anunciosInseridos < maxAnunciosPermitidos && paginados.length >= 5) {
          const vencedoresInline = LeilaoAdRankServico.executarLeilao(todasCampanhas, {
            usuarioId: filtros.usuarioId,
            categoria: filtros.categoria,
            busca: filtros.busca,
            slot: "feed_inline",
            limite: 1,
          });

          if (vencedoresInline.length > 0) {
            const campInline = vencedoresInline[0].campanha;
            const jaPresente = paginados.some((p) => p.id === campInline.id);
            if (!jaPresente) {
              const pubInline: Publicacao = {
                id: campInline.id,
                usuarioId: campInline.usuarioId,
                nome: campInline.nome,
                categoria: campInline.categoria || "Destaque",
                descricao: campInline.texto || "Grupo em destaque no seu nicho.",
                link: campInline.link,
                imagens: campInline.imagem ? [campInline.imagem] : [],
                tipo: campInline.imagem ? "foto" : "texto",
                destaque: false,
                isAnuncio: true,
                visualizacoes: campInline.visualizacoes || 0,
                likes: Math.max(8, Math.round((campInline.cliques || 5) * 1.4)),
                cliques: campInline.cliques || 0,
                status: "Publicado",
                dataCriacao: campInline.dataCriacao,
                membros: "Comunidade VIP",
                tags: campInline.tags || [campInline.categoria.toLowerCase()],
                nicho: campInline.categoria.toLowerCase(),
                nomeNicho: campInline.categoria,
                iconeNicho: "📢",
              };
              // Insere na posição 4 (5º item do feed)
              paginados.splice(4, 0, pubInline);
              anunciosInseridos++;
            }
          }
        }
      } catch (err) {

        console.warn("[PublicacoesServico] Erro ao integrar leilão no feed:", err);
      }
    }

    // Recupera resumo do perfil do usuário para feedback
    let resumoPerfil: { classificacao: string; distribuicao: Record<string, number> } | undefined;
    if (filtros.usuarioId) {
      try {
        const p = PerfilInteressesServico.obterPerfil(filtros.usuarioId);
        resumoPerfil = {
          classificacao: p.classificacaoPublico,
          distribuicao: p.distribuicaoPercentual,
        };
      } catch {}
    }

    return {
      sucesso: true,
      dados: paginados,
      total,
      pagina,
      limite,
      totalPaginas,
      temMais,
      categoriasDisponiveis: categorias,
      scoresDetalhados: scoresPorId,
      perfilUsuario: resumoPerfil,
    };
  },

  /**
   * Obtém publicação individual por ID
   */
  async buscarPorId(id: string): Promise<Publicacao> {
    const item = await RepositorioPublicacoes.buscarPorId(id);
    if (!item) {
      throw new Error("Publicação não encontrada.");
    }
    return item;
  },

  /**
   * Valida e persiste nova publicação de canal ou grupo
   */
  async criar(dados: CriarPublicacaoInput): Promise<Publicacao> {
    const validacao = validarCriarPublicacao(dados);
    if (!validacao.valido) {
      throw new Error(validacao.erro || "Dados inválidos para publicação.");
    }

    const id = `pub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const temImagens = Array.isArray(dados.imagens) && dados.imagens.length > 0;

    const tagsLimpos = Array.isArray(dados.tags)
      ? dados.tags
          .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
          .filter(Boolean)
          .slice(0, 5) // Mínimo 1, máximo 5 tags
      : [];

    const novaPublicacao: Publicacao = {
      id,
      usuarioId: dados.usuarioId || `user_${Date.now()}`,
      nome: dados.nome.trim(),
      categoria: dados.categoria.trim(),
      descricao: dados.descricao ? dados.descricao.trim() : "",
      link: dados.link.trim(),
      imagens: Array.isArray(dados.imagens) ? dados.imagens : [],
      tipo: dados.tipo || (temImagens ? "foto" : "texto"),
      destaque: Boolean(dados.destaque),
      isAnuncio: false,
      visualizacoes: 0,
      likes: 0,
      cliques: 0,
      status: "Publicado",
      dataCriacao: new Date().toISOString(),
      membros: dados.membros ? dados.membros.trim() : "Comunidade Ativa",
      tags: tagsLimpos,
      nicho: dados.nicho || dados.categoria.toLowerCase(),
      nomeNicho: dados.nomeNicho || dados.categoria,
      iconeNicho: dados.iconeNicho || "📢",
    };

    const salva = await RepositorioPublicacoes.salvar(novaPublicacao);

    // Dispara webhook proativo para Website 1 atualizar contadores de publicadores e divulgações
    import("./s.painel.comunicacao")
      .then((m) => {
        m.ComunicacaoServico.dispararWebhookParaWebsite1("publicacao_criada", "usuarios", {
          publicacaoId: novaPublicacao.id,
          usuarioId: novaPublicacao.usuarioId,
        }).catch(() => {});
        m.ComunicacaoServico.dispararWebhookParaWebsite1("publicacao_criada", "divulgacoes", {
          publicacaoId: novaPublicacao.id,
          usuarioId: novaPublicacao.usuarioId,
        }).catch(() => {});
      })
      .catch(() => {});

    return salva;
  },

  /**
   * Gerencia curtidas de forma idempotente (impede múltiplos likes pelo mesmo usuário)
   */
  async curtir(
    id: string,
    descurtir = false,
    usuarioId?: string
  ): Promise<{ likes: number; curtido: boolean; perfilInteresse?: PerfilInteresseUsuario }> {
    const { RepositorioInteracoesUsuario } = await import(
      "../repositorios/repositorio.interacoes.usuario"
    );
    const uid = (usuarioId || "usr_anonimo").trim();

    const pub = await RepositorioPublicacoes.buscarPorId(id);
    const jaCurtiuAntes = RepositorioInteracoesUsuario.jaCurtiu(uid, id);

    let likesAtual = pub?.likes || 0;

    if (!descurtir) {
      // Solicitação para dar Like: apenas incrementa se o usuário AINDA NÃO curtiu
      if (!jaCurtiuAntes) {
        RepositorioInteracoesUsuario.registrarCurtida(
          uid,
          id,
          pub?.tags,
          pub?.categoria,
          pub?.nicho
        );
        likesAtual = await RepositorioPublicacoes.incrementarCurtida(id, false);
      }
    } else {
      // Solicitação para Descurtir: apenas decrementa se o usuário REALMENTE havia curtido
      if (jaCurtiuAntes) {
        RepositorioInteracoesUsuario.removerCurtida(uid, id);
        likesAtual = await RepositorioPublicacoes.incrementarCurtida(id, true);
      }
    }

    let perfilInteresse: PerfilInteresseUsuario | undefined;
    if (uid) {
      perfilInteresse = await RastreadorEventosServico.rastrearAcao({
        usuarioId: uid,
        tipo: descurtir ? "descurtir" : "like",
        publicacaoId: id,
      });
    }

    return {
      likes: likesAtual,
      curtido: !descurtir,
      perfilInteresse,
    };
  },

  /**
   * Registra clique no link do canal/grupo e atualiza interesse (ação de alta conversão)
   */
  async registrarClique(id: string, usuarioId?: string): Promise<number> {
    const { RepositorioInteracoesUsuario } = await import(
      "../repositorios/repositorio.interacoes.usuario"
    );
    const totalCliques = await RepositorioPublicacoes.incrementarClique(id);
    const pub = await RepositorioPublicacoes.buscarPorId(id).catch(() => null);

    if (usuarioId) {
      RepositorioInteracoesUsuario.registrarClique(
        usuarioId,
        id,
        pub?.tags,
        pub?.categoria,
        pub?.nicho
      );
      RastreadorEventosServico.rastrearAcao({
        usuarioId,
        tipo: "clique_link",
        publicacaoId: id,
      }).catch(() => {});
    }

    return totalCliques;
  },

  /**
   * Registra visualização no card da publicação e atualiza histórico do usuário
   */
  async registrarVisualizacao(id: string, usuarioId?: string): Promise<number> {
    const { RepositorioInteracoesUsuario } = await import(
      "../repositorios/repositorio.interacoes.usuario"
    );
    const totalVisualizacoes = await RepositorioPublicacoes.incrementarVisualizacao(id);
    const pub = await RepositorioPublicacoes.buscarPorId(id).catch(() => null);

    if (usuarioId) {
      RepositorioInteracoesUsuario.registrarVisualizacao(
        usuarioId,
        id,
        pub?.tags,
        pub?.categoria,
        pub?.nicho
      );
      RastreadorEventosServico.rastrearAcao({
        usuarioId,
        tipo: "visualizacao",
        publicacaoId: id,
      }).catch(() => {});
    }

    return totalVisualizacoes;
  },

  /**
   * Registra tempo retido de leitura (dwell time) ou clique em hashtag
   */
  async registrarEventoInteresse(params: {
    usuarioId: string;
    tipo: TipoAcaoInteresse;
    publicacaoId?: string;
    tag?: string;
    nicho?: string;
    duracaoSegundos?: number;
  }): Promise<PerfilInteresseUsuario> {
    return await RastreadorEventosServico.rastrearAcao(params);
  },

  /**
   * Obtém o perfil dinâmico de interesses de um usuário
   */
  obterPerfilInteresses(usuarioId: string): PerfilInteresseUsuario {
    return PerfilInteressesServico.obterPerfil(usuarioId);
  },

  /**
   * Exclui uma publicação
   */
  async remover(id: string): Promise<void> {
    const sucesso = await RepositorioPublicacoes.excluir(id);
    if (!sucesso) {
      throw new Error("Publicação não encontrada para exclusão.");
    }
  },
};

export default PublicacoesServico;
