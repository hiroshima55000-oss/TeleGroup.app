import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Info,
} from "lucide-react";
import { enviarDenunciaPublicacao } from "../servicos/api.publicacoes";

export interface ItemPublicacaoParaDenuncia {
  id?: string;
  nome?: string;
  descricao?: string;
  usuarioId?: string;
  link?: string;
  foto?: string;
}

export interface CardDenunciarProps {
  aberto: boolean;
  publicacao?: ItemPublicacaoParaDenuncia | null;
  onFechar: () => void;
  onSucesso?: () => void;
}

const MOTIVOS_DENUNCIA = [
  {
    id: "spam",
    titulo: "Spam ou Golpe / Fraude",
    descricao: "Esquemas financeiros duvidosos, pirâmides, bots ou divulgação repetitiva",
  },
  {
    id: "ilicito",
    titulo: "Conteúdo Ilícito ou Proibido",
    descricao: "Pirataria, comércio não autorizado de itens ilegais ou violação das leis",
  },
  {
    id: "odio",
    titulo: "Discurso de Ódio ou Assédio",
    descricao: "Ofensas graves, ataques discriminatórios, ameaças ou intimidação",
  },
  {
    id: "link_falso",
    titulo: "Link Enganoso, Phishing ou Inativo",
    descricao: "Link redireciona para página suspeita, roubo de dados ou vírus",
  },
  {
    id: "violencia",
    titulo: "Violência ou Conteúdo Explícito",
    descricao: "Ameaças de dano, violência explícita ou imagens não autorizadas",
  },
  {
    id: "outro",
    titulo: "Outro motivo",
    descricao: "Violação das diretrizes da comunidade ou outro problema",
  },
];

export function CardDenunciar({
  aberto,
  publicacao,
  onFechar,
  onSucesso,
}: CardDenunciarProps) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>(
    MOTIVOS_DENUNCIA[0].titulo
  );
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Reseta o formulário quando o card abre ou fecha
  useEffect(() => {
    if (aberto) {
      setMotivoSelecionado(MOTIVOS_DENUNCIA[0].titulo);
      setDetalhes("");
      setErro(null);
      setSucesso(false);
      setEnviando(false);
    }
  }, [aberto, publicacao?.id]);

  // Tecla ESC para fechar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && aberto && !enviando) {
        onFechar();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, enviando, onFechar]);

  if (!aberto) return null;

  async function handleEnviar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!motivoSelecionado) {
      setErro("Selecione um motivo para a denúncia.");
      return;
    }

    try {
      setEnviando(true);
      setErro(null);

      const pubId = publicacao?.id || "";
      const nomeIdentificador =
        publicacao?.nome ||
        (publicacao?.usuarioId ? `@${publicacao.usuarioId}` : "publicação");

      const res = await enviarDenunciaPublicacao(pubId, {
        motivo: motivoSelecionado,
        categoria: "Moderação da Comunidade",
        detalhes: detalhes.trim(),
        usuarioId: publicacao?.usuarioId,
        usuario: nomeIdentificador,
      });

      if (!res.sucesso) {
        throw new Error(res.erro || "Falha ao enviar denúncia.");
      }

      setSucesso(true);
      onSucesso?.();

      // Fecha suavemente após 2.2 segundos
      setTimeout(() => {
        onFechar();
      }, 2200);
    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro ao registrar sua denúncia. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const tituloPublicacao =
    publicacao?.nome ||
    (publicacao?.descricao
      ? publicacao.descricao.replace(/\n/g, " ").slice(0, 48) + "..."
      : "esta publicação");

  return (
    <div
      onClick={!enviando ? onFechar : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(3, 7, 18, 0.78)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#151b22",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
          overflow: "hidden",
          color: "#e2e8f0",
          fontFamily: "Inter, Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* CABEÇALHO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldAlert size={19} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.2px",
                }}
              >
                Denunciar publicação
              </h2>
              <span
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  display: "block",
                  marginTop: "1px",
                }}
              >
                Ajude a manter a comunidade segura
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            aria-label="Fechar"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              color: "#94a3b8",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: enviando ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* CORPO DO CARD */}
        <div
          style={{
            padding: "16px 20px 20px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {sucesso ? (
            /* TELA DE SUCESSO */
            <div
              style={{
                padding: "30px 10px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.35)",
                  color: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 25px rgba(34, 197, 94, 0.2)",
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                Denúncia enviada com sucesso!
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: "13.5px",
                  lineHeight: "1.55",
                  color: "#94a3b8",
                  maxWidth: "360px",
                }}
              >
                Agradecemos por colaborar com o TeleGroup. Nossa equipe de
                moderação foi notificada e avaliará este conteúdo com prioridade.
              </p>

              <button
                type="button"
                onClick={onFechar}
                style={{
                  marginTop: "10px",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #229ED9, #168AC0)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Concluir
              </button>
            </div>
          ) : (
            /* FORMULÁRIO DE DENÚNCIA */
            <form onSubmit={handleEnviar}>
              {/* PILL DE IDENTIFICAÇÃO DA PUBLICAÇÃO */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  marginBottom: "16px",
                  fontSize: "12.5px",
                  color: "#cbd5e1",
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 600 }}>Alvo:</span>
                <span
                  style={{
                    color: "#38bdf8",
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tituloPublicacao}
                </span>
              </div>

              {/* SELEÇÃO DE MOTIVO */}
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  marginBottom: "8px",
                }}
              >
                Selecione o motivo principal:
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                {MOTIVOS_DENUNCIA.map((motivo) => {
                  const selecionado = motivoSelecionado === motivo.titulo;
                  return (
                    <div
                      key={motivo.id}
                      onClick={() => setMotivoSelecionado(motivo.titulo)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: selecionado
                          ? "1px solid #38bdf8"
                          : "1px solid rgba(255, 255, 255, 0.07)",
                        background: selecionado
                          ? "rgba(56, 189, 248, 0.08)"
                          : "rgba(255, 255, 255, 0.02)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="motivo_denuncia"
                        checked={selecionado}
                        onChange={() => setMotivoSelecionado(motivo.titulo)}
                        style={{
                          marginTop: "3px",
                          accentColor: "#38bdf8",
                          cursor: "pointer",
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: selecionado ? 750 : 600,
                            color: selecionado ? "#38bdf8" : "#f1f5f9",
                          }}
                        >
                          {motivo.titulo}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#8b9baa",
                            marginTop: "2px",
                            lineHeight: "1.35",
                          }}
                        >
                          {motivo.descricao}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DETALHES ADICIONAIS (OPCIONAL) */}
              <label
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                  marginBottom: "6px",
                }}
              >
                Detalhes adicionais (opcional):
              </label>
              <textarea
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                placeholder="Explique o que há de errado nesta comunidade ou mensagem..."
                maxLength={400}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(15, 20, 26, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  lineHeight: "1.45",
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />

              {/* MENSAGEM DE ERRO */}
              {erro && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#f87171",
                    fontSize: "12px",
                    marginTop: "12px",
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{erro}</span>
                </div>
              )}

              {/* INFORMAÇÃO DE SEGURANÇA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "14px",
                  color: "#64748b",
                  fontSize: "11.5px",
                }}
              >
                <Info size={13} style={{ flexShrink: 0 }} />
                <span>Sua denúncia é anônima e avaliada com discrição.</span>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.3fr",
                  gap: "10px",
                  marginTop: "18px",
                }}
              >
                <button
                  type="button"
                  onClick={onFechar}
                  disabled={enviando}
                  style={{
                    height: "42px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: enviando ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    height: "42px",
                    borderRadius: "10px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: enviando ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(239, 68, 68, 0.25)",
                    transition: "all 0.15s ease",
                    opacity: enviando ? 0.75 : 1,
                  }}
                >
                  {enviando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={16} />
                      <span>Enviar denúncia</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardDenunciar;
