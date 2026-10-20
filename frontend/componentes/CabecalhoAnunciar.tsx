import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

function CabecalhoAnunciar() {
  const navigate = useNavigate();

  function voltar() {
    navigate("/");
  }

  return (
    <header
      style={{
        width: "100%",
        height: "64px",
        display: "flex",
        alignItems: "center",
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
          width: "100%",
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={voltar}
          style={{
            height: "40px",
            border: "none",
            background: "transparent",
            color: "#cbd5e1",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: 0,
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#38aee0",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          <Send size={17} />
          Divulgação no Telegram
        </div>
      </div>
    </header>
  );
}

export default CabecalhoAnunciar;
