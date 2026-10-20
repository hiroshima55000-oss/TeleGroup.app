import { Users, CheckCircle2, Eye } from "lucide-react";
import { PublicacaoItem } from "../servicos/api.publicacoes";

export interface CardMetricasPublicacoesProps {
  grupos?: PublicacaoItem[];
  totalPublicacoes?: number;
  publicacoesAtivas?: number;
  visualizacoesTotais?: number;
}

/**
 * Card unificado de métricas gerais cobrindo a largura da tela de lista de publicações.
 * Reúne Publicações Totais, Publicações Ativas e Visualizações Totais em um único card com 3 colunas e divisores discretos.
 */
export function CardMetricasPublicacoes({
  grupos = [],
  totalPublicacoes: totalCustom,
  publicacoesAtivas: ativasCustom,
  visualizacoesTotais: viewsCustom,
}: CardMetricasPublicacoesProps) {
  const total = totalCustom ?? grupos.length;

  const ativas =
    ativasCustom ??
    grupos.filter(
      (g) => g.status === "Publicado" || (g.status as string) === "Ativa"
    ).length;

  const views =
    viewsCustom ??
    grupos.reduce((acc, curr) => acc + (Number(curr.visualizacoes) || 0), 0);

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
        {/* COLUNA 1: PUBLICAÇÕES TOTAIS */}
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
            <Users size={14} color="#38bdf8" />
            Publicações Totais
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

        {/* COLUNA 2: PUBLICAÇÕES ATIVAS */}
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
            <CheckCircle2 size={14} color="#4ade80" />
            Publicações Ativas
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
            <Eye size={14} color="#b8c2cf" />
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

export default CardMetricasPublicacoes;
