import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import CabecalhoDivulgacaoTelegram from "../componentes/cabecalho.pesquisar";
import ContainerPesquisa from "../componentes/container.pesquisa";
import {
  PublicacaoItem,
  buscarPublicacoesPaginadas,
  curtirPublicacao,
  alternarCurtidaPublicacao,
  definirCurtidaLocal,
  jaCurtiuLocal,
  registrarCliqueLink,
  registrarVisualizacoesEmLote,
  obterPesquisaCacheLocal,
  salvarPesquisaCacheLocal,
  limparPesquisaCacheLocal,
} from "../servicos/api.publicacoes";

const LIMITE_POR_PAGINA = 6;

function TelaPesquisaGrupo() {
  const [searchParams] = useSearchParams();

  const termoInicial =
    searchParams.get("q") || searchParams.get("busca") || "";

  const [pesquisa, setPesquisa] = useState(termoInicial);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [grupos, setGrupos] = useState<PublicacaoItem[]>(() => {
    const c = obterPesquisaCacheLocal();
    return c?.dados || [];
  });
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>(() => {
    const c = obterPesquisaCacheLocal();
    return c?.categorias || [];
  });
  const [carregando, setCarregando] = useState(() => !obterPesquisaCacheLocal());
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(true);
  const [processandoLikes, setProcessandoLikes] = useState<Record<string, boolean>>({});

  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("busca");
    if (q !== null) {
      setPesquisa(q);
    }
  }, [searchParams]);

  // Carrega a primeira página com debounce para digitação
  const carregarPaginaInicial = useCallback(
    async (termoBusca: string, cat: string) => {
      try {
        limparPesquisaCacheLocal();
        setCarregando((prev) => (obterPesquisaCacheLocal() ? prev : true));
        setPagina(1);

        const res = await buscarPublicacoesPaginadas(false, {
          busca: termoBusca.trim() || undefined,
          categoria: cat && cat !== "Todos" ? cat : undefined,
          apenasComImagem: true,
          pagina: 1,
          limite: LIMITE_POR_PAGINA,
        });

        // Limpa cache anterior a cada lote carregado
        limparPesquisaCacheLocal();

        setGrupos(res.dados);
        setTemMais(res.temMais);
        if (res.categoriasDisponiveis && res.categoriasDisponiveis.length > 0) {
          setCategoriasDisponiveis(res.categoriasDisponiveis);
        }

        if (!termoBusca.trim() && (!cat || cat === "Todos")) {
          salvarPesquisaCacheLocal(res.dados, res.categoriasDisponiveis || []);
        }

        if (res.dados && res.dados.length > 0) {
          registrarVisualizacoesEmLote(res.dados.map((g) => g.id));
        }
      } catch (err) {
        console.error("Erro ao carregar resultados da pesquisa:", err);
      } finally {
        setCarregando(false);
      }
    },
    []
  );

  // Efeito com debounce para disparar busca ao digitar ou trocar categoria
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarPaginaInicial(pesquisa, categoriaAtiva);
    }, 280);

    return () => clearTimeout(timer);
  }, [pesquisa, categoriaAtiva, carregarPaginaInicial]);

  // Função para carregar a próxima página no scroll infinito
  const carregarMais = useCallback(async () => {
    if (carregando || carregandoMais || !temMais) return;

    try {
      setCarregandoMais(true);
      const proximaPagina = pagina + 1;

      const res = await buscarPublicacoesPaginadas(false, {
        busca: pesquisa.trim() || undefined,
        categoria: categoriaAtiva && categoriaAtiva !== "Todos" ? categoriaAtiva : undefined,
        apenasComImagem: true,
        pagina: proximaPagina,
        limite: LIMITE_POR_PAGINA,
      });

      // Limpa cache a cada 6 publicações carregadas para não sobrecarregar
      limparPesquisaCacheLocal();

      setGrupos((prev) => {
        const idsExistentes = new Set(prev.map((g) => g.id));
        const novos = res.dados.filter((g) => !idsExistentes.has(g.id));
        return [...prev, ...novos];
      });

      setPagina(proximaPagina);
      setTemMais(res.temMais);

      if (res.dados && res.dados.length > 0) {
        registrarVisualizacoesEmLote(res.dados.map((g) => g.id));
      }
    } catch (err) {
      console.error("Erro ao carregar mais resultados da pesquisa:", err);
    } finally {
      setCarregandoMais(false);
    }
  }, [carregando, carregandoMais, temMais, pagina, pesquisa, categoriaAtiva]);

  // IntersectionObserver para detectar quando o usuário chega ao fim da página
  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && temMais && !carregando && !carregandoMais) {
          carregarMais();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinela);
    return () => observer.disconnect();
  }, [carregarMais, temMais, carregando, carregandoMais]);

  // Listener auxiliar de scroll na janela
  useEffect(() => {
    function handleScroll() {
      if (carregando || carregandoMais || !temMais) return;
      const scrollAtual = window.innerHeight + window.scrollY;
      const fimPagina = document.documentElement.scrollHeight - 250;
      if (scrollAtual >= fimPagina) {
        carregarMais();
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [carregarMais, carregando, carregandoMais, temMais]);

  function handleAcessar(grupo: PublicacaoItem) {
    registrarCliqueLink(grupo.id);

    const linkFinal = grupo.link.startsWith("http")
      ? grupo.link
      : `https://${grupo.link}`;

    window.open(linkFinal, "_blank", "noopener,noreferrer");
  }

  async function handleCurtir(id: string) {
    if (processandoLikes[id]) return; // Evita cliques simultâneos/duplos que travam o botão

    const grupo = grupos.find((g) => g.id === id);
    if (!grupo) return;

    const estaCurtido = Boolean(grupo.curtido);
    const novoStatus = !estaCurtido;

    setProcessandoLikes((prev) => ({ ...prev, [id]: true }));

    // Atualização otimista na tela
    setGrupos((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              likes: Math.max(0, novoStatus ? g.likes + 1 : g.likes - 1),
              curtido: novoStatus,
            }
          : g
      )
    );
    definirCurtidaLocal(id, novoStatus);

    try {
      const res = await alternarCurtidaPublicacao(id, novoStatus);
      if (res.pub) {
        setGrupos((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  likes: typeof res.totalLikes === "number" ? res.totalLikes : g.likes,
                  curtido: res.curtido,
                }
              : g
          )
        );
        definirCurtidaLocal(id, res.curtido);
      }
    } catch (err) {
      console.error("Erro ao alternar curtida na pesquisa:", err);
      // Rollback se falhar
      setGrupos((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                likes: grupo.likes,
                curtido: grupo.curtido,
              }
            : g
        )
      );
      definirCurtidaLocal(id, estaCurtido);
    } finally {
      setProcessandoLikes((prev) => {
        const proximo = { ...prev };
        delete proximo[id];
        return proximo;
      });
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* Cabeçalho padronizado com botão de voltar */}
      <CabecalhoDivulgacaoTelegram mostrarVoltar={true} />

      <ContainerPesquisa
        pesquisa={pesquisa}
        setPesquisa={setPesquisa}
        categoriaAtiva={categoriaAtiva}
        setCategoriaAtiva={setCategoriaAtiva}
        categoriasDisponiveis={categoriasDisponiveis}
        gruposFiltrados={grupos}
        carregando={carregando}
        carregandoMais={carregandoMais}
        temMais={temMais}
        sentinelaRef={sentinelaRef}
        onAcessar={handleAcessar}
        onCurtir={handleCurtir}
        onTagClick={(tag) => setPesquisa(tag)}
      />
    </div>
  );
}

export default TelaPesquisaGrupo;