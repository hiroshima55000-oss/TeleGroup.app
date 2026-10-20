import { Megaphone, TrendingUp, BarChart3 } from "lucide-react";
import { CampanhaItem, MetricasCampanhasGerais } from "../servicos/api.campanhas";

export interface CardMetricasCampanhasProps {
  campanhas?: CampanhaItem[];
  metricas?: MetricasCampanhasGerais | null;
  totalCampanhas?: number;
  campanhasAtivas?: number;
  visualizacoesTotais?: number;
}

/**
 * Card unificado de métricas gerais cobrindo a largura da tela de lista de campanhas.
 * Reúne Campanhas Totais, Campanhas Ativas e Visualizações Totais em um único card.
 */
export function CardMetricasCampanhas({
  campanhas = [],
  metricas,
  totalCampanhas: totalCustom,
  campanhasAtivas: ativasCustom,
  visualizacoesTotais: viewsCustom,
}: CardMetricasCampanhasProps) {
  const total =
    totalCustom ??
    (metricas ? metricas.totalCampanhas : campanhas.length);

  const ativas =
    ativasCustom ??
    (metricas
      ? metricas.campanhasAtivas
      : campanhas.filter((c) => c.status === "Ativa").length);

  const views =
    viewsCustom ??
    (metricas
      ? metricas.visualizacoesTotais
      : campanhas.reduce((acc, c) => acc + (c.visualizacoes || 0), 0));

  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "24px",
        padding: "20px 22px",
        borderRadius: "14px",
        background: "#111827",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.16)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          alignItems: "center",
        }}
      >
        {/* COLUNA 1: CAMPANHAS TOTAIS */}
        <div
          style={{
            padding: "0 16px 0 4px",
            borderRight: "1px solid rgba(255, 255, 255, 0.055)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "7px",
              color: "#667487",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <Megaphone size={14} color="#38bdf8" />
            Campanhas Totais
          </div>

          <strong
            style={{
              color: "#e8edf3",
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {total}
          </strong>
        </div>

        {/* COLUNA 2: CAMPANHAS ATIVAS */}
        <div
          style={{
            padding: "0 16px",
            borderRight: "1px solid rgba(255, 255, 255, 0.055)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "7px",
              color: "#667487",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <TrendingUp size={14} color="#4ade80" />
            Campanhas Ativas
          </div>

          <strong
            style={{
              color: "#4ade80",
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {ativas}
          </strong>
        </div>

        {/* COLUNA 3: VISUALIZAÇÕES TOTAIS */}
        <div
          style={{
            padding: "0 4px 0 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "7px",
              color: "#667487",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <BarChart3 size={14} color="#b8c2cf" />
            Visualizações Totais
          </div>

          <strong
            style={{
              color: "#e8edf3",
              fontSize: "22px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {views.toLocaleString("pt-BR")}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default CardMetricasCampanhas;
