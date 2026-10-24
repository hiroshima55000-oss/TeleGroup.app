import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  Heart,
  MousePointerClick,
  Sparkles,
  Loader2,
  Send,
  Layers,
  ArrowRight,
} from "lucide-react";
import CabecalhoConteudos from "../componentes/cabecalho.conteudos";
import {
  PublicacaoItem,
  RespostaHistoricoUsuario,
  obterHistoricoUsuarioApi,
  curtirPublicacao,
  registrarCliqueLink,
  obterHistoricoCacheLocal,
} from "../servicos/api.publicacoes";
import { obterOuCriarUsuario, InfoUsuario } from "../servicos/usuario";
import CardDenunciar from "../componentes/card.denunciar";

export type AbaAtiva = "vistos" | "likes" | "cliques";

const LIMITE_POR_PAGINA = 4;

export function TelaHistoricoConteudos() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const abaParam = searchParams.get("aba") as AbaAtiva | null;

  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);
  const [carregando, setCarregando] = useState(() => !obterHistoricoCacheLocal());
  const [historico, setHistorico] = useState<RespostaHistoricoUsuario | null>(() => obterHistoricoCacheLocal());

  // Exclusivamente as 3 abas solicitadas: vistos - likes - cliques
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>(
    abaParam === "likes" || abaParam === "cliques" ? abaParam : "vistos"
  );

  const [limiteExibicao, setLimiteExibicao] = useState(LIMITE_POR_PAGINA);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  // Estado do modal de denúncia
  const [modalDenunciarAberto, setModalDenunciarAberto] = useState(false);
  const [publicacaoParaDenunciar, setPublicacaoParaDenunciar] =
    useState<PublicacaoItem | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando((prev) => (!obterHistoricoCacheLocal() ? true : prev));
      const user = obterOuCriarUsuario();
      setUsuario(user);

      const resHistorico = await obterHistoricoUsuarioApi(user.id);
      setHistorico(resHistorico);
      setLimiteExibicao(LIMITE_POR_PAGINA);
    } catch (err) {
      console.error("Erro ao carregar conteúdos do usuário:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function handleMudarAba(aba: AbaAtiva) {
    setAbaAtiva(aba);
    setLimiteExibicao(LIMITE_POR_PAGINA);
    setSearchParams({ aba });
  }

  async function handleCurtirItem(pub: PublicacaoItem) {
    const novoStatus = !pub.curtido;
    try {
      const res = await curtirPublicacao(pub.id, novoStatus);
      setHistorico((prev) => {
        if (!prev) return prev;
        const atualizarLista = (lista: PublicacaoItem[]) =>
          lista.map((item) =>
            item.id === pub.id
              ? {
                  ...item,
                  curtido: res.curtido,
                  likes: res.totalLikes,
                }
              : item
          );

        return {
          ...prev,
          conteudos: {
            ...prev.conteudos,
            visualizados: atualizarLista(prev.conteudos.visualizados),
            curtidos: novoStatus
              ? [...prev.conteudos.curtidos, { ...pub, curtido: true, likes: res.totalLikes }]
              : prev.conteudos.curtidos.filter((item) => item.id !== pub.id),
            clicados: atualizarLista(prev.conteudos.clicados),
            totalCurtidos: novoStatus
              ? prev.conteudos.totalCurtidos + 1
              : Math.max(0, prev.conteudos.totalCurtidos - 1),
          },
        };
      });
    } catch (err) {
      console.error("Erro ao alternar curtida:", err);
    }
  }

  function handleEntrarGrupo(pub: PublicacaoItem) {
    registrarCliqueLink(pub.id);
    if (pub.link) {
      const urlFinal = pub.link.startsWith("http") ? pub.link : `https://${pub.link}`;
      window.open(urlFinal, "_blank", "noopener,noreferrer");
    }
  }

  function handleClicarTag(tag: string) {
    navigate(`/?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`);
  }

  // Lista da aba atualmente selecionada (estritamente vistos, likes ou cliques)
  const listaAtual: PublicacaoItem[] =
    abaAtiva === "vistos"
      ? historico?.conteudos?.visualizados || []
      : abaAtiva === "likes"
      ? historico?.conteudos?.curtidos || []
      : historico?.conteudos?.clicados || [];

  const temMais = limiteExibicao < listaAtual.length;

  const carregarMais = useCallback(() => {
    if (limiteExibicao >= listaAtual.length) return;
    setLimiteExibicao((prev) => Math.min(prev + LIMITE_POR_PAGINA, listaAtual.length));
  }, [limiteExibicao, listaAtual.length]);

  // Observer de rolagem infinita
  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela || !temMais) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          carregarMais();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinela);
    return () => observer.disconnect();
  }, [carregarMais, temMais]);

  // Listener de scroll na janela como fallback
  useEffect(() => {
    function handleScroll() {
      if (!temMais) return;
      const scrollAtual = window.innerHeight + window.scrollY;
      const fimPagina = document.documentElement.scrollHeight - 250;
      if (scrollAtual >= fimPagina) {
        carregarMais();
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [carregarMais, temMais]);

  const listaExibida = listaAtual.slice(0, limiteExibicao);

  const totalVistos = historico?.conteudos?.totalVisualizados || 0;
  const totalLikes = historico?.conteudos?.totalCurtidos || 0;
  const totalCliques = historico?.conteudos?.totalClicados || 0;

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
      {/* CABEÇALHO LIMPO COM BOTÃO DE VOLTAR PARA O PAINEL */}
      <CabecalhoConteudos />

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "24px 16px 100px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* BANNER / CABEÇALHO DA PÁGINA */}
        <section
          style={{
            background:
              "linear-gradient(135deg, #18212c 0%, #151a22 55%, #18222d 100%)",
            border: "1px solid rgba(56, 189, 248, 0.18)",
            borderRadius: "20px",
            padding: "22px 24px",
            boxShadow: "0 14px 35px rgba(0, 0, 0, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.4px",
                }}
              >
                Conteúdo Visualizados
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                Acompanhe o registro das comunidades que você viu, curtiu ou clicou.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* NAVEGAÇÃO DE ABAS: ESTRITAMENTE VISTOS - LIKES - CLIQUES  */}
        {/* ======================================================== */}
        <section
          style={{
            background: "#151a21",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "18px",
            padding: "16px 20px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "100%",
              maxWidth: "500px",
              background: "rgba(15, 20, 26, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "4px",
              gap: "4px",
              boxSizing: "border-box",
            }}
          >
            {/* ABA 1: VISTOS */}
            <button
              type="button"
              onClick={() => handleMudarAba("vistos")}
              style={{
                padding: "9px 12px",
                borderRadius: "9px",
                border: "none",
                background:
                  abaAtiva === "vistos"
                    ? "rgba(56, 189, 248, 0.18)"
                    : "transparent",
                color: abaAtiva === "vistos" ? "#38bdf8" : "#94a3b8",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Eye size={15} style={{ flexShrink: 0 }} />
              <span>Vistos</span>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "999px",
                  background:
                    abaAtiva === "vistos"
                      ? "rgba(56, 189, 248, 0.25)"
                      : "rgba(255, 255, 255, 0.08)",
                  color: abaAtiva === "vistos" ? "#38bdf8" : "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 750,
                  flexShrink: 0,
                }}
              >
                {totalVistos}
              </span>
            </button>

            {/* ABA 2: LIKES */}
            <button
              type="button"
              onClick={() => handleMudarAba("likes")}
              style={{
                padding: "9px 12px",
                borderRadius: "9px",
                border: "none",
                background:
                  abaAtiva === "likes"
                    ? "rgba(244, 63, 94, 0.18)"
                    : "transparent",
                color: abaAtiva === "likes" ? "#f43f5e" : "#94a3b8",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Heart
                size={15}
                fill={abaAtiva === "likes" ? "#f43f5e" : "none"}
                style={{ flexShrink: 0 }}
              />
              <span>Likes</span>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "999px",
                  background:
                    abaAtiva === "likes"
                      ? "rgba(244, 63, 94, 0.25)"
                      : "rgba(255, 255, 255, 0.08)",
                  color: abaAtiva === "likes" ? "#f43f5e" : "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 750,
                  flexShrink: 0,
                }}
              >
                {totalLikes}
              </span>
            </button>

            {/* ABA 3: CLIQUES */}
            <button
              type="button"
              onClick={() => handleMudarAba("cliques")}
              style={{
                padding: "9px 12px",
                borderRadius: "9px",
                border: "none",
                background:
                  abaAtiva === "cliques"
                    ? "rgba(34, 197, 94, 0.18)"
                    : "transparent",
                color: abaAtiva === "cliques" ? "#4ade80" : "#94a3b8",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <MousePointerClick size={15} style={{ flexShrink: 0 }} />
              <span>Cliques</span>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "999px",
                  background:
                    abaAtiva === "cliques"
                      ? "rgba(34, 197, 94, 0.25)"
                      : "rgba(255, 255, 255, 0.08)",
                  color: abaAtiva === "cliques" ? "#4ade80" : "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 750,
                  flexShrink: 0,
                }}
              >
                {totalCliques}
              </span>
            </button>
          </div>

          <span style={{ fontSize: "12.5px", color: "#64748b" }}>
            {listaAtual.length} {listaAtual.length === 1 ? "publicação" : "publicações"}
          </span>
        </section>

        {/* NOTA INFORMATIVA CONTEXTUAL POR ABA */}
        {abaAtiva === "vistos" && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "14px",
              background: "rgba(56, 189, 248, 0.06)",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              fontSize: "13px",
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <Sparkles size={17} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>
              <strong>Conteúdos Vistos:</strong> As publicações visualizadas continuam ativas
              no seu feed orgânico. Elas só deixam de se repetir quando você clica para entrar no grupo!
            </span>
          </div>
        )}

        {abaAtiva === "likes" && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "14px",
              background: "rgba(244, 63, 94, 0.06)",
              border: "1px solid rgba(244, 63, 94, 0.18)",
              fontSize: "13px",
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <Heart size={17} color="#f43f5e" fill="#f43f5e" style={{ flexShrink: 0 }} />
            <span>
              <strong>Conteúdos Curtidos:</strong> Suas comunidades favoritas salvas. Curtidas têm peso 4x
              no ranqueamento dos seus interesses e afinidade de feed.
            </span>
          </div>
        )}

        {abaAtiva === "cliques" && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "14px",
              background: "rgba(34, 197, 94, 0.06)",
              border: "1px solid rgba(34, 197, 94, 0.18)",
              fontSize: "13px",
              color: "#cbd5e1",
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <MousePointerClick size={17} color="#4ade80" style={{ flexShrink: 0 }} />
            <span>
              <strong>Conteúdos Clicados:</strong> Grupos em que você clicou para entrar. Para dar
              espaço a novos grupos, publicações orgânicas clicadas não se repetem no feed!
            </span>
          </div>
        )}

        {/* GRADE DE PUBLICAÇÕES */}
        {carregando ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#38bdf8" />
            <span style={{ fontSize: "14px" }}>Carregando conteúdos da aba...</span>
          </div>
        ) : listaAtual.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "rgba(21, 26, 33, 0.5)",
              borderRadius: "20px",
              border: "1px dashed rgba(255, 255, 255, 0.10)",
            }}
          >
            <Layers size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: "17px",
                fontWeight: 750,
                color: "#ffffff",
              }}
            >
              Nenhum conteúdo na aba &quot;{abaAtiva}&quot;
            </h3>
            <p
              style={{
                margin: "0 auto 20px",
                fontSize: "13.5px",
                color: "#94a3b8",
                maxWidth: "440px",
                lineHeight: "1.5",
              }}
            >
              {abaAtiva === "vistos"
                ? "Navegue pelo feed para explorar novos grupos e registrar suas visualizações aqui."
                : abaAtiva === "likes"
                ? "Curta publicações que você achou interessantes para salvá-las nesta aba."
                : "Ao clicar para entrar em um grupo, ele será registrado aqui e deixará de se repetir no feed orgânico."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                padding: "10px 22px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #229ED9, #168AC0)",
                color: "#ffffff",
                border: "none",
                fontWeight: 750,
                fontSize: "13.5px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <span>Explorar Feed</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
            {listaExibida.map((pub) => {
              const foto =
                pub.imagens && pub.imagens.length > 0 ? pub.imagens[0] : undefined;
              return (
                <article
                  key={pub.id}
                  style={{
                    background: "#151a21",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {/* FOTO SE HOUVER */}
                  {foto && (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 9",
                        background: "#0a0e13",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={foto}
                        alt={pub.nome}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  )}

                  {/* CORPO */}
                  <div
                    style={{
                      padding: "16px",
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 800,
                          color: "#ffffff",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {pub.nome}
                      </h4>

                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "rgba(56, 189, 248, 0.1)",
                          color: "#38bdf8",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      >
                        {pub.categoria || "Geral"}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        color: "#94a3b8",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 3,
                        overflow: "hidden",
                      }}
                    >
                      {pub.descricao}
                    </p>

                    {/* TAGS */}
                    {pub.tags && pub.tags.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "5px",
                          marginBottom: "14px",
                        }}
                      >
                        {pub.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            onClick={() => handleClicarTag(tag)}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "5px",
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "#94a3b8",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* RODAPÉ DO CARD COM AÇÕES E MÉTRICAS */}
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        {/* BOTÃO CURTIR / DESCURTIR */}
                        <button
                          type="button"
                          onClick={() => handleCurtirItem(pub)}
                          title={pub.curtido ? "Descurtir" : "Curtir"}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            border: "none",
                            background: "transparent",
                            color: pub.curtido ? "#f43f5e" : "#94a3b8",
                            fontSize: "12.5px",
                            fontWeight: pub.curtido ? 750 : 500,
                            cursor: "pointer",
                            padding: "4px",
                          }}
                        >
                          <Heart
                            size={16}
                            fill={pub.curtido ? "#f43f5e" : "none"}
                            color={pub.curtido ? "#f43f5e" : "#94a3b8"}
                          />
                          <span>{pub.likes}</span>
                        </button>

                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          <Eye size={15} />
                          <span>{pub.visualizacoes}</span>
                        </div>

                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          <MousePointerClick size={15} />
                          <span>{pub.cliques}</span>
                        </div>
                      </div>

                      {/* BOTÃO ENTRAR */}
                      <button
                        type="button"
                        onClick={() => handleEntrarGrupo(pub)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(34, 158, 217, 0.25)",
                          background: "rgba(34, 158, 217, 0.12)",
                          color: "#55bee9",
                          fontSize: "12px",
                          fontWeight: 750,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Send size={13} />
                        <span>Entrar</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sentinela de rolagem infinita */}
          <div ref={sentinelaRef} style={{ width: "100%", height: "20px" }} />
        </>
      )}
      </main>

      {/* MODAL DE DENÚNCIA */}
      <CardDenunciar
        aberto={modalDenunciarAberto}
        publicacao={publicacaoParaDenunciar}
        onFechar={() => {
          setModalDenunciarAberto(false);
          setPublicacaoParaDenunciar(null);
        }}
      />
    </div>
  );
}

export default TelaHistoricoConteudos;
