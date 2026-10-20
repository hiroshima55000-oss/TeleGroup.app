import {
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
} from "lucide-react";

export interface CardAlcanceEstimadoProps {
  orcamentoDiario: number;
  semTituloInterno?: boolean;
}

export function CardAlcanceEstimado({
  orcamentoDiario,
  semTituloInterno = false,
}: CardAlcanceEstimadoProps) {
  const alcanceEstimado = (orcamentoDiario || 10) * 1000;
  const impressoes = Math.round(alcanceEstimado * 1.5);
  const cliquesMinimos = Math.round(alcanceEstimado * 0.025);
  const cliquesMaximos = Math.round(alcanceEstimado * 0.055);

  const formatarNumero = (valor: number) =>
    valor.toLocaleString("pt-BR");

  return (
    <section
      style={{
        boxSizing: "border-box",
        padding: "22px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(27,33,42,0.92)",
      }}
    >
      {!semTituloInterno && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          <TrendingUp size={19} color="#38bdf8" />

          <span
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#f1f5f9",
            }}
          >
            Alcance Estimado
          </span>
        </div>
      )}

      {/* ALCANCE PRINCIPAL */}
      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            color: "#94a3b8",
            fontSize: "12px",
          }}
        >
          <Users size={15} color="#38bdf8" />
          <span>Pessoas alcançadas por dia</span>
        </div>

        <div
          style={{
            color: "#38bdf8",
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.6px",
            lineHeight: 1.2,
          }}
        >
          {formatarNumero(alcanceEstimado)}
        </div>
      </div>

      {/* MÉTRICAS SECUNDÁRIAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        {/* IMPRESSÕES */}
        <div
          style={{
            minWidth: 0,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <Eye size={14} color="#38bdf8" />
            <span>Impressões</span>
          </div>

          <div
            style={{
              color: "#f1f5f9",
              fontSize: "16px",
              fontWeight: 800,
              overflowWrap: "anywhere",
            }}
          >
            {formatarNumero(impressoes)}
          </div>
        </div>

        {/* CLIQUES */}
        <div
          style={{
            minWidth: 0,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              color: "#94a3b8",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            <MousePointerClick size={14} color="#38bdf8" />
            <span>Cliques no link</span>
          </div>

          <div
            style={{
              color: "#f1f5f9",
              fontSize: "16px",
              fontWeight: 800,
              overflowWrap: "anywhere",
            }}
          >
            {formatarNumero(cliquesMinimos)} -{" "}
            {formatarNumero(cliquesMaximos)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CardAlcanceEstimado;