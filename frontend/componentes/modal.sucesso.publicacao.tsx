import { CheckCircle2, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ModalSucessoPublicacaoProps {
  nome?: string;
  onVerMinhasPublicacoes?: () => void;
  onIrFeed?: () => void;
  onCriarOutra?: () => void;
  incluirCabecalho?: boolean;
}

export function ModalSucessoPublicacao({
  nome = "",
  onVerMinhasPublicacoes,
  onIrFeed,
  onCriarOutra,
  incluirCabecalho = false,
}: ModalSucessoPublicacaoProps) {
  const navigate = useNavigate();

  function handleVerMinhas() {
    if (onVerMinhasPublicacoes) {
      onVerMinhasPublicacoes();
    } else {
      navigate("/lista-publicacoes");
    }
  }

  function handleIrFeed() {
    if (onIrFeed) {
      onIrFeed();
    } else {
      navigate("/");
    }
  }

  function handleCriarOutra() {
    if (onCriarOutra) {
      onCriarOutra();
    }
  }

  return (
    <div>
      {/* CABEÇALHO OPCIONAL DE POSTAGEM */}
      {incluirCabecalho && (
        <div style={{ marginBottom: "26px", textAlign: "center" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(34,158,217,0.12)",
              border: "1px solid rgba(34,158,217,0.25)",
              color: "#38bdf8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={22} />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
            }}
          >
            Criar Postagem Gratuita
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Publique seu canal ou grupo do Telegram na comunidade instantaneamente e sem custo.
          </p>
        </div>
      )}

      {/* CARD DO SUCESSO */}
      <div
        style={{
          background: "rgba(22, 28, 36, 0.98)",
          border: "1px solid rgba(34, 197, 94, 0.35)",
          borderRadius: "20px",
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#4ade80",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <CheckCircle2 size={30} />
        </div>

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "22px",
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          Publicação no ar com sucesso!
        </h2>
        <p
          style={{
            margin: "0 0 24px",
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          {nome ? (
            <>
              Seu canal <strong>&quot;{nome}&quot;</strong> já foi salvo no servidor e está visível
              na lista de publicações e no feed de divulgação.
            </>
          ) : (
            <>
              Sua publicação já foi salva no servidor e está visível
              na lista de publicações e no feed de divulgação.
            </>
          )}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={handleVerMinhas}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "#229ed9",
              color: "#ffffff",
              border: "none",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Users size={17} />
            Ver em Minhas Publicações
          </button>

          <button
            type="button"
            onClick={handleIrFeed}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Ir para o Feed Geral do Telegram
          </button>

          <button
            type="button"
            onClick={handleCriarOutra}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "none",
              padding: "8px",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline",
              marginTop: "6px",
            }}
          >
            Criar outra postagem gratuita
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalSucessoPublicacao;
