import React from "react";
import {
  Pause,
  Play,
  Trash2,
  BarChart3,
  ChevronRight,
  Loader2,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface CardEstCampAcoesProps {
  status?: string;
  carregando?: boolean;
  onPausar?: () => void;
  onContinuar?: () => void;
  onApagar?: () => void;
  onVerEstatisticas?: () => void;
  onAdicionarSaldo?: () => void;
}

export function CardEstCampAcoes({
  status = "Ativa",
  carregando = false,
  onPausar,
  onContinuar,
  onApagar,
  onVerEstatisticas,
  onAdicionarSaldo,
}: CardEstCampAcoesProps) {
  const navigate = useNavigate();
  const estaAtiva = status === "Ativa";

  function handleVerEstatisticas() {
    if (onVerEstatisticas) {
      onVerEstatisticas();
    } else {
      navigate("/lista-campanhas");
    }
  }

  return (
    <div
      style={{
        marginBottom: "28px",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "12px",
          color: "#38bdf8",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        Ações
      </h2>

      <section
        style={{
          background: "#1b222b",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        }}
      >
        {/* ADICIONAR SALDO À CAMPANHA VIA PIX */}
        {onAdicionarSaldo && (
          <div
            onClick={carregando ? undefined : onAdicionarSaldo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              padding: "18px 21px",
              cursor: carregando ? "not-allowed" : "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(56,189,248,0.03)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "rgba(56,189,248,0.12)",
                border: "1px solid rgba(56,189,248,0.22)",
                color: "#38bdf8",
              }}
            >
              <Wallet size={18} />
            </div>

            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  color: "#38bdf8",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "3px",
                }}
              >
                Adicionar saldo à campanha
              </strong>
              <span
                style={{
                  color: "#7f8c9d",
                  fontSize: "13px",
                }}
              >
                Fazer recarga via PIX 100% real para impulsionar esta campanha.
              </span>
            </div>

            <ChevronRight size={18} color="#657384" />
          </div>
        )}

        {/* PAUSAR OU ATIVAR CAMPANHA */}
        {estaAtiva ? (
          <div
            onClick={carregando ? undefined : onPausar}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              padding: "18px 21px",
              cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando ? 0.6 : 1,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "rgba(250,204,21,0.10)",
                border: "1px solid rgba(250,204,21,0.20)",
                color: "#facc15",
              }}
            >
              {carregando ? <Loader2 size={18} className="animate-spin" /> : <Pause size={18} />}
            </div>

            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  color: "#e9eef5",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "3px",
                }}
              >
                Pausar campanha
              </strong>
              <span
                style={{
                  color: "#7f8c9d",
                  fontSize: "13px",
                }}
              >
                Interromper temporariamente a veiculação no Telegram.
              </span>
            </div>

            <ChevronRight size={18} color="#657384" />
          </div>
        ) : (
          <div
            onClick={carregando ? undefined : onContinuar}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              padding: "18px 21px",
              cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando ? 0.6 : 1,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "rgba(74,222,128,0.10)",
                border: "1px solid rgba(74,222,128,0.20)",
                color: "#4ade80",
              }}
            >
              {carregando ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            </div>

            <div style={{ flex: 1 }}>
              <strong
                style={{
                  display: "block",
                  color: "#e9eef5",
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "3px",
                }}
              >
                Reativar campanha
              </strong>
              <span
                style={{
                  color: "#7f8c9d",
                  fontSize: "13px",
                }}
              >
                Retomar veiculação e exibição de anúncios.
              </span>
            </div>

            <ChevronRight size={18} color="#657384" />
          </div>
        )}

        {/* APAGAR CAMPANHA */}
        <div
          onClick={carregando ? undefined : onApagar}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "18px 21px",
            cursor: carregando ? "not-allowed" : "pointer",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            opacity: carregando ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.18)",
              color: "#f87171",
            }}
          >
            <Trash2 size={18} />
          </div>

          <div style={{ flex: 1 }}>
            <strong
              style={{
                display: "block",
                color: "#f87171",
                fontSize: "15px",
                fontWeight: 700,
                marginBottom: "3px",
              }}
            >
              Apagar campanha
            </strong>
            <span
              style={{
                color: "#7f8c9d",
                fontSize: "13px",
              }}
            >
              Excluir permanentemente esta campanha do sistema.
            </span>
          </div>

          <ChevronRight size={18} color="#657384" />
        </div>

        {/* VER TODAS AS CAMPANHAS */}
        <div
          onClick={handleVerEstatisticas}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "18px 21px",
            cursor: "pointer",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "rgba(56,189,248,0.10)",
              border: "1px solid rgba(56,189,248,0.18)",
              color: "#38bdf8",
            }}
          >
            <BarChart3 size={18} />
          </div>

          <div style={{ flex: 1 }}>
            <strong
              style={{
                display: "block",
                color: "#e9eef5",
                fontSize: "15px",
                fontWeight: 700,
                marginBottom: "3px",
              }}
            >
              Ver todas as campanhas
            </strong>
            <span
              style={{
                color: "#7f8c9d",
                fontSize: "13px",
              }}
            >
              Ir para o painel com a lista de todas as suas campanhas.
            </span>
          </div>

          <ChevronRight size={18} color="#657384" />
        </div>
      </section>
    </div>
  );
}

export default CardEstCampAcoes;
