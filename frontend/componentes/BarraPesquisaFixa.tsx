import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, X } from "lucide-react";

export interface BarraPesquisaFixaProps {
  onAbrirPesquisa?: (termo?: string) => void;
  placeholder?: string;
}

export function BarraPesquisaFixa({
  onAbrirPesquisa,
  placeholder = "Pesquisar grupos, canais e comunidades no Telegram...",
}: BarraPesquisaFixaProps) {
  const navigate = useNavigate();
  const [visivel, setVisivel] = useState(true);
  const [termo, setTermo] = useState("");
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<number | null>(null);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // Se estiver bem no topo da página (menos de 50px), sempre fica visível
      if (currentScrollY <= 50) {
        setVisivel(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Threshold para evitar piscadas com micro-rolagens de 5px
      if (Math.abs(diff) < 6) {
        return;
      }

      if (diff > 0 && currentScrollY > 70) {
        // Rolando para BAIXO: esconde a barra
        setVisivel(false);
      } else if (diff < 0) {
        // Rolando para CIMA: exibe a barra
        setVisivel(true);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        window.clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  function handleSubmeter(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }
    const q = termo.trim();
    if (onAbrirPesquisa) {
      onAbrirPesquisa(q || undefined);
    } else {
      if (q) {
        navigate(`/pesquisa?q=${encodeURIComponent(q)}`);
      } else {
        navigate("/pesquisa");
      }
    }
  }

  function handleAbrirDireto() {
    handleSubmeter();
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "74px",
        left: "50%",
        transform: visivel
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(-120%)",
        opacity: visivel ? 1 : 0,
        pointerEvents: visivel ? "auto" : "none",
        transition:
          "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease",
        zIndex: 90,
        width: "calc(100% - 32px)",
        maxWidth: "680px",
        boxSizing: "border-box",
      }}
      aria-hidden={!visivel}
    >
      <form
        onSubmit={handleSubmeter}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(21, 26, 33, 0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(56, 189, 248, 0.28)",
          borderRadius: "14px",
          padding: "6px 8px 6px 14px",
          boxShadow:
            "0 14px 35px rgba(0, 0, 0, 0.38), 0 0 20px rgba(34, 158, 217, 0.12)",
          cursor: "pointer",
          boxSizing: "border-box",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onClick={(e) => {
          // Se o usuário clicar fora do input ou do botão, ativa a busca
          if (
            (e.target as HTMLElement).tagName !== "INPUT" &&
            (e.target as HTMLElement).tagName !== "BUTTON"
          ) {
            handleAbrirDireto();
          }
        }}
      >
        {/* Ícone de Pesquisa */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#38bdf8",
            flexShrink: 0,
          }}
        >
          <Search size={18} strokeWidth={2.3} />
        </div>

        {/* Campo de Input com clique que leva à pesquisa */}
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={placeholder}
          aria-label="Pesquisar comunidades do Telegram"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f8fafc",
            fontSize: "14px",
            fontWeight: 500,
            padding: "8px 4px",
            boxSizing: "border-box",
          }}
        />

        {/* Botão limpar caso tenha texto digitado */}
        {termo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTermo("");
            }}
            aria-label="Limpar texto"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              cursor: "pointer",
              flexShrink: 0,
              padding: 0,
            }}
          >
            <X size={13} />
          </button>
        )}

        {/* Botão Ação "Buscar" */}
        <button
          type="submit"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "linear-gradient(135deg, #229ED9, #168AC0)",
            border: "none",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 750,
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(34, 158, 217, 0.35)",
            transition: "filter 0.15s ease",
          }}
        >
          <span>Buscar</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}

export default BarraPesquisaFixa;
