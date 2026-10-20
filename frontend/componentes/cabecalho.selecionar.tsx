import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CabecalhoSelecionarProps {
  titulo?: string;
  onVoltar?: () => void;
}

export function CabecalhoSelecionar({
  titulo = "Escolher Tipo de Anúncio",
  onVoltar,
}: CabecalhoSelecionarProps) {
  const navigate = useNavigate();

  function voltar() {
    if (onVoltar) {
      onVoltar();
    } else {
      navigate("/");
    }
  }

  return (
    <header
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
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
          aria-label="Voltar para a página inicial"
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
    </header>
  );
}

export default CabecalhoSelecionar;
