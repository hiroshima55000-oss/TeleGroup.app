import {
  Eye,
  Heart,
  MousePointerClick,
  Send,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import CardDenunciar from "./card.denunciar";

export interface ContainerGrupoTelegramProps {
  id?: string;
  usuarioId?: string;
  nome?: string;
  descricao: string;
  destaque?: boolean;
  foto?: string;
  visualizacoes: string | number;
  likes: string | number;
  cliques: string | number;
  link?: string;
  categoria?: string;
  isAnuncio?: boolean;
  tags?: string[];
  nicho?: string;
  nomeNicho?: string;
  iconeNicho?: string;
  curtido?: boolean;
  processandoLike?: boolean;
  onCurtir?: () => void;
  onEntrar?: () => void;
  onTagClick?: (tag: string) => void;
  onDenunciar?: () => void;
}

export function organizarSequenciasTexto(texto: string): string {
  if (!texto || typeof texto !== "string") return "";

  let formatado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  formatado = formatado
    .split("\n")
    .map((linha) => linha.replace(/[ \t]+/g, " ").trim())
    .join("\n");

  const marcadores = [
    "🔥", "🚀", "💎", "⚡", "🎯", "💥", "🏆", "📌", "✨", "🎉",
    "⚠️", "🚨", "📢", "💰", "💸", "📈", "🔔", "💬", "👑", "🌟",
    "⭐", "✅", "✔", "✓", "👉", "➡", "🔹", "🔸", "▫", "▪",
    "•", "➜", "➔", "▶", "►", "🟢", "🔴",
  ];

  const marcadoresRegex = marcadores
    .map((m) => m.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("|");

  const regexMarcadoresMeio = new RegExp(
    `([^\\n\\s])\\s*(${marcadoresRegex})\\s+`,
    "gu"
  );

  formatado = formatado.replace(regexMarcadoresMeio, "$1\n$2 ");

  formatado = formatado.replace(
    /([^\n\s])\s+([•\-])\s+/g,
    "$1\n$2 "
  );

  return formatado
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha, indice, array) => {
      if (!linha && indice > 0 && !array[indice - 1]) {
        return false;
      }
      return true;
    })
    .join("\n")
    .trim();
}

function ContainerGrupoTelegram({
  id,
  usuarioId,
  nome,
  descricao,
  foto,
  visualizacoes,
  likes,
  cliques,
  link,
  isAnuncio,
  tags,
  nicho,
  nomeNicho,
  iconeNicho,
  curtido = false,
  processandoLike = false,
  onCurtir,
  onEntrar,
  onTagClick,
  onDenunciar,
}: ContainerGrupoTelegramProps) {
  const [denunciarAberto, setDenunciarAberto] = useState(false);

  const PASSO_LINHAS = 4;
  const [linhasMaximas, setLinhasMaximas] = useState(PASSO_LINHAS);
  const [temMaisParaLer, setTemMaisParaLer] = useState(false);

  const textoRef = useRef<HTMLParagraphElement>(null);

  const descricaoFormatada = useMemo(
    () => organizarSequenciasTexto(descricao),
    [descricao]
  );

  const verificarTruncamento = useCallback(() => {
    const elemento = textoRef.current;
    if (!elemento) return;

    setTemMaisParaLer(
      elemento.scrollHeight > elemento.clientHeight + 3
    );
  }, []);

  useEffect(() => {
    verificarTruncamento();

    const idAnimacao = requestAnimationFrame(verificarTruncamento);

    window.addEventListener("resize", verificarTruncamento);

    return () => {
      cancelAnimationFrame(idAnimacao);
      window.removeEventListener("resize", verificarTruncamento);
    };
  }, [descricaoFormatada, linhasMaximas, verificarTruncamento]);

  function handleLerMais(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setLinhasMaximas((anterior) => anterior + PASSO_LINHAS);
  }

  function handleRecolher(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setLinhasMaximas(PASSO_LINHAS);
  }

  function handleEntrar() {
    if (onEntrar) {
      onEntrar();
      return;
    }

    if (link) {
      const urlFinal = link.startsWith("http")
        ? link
        : `https://${link}`;

      window.open(urlFinal, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <>
      <article
        style={{
          width: "calc(100% - 32px)",
          maxWidth: "620px",
          margin: "18px auto",
          background: "transparent",
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
          overflow: "visible",
          position: "relative",
        }}
      >
        {/* FOTO E BOTÃO DE OPÇÕES NO CANTO SUPERIOR DIREITO */}
        {foto && (
          <div
            style={{
              position: "relative",
              width: "100%",
              margin: 0,
              padding: 0,
              border: "none",
              borderRadius: "16px 16px 0 0",
              overflow: "hidden",
              background: "transparent",
              display: "block",
            }}
          >
            <img
              src={foto}
              alt="Mídia da postagem"
              loading="lazy"
              decoding="async"
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "620px",
                objectFit: "contain",
                border: "none",
                borderRadius: "16px 16px 0 0",
                margin: 0,
              }}
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (onDenunciar) {
                  onDenunciar();
                } else {
                  setDenunciarAberto(true);
                }
              }}
              aria-label="Opções da publicação (denunciar)"
              title="Denunciar publicação"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 15,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(15,20,26,0.72)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "none",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(30,41,59,0.95)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(15,20,26,0.72)";
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <MoreVertical size={16} />
            </button>
          </div>
        )}

        {/* CONTEÚDO COM BORDA ABAIXO DA FOTO */}
        <div
          style={{
            position: "relative",
            background: "#151a21",
            border: "1px solid rgba(255,255,255,0.10)",
            borderTop: "none",
            borderRadius: foto ? "0 0 12px 12px" : "12px",
            boxShadow: "none",
            overflow: "hidden",
          }}
        >
          {/* QUANDO NÃO HÁ FOTO, OS TRÊS PONTINHOS FICAM NO TOPO DO CARD */}
          {!foto && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (onDenunciar) {
                  onDenunciar();
                } else {
                  setDenunciarAberto(true);
                }
              }}
              aria-label="Opções da publicação (denunciar)"
              title="Denunciar publicação"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 15,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(15,20,26,0.72)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <MoreVertical size={16} />
            </button>
          )}

          {/* DESCRIÇÃO */}
          <div style={{ padding: "20px 16px 16px" }}>
            <p
              ref={textoRef}
              style={{
                margin: 0,
                lineHeight: "1.65",
                color: "#edf2f7",
                fontSize: "15px",
                whiteSpace: "pre-line",
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: linhasMaximas,
                overflow: "hidden",
              }}
            >
              {descricaoFormatada}
            </p>

            {/* LER MAIS / LER MENOS */}
            {(temMaisParaLer || linhasMaximas > PASSO_LINHAS) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: temMaisParaLer
                    ? "flex-start"
                    : "flex-end",
                  width: "100%",
                  marginTop: "10px",
                }}
              >
                {temMaisParaLer ? (
                  <button
                    type="button"
                    onClick={handleLerMais}
                    style={{
                      padding: "5px 11px",
                      borderRadius: "8px",
                      background: "rgba(56,189,248,0.08)",
                      border: "1px solid rgba(56,189,248,0.22)",
                      color: "#38bdf8",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Ler mais</span>
                    <ChevronDown size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRecolher}
                    style={{
                      padding: "5px 11px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#cbd5e1",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>Ler menos</span>
                    <ChevronUp size={14} />
                  </button>
                )}
              </div>
            )}

            {/* TAGS */}
            {tags && tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "12px",
                }}
              >
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    style={{
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: onTagClick ? "pointer" : "default",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <span style={{ color: "#38bdf8" }}>#</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MÉTRICAS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "20px",
              padding: "14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.055)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "#f1f5f9",
              }}
            >
              <Eye size={19} />
              <span style={{ fontSize: "13px", color: "#7f929a" }}>
                {typeof visualizacoes === "number"
                  ? visualizacoes.toLocaleString("pt-BR")
                  : visualizacoes}
              </span>
            </div>

            {/* CURTIDAS */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();

                if (!processandoLike && onCurtir) {
                  onCurtir();
                }
              }}
              disabled={processandoLike}
              title={curtido ? "Descurtir publicação" : "Curtir publicação"}
              aria-label={
                curtido ? "Descurtir publicação" : "Curtir publicação"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "none",
                background: "transparent",
                color: curtido ? "#f43f5e" : "#f1f5f9",
                cursor: processandoLike
                  ? "wait"
                  : onCurtir
                    ? "pointer"
                    : "default",
                padding: "4px 6px",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                transform: processandoLike ? "scale(0.96)" : "scale(1)",
                opacity: processandoLike ? 0.75 : 1,
                userSelect: "none",
              }}
            >
              <Heart
                size={19}
                fill={curtido ? "#f43f5e" : "none"}
                style={{
                  color: curtido ? "#f43f5e" : "#f1f5f9",
                  transform: curtido ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.18s ease",
                }}
              />

              <span
                style={{
                  fontSize: "13px",
                  color: curtido ? "#f43f5e" : "#7f929a",
                  fontWeight: curtido ? 750 : 500,
                }}
              >
                {typeof likes === "number"
                  ? likes.toLocaleString("pt-BR")
                  : likes}
              </span>
            </button>

            {/* CLIQUES */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "#f1f5f9",
              }}
            >
              <MousePointerClick size={19} strokeWidth={2} />
              <span style={{ fontSize: "13px", color: "#7f929a" }}>
                {typeof cliques === "number"
                  ? cliques.toLocaleString("pt-BR")
                  : cliques}
              </span>
            </div>
          </div>

          {/* BOTÃO ENTRAR */}
          <div style={{ padding: "14px 16px 16px" }}>
            <button
              type="button"
              onClick={handleEntrar}
              style={{
                width: "100%",
                border: "1px solid rgba(34,158,217,0.22)",
                background: "rgba(34,158,217,0.10)",
                color: "#55bee9",
                padding: "11px 16px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                transition: "background 0.2s ease",
              }}
            >
              <Send size={15} />
              Entrar no grupo
            </button>
          </div>
        </div>
      </article>

      {/* CARD DE DENÚNCIA */}
      <CardDenunciar
        aberto={denunciarAberto}
        publicacao={{
          id,
          nome,
          descricao,
          usuarioId,
          link,
          foto,
        }}
        onFechar={() => setDenunciarAberto(false)}
      />
    </>
  );
}

export default ContainerGrupoTelegram;



