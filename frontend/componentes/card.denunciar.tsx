
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  ShieldAlert,
  X,
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

const estilos: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(3, 7, 18, 0.78)",
    backdropFilter: "blur(6px)",
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: "#e2e8f0",
    background: "#151b22",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
    fontFamily: "Inter, Arial, sans-serif",
  },
  cabecalho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "17px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  tituloGrupo: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 0,
  },
  iconeTitulo: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    color: "#f87171",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.22)",
    borderRadius: 11,
  },
  titulo: {
    margin: 0,
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
  },
  subtitulo: {
    display: "block",
    marginTop: 3,
    color: "#94a3b8",
    fontSize: 12,
  },
  fechar: {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    color: "#94a3b8",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9,
    cursor: "pointer",
  },
  corpo: {
    padding: "18px 20px 20px",
    overflowY: "auto",
  },
  rotulo: {
    display: "block",
    marginBottom: 8,
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: 700,
  },
  detalhes: {
    width: "100%",
    minHeight: 150,
    boxSizing: "border-box",
    padding: "12px",
    color: "#fff",
    background: "#10161d",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 10,
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
  },
  botoes: {
    display: "grid",
    gridTemplateColumns: "1fr 1.3fr",
    gap: 10,
    marginTop: 18,
  },
  botaoBase: {
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 750,
    cursor: "pointer",
  },
  cancelar: {
    color: "#cbd5e1",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  enviar: {
    color: "#fff",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    border: "none",
    boxShadow: "0 5px 16px rgba(239,68,68,0.18)",
  },
  aviso: {
    display: "flex",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 14,
    color: "#8493a5",
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  erro: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: "10px 12px",
    color: "#f87171",
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.22)",
    borderRadius: 9,
    fontSize: 12,
  },
  sucesso: {
    padding: "28px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 13,
    textAlign: "center",
  },
};

export function CardDenunciar({
  aberto,
  publicacao,
  onFechar,
  onSucesso,
}: CardDenunciarProps) {
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    setDetalhes("");
    setErro(null);
    setSucesso(false);
    setEnviando(false);
  }, [aberto, publicacao?.id]);

  useEffect(() => {
    if (!aberto || enviando) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onFechar();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, enviando, onFechar]);

  useEffect(() => {
    if (!aberto || !sucesso) return;

    const temporizador = window.setTimeout(onFechar, 2200);
    return () => window.clearTimeout(temporizador);
  }, [aberto, sucesso, onFechar]);

  if (!aberto) return null;

  const tituloPublicacao =
    publicacao?.nome ||
    (publicacao?.descricao
      ? publicacao.descricao.replace(/\n/g, " ").slice(0, 48)
      : "Esta publicação");

  async function handleEnviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detalhes.trim()) {
      setErro("Escreva o motivo da sua denúncia antes de enviar.");
      return;
    }

    try {
      setEnviando(true);
      setErro(null);

      const usuario =
        publicacao?.nome ||
        (publicacao?.usuarioId ? `@${publicacao.usuarioId}` : "publicação");

      const resposta = await enviarDenunciaPublicacao(
        publicacao?.id || "",
        {
          motivo: detalhes.trim(),
          categoria: "Moderação da Comunidade",
          detalhes: detalhes.trim(),
          usuarioId: publicacao?.usuarioId,
          usuario,
        }
      );

      if (!resposta.sucesso) {
        throw new Error(resposta.erro || "Falha ao enviar denúncia.");
      }

      setSucesso(true);
      onSucesso?.();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar a denúncia. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  function fecharSePermitido() {
    if (!enviando) onFechar();
  }

  return (
    <div
      style={estilos.overlay}
      onClick={fecharSePermitido}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="denuncia-titulo"
        style={estilos.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <header style={estilos.cabecalho}>
          <div style={estilos.tituloGrupo}>
            <div style={estilos.iconeTitulo}>
              <ShieldAlert size={20} />
            </div>

            <div>
              <h2 id="denuncia-titulo" style={estilos.titulo}>
                Denunciar publicação
              </h2>
              <span style={estilos.subtitulo}>
                Ajude a manter a comunidade segura
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="Fechar denúncia"
            style={{
              ...estilos.fechar,
              opacity: enviando ? 0.5 : 1,
              cursor: enviando ? "not-allowed" : "pointer",
            }}
            onClick={fecharSePermitido}
            disabled={enviando}
          >
            <X size={17} />
          </button>
        </header>

        <div style={estilos.corpo}>
          {sucesso ? (
            <div style={estilos.sucesso}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  display: "grid",
                  placeItems: "center",
                  color: "#22c55e",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.28)",
                  borderRadius: "50%",
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>
                Denúncia enviada!
              </h3>

              <p
                style={{
                  maxWidth: 320,
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                Obrigado por colaborar com o TeleGroup. A equipe responsável
                poderá avaliar o conteúdo denunciado.
              </p>

              <button
                type="button"
                style={{
                  ...estilos.botaoBase,
                  ...estilos.enviar,
                  marginTop: 5,
                  paddingInline: 24,
                }}
                onClick={onFechar}
              >
                Concluir
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviar}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 18,
                  padding: "10px 12px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  fontSize: 12,
                  minWidth: 0,
                }}
              >
                <span style={{ color: "#8493a5", flexShrink: 0 }}>
                  Publicação:
                </span>
                <span
                  title={tituloPublicacao}
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

              <label htmlFor="detalhes-denuncia" style={estilos.rotulo}>
                Descreva o motivo da denúncia
              </label>

              <textarea
                id="detalhes-denuncia"
                value={detalhes}
                onChange={(event) => setDetalhes(event.target.value)}
                placeholder="Explique o que aconteceu e por que esta publicação deve ser analisada..."
                maxLength={1000}
                rows={6}
                required
                style={estilos.detalhes}
              />

              <div
                style={{
                  marginTop: 5,
                  color: "#64748b",
                  fontSize: 11,
                  textAlign: "right",
                }}
              >
                {detalhes.length}/1000
              </div>

              {erro && (
                <div role="alert" style={estilos.erro}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{erro}</span>
                </div>
              )}

              <div style={estilos.aviso}>
                <Info size={14} style={{ flexShrink: 0 }} />
                <span>
                  Escreva sua denúncia com clareza. As informações serão
                  encaminhadas para análise da moderação.
                </span>
              </div>

              <div style={estilos.botoes}>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={fecharSePermitido}
                  style={{
                    ...estilos.botaoBase,
                    ...estilos.cancelar,
                    opacity: enviando ? 0.6 : 1,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  style={{
                    ...estilos.botaoBase,
                    ...estilos.enviar,
                    opacity: enviando ? 0.7 : 1,
                    cursor: enviando ? "wait" : "pointer",
                  }}
                >
                  {enviando ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={16} />
                      Enviar denúncia
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default CardDenunciar;
