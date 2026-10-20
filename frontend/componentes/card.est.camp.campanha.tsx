import React from "react";
import {
  Megaphone,
  CalendarDays,
  Target,
} from "lucide-react";

export interface CardEstCampCampanhaProps {
  nome?: string;
  dataCriacao?: string;
  tempoAtuacao?: string;
  status?: string;
}

export function CardEstCampCampanha({
  nome = "Campanha de Divulgação",
  dataCriacao = "03/10/2026",
  tempoAtuacao = "12 dias",
  status = "Ativa",
}: CardEstCampCampanhaProps) {
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
        Campanha
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
        {/* NOME */}
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
            <Megaphone size={19} color="#38bdf8" />
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
              Nome
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {nome}
            </strong>
          </div>
        </div>

        {/* DATA DE CRIAÇÃO */}
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
            <CalendarDays size={19} color="#38bdf8" />
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
              Data de criação
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {dataCriacao}
            </strong>
          </div>
        </div>

        {/* TEMPO DE ATUAÇÃO */}
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
            <CalendarDays size={19} color="#38bdf8" />
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
              Tempo de atuação
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {tempoAtuacao}
            </strong>
          </div>
        </div>

        {/* STATUS */}
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
              background: "rgba(74,222,128,0.10)",
              border: "1px solid rgba(74,222,128,0.18)",
            }}
          >
            <Target size={19} color="#4ade80" />
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
              Status
            </span>
            <strong
              style={{
                display: "block",
                color: "#4ade80",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {status}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CardEstCampCampanha;
