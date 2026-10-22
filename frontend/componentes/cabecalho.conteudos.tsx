import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CabecalhoConteudosProps {
  titulo?: string;
  onVoltar?: () => void;
}

export function CabecalhoConteudos({
  titulo = "Conteúdos Interagidos",
  onVoltar,
}: CabecalhoConteudosProps) {
  const navigate = useNavigate();

  function handleVoltar() {
    if (onVoltar) {
      onVoltar();
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <header
      style={{
        width: "100%",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 24px",
        background: "rgba(17, 21, 27, 0.94)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
          onClick={handleVoltar}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#e9eef5",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          aria-label="Voltar para o painel"
        >
          <ArrowLeft size={20} />
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.3px",
          }}
        >
          {titulo}
        </h1>
      </div>
    </header>
  );
}

export default CabecalhoConteudos;
