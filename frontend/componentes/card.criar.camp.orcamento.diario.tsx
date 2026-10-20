import { Wallet } from "lucide-react";

export interface CardOrcamentoDiarioProps {
  orcamentoDiario: number;
  setOrcamentoDiario: (valor: number) => void;
  semTituloInterno?: boolean;
}

export function CardOrcamentoDiario({
  orcamentoDiario,
  setOrcamentoDiario,
  semTituloInterno = false,
}: CardOrcamentoDiarioProps) {
  return (
    <section
      style={{
        padding: "22px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(27,33,42,0.92)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: semTituloInterno ? "flex-end" : "space-between",
          marginBottom: "16px",
        }}
      >
        {!semTituloInterno && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Wallet size={19} color="#38bdf8" />
            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#f1f5f9",
              }}
            >
              Orçamento Diário
            </span>
          </div>
        )}

        <div
          style={{
            fontSize: "18px",
            fontWeight: 900,
            color: "#38bdf8",
          }}
        >
          R$ {orcamentoDiario.toFixed(2)} / dia
        </div>
      </div>

      {/* BOTÕES DE ATALHO */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {[10, 25, 50, 100].map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => setOrcamentoDiario(valor)}
            style={{
              padding: "10px 4px",
              borderRadius: "10px",
              border:
                orcamentoDiario === valor
                  ? "1px solid #38bdf8"
                  : "1px solid rgba(255,255,255,0.08)",
              background:
                orcamentoDiario === valor
                  ? "rgba(56, 189, 248, 0.15)"
                  : "rgba(255,255,255,0.03)",
              color: orcamentoDiario === valor ? "#38bdf8" : "#94a3b8",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            R$ {valor}
          </button>
        ))}
      </div>

      {/* SLIDER INTERATIVO */}
      <div style={{ marginBottom: "14px" }}>
        <input
          id="campo-orcamento-diario"
          type="range"
          min={10}
          max={100}
          step={5}
          value={orcamentoDiario}
          onChange={(e) => setOrcamentoDiario(Number(e.target.value))}
          style={{
            width: "100%",
            accentColor: "#229ed9",
            cursor: "pointer",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#718094",
          fontSize: "12px",
        }}
      >
        <span>Mínimo: R$ 10,00</span>
        <span>Máximo: R$ 100,00</span>
      </div>
    </section>
  );
}

export default CardOrcamentoDiario;
