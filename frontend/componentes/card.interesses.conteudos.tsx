import React from "react";
import {
  Layers,
  Eye,
  Heart,
  MousePointerClick,
  Sparkles,
  Loader2,
  ArrowRight,
  Send,
} from "lucide-react";
import { PublicacaoItem } from "../servicos/api.publicacoes";

export interface CardConteudosInteressesProps {
  abaAtiva: "visualizados" | "curtidos" | "clicados";
  aoMudarAba: (aba: "visualizados" | "curtidos" | "clicados") => void;
  listaAtual: PublicacaoItem[];
  totalVisualizados: number;
  totalCurtidos: number;
  totalClicados: number;
  carregando: boolean;
  aoCurtir: (pub: PublicacaoItem) => void;
  aoEntrar: (pub: PublicacaoItem) => void;
  aoClicarTag: (tag: string) => void;
  aoExplorarFeed: () => void;
}

export function CardConteudosInteresses({
  abaAtiva,
  aoMudarAba,
  listaAtual,
  totalVisualizados,
  totalCurtidos,
  totalClicados,
  carregando,
  aoCurtir,
  aoEntrar,
  aoClicarTag,
  aoExplorarFeed,
}: CardConteudosInteressesProps) {
  return (
    <section
      style={{
        background: "#151a21",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* HEADER DA SEÇÃO DE CONTEÚDOS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={18} color="#38bdf8" />
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            Conteúdos com que você interagiu
          </h3>
        </div>

        {/* BARRA DE NAVEGAÇÃO DE ABAS */}
        <div
          style={{
            display: "inline-flex",
            background: "rgba(15, 20, 26, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "3px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => aoMudarAba("visualizados")}
            style={{
              padding: "8px 14px",
              borderRadius: "9px",
              border: "none",
              background:
                abaAtiva === "visualizados"
                  ? "rgba(56, 189, 248, 0.15)"
                  : "transparent",
              color: abaAtiva === "visualizados" ? "#38bdf8" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <Eye size={15} />
            <span>Visualizados</span>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                fontSize: "10.5px",
              }}
            >
              {totalVisualizados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => aoMudarAba("curtidos")}
            style={{
              padding: "8px 14px",
              borderRadius: "9px",
              border: "none",
              background:
                abaAtiva === "curtidos"
                  ? "rgba(244, 63, 94, 0.15)"
                  : "transparent",
              color: abaAtiva === "curtidos" ? "#f43f5e" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <Heart size={15} fill={abaAtiva === "curtidos" ? "#f43f5e" : "none"} />
            <span>Curtidos</span>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                fontSize: "10.5px",
              }}
            >
              {totalCurtidos}
            </span>
          </button>

          <button
            type="button"
            onClick={() => aoMudarAba("clicados")}
            style={{
              padding: "8px 14px",
              borderRadius: "9px",
              border: "none",
              background:
                abaAtiva === "clicados"
                  ? "rgba(34, 197, 94, 0.15)"
                  : "transparent",
              color: abaAtiva === "clicados" ? "#4ade80" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <MousePointerClick size={15} />
            <span>Clicados</span>
            <span
              style={{
                padding: "1px 6px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.08)",
                fontSize: "10.5px",
              }}
            >
              {totalClicados}
            </span>
          </button>
        </div>
      </div>

      {/* NOTA INFORMATIVA DA REGRA DO FEED (SEM BOTÃO DE RESET) */}
      {abaAtiva === "visualizados" && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px solid rgba(56, 189, 248, 0.18)",
            fontSize: "12.5px",
            color: "#cbd5e1",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            <strong>Regra do feed:</strong> Publicações já visualizadas 1 vez
            não se repetem no seu feed orgânico (somente anúncios pagos podem
            reaparecer). Você pode revê-las aqui a qualquer momento.
          </span>
        </div>
      )}

      {/* LISTA DE CARDS DE CONTEÚDO */}
      {carregando ? (
        <div
          style={{
            padding: "50px 20px",
            textAlign: "center",
            color: "#7f8c9d",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Loader2 size={26} className="animate-spin" color="#38bdf8" />
          <span>Carregando seus conteúdos...</span>
        </div>
      ) : listaAtual.length === 0 ? (
        <div
          style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "rgba(21, 26, 33, 0.4)",
            borderRadius: "16px",
            border: "1px dashed rgba(255, 255, 255, 0.10)",
          }}
        >
          <Layers size={32} color="#64748b" style={{ margin: "0 auto 10px" }} />
          <h4
            style={{
              margin: "0 0 6px",
              fontSize: "16px",
              fontWeight: 750,
              color: "#ffffff",
            }}
          >
            Nenhum conteúdo {abaAtiva} ainda
          </h4>
          <p
            style={{
              margin: "0 auto 16px",
              fontSize: "13px",
              color: "#94a3b8",
              maxWidth: "420px",
            }}
          >
            Navegue pelas comunidades no feed e interaja para acompanhar seu histórico
            completo aqui.
          </p>
          <button
            type="button"
            onClick={aoExplorarFeed}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #229ED9, #168AC0)",
              color: "#ffffff",
              border: "none",
              fontWeight: 750,
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Explorar Feed</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {listaAtual.map((pub) => {
            const foto =
              pub.imagens && pub.imagens.length > 0 ? pub.imagens[0] : undefined;
            return (
              <article
                key={pub.id}
                style={{
                  background: "#12171e",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 8px 22px rgba(0, 0, 0, 0.2)",
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
                          onClick={() => aoClicarTag(tag.replace(/^#/, ""))}
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
                        onClick={() => aoCurtir(pub)}
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
                      onClick={() => aoEntrar(pub)}
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
      )}
    </section>
  );
}

export default CardConteudosInteresses;
