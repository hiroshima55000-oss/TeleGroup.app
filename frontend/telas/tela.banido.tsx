import {
  ShieldAlert,
  ArrowLeft,
  FileText,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Info,
  Clock,
  UserX,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checarStatusBanimento, InfoStatusBanido, obterOuCriarUsuario } from "../servicos/usuario";

export function TelaBanido() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [statusBan, setStatusBan] = useState<InfoStatusBanido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalDiretrizes, setModalDiretrizes] = useState(false);
  const [modalRecurso, setModalRecurso] = useState(false);
  const [textoRecurso, setTextoRecurso] = useState("");
  const [enviadoRecurso, setEnviadoRecurso] = useState(false);

  useEffect(() => {
    async function carregar() {
      const info = await checarStatusBanimento();
      // Permite sobresscrever via searchParams se passado diretamente
      const motivoParam = searchParams.get("motivo");
      const usuarioParam = searchParams.get("usuario");
      if (motivoParam || usuarioParam) {
        setStatusBan({
          banido: true,
          usuario: usuarioParam || info.usuario || obterOuCriarUsuario().nickname,
          motivo: motivoParam || info.motivo || "Violação das regras e diretrizes da comunidade",
          dataBanimento: info.dataBanimento || new Date().toISOString(),
        });
      } else {
        setStatusBan(info);
      }
      setCarregando(false);
    }
    carregar();
  }, [searchParams]);

  const usuarioDisplay =
    statusBan?.usuario ||
    obterOuCriarUsuario().nickname ||
    "@usuario";

  const motivoDisplay =
    statusBan?.motivo ||
    "Violação das diretrizes da comunidade e termos de serviço";

  const dataDisplay = statusBan?.dataBanimento
    ? new Date(statusBan.dataBanimento).toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "Recentemente";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top center, #1e1317 0%, #13171d 40%, #0d1015 100%)",
        color: "#edf2f7",
        fontFamily: "Inter, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Topo / Barra de Navegação */}
      <header
        style={{
          borderBottom: "1px solid rgba(239, 68, 68, 0.18)",
          backgroundColor: "rgba(15, 20, 26, 0.85)",
          backdropFilter: "blur(12px)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#fff" }}>
              Tele<span style={{ color: "#ef4444" }}>Group</span> Moderation
            </h1>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Acesso Restrito</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
          }}
        >
          <ArrowLeft size={16} />
          Voltar ao Feed
        </button>
      </header>

      {/* Conteúdo Central */}
      <main
        style={{
          flex: 1,
          maxWidth: "680px",
          width: "100%",
          margin: "0 auto",
          padding: "36px 20px 80px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Cartão Principal de Banimento */}
        <div
          style={{
            backgroundColor: "#161b22",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "18px",
            padding: "32px 24px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 35px rgba(239, 68, 68, 0.08)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Ícone de Escudo de Alerta */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "2px solid rgba(239, 68, 68, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
              marginBottom: "18px",
              boxShadow: "0 0 25px rgba(239, 68, 68, 0.25)",
            }}
          >
            <ShieldAlert size={38} />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}
          >
            <UserX size={14} />
            Conta Suspensa
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 10px",
            }}
          >
            Acesso de Criação Bloqueado
          </h2>

          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#94a3b8",
              maxWidth: "520px",
              margin: "0 0 24px",
            }}
          >
            Identificamos infrações recorrentes às diretrizes do TeleGroup associadas à sua conta. Por motivos de segurança dos demais membros, suas permissões de publicação foram suspensas.
          </p>

          {/* Dossiê do Banimento */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#0d1117",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "14px",
              padding: "18px 20px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "10px" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600 }}>Identificador:</span>
              <span style={{ fontSize: "13.5px", color: "#f1f5f9", fontWeight: 700, fontFamily: "monospace" }}>{usuarioDisplay}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "10px" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600 }}>Motivo registrado:</span>
              <span style={{ fontSize: "13px", color: "#f87171", fontWeight: 600, textAlign: "right", maxWidth: "340px" }}>{motivoDisplay}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                <Clock size={14} /> Data da Aplicação:
              </span>
              <span style={{ fontSize: "12.5px", color: "#94a3b8" }}>{dataDisplay}</span>
            </div>
          </div>

          {/* Aviso sobre Exclusão Automática */}
          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
              padding: "14px 16px",
              textAlign: "left",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              marginBottom: "24px",
            }}
          >
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.55 }}>
              <strong style={{ color: "#f87171" }}>Ação de moderação executada:</strong> Todas as publicações e campanhas ativas vinculadas a esta conta foram <strong>apagadas automaticamente</strong> e não estão mais visíveis para os usuários.
            </div>
          </div>

          {/* Aviso de Navegação Normal */}
          <div
            style={{
              width: "100%",
              backgroundColor: "rgba(56, 189, 248, 0.06)",
              border: "1px solid rgba(56, 189, 248, 0.18)",
              borderRadius: "12px",
              padding: "14px 16px",
              textAlign: "left",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              marginBottom: "28px",
            }}
          >
            <Info size={20} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.55 }}>
              <strong style={{ color: "#38bdf8" }}>Você ainda pode usar o app normalmente:</strong> Você pode navegar pelo feed público, pesquisar grupos e acessar canais de terceiros. Apenas a criação de novos anúncios e comunidades foi bloqueada.
            </div>
          </div>

          {/* Botões de Ação */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                backgroundColor: "#229ed9",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 10px 20px rgba(34, 158, 217, 0.25)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1b8bc2";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#229ed9";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <ArrowLeft size={18} />
              Voltar ao Feed e Navegar Normalmente
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => setModalDiretrizes(true)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
              >
                <FileText size={15} />
                Ver Diretrizes
              </button>

              <button
                onClick={() => setModalRecurso(true)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
              >
                <HelpCircle size={15} />
                Solicitar Revisão
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Diretrizes da Comunidade */}
      {modalDiretrizes && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              color: "#edf2f7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={18} color="#229ed9" />
                Diretrizes da Comunidade TeleGroup
              </h3>
              <button
                onClick={() => setModalDiretrizes(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: "13.5px", color: "#cbd5e1", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ margin: 0 }}>
                Para manter o ambiente seguro e benéfico a todos os membros, é estritamente proibido:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Divulgação de esquemas de pirâmide, promessas irreais de lucros e golpes PIX.</li>
                <li>Spam massivo ou publicação repetitiva de canais em intervalos abusivos.</li>
                <li>Links maliciosos, páginas de phishing ou captura indevida de dados.</li>
                <li>Conteúdo que viole direitos autorais, leis locais ou termos do Telegram.</li>
              </ul>
              <p style={{ margin: "10px 0 0", color: "#94a3b8", fontSize: "12.5px" }}>
                O desrespeito a essas diretrizes resulta na suspensão definitiva da conta e na remoção imediata de todo o conteúdo divulgado.
              </p>
            </div>

            <button
              onClick={() => setModalDiretrizes(false)}
              style={{
                width: "100%",
                marginTop: "20px",
                backgroundColor: "#229ed9",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "11px",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: "pointer",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Revisão / Recurso */}
      {modalRecurso && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              color: "#edf2f7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <HelpCircle size={18} color="#229ed9" />
                Solicitar Revisão de Moderação
              </h3>
              <button
                onClick={() => {
                  setModalRecurso(false);
                  setEnviadoRecurso(false);
                }}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {enviadoRecurso ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <CheckCircle2 size={44} color="#22c55e" style={{ margin: "0 auto 12px" }} />
                <h4 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800 }}>Recurso Enviado com Sucesso</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                  Sua solicitação foi encaminhada para a equipe de moderação. A análise será feita em até 48 horas úteis.
                </p>
                <button
                  onClick={() => {
                    setModalRecurso(false);
                    setEnviadoRecurso(false);
                  }}
                  style={{
                    marginTop: "20px",
                    backgroundColor: "#229ed9",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Se você acredita que sua conta foi punida por engano, descreva os detalhes abaixo para que a equipe do TeleGroup possa reavaliar o caso.
                </p>

                <textarea
                  value={textoRecurso}
                  onChange={(e) => setTextoRecurso(e.target.value)}
                  placeholder="Explique os motivos pelos quais seu canal está de acordo com as regras..."
                  rows={4}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d1117",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "12px",
                    color: "#fff",
                    fontSize: "13.5px",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setModalRecurso(false)}
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: "#cbd5e1",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    disabled={!textoRecurso.trim()}
                    onClick={() => {
                      if (textoRecurso.trim()) {
                        setEnviadoRecurso(true);
                      }
                    }}
                    style={{
                      flex: 1.5,
                      backgroundColor: textoRecurso.trim() ? "#229ed9" : "rgba(34, 158, 217, 0.4)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: textoRecurso.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Send size={15} />
                    Enviar Recurso
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaBanido;
