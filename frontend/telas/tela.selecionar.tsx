
import {
  Megaphone,
  Gift,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useEffect } from "react";
import {
  estaLogadoGoogle,
  obterGoogleUsuario,
  checarStatusBanimento,
} from "../servicos/usuario";

import CabecalhoSelecionar from "../componentes/cabecalho.selecionar";

function TelaEscolherAnuncio() {
  const navigate = useNavigate();

  const logado = estaLogadoGoogle();
  const googleUser = obterGoogleUsuario();

  // Verifica se o usuário foi banido ao abrir a tela de escolha de anúncio
  useEffect(() => {
    async function verificar() {
      const banInfo = await checarStatusBanimento();
      if (banInfo.banido) {
        navigate(
          `/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`,
          { replace: true }
        );
      }
    }
    verificar();
  }, [navigate]);

  async function escolherGratuito() {
    const banInfo = await checarStatusBanimento();
    if (banInfo.banido) {
      navigate(
        `/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`
      );
      return;
    }

    if (estaLogadoGoogle()) {
      navigate("/anunciar-gratuito");
    } else {
      navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login", {
        state: { destino: "/anunciar-gratuito" },
      });
    }
  }

  async function escolherPago() {
    const banInfo = await checarStatusBanimento();
    if (banInfo.banido) {
      navigate(
        `/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`
      );
      return;
    }

    if (estaLogadoGoogle()) {
      navigate("/anunciar-pago");
    } else {
      navigate("/b?destino=/anunciar-pago&aviso=necessario_login", {
        state: { destino: "/anunciar-pago" },
      });
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <CabecalhoSelecionar />

      <main
        style={{
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto",
          padding: "70px 20px 100px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 16px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34,158,217,0.12)",
              border: "1px solid rgba(34,158,217,0.25)",
            }}
          >
            <Megaphone size={23} color="#42b7e9" />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "27px",
              fontWeight: 800,
              letterSpacing: "-0.6px",
              color: "#e9eef5",
            }}
          >
            Escolha como anunciar
          </h1>

          <p
            style={{
              margin: "9px 0 0",
              color: "#7f8c9d",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Escolha uma opção para continuar
            com a criação do seu anúncio.
          </p>

          {googleUser ? (
            <div
              style={{
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.28)",
                color: "#4ade80",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={15} />
              <span>
                Conectado como <strong>{googleUser.nome}</strong>
              </span>
            </div>
          ) : (
            <div
              style={{
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "20px",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.28)",
                color: "#fcd34d",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <Lock size={14} />
              <span>Login com Google necessário para postar</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <button
            type="button"
            onClick={escolherGratuito}
            style={{
              width: "100%",
              padding: "21px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(27,33,42,0.90)",
              color: "#e7edf5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              textAlign: "left",
            }}
          >
            <Gift size={21} color="#42b7e9" />

            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                Anunciar gratuito
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "13px",
                  color: "#7f8c9d",
                }}
              >
                Crie seu anúncio gratuitamente.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={escolherPago}
            style={{
              width: "100%",
              padding: "21px",
              borderRadius: "16px",
              border: "1px solid rgba(34,158,217,0.25)",
              background: "rgba(34,158,217,0.10)",
              color: "#e7edf5",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              textAlign: "left",
            }}
          >
            <CreditCard size={21} color="#59c5ef" />

            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                }}
              >
                Anunciar pago
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "13px",
                  color: "#7f8c9d",
                }}
              >
                Amplie o alcance do seu anúncio.
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}

export default TelaEscolherAnuncio;
