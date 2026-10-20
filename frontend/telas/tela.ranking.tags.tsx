import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Hash,
  Loader2,
  Search,
  Trophy,
  PlusCircle,
  RotateCw,
} from "lucide-react";

import CabecalhoDivulgacaoTelegram from "../componentes/cabecalho.ranktags";
import CardTotalTags from "../componentes/card.total.tags";
import {
  obterTags,
  type TagItem,
} from "../servicos/api.publicacoes";

const LIMITE_POR_PAGINA = 50;

function formatarTextoUsos(tag: TagItem): string {
  const contagem = tag.contagemTotal ?? 0;
  if (contagem === 1) {
    return "1 uso";
  }
  return `${contagem.toLocaleString("pt-BR")} usos`;
}

export function TelaRankingTags() {
  const navigate = useNavigate();

  const [tags, setTags] = useState<TagItem[]>([]);
  const [totalFiltradas, setTotalFiltradas] = useState(0);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Carregar as hashtags do ranking a partir do banco de dados
  const carregarTags = useCallback(async (termoBusca?: string) => {
    setCarregando(true);
    setErro(false);

    try {
      const res = await obterTags(
        undefined,
        termoBusca !== undefined ? termoBusca : busca,
        1,
        LIMITE_POR_PAGINA,
        "ranking"
      );

      setTags(res.tags);
      setTotalFiltradas(
        res.totalFiltradas || res.totalTagsExistentes || res.tags.length || 0
      );
      setPaginaAtual(1);
      setTemMais(res.temMais);
    } catch (error) {
      console.error("Erro ao carregar ranking de hashtags:", error);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  // Carregamento inicial
  useEffect(() => {
    void carregarTags();
  }, [carregarTags]);

  // Busca em tempo real com debounce leve
  useEffect(() => {
    const timer = setTimeout(() => {
      void carregarTags(busca);
    }, 250);

    return () => clearTimeout(timer);
  }, [busca, carregarTags]);

  // Forçar recálculo e sincronização
  async function handleSincronizar() {
    try {
      setRecarregando(true);
      await fetch("/api/tags/sincronizar", { method: "POST" });
      await carregarTags();
    } catch (err) {
      console.error("Erro ao sincronizar hashtags:", err);
    } finally {
      setRecarregando(false);
    }
  }

  // Carregar mais tags para paginação
  const carregarMais = useCallback(async () => {
    if (carregando || carregandoMais || !temMais) {
      return;
    }

    setCarregandoMais(true);
    const proximaPagina = paginaAtual + 1;

    try {
      const res = await obterTags(
        undefined,
        busca,
        proximaPagina,
        LIMITE_POR_PAGINA,
        "ranking"
      );

      setTags((anteriores) => {
        const existentes = new Set(anteriores.map((tag) => tag.slug));
        return [
          ...anteriores,
          ...res.tags.filter((tag) => !existentes.has(tag.slug)),
        ];
      });

      setPaginaAtual(proximaPagina);
      setTemMais(res.temMais);
      setTotalFiltradas(
        res.totalFiltradas || res.totalTagsExistentes || 0
      );
    } catch (error) {
      console.error("Erro ao carregar mais tags:", error);
    } finally {
      setCarregandoMais(false);
    }
  }, [
    carregando,
    carregandoMais,
    temMais,
    paginaAtual,
    busca,
  ]);

  // Rolagem infinita
  useEffect(() => {
    const elemento = sentinelRef.current;
    if (!elemento || !temMais || carregando || carregandoMais) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void carregarMais();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, [temMais, carregando, carregandoMais, carregarMais]);

  // Abrir o feed filtrado pela hashtag clicada
  function handleTagClick(slug: string) {
    navigate(`/?tag=${encodeURIComponent(slug)}`);
  }

  // Cores e decorações para os primeiros colocados no ranking
  function getRankBadge(rank: number = 0) {
    if (rank === 1) {
      return {
        texto: "1º",
        fundo: "linear-gradient(135deg, rgba(234, 179, 8, 0.28) 0%, rgba(202, 138, 4, 0.16) 100%)",
        borda: "1px solid rgba(234, 179, 8, 0.55)",
        cor: "#facc15",
        icone: "🥇",
      };
    }
    if (rank === 2) {
      return {
        texto: "2º",
        fundo: "linear-gradient(135deg, rgba(226, 232, 240, 0.2) 0%, rgba(148, 163, 184, 0.12) 100%)",
        borda: "1px solid rgba(203, 213, 225, 0.45)",
        cor: "#e2e8f0",
        icone: "🥈",
      };
    }
    if (rank === 3) {
      return {
        texto: "3º",
        fundo: "linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(194, 65, 12, 0.12) 100%)",
        borda: "1px solid rgba(249, 115, 22, 0.45)",
        cor: "#fb923c",
        icone: "🥉",
      };
    }
    return {
      texto: `${rank}º`,
      fundo: "rgba(255, 255, 255, 0.05)",
      borda: "1px solid rgba(255, 255, 255, 0.08)",
      cor: "#94a3b8",
      icone: null,
    };
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
      {/* CABEÇALHO */}
      <CabecalhoDivulgacaoTelegram />

      <main
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "24px 16px 60px",
          boxSizing: "border-box",
        }}
      >
        {/* BANNER / INTRODUÇÃO DO RANKING */}
        <div
          style={{
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* CARD DE TOTAL DE TAGS */}
          <CardTotalTags
            total={totalFiltradas}
            carregando={carregando}
          />

          {/* BARRA DE PESQUISA & AÇÕES */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                position: "relative",
                flex: "1 1 280px",
                maxWidth: "480px",
              }}
            >
              <Search
                size={18}
                color="#64748b"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar hashtag no ranking (ex: carro, tecnologia)..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                  background: "#182029",
                  color: "#f8fafc",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.09)";
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={handleSincronizar}
                disabled={recarregando}
                title="Recalcular e atualizar contagens de todas as publicações"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 14px",
                  borderRadius: "11px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: recarregando ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <RotateCw
                  size={15}
                  className={recarregando ? "animate-spin" : ""}
                />
                <span>Atualizar Ranking</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/anunciar-gratuito")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 16px",
                  borderRadius: "11px",
                  background: "linear-gradient(135deg, #229ed9 0%, #168ac0 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(34, 158, 217, 0.25)",
                }}
              >
                <PlusCircle size={16} />
                <span>Criar Publicação</span>
              </button>
            </div>
          </div>
        </div>

        {/* LISTA / GRID DO RANKING DE HASHTAGS */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <Trophy size={20} color="#facc15" />

              <h1
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: 800,
                  color: "#f8fafc",
                  letterSpacing: "-0.4px",
                }}
              >
                Ranking de Hashtags
              </h1>
            </div>

            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                whiteSpace: "nowrap",
              }}
            >
              {totalFiltradas === 1
                ? "1 hashtag contabilizada"
                : `${totalFiltradas.toLocaleString("pt-BR")} hashtags no ranking`}
            </span>
          </div>

          {carregando && tags.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "60px 20px",
                background: "#182029",
                borderRadius: "16px",
                color: "#94a3b8",
              }}
            >
              <Loader2
                size={28}
                color="#38bdf8"
                className="animate-spin"
              />

              <span style={{ fontSize: "13px" }}>
                Contabilizando hashtags nas publicações...
              </span>
            </div>
          ) : erro ? (
            <div
              style={{
                padding: "32px 20px",
                textAlign: "center",
                background: "#182029",
                borderRadius: "16px",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <p
                style={{
                  color: "#f87171",
                  fontSize: "14px",
                  margin: "0 0 14px",
                }}
              >
                Não foi possível carregar as hashtags do ranking.
              </p>

              <button
                type="button"
                onClick={() => void carregarTags()}
                style={{
                  padding: "9px 16px",
                  borderRadius: "9px",
                  background: "rgba(56,189,248,0.1)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  color: "#38bdf8",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : tags.length === 0 ? (
            <div
              style={{
                padding: "50px 24px",
                textAlign: "center",
                borderRadius: "16px",
                background: "#182029",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#94a3b8",
              }}
            >
              <Hash
                size={36}
                color="#475569"
                style={{ marginBottom: "12px" }}
              />

              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                }}
              >
                {busca
                  ? `Nenhuma hashtag encontrada para "${busca}".`
                  : "Nenhuma hashtag em uso nas publicações no momento."}
              </p>

              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "13px",
                  color: "#94a3b8",
                }}
              >
                {busca
                  ? "Tente buscar por outro termo ou limpe o campo de busca."
                  : "Crie uma nova publicação utilizando hashtags (ex: #carro, #tecnologia) para adicioná-la automaticamente ao ranking!"}
              </p>

              <button
                type="button"
                onClick={() => navigate("/anunciar-gratuito")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #229ed9 0%, #168ac0 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Criar Publicação com Hashtag
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
                gap: "12px",
              }}
            >
              {tags.map((tag, index) => {
                const rankNum = tag.rank ?? index + 1;
                const badge = getRankBadge(rankNum);
                const textoUsos = formatarTextoUsos(tag);

                return (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => handleTagClick(tag.slug)}
                    title={`Ver publicações com #${tag.slug} (${textoUsos})`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      minWidth: 0,
                      padding: "14px 16px",
                      borderRadius: "14px",
                      background: "#182029",
                      border: rankNum <= 3
                        ? badge.borda
                        : "1px solid rgba(255,255,255,0.07)",
                      boxShadow: rankNum <= 3
                        ? "0 4px 16px rgba(0,0,0,0.22)"
                        : "0 4px 12px rgba(0,0,0,0.12)",
                      cursor: "pointer",
                      textAlign: "left",
                      boxSizing: "border-box",
                      transition:
                        "transform 0.16s ease, background 0.16s ease, border-color 0.16s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.background = "#1e2834";
                      if (rankNum > 3) {
                        e.currentTarget.style.borderColor = "rgba(56,189,248,0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "#182029";
                      if (rankNum > 3) {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: 0,
                      }}
                    >
                      {/* POSIÇÃO DO RANKING */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "32px",
                          height: "32px",
                          padding: "0 6px",
                          borderRadius: "9px",
                          background: badge.fundo,
                          border: badge.borda,
                          color: badge.cor,
                          fontSize: "12px",
                          fontWeight: 800,
                          flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {badge.texto}
                      </span>

                      {/* NOME DA HASHTAG */}
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            color: "#38bdf8",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          #
                        </span>

                        <span
                          style={{
                            color: "#f8fafc",
                            fontWeight: 700,
                            fontSize: "14px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {tag.slug}
                        </span>
                      </span>
                    </div>

                    {/* CONTAGEM EXATA DE USOS */}
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: "12px",
                        fontWeight: 700,
                        color: rankNum <= 3 ? badge.cor : "#38bdf8",
                        background: rankNum <= 3
                          ? badge.fundo
                          : "rgba(56, 189, 248, 0.1)",
                        padding: "5px 9px",
                        borderRadius: "8px",
                        border: rankNum <= 3
                          ? badge.borda
                          : "1px solid rgba(56, 189, 248, 0.2)",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {textoUsos}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* CARREGAMENTO INFINITO / BOTÃO CARREGAR MAIS */}
        <div
          ref={sentinelRef}
          style={{
            padding: "24px 0",
            textAlign: "center",
          }}
        >
          {carregandoMais && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              <Loader2
                size={18}
                className="animate-spin"
                color="#38bdf8"
              />
              Carregando mais hashtags...
            </div>
          )}

          {!carregando &&
            !carregandoMais &&
            temMais &&
            tags.length > 0 && (
              <button
                type="button"
                onClick={() => void carregarMais()}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#cbd5e1",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Carregar mais hashtags
              </button>
            )}
        </div>
      </main>
    </div>
  );
}

export default TelaRankingTags;
