import {
  Send,
  LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";

function CabecalhoDivulgacaoTelegram() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: "64px",
        display: "flex",
        alignItems: "center",
        background: "rgba(17, 21, 27, 0.92)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
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
        {/* LOGO TELEGROUP */}
        <Link
          to="/"
          title="TeleGroup"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            textDecoration: "none",
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
              background:
                "linear-gradient(145deg, #229ED9, #168AC0)",
              color: "#ffffff",
              boxShadow:
                "0 8px 20px rgba(34,158,217,0.25)",
              flexShrink: 0,
            }}
          >
            <Send size={19} strokeWidth={2.3} />
          </div>

          <span
            style={{
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "-0.4px",
              color: "#f8fafc",
              lineHeight: 1,
            }}
          >
            Tele
            <span style={{ color: "#38bdf8" }}>
              Group
            </span>
          </span>
        </Link>

        {/* BOTÃO DE NAVEGAÇÃO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Link
            to="/dashboard"
            title="Painel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "38px",
              padding: "0 14px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <LayoutDashboard
              size={15}
              color="#cbd5e1"
            />

            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#f1f5f9",
              }}
            >
              Painel
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default CabecalhoDivulgacaoTelegram;
