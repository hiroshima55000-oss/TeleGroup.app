import React from "react";
import { BarChart3 } from "lucide-react";
import { CalculoInteressePeriodoItem } from "../servicos/api.publicacoes";

export interface CardDistribuicaoInteressesProps {
  calculoAtual?: CalculoInteressePeriodoItem;
  carregando: boolean;
}

export function CardDistribuicaoInteresses({
  calculoAtual,
  carregando,
}: CardDistribuicaoInteressesProps) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart3 size={18} color="#38bdf8" />
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            Distribuição de Afinidade por Categoria ({calculoAtual?.label || "Geral"})
          </h3>
        </div>
        <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
          Soma normalizada a 100%
        </span>
      </div>

      {!carregando &&
      calculoAtual?.distribuicaoGrupos &&
      calculoAtual.distribuicaoGrupos.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {calculoAtual.distribuicaoGrupos.map((item, idx) => (
            <div key={item.grupoNome + idx}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontWeight: 700, color: "#f1f5f9" }}>
                  {item.grupoNome}
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    color: "#38bdf8",
                  }}
                >
                  {item.percentual}% ({item.pontos} pts)
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(4, item.percentual))}%`,
                    height: "100%",
                    background:
                      idx === 0
                        ? "linear-gradient(90deg, #38bdf8, #0ea5e9)"
                        : idx === 1
                        ? "linear-gradient(90deg, #a855f7, #8b5cf6)"
                        : idx === 2
                        ? "linear-gradient(90deg, #10b981, #059669)"
                        : "linear-gradient(90deg, #f59e0b, #d97706)",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "12px",
          }}
        >
          {carregando
            ? "Carregando distribuição de categorias..."
            : "Nenhuma interação detectada neste período. Interaja no feed curtindo, visualizando e clicando para calibrar as categorias!"}
        </div>
      )}
    </section>
  );
}

export default CardDistribuicaoInteresses;
