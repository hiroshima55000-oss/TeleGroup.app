import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { estaLogadoGoogle } from "../servicos/usuario";

export interface CardTopoPublicacoesProps {
  onCriarPublicacao?: () => void;
}

/**
 * Card informativo de topo para a tela de lista de publicações.
 * Padronizado com as mesmas dimensões, espaçamentos e altura do card de campanhas.
 */
export function CardTopoPublicacoes({
  onCriarPublicacao
}: CardTopoPublicacoesProps) {
  const navigate = useNavigate();

  function handleCriar() {
    if (onCriarPublicacao) {
      onCriarPublicacao();
    } else if (estaLogadoGoogle()) {
      navigate("/anunciar-gratuito");
    } else {
      navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login", { state: { destino: "/anunciar-gratuito" } });
    }
  }

  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginBottom: "24px",
        padding: "22px 24px",
        borderRadius: "16px",
        background: "#111827",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 0,
          }}
        >
          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: "24px",
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#f8fafc",
            }}
          >
            Publicações de Grupos
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "640px",
              color: "#8995a7",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            Gerencie suas postagens ativas no catálogo do Telegram. Todas as postagens criadas
            aparecem em tempo real no feed da comunidade.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCriar}
          style={{
            height: "42px",
            padding: "0 18px",
            border: "none",
            borderRadius: "10px",
            background: "#229ed9",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 800,
            whiteSpace: "nowrap",
            boxShadow: "0 6px 18px rgba(34, 158, 217, 0.25)",
            transition: "all 0.15s ease",
            boxSizing: "border-box",
          }}
        >
          <Plus size={17} />
          Nova Publicação Gratuita
        </button>
      </div>
    </section>
  );
}

export default CardTopoPublicacoes;