
import React from "react";
import { BarChart3, Layers3, LoaderCircle } from "lucide-react";
import { CalculoInteressePeriodoItem } from "../servicos/api.publicacoes";

export interface CardDistribuicaoInteressesProps {
  calculoAtual?: CalculoInteressePeriodoItem;
  carregando: boolean;
}

const CORES = {
  fundo: "#151b24",
  texto: "#f1f5f9",
  secundario: "#94a3b8",
  azul: "#38bdf8",
  borda: "rgba(255,255,255,0.08)",
  trilho: "rgba(255,255,255,0.07)",
};

const CORES_BARRAS = [
  "linear-gradient(90deg, #38bdf8, #0ea5e9)",
  "linear-gradient(90deg, #a855f7, #8b5cf6)",
  "linear-gradient(90deg, #10b981, #059669)",
  "linear-gradient(90deg, #f59e0b, #d97706)",
];

const estilos = {
  card: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "22px",
    borderRadius: "18px",
    background: `linear-gradient(145deg, #1b2531, ${CORES.fundo})`,
    border: `1px solid ${CORES.borda}`,
    color: CORES.texto,
    fontFamily: "Inter, Arial, sans-serif",
  },

  cabecalho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
    marginBottom: "22px",
  },

  tituloGrupo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  icone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "11px",
    background: "rgba(56,189,248,0.10)",
    border: "1px solid rgba(56,189,248,0.18)",
    color: CORES.azul,
  },

  titulo: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 800,
    lineHeight: 1.5,
  },

  periodo: {
    color: CORES.secundario,
    fontSize: "12px",
    margin: "3px 0 0",
  },

  legenda: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.035)",
    color: CORES.secundario,
    fontSize: "11px",
    whiteSpace: "nowrap" as const,
  },

  lista: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },

  linha: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: "9px",
  },

  nome: {
    fontSize: "13px",
    fontWeight: 700,
    overflowWrap: "anywhere" as const,
  },

  valor: {
    fontSize: "12px",
    fontWeight: 800,
    color: CORES.azul,
    textAlign: "right" as const,
  },

  trilho: {
    width: "100%",
    height: "8px",
    overflow: "hidden",
    borderRadius: "999px",
    background: CORES.trilho,
  },

  vazio: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "30px 18px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.025)",
    textAlign: "center" as const,
    color: CORES.secundario,
    fontSize: "12px",
    lineHeight: 1.6,
  },
};

export function CardDistribuicaoInteresses({
  calculoAtual,
  carregando,
}: CardDistribuicaoInteressesProps) {
  const grupos = calculoAtual?.distribuicaoGrupos ?? [];

  return (
    <section style={estilos.card}>
      {/* Cabeçalho */}
      <header style={estilos.cabecalho}>
        <div style={estilos.tituloGrupo}>
          <div style={estilos.icone}>
            <BarChart3 size={19} />
          </div>

          <div>
            <h3 style={estilos.titulo}>
              Distribuição de Afinidade
            </h3>

            <p style={estilos.periodo}>
              Categorias · {calculoAtual?.label || "Geral"}
            </p>
          </div>
        </div>

        <div style={estilos.legenda}>
          <Layers3 size={13} />
          Soma normalizada a 100%
        </div>
      </header>

      {/* Conteúdo */}
      {carregando ? (
        <div role="status" style={estilos.vazio}>
          <LoaderCircle
            size={25}
            color={CORES.azul}
            className="animate-spin"
          />
          <span>Carregando distribuição de categorias...</span>
        </div>
      ) : grupos.length > 0 ? (
        <div style={estilos.lista}>
          {grupos.map((item, index) => {
            const percentual = Math.min(
              100,
              Math.max(4, item.percentual)
            );

            const cor =
              CORES_BARRAS[index % CORES_BARRAS.length];

            return (
              <div key={`${item.grupoNome}-${index}`}>
                <div style={estilos.linha}>
                  <span style={estilos.nome}>
                    {item.grupoNome}
                  </span>

                  <span style={estilos.valor}>
                    {item.percentual}% · {item.pontos} pts
                  </span>
                </div>

                <div
                  style={estilos.trilho}
                  role="progressbar"
                  aria-label={`Afinidade: ${item.grupoNome}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.max(0, item.percentual)
                  )}
                >
                  <div
                    style={{
                      width: `${percentual}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: cor,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={estilos.vazio}>
          <BarChart3 size={26} color="#64748b" />

          <span>
            Nenhuma interação detectada neste período.
            Interaja com publicações curtindo, visualizando
            e clicando para calibrar suas categorias.
          </span>
        </div>
      )}
    </section>
  );
}

export default CardDistribuicaoInteresses;



