import React from "react";
import { Hash, Award, ExternalLink, Loader2 } from "lucide-react";
import { TagRankeadaInteresse } from "../servicos/api.publicacoes";

export interface CardTagsRankeadasInteressesProps {
  tags: TagRankeadaInteresse[];
  carregando: boolean;
  aoClicarTag: (slugOuNome: string) => void;
}

export function CardTagsRankeadasInteresses({
  tags,
  carregando,
  aoClicarTag,
}: CardTagsRankeadasInteressesProps) {
  return (
    <section
      style={{
        background: "#151a21",
        border: "1px solid rgba(56, 189, 248, 0.22)",
        borderRadius: "20px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Hash size={19} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.2px",
              }}
            >
              Tags Rankeadas pelo seu Interesse
            </h3>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              Hashtags ordenadas por relevância, engajamento e pontuação ponderada.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "8px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: "#38bdf8",
            fontSize: "11.5px",
            fontWeight: 750,
          }}
        >
          <Award size={13} />
          <span>{tags.length} tags rankeadas</span>
        </div>
      </div>

      {carregando ? (
        <div
          style={{
            padding: "36px",
            textAlign: "center",
            color: "#94a3b8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Loader2 size={24} className="animate-spin" color="#38bdf8" />
          <span>Rankeando tags pelo seu perfil...</span>
        </div>
      ) : tags.length === 0 ? (
        <div
          style={{
            padding: "30px 16px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "12px",
          }}
        >
          Ainda não há tags rankeadas para o seu perfil. Explore o feed, curta e
          acesse comunidades para que as hashtags de maior afinidade sejam rankeadas aqui.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {tags.map((item, idx) => {
            const posicao = idx + 1;
            const medalha =
              posicao === 1 ? "🥇" : posicao === 2 ? "🥈" : posicao === 3 ? "🥉" : null;

            const corBordaMedalha =
              posicao === 1
                ? "rgba(234, 179, 8, 0.4)"
                : posicao === 2
                ? "rgba(148, 163, 184, 0.4)"
                : posicao === 3
                ? "rgba(249, 115, 22, 0.4)"
                : "rgba(255, 255, 255, 0.06)";

            const corFundoPosicao =
              posicao === 1
                ? "rgba(234, 179, 8, 0.12)"
                : posicao === 2
                ? "rgba(148, 163, 184, 0.12)"
                : posicao === 3
                ? "rgba(249, 115, 22, 0.12)"
                : "rgba(255, 255, 255, 0.05)";

            const corTextoPosicao =
              posicao === 1
                ? "#facc15"
                : posicao === 2
                ? "#e2e8f0"
                : posicao === 3
                ? "#fb923c"
                : "#94a3b8";

            const tagAlvo = item.slug || item.tag;

            return (
              <div
                key={tagAlvo + idx}
                style={{
                  background: "rgba(21, 26, 33, 0.6)",
                  border: `1px solid ${corBordaMedalha}`,
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* BADGE DE POSIÇÃO NO RANKING */}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: corFundoPosicao,
                        border: `1px solid ${corBordaMedalha}`,
                        color: corTextoPosicao,
                        fontWeight: 800,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {medalha ? medalha : `#${posicao}`}
                    </div>

                    {/* NOME DA TAG */}
                    <div>
                      <span
                        style={{
                          fontSize: "14.5px",
                          fontWeight: 800,
                          color: "#ffffff",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        #{tagAlvo}
                      </span>
                      <span
                        style={{
                          marginLeft: "8px",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          background:
                            item.nivelAfinidade === "Alta"
                              ? "rgba(34, 197, 94, 0.15)"
                              : item.nivelAfinidade === "Média"
                              ? "rgba(56, 189, 248, 0.15)"
                              : "rgba(168, 85, 247, 0.15)",
                          color:
                            item.nivelAfinidade === "Alta"
                              ? "#4ade80"
                              : item.nivelAfinidade === "Média"
                              ? "#38bdf8"
                              : "#c084fc",
                          fontSize: "11px",
                          fontWeight: 750,
                        }}
                      >
                        {item.nivelAfinidade || "Em Alta"}
                      </span>
                    </div>
                  </div>

                  {/* SCORE & PONTUAÇÃO & AÇÃO */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#38bdf8",
                        }}
                      >
                        {item.percentual > 0 ? `${item.percentual}% de afinidade` : `${item.pontos} pts`}
                      </span>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        {item.pontos} pts • {item.totalAcoes} ações
                      </div>
                    </div>

                    {/* BOTÃO PARA EXPLORAR NO FEED */}
                    <button
                      type="button"
                      onClick={() => aoClicarTag(tagAlvo)}
                      title={`Ver publicações de #${tagAlvo}`}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "#cbd5e1",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>Feed</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO DO INTERESSE DA TAG */}
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.06)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(6, item.percentual || (100 / (posicao * 1.5))))}%`,
                      height: "100%",
                      background:
                        posicao === 1
                          ? "linear-gradient(90deg, #eab308, #ca8a04)"
                          : posicao === 2
                          ? "linear-gradient(90deg, #38bdf8, #0284c7)"
                          : posicao === 3
                          ? "linear-gradient(90deg, #f97316, #ea580c)"
                          : "linear-gradient(90deg, #818cf8, #6366f1)",
                      borderRadius: "999px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CardTagsRankeadasInteresses;
