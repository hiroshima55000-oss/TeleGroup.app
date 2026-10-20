import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import { InfoUsuario, obterOuCriarUsuario } from "../servicos/usuario";

export interface CardPerfilUsuarioProps {
  usuario?: InfoUsuario | null;
  onAtualizar?: (usuario: InfoUsuario) => void;
}

export function CardPerfilUsuario({
  usuario: usuarioProp,
}: CardPerfilUsuarioProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<InfoUsuario | null>(
    usuarioProp || null
  );

  useEffect(() => {
    if (usuarioProp) {
      setUsuario(usuarioProp);
    } else {
      const info = obterOuCriarUsuario();
      setUsuario(info);
    }
  }, [usuarioProp]);

  function handleEntrarComGoogle() {
    navigate("/b");
  }

  if (!usuario) return null;

  const nicknameExibicao = usuario.nickname?.startsWith("@")
    ? usuario.nickname
    : `@${usuario.nickname || "usuario"}`;

  const nomeExibicao =
    usuario.nome && !usuario.nome.startsWith("@")
      ? usuario.nome
      : (usuario.google?.nome || "");

  const letraInicial =
    nomeExibicao
      ? nomeExibicao.slice(0, 1).toUpperCase()
      : nicknameExibicao.replace(/^@/, "").slice(0, 1).toUpperCase() || "@";

  return (
    <div
      style={{
        marginBottom: "32px",
        padding: "24px",
        borderRadius: "20px",
        background: "linear-gradient(145deg, #1b2430 0%, #131922 100%)",
        border: "1px solid rgba(56, 189, 248, 0.22)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "18px",
        }}
      >
        {/* AVATAR + NICKNAME / NOME */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            minWidth: 0,
          }}
        >
          {/* AVATAR */}
          {usuario.google?.foto ? (
            <img
              src={usuario.google.foto}
              alt={usuario.google.nome}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                objectFit: "cover",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                boxShadow: "0 4px 14px rgba(34,158,217,0.2)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, rgba(34,158,217,0.3) 0%, rgba(56,189,248,0.15) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(34,158,217,0.2)",
              }}
            >
              {letraInicial}
            </div>
          )}

          {/* NOME E NICKNAME ÚNICO (@) */}
          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {nomeExibicao && (
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "19px",
                  fontWeight: 800,
                  letterSpacing: "-0.3px",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                }}
              >
                {nomeExibicao}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#38bdf8",
                  fontSize: nomeExibicao ? "16px" : "20px",
                  fontWeight: 850,
                  letterSpacing: "-0.4px",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                }}
              >
                {nicknameExibicao}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  color: "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <Sparkles size={11} />
                @ Único
              </span>
            </div>

            <div
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {usuario.google
                ? usuario.google.email
                : "Identificador exclusivo gerado para sua conta"}
            </div>
          </div>
        </div>

        {/* AÇÕES (AUTENTICAÇÃO GOOGLE) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {usuario.google ? (
            <button
              type="button"
              onClick={handleEntrarComGoogle}
              style={{
                height: "38px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 14px",
                borderRadius: "10px",
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                color: "#4ade80",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              <ShieldCheck size={15} color="#4ade80" />
              <span>Google Verificado ✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEntrarComGoogle}
              style={{
                height: "38px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0 14px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#1f2937",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(0,0,0,0.16)",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#4285F4",
                }}
              >
                G
              </span>
              <span>Entrar com Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardPerfilUsuario;
