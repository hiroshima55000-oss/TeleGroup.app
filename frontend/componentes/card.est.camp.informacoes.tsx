import React from "react";
import {
  Link as LinkIcon,
  Users,
  CalendarDays,
} from "lucide-react";

export interface CardEstCampInformacoesProps {
  link?: string;
  publicoAlcancado?: string;
  dataInicio?: string;
  dataTermino?: string;
}

export function CardEstCampInformacoes({
  link = "https://flux.app/campanha",
  publicoAlcancado = "1.842.390 pessoas",
  dataInicio = "21/09/2026",
  dataTermino = "21/10/2026",
}: CardEstCampInformacoesProps) {
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
        Informações
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
        {/* LINK */}
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
            <LinkIcon size={19} color="#38bdf8" />
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
              Link
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {link}
            </strong>
          </div>
        </div>

        {/* PÚBLICO ALCANÇADO */}
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
            <Users size={19} color="#38bdf8" />
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
              Público alcançado
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {publicoAlcancado}
            </strong>
          </div>
        </div>

        {/* DATA DE INÍCIO */}
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
              Data de início
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {dataInicio}
            </strong>
          </div>
        </div>

        {/* DATA DE TÉRMINO */}
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
              Data de término
            </span>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {dataTermino}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CardEstCampInformacoes;
