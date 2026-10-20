
import { Hash, Tags } from "lucide-react";

interface CardTotalTagsProps {
  total: number;
  carregando?: boolean;
}

export function CardTotalTags({
  total,
  carregando = false,
}: CardTotalTagsProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        width: "100%",
        padding: "20px",
        boxSizing: "border-box",
        borderRadius: "16px",
        background:
          "linear-gradient(135deg, #1c2936 0%, #182029 100%)",
        border: "1px solid rgba(56,189,248,0.18)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            flexShrink: 0,
            borderRadius: "13px",
            background: "rgba(56,189,248,0.12)",
            border: "1px solid rgba(56,189,248,0.16)",
          }}
        >
          <Hash size={25} color="#38bdf8" />
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: "0 0 5px",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Hashtags no Ranking
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "7px",
              flexWrap: "wrap",
            }}
          >
            <strong
              style={{
                color: "#f8fafc",
                fontSize: "28px",
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: "-0.8px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {carregando
                ? "..."
                : total.toLocaleString("pt-BR")}
            </strong>

            <span
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              {total === 1 ? "tag" : "tags"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          flexShrink: 0,
          borderRadius: "12px",
          background: "rgba(56,189,248,0.08)",
        }}
      >
        <Tags size={20} color="#38bdf8" />
      </div>
    </div>
  );
}

export default CardTotalTags;