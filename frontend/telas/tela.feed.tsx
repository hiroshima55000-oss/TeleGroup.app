import {
  Loader2,
  Users,
  Send,
  X,
  Sparkles,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CabecalhoDivulgacaoTelegram from "../componentes/cabecalho.principal";
import BotaoAnunciar from "../componentes/BotaoAnunciar";
import CardPesquisaTelegram from "../componentes/card.pesquisa";
import BarraPesquisaFixa from "../componentes/BarraPesquisaFixa";
import ContainerGrupoTelegram from "../componentes/Container.Grupo.Telegram";
import {
  PublicacaoItem,
  buscarPublicacoesPaginadas,
  curtirPublicacao,
  alternarCurtidaPublicacao,
  definirCurtidaLocal,
  jaCurtiuLocal,
  registrarCliqueLink,
  registrarVisualizacoesEmLote,
} from "../servicos/api.publicacoes";
import {
  InfoUsuario,
  obterOuCriarUsuario,
  estaLogadoGoogle,
  ouvirMudancaUsuario,
} from "../servicos/usuario";

const LIMITE_POR_PAGINA = 4;

function TelaDivulgacaoTelegram() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryTag = new URLSearchParams(location.search).get("tag");

  const [grupos, setGrupos] = useState<PublicacaoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(true);
  const [totalPublicacoes, setTotalPublicacoes] = useState(0);
  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);
  const [processandoLikes, setProcessandoLikes] = useState<Record<string, boolean>>({});

  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  // Filtro por tag quando o usuário clica em uma hashtag
  const [tagFiltroAtiva, setTagFiltroAtiva] = useState<string | null>(queryTag || null);

  useEffect(() => {
    if (queryTag) {
      setTagFiltroAtiva(queryTag);
    }
  }, [queryTag]);

  useEffect(() => {
    const info = obterOuCriarUsuario();
    setUsuario(info);

    const removerOuvinte = ouvirMudancaUsuario(() => {
      setUsuario(obterOuCriarUsuario());
    });
    return removerOuvinte;
  }, []);

  const carregarFeedInicial = useCallback(async (tag?: string) => {
    try {
      setCarregando(true);
      setPagina(1);
      const res = await buscarPublicacoesPaginadas(false, {
        tag: tag || undefined,
        pagina: 1,
        limite: LIMITE_POR_PAGINA,
      });

      setGrupos(res.dados);
      setTemMais(res.temMais);
      setTotalPublicacoes(res.total);

      // Registra visualização de cada publicação na tela (1 vez por usuário)
      if (res.dados && res.dados.length > 0) {
        registrarVisualizacoesEmLote(res.dados.map((g) => g.id));
      }
    } catch (err) {
      console.error("Erro ao carregar feed inicial de publicações:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFeedInicial(tagFiltroAtiva || undefined);
  }, [tagFiltroAtiva, carregarFeedInicial]);

  const carregarMais = useCallback(async () => {
    if (carregando || carregandoMais || !temMais) return;

    try {
      setCarregandoMais(true);
      const proximaPagina = pagina + 1;
      const res = await buscarPublicacoesPaginadas(false, {
        tag: tagFiltroAtiva || undefined,
        pagina: proximaPagina,
        limite: LIMITE_POR_PAGINA,
      });

      setGrupos((prev) => {
        const idsExistentes = new Set(prev.map((g) => g.id));
        const novos = res.dados.filter((g) => !idsExistentes.has(g.id));
        return [...prev, ...novos];
      });

      setPagina(proximaPagina);
      setTemMais(res.temMais);
      setTotalPublicacoes(res.total);

      if (res.dados && res.dados.length > 0) {
        registrarVisualizacoesEmLote(res.dados.map((g) => g.id));
      }
    } catch (err) {
      console.error("Erro ao carregar mais publicações:", err);
    } finally {
      setCarregandoMais(false);
    }
  }, [carregando, carregandoMais, temMais, pagina, tagFiltroAtiva]);

  // Observer de interseção para disparar carregamento automático ao rolar
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

  // Listener auxiliar de scroll na janela como fallback
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

  async function handleCurtir(id: string) {
    if (processandoLikes[id]) return; // Evita cliques simultâneos/duplos que travam o botão

    const grupo = grupos.find((g) => g.id === id);
    if (!grupo) return;

    const estaCurtido = Boolean(grupo.curtido);
    const novoStatus = !estaCurtido;

    // Marca como em processamento para desabilitar o botão temporariamente
    setProcessandoLikes((prev) => ({ ...prev, [id]: true }));

    // Atualização otimista imediata na interface para resposta visual instantânea
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
      console.error("Erro ao alternar curtida da publicação:", err);
      // Rollback se a chamada de rede falhar
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

  function handleEntrar(grupo: PublicacaoItem) {
    registrarCliqueLink(grupo.id);

    // Nova regra: o conteúdo orgânico desaparece assim que a pessoa clica para entrar no grupo
    if (!grupo.isAnuncio) {
      setGrupos((prev) => prev.filter((item) => item.id !== grupo.id));
      setTotalPublicacoes((prev) => Math.max(0, prev - 1));
    }

    const linkFinal = grupo.link.startsWith("http")
      ? grupo.link
      : `https://${grupo.link}`;
    window.open(linkFinal, "_blank", "noopener,noreferrer");
  }

  function selecionarTag(tagNome: string) {
    setTagFiltroAtiva(tagNome);
  }

  function limparFiltros() {
    setTagFiltroAtiva(null);
    if (queryTag) {
      navigate("/", { replace: true });
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
      <CabecalhoDivulgacaoTelegram />

      {/* BARRA DE PESQUISA FIXA ISOLADA (SOME AO ROLAR PRA BAIXO, APARECE AO ROLAR PRA CIMA) */}
      <BarraPesquisaFixa />

      <main
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0 auto",
          padding: "24px 0 100px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 16px" }}>
          <CardPesquisaTelegram />

          {/* INDICADOR DE FILTRO ATIVO SE UMA TAG FOI CLICADA */}
          {tagFiltroAtiva && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                padding: "10px 16px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.20)",
                color: "#e2e8f0",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>Filtrando por tag:</span>
                <span style={{ fontWeight: 800, color: "#f8fafc" }}>#{tagFiltroAtiva}</span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  ({grupos.length} {grupos.length === 1 ? "publicação encontrada" : "publicações encontradas"})
                </span>
              </div>

              <button
                type="button"
                onClick={limparFiltros}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <X size={13} />
                Limpar filtro
              </button>
            </div>
          )}
        </div>

        {/* FEED DE PUBLICAÇÕES */}
        <section style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
          {carregando ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#7f8c9d",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Loader2 size={32} className="animate-spin" color="#38bdf8" />
              <span>Carregando comunidades e distribuindo feed personalizado...</span>
            </div>
          ) : grupos.length === 0 ? (
            <div
              style={{
                maxWidth: "620px",
                margin: "20px auto",
                padding: "60px 24px",
                textAlign: "center",
                borderRadius: "20px",
                background: "#182029",
                border: "1px dashed rgba(255,255,255,0.12)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  background: "rgba(34,158,217,0.12)",
                  border: "1px solid rgba(34,158,217,0.25)",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <Users size={30} />
              </div>

              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {tagFiltroAtiva
                  ? "Nenhuma publicação nesta tag ainda"
                  : "Nenhuma publicação cadastrada ainda"}
              </h2>

              <p
                style={{
                  margin: "0 auto 24px",
                  maxWidth: "520px",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "#94a3b8",
                }}
              >
                {tagFiltroAtiva
                  ? "Seja o primeiro criador a associar sua comunidade a esta tag e conquistar destaque imediato no feed!"
                  : "Este aplicativo é 100% autêntico e moderado. Publique agora sua comunidade com tags para direcionamento inteligente."}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (estaLogadoGoogle()) {
                      navigate("/anunciar-gratuito");
                    } else {
                      navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login", {
                        state: { destino: "/anunciar-gratuito" },
                      });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 24px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #229ED9, #168AC0)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(34,158,217,0.25)",
                  }}
                >
                  <Send size={16} />
                  Publicar com Tags Agora
                </button>

                {tagFiltroAtiva && (
                  <button
                    type="button"
                    onClick={limparFiltros}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "13px 20px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#cbd5e1",
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    Limpar Filtro
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/historico")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 20px",
                    borderRadius: "12px",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={16} />
                  Ver Histórico & Interesses
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "#161c24",
              }}
            >
              {grupos.map((grupo) => (
                <ContainerGrupoTelegram
                  key={grupo.id}
                  id={grupo.id}
                  usuarioId={grupo.usuarioId}
                  nome={grupo.nome}
                  descricao={grupo.descricao}
                  destaque={grupo.destaque}
                  foto={grupo.imagens && grupo.imagens.length > 0 ? grupo.imagens[0] : undefined}
                  visualizacoes={grupo.visualizacoes}
                  likes={grupo.likes}
                  cliques={grupo.cliques}
                  link={grupo.link}
                  categoria={grupo.categoria}
                  isAnuncio={grupo.isAnuncio}
                  tags={grupo.tags}
                  nicho={grupo.nicho}
                  nomeNicho={grupo.nomeNicho}
                  iconeNicho={grupo.iconeNicho}
                  curtido={Boolean(grupo.curtido)}
                  processandoLike={Boolean(processandoLikes[grupo.id])}
                  onCurtir={() => handleCurtir(grupo.id)}
                  onEntrar={() => handleEntrar(grupo)}
                  onTagClick={(tag) => selecionarTag(tag)}
                />
              ))}

              {/* SENTINELA DE ROLAGEM INFINITA */}
              <div ref={sentinelaRef} style={{ width: "100%", height: "20px" }} />

              {/* INDICADOR DE CARREGAMENTO DE MAIS PÁGINAS */}
              {carregandoMais && (
                <div
                  style={{
                    padding: "26px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "#38bdf8",
                    fontSize: "13px",
                    fontWeight: 700,
                    background: "rgba(15, 23, 42, 0.4)",
                  }}
                >
                  <Loader2 size={20} className="animate-spin" />
                  <span>Carregando mais comunidades...</span>
                </div>
              )}

              {/* AVISO DE FIM DO FEED */}
              {!temMais && grupos.length > 0 && (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles size={14} color="#38bdf8" />
                  <span>Você chegou ao fim do feed. Todas as comunidades disponíveis foram carregadas.</span>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <div
        style={{
          position: "fixed",
          right: "25px",
          bottom: "25px",
          zIndex: 9999,
        }}
      >
        <BotaoAnunciar />
      </div>
    </div>
  );
}

export default TelaDivulgacaoTelegram;
