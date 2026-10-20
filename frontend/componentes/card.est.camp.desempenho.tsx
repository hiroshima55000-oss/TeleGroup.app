import React from "react";
import {
  Eye,
  MousePointerClick,
  Wallet,
} from "lucide-react";

export interface CardEstCampDesempenhoProps {
  visualizacoesPorDia?: string;
  cliquesPorDia?: string;
  gastoPorDia?: string;
}

export function CardEstCampDesempenho({
  visualizacoesPorDia = "227.582",
  cliquesPorDia = "21.320",
  gastoPorDia = "R$ 153,54",
}: CardEstCampDesempenhoProps) {
  return (
    <div
      style={{
        marginBottom: "28px",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "12px",
          color: "#38bdf8",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        Desempenho
      </h2>

      <section
        style={{
          background: "#1b222b",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        {/* VISUALIZAÇÕES POR DIA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "17px 21px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(34,158,217,0.10)",
              border: "1px solid rgba(34,158,217,0.15)",
            }}
          >
            <Eye size={19} color="#38bdf8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                color: "#7f8c9d",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Visualizações por dia
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {visualizacoesPorDia}
            </strong>
          </div>
        </div>

        {/* CLIQUES POR DIA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "17px 21px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(34,158,217,0.10)",
              border: "1px solid rgba(34,158,217,0.15)",
            }}
          >
            <MousePointerClick size={19} color="#38bdf8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                color: "#7f8c9d",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Cliques por dia
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {cliquesPorDia}
            </strong>
          </div>
        </div>

        {/* GASTO POR DIA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "17px 21px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(34,158,217,0.10)",
              border: "1px solid rgba(34,158,217,0.15)",
            }}
          >
            <Wallet size={19} color="#38bdf8" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                color: "#7f8c9d",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            >
              Gasto por dia
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {gastoPorDia}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CardEstCampDesempenho;
