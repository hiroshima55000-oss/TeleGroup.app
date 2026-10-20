import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CabecalhoCampanhaGratuitaProps {
  titulo?: string;
  onVoltar?: () => void;
  mostrarBadge?: boolean;
}

export function CabecalhoCampanhaGratuita({
  titulo = "Divulgação Gratuita",
  onVoltar,
  mostrarBadge = true,
}: CabecalhoCampanhaGratuitaProps) {
  const navigate = useNavigate();

  function voltar() {
    if (onVoltar) {
      onVoltar();
    } else {
      navigate("/anunciar");
    }
  }

  return (
    <header
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(17, 21, 27, 0.92)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(14px)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={voltar}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#e9eef5",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          aria-label="Voltar para a seleção de anúncios"
        >
          <ChevronLeft size={21} />
        </button>

        <strong
          style={{
            color: "#e9eef5",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          {titulo}
        </strong>
      </div>

      {mostrarBadge && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "#38bdf8",
            background: "rgba(34, 158, 217, 0.12)",
            border: "1px solid rgba(34, 158, 217, 0.22)",
            padding: "4px 10px",
            borderRadius: "20px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          100% Gratuito
        </span>
      )}
    </header>
  );
}

export default CabecalhoCampanhaGratuita;
