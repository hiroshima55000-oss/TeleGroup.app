import React from "react";

import {
  CircleDollarSign,
  BarChart3,
  MousePointerClick,
  Eye,
  Wallet,
} from "lucide-react";


export interface CardEstCampMetricasProps {
  cpm?: string;
  ctr?: string;
  cliques?: string;
  visualizacoes?: string;
  impressoes?: string;
  conversoes?: string;
  custoTotal?: string;
  orcamentoDiario?: string;
  orcamentoRestante?: string;
}


export function CardEstCampMetricas({
  cpm = "R$ 5,90",
  ctr = "25%",
  cliques = "255.842",
  visualizacoes = "2.730.987",
  impressoes,
  conversoes,
  custoTotal = "R$ 1.842,50",
  orcamentoDiario = "R$ 100,00",
  orcamentoRestante = "R$ 2.157,50",
}: CardEstCampMetricasProps) {

  const metricas = [
    {
      icone: (
        <CircleDollarSign
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "CPM",
      valor: cpm,
      destaque: false,
    },

    {
      icone: (
        <BarChart3
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "CTR",
      valor: ctr,
      destaque: false,
    },

    {
      icone: (
        <MousePointerClick
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "Cliques",
      valor: cliques,
      destaque: false,
    },

    {
      icone: (
        <Eye
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "Visualizações",
      valor: visualizacoes,
      destaque: false,
    },

    {
      icone: (
        <Wallet
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "Custo total",
      valor: custoTotal,
      destaque: true,
    },

    {
      icone: (
        <Wallet
          size={19}
          color="#38bdf8"
        />
      ),
      titulo: "Orçamento diário",
      valor: orcamentoDiario,
      destaque: false,
    },

    {
      icone: (
        <Wallet
          size={19}
          color="#4ade80"
        />
      ),
      titulo: "Orçamento restante",
      valor: orcamentoRestante,
      destaque: true,
    },
  ];


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
        Métricas
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            padding: "18px",
          }}
        >
          {metricas.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "20px",
                borderRadius: "16px",
                background: item.destaque
                  ? "linear-gradient(145deg, #1d3442, #17232d)"
                  : "#1b222b",
                border: item.destaque
                  ? "1px solid rgba(56,189,248,0.25)"
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  background: "rgba(34,158,217,0.10)",
                  border: "1px solid rgba(34,158,217,0.15)",
                }}
              >
                {item.icone}
              </div>


              <span
                style={{
                  display: "block",
                  color: "#7f8c9d",
                  fontSize: "12px",
                  marginBottom: "6px",
                }}
              >
                {item.titulo}
              </span>


              <strong
                style={{
                  display: "block",
                  color: "#f1f5f9",
                  fontSize: "21px",
                  fontWeight: 800,
                }}
              >
                {item.valor}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


export default CardEstCampMetricas;