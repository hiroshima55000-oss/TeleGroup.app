
import React from "react";
import {
  Hash,
  Award,
  ExternalLink,
  LoaderCircle,
  TrendingUp,
} from "lucide-react";

import { TagRankeadaInteresse } from "../servicos/api.publicacoes";

export interface CardTagsRankeadasInteressesProps {
  tags: TagRankeadaInteresse[];
  carregando: boolean;
  aoClicarTag: (slugOuNome: string) => void;
}

const CORES = {
  fundo: "#151b24",
  card: "rgba(255,255,255,0.025)",
  borda: "rgba(255,255,255,0.08)",
  texto: "#f1f5f9",
  secundario: "#94a3b8",
  azul: "#38bdf8",
};

const CORES_POSICAO = [
  {
    texto: "#facc15",
    fundo: "rgba(234,179,8,0.12)",
    borda: "rgba(234,179,8,0.35)",
    barra: "linear-gradient(90deg, #eab308, #ca8a04)",
    medalha: "🥇",
  },
  {
    texto: "#e2e8f0",
    fundo: "rgba(148,163,184,0.12)",
    borda: "rgba(148,163,184,0.35)",
    barra: "linear-gradient(90deg, #38bdf8, #0284c7)",
    medalha: "🥈",
  },
  {
    texto: "#fb923c",
    fundo: "rgba(249,115,22,0.12)",
    borda: "rgba(249,115,22,0.35)",
    barra: "linear-gradient(90deg, #f97316, #ea580c)",
    medalha: "🥉",
  },
];

const CORES_AFINIDADE = {
  Alta: {
    texto: "#4ade80",
    fundo: "rgba(34,197,94,0.12)",
  },
  Média: {
    texto: "#38bdf8",
    fundo: "rgba(56,189,248,0.12)",
  },
  Baixa: {
    texto: "#c084fc",
    fundo: "rgba(168,85,247,0.12)",
  },
};

const estilos = {
  card: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "22px",
    borderRadius: "18px",
    background: `linear-gradient(145deg, #1b2531, ${CORES.fundo})`,
    border: "1px solid rgba(56,189,248,0.16)",
    color: CORES.texto,
    fontFamily: "Inter, Arial, sans-serif",
  },

  cabecalho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "14px",
    marginBottom: "22px",
  },

  tituloGrupo: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
    flex: "1 1 250px",
  },

  icone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    flexShrink: 0,
    borderRadius: "12px",
    background: "rgba(56,189,248,0.10)",
    border: "1px solid rgba(56,189,248,0.18)",
    color: CORES.azul,
  },

  titulo: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "-0.3px",
    lineHeight: 1.4,
  },

  descricao: {
    margin: "5px 0 0",
    color: CORES.secundario,
    fontSize: "12px",
    lineHeight: 1.6,
  },

  contador: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "9px",
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.18)",
    color: CORES.azul,
    fontSize: "11px",
    fontWeight: 750,
    whiteSpace: "nowrap" as const,
  },

  lista: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },

  item: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    padding: "15px",
    borderRadius: "13px",
    background: CORES.card,
    border: `1px solid ${CORES.borda}`,
    transition: "border-color 0.2s ease",
  },

  linha: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
  },

  identificacao: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flex: "1 1 220px",
  },

  posicao: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 800,
  },

  nome: {
    color: CORES.texto,
    fontSize: "14px",
    fontWeight: 800,
    overflowWrap: "anywhere" as const,
  },

  afinidade: {
    display: "inline-flex",
    marginTop: "6px",
    padding: "3px 7px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: 750,
  },

  metricas: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap" as const,
  },

  pontuacao: {
    textAlign: "right" as const,
  },

  percentual: {
    display: "block",
    color: CORES.azul,
    fontSize: "12px",
    fontWeight: 800,
  },

  detalhe: {
    marginTop: "5px",
    color: "#718096",
    fontSize: "11px",
  },

  botao: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: `1px solid ${CORES.borda}`,
    background: "rgba(255,255,255,0.04)",
    color: "#cbd5e1",
    fontSize: "11px",
    fontWeight: 750,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },

  trilho: {
    width: "100%",
    height: "6px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "rgba(255,255,255,0.06)",
  },

  vazio: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 18px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.025)",
    textAlign: "center" as const,
    color: CORES.secundario,
    fontSize: "12px",
    lineHeight: 1.7,
  },
};

export function CardTagsRankeadasInteresses({
  tags,
  carregando,
  aoClicarTag,
}: CardTagsRankeadasInteressesProps) {
  return (
    <section style={estilos.card}>
      {/* Cabeçalho */}
      <header style={estilos.cabecalho}>
        <div style={estilos.tituloGrupo}>
          <div style={estilos.icone}>
            <Hash size={20} />
          </div>

          <div>
            <h3 style={estilos.titulo}>
              Tags por Interesse
            </h3>

            <p style={estilos.descricao}>
              Hashtags ordenadas por afinidade e engajamento.
            </p>
          </div>
        </div>

        <div style={estilos.contador}>
          <Award size={14} />
          {tags.length} {tags.length === 1 ? "tag" : "tags"}
        </div>
      </header>

      {/* Carregamento */}
      {carregando ? (
        <div role="status" style={estilos.vazio}>
          <LoaderCircle
            size={26}
            color={CORES.azul}
            className="animate-spin"
          />
          <span>Calculando o ranking de interesses...</span>
        </div>
      ) : tags.length === 0 ? (
        /* Estado vazio */
        <div style={estilos.vazio}>
          <TrendingUp size={26} color="#64748b" />

          <span>
            Ainda não existem tags rankeadas para seu perfil.
            Explore o feed, curta publicações e acesse
            comunidades para identificar seus interesses.
          </span>
        </div>
      ) : (
        /* Ranking */
        <div style={estilos.lista}>
          {tags.map((item, index) => {
            const posicao = index + 1;
            const tagAlvo = item.slug || item.tag;

            const destaque = CORES_POSICAO[index] ?? {
              texto: CORES.secundario,
              fundo: "rgba(255,255,255,0.04)",
              borda: CORES.borda,
              barra: "linear-gradient(90deg, #818cf8, #6366f1)",
              medalha: "",
            };

            const afinidade =
              item.nivelAfinidade === "Alta"
                ? CORES_AFINIDADE.Alta
                : item.nivelAfinidade === "Média"
                  ? CORES_AFINIDADE.Média
                  : CORES_AFINIDADE.Baixa;

            const percentual = Math.min(
              100,
              Math.max(
                6,
                item.percentual || 100 / (posicao * 1.5)
              )
            );

            return (
              <article
                key={`${tagAlvo}-${index}`}
                style={{
                  ...estilos.item,
                  borderColor:
                    index < 3 ? destaque.borda : CORES.borda,
                }}
              >
                <div style={estilos.linha}>
                  {/* Posição e tag */}
                  <div style={estilos.identificacao}>
                    <div
                      style={{
                        ...estilos.posicao,
                        background: destaque.fundo,
                        border: `1px solid ${destaque.borda}`,
                        color: destaque.texto,
                      }}
                    >
                      {destaque.medalha || `#${posicao}`}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={estilos.nome}>
                        #{tagAlvo}
                      </div>

                      <span
                        style={{
                          ...estilos.afinidade,
                          color: afinidade.texto,
                          background: afinidade.fundo,
                        }}
                      >
                        {item.nivelAfinidade || "Em Alta"}
                      </span>
                    </div>
                  </div>

                  {/* Pontuação e botão */}
                  <div style={estilos.metricas}>
                    <div style={estilos.pontuacao}>
                      <span style={estilos.percentual}>
                        {item.percentual > 0
                          ? `${item.percentual}% de afinidade`
                          : `${item.pontos} pts`}
                      </span>

                      <div style={estilos.detalhe}>
                        {item.pontos} pts · {item.totalAcoes} ações
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => aoClicarTag(tagAlvo)}
                      title={`Ver publicações de #${tagAlvo}`}
                      aria-label={`Explorar a tag ${tagAlvo} no feed`}
                      style={estilos.botao}
                    >
                      Feed
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                {/* Barra de afinidade */}
                <div
                  style={estilos.trilho}
                  role="progressbar"
                  aria-label={`Afinidade da tag ${tagAlvo}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.max(0, item.percentual || 0)
                  )}
                >
                  <div
                    style={{
                      width: `${percentual}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: destaque.barra,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CardTagsRankeadasInteresses;



