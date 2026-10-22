import React from "react";
import { Sparkles, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { CalculoInteressePeriodoItem } from "../servicos/api.publicacoes";

export interface CardCalculadorInteressesProps {
  periodoCalculo: "ontem" | "10d" | "30d";
  aoMudarPeriodo: (periodo: "ontem" | "10d" | "30d") => void;
  calculoAtual?: CalculoInteressePeriodoItem;
  carregando: boolean;
}

export function CardCalculadorInteresses({
  periodoCalculo,
  aoMudarPeriodo,
  calculoAtual,
  carregando,
}: CardCalculadorInteressesProps) {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #18212c 0%, #151a22 55%, #18222d 100%)",
        border: "1px solid rgba(56, 189, 248, 0.20)",
        borderRadius: "20px",
        padding: "24px 22px",
        boxShadow: "0 14px 35px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* ======================================================== */}
      {/* PARTE 1: CALCULADOR DINÂMICO DE INTERESSES + SELETOR     */}
      {/* ======================================================== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.4px",
              }}
            >
              Calculador Dinâmico de Interesses
            </h2>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "13px",
                color: "#94a3b8",
              }}
            >
              Algoritmo de afinidade baseado nas suas visualizações, curtidas e cliques.
            </p>
          </div>
        </div>

        {/* SELETOR DE PERÍODO: ONTEM, 10D, 30 DIAS */}
        <div
          style={{
            display: "inline-flex",
            background: "rgba(15, 20, 26, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "4px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => aoMudarPeriodo("ontem")}
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "none",
              background:
                periodoCalculo === "ontem"
                  ? "linear-gradient(135deg, #229ED9, #168AC0)"
                  : "transparent",
              color: periodoCalculo === "ontem" ? "#ffffff" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={13} />
            Ontem
          </button>

          <button
            type="button"
            onClick={() => aoMudarPeriodo("10d")}
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "none",
              background:
                periodoCalculo === "10d"
                  ? "linear-gradient(135deg, #229ED9, #168AC0)"
                  : "transparent",
              color: periodoCalculo === "10d" ? "#ffffff" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={13} />
            10 Dias
          </button>

          <button
            type="button"
            onClick={() => aoMudarPeriodo("30d")}
            style={{
              padding: "8px 16px",
              borderRadius: "9px",
              border: "none",
              background:
                periodoCalculo === "30d"
                  ? "linear-gradient(135deg, #229ED9, #168AC0)"
                  : "transparent",
              color: periodoCalculo === "30d" ? "#ffffff" : "#94a3b8",
              fontWeight: 750,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Calendar size={13} />
            30 Dias
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PARTE 2: MÉTRICAS DO PERÍODO NO MESMO COMPONENTE         */}
      {/* ======================================================== */}
      <div style={{ paddingTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="#38bdf8" />
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              Métricas do Período ({calculoAtual?.label || "10 Dias"})
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Ponderação: Visualização = 1 • Like = 4 • Clique = 6
          </span>
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
            <span>Calculando métricas do período...</span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            {/* TOTAL DE AÇÕES */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                Total de Ações
              </span>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#ffffff",
                  marginTop: "4px",
                }}
              >
                {calculoAtual?.totalAcoes || 0}
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                {calculoAtual?.totalVisualizacoes || 0} vistos • {calculoAtual?.totalLikes || 0} likes • {calculoAtual?.totalCliques || 0} cliques
              </div>
            </div>

            {/* PONTOS PONDERADOS */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                Pontos Ponderados
              </span>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#38bdf8",
                  marginTop: "4px",
                }}
              >
                {calculoAtual?.totalPontos || 0} pts
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                Score acumulado de afinidade
              </div>
            </div>

            {/* TAXA DE CONVERSÃO CTR */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                Taxa de Conversão (CTR)
              </span>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: "#22c55e",
                  marginTop: "4px",
                }}
              >
                {calculoAtual?.taxaCTR || 0}%
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                Cliques / Visualizações no período
              </div>
            </div>

            {/* CLASSIFICAÇÃO DO PERFIL */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                Classificação do Perfil
              </span>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "#f59e0b",
                  marginTop: "8px",
                  lineHeight: "1.3",
                }}
              >
                {calculoAtual?.classificacao || "Visitante"}
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                Qualificação algorítmica
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CardCalculadorInteresses;
