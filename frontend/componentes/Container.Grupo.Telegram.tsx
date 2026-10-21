import {
  Eye,
  Heart,
  MousePointerClick,
  Send,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

/**
 * Organiza e formata o texto para manter sequências limpas e legíveis no Feed:
 * 1. Remove múltiplos espaços repetitivos (ex: "Top  demais" -> "Top demais").
 * 2. Quebra itens em linhas separadas quando marcadores/emojis iniciam novas sequências:
 *    Exemplo solicitado pelo usuário:
 *    Invés de: "🔥 Legal demais 🔥 Top  demais"
 *    Fica:
 *    🔥 Legal demais
 *    🔥 Top demais
 * 3. Mantém quebras de linha existentes respeitando parágrafos.
 * 4. Remove linhas em branco excessivas consecutivas.
 */
export function organizarSequenciasTexto(texto: string): string {
  if (!texto || typeof texto !== "string") return "";

  // 1. Normalizar quebras de linha universais
  let formatado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 2. Reduzir múltiplos espaços consecutivos dentro de linhas (preservando quebras)
  formatado = formatado
    .split("\n")
    .map((linha) => linha.replace(/[ \t]+/g, " ").trim())
    .join("\n");

  // 3. Marcadores e emojis comuns de tópicos e listas do Telegram
  const marcadores = [
    "🔥", "🚀", "💎", "⚡", "🎯", "💥", "🏆", "📌", "✨", "🎉",
    "⚠️", "🚨", "📢", "💰", "💸", "📈", "🔔", "💬", "👑", "🌟",
    "⭐", "✅", "✔", "✓", "👉", "➡", "🔹", "🔸", "▫", "▪", "•", "➜", "➔", "▶", "►", "🟢", "🔴"
  ];

  const marcadoresRegex = marcadores
    .map((m) => m.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("|");

  // Insere quebra de linha quando um marcador/emoji aparece no meio de uma linha após texto/palavras:
  // Exemplo: "Legal demais 🔥 Top demais" -> "Legal demais\n🔥 Top demais"
  const regexMarcadoresMeio = new RegExp(`([^\\n\\s])\\s*(${marcadoresRegex})\\s+`, "gu");
  formatado = formatado.replace(regexMarcadoresMeio, "$1\n$2 ");

  // Também quebra tópicos de traço ou bullet no meio de uma linha:
  // Exemplo: "Texto aqui - Tópico 2" -> "Texto aqui\n- Tópico 2"
  formatado = formatado.replace(/([^\n\s])\s+([•\-])\s+/g, "$1\n$2 ");

  // 4. Limpeza final: remove espaços nas bordas e elimina múltiplas linhas vazias
  return formatado
    .split("\n")
    .map((l) => l.trim())
    .filter((linha, idx, arr) => {
      if (!linha && idx > 0 && !arr[idx - 1]) return false;
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
  // Controle progressivo de linhas: inicia em 4 linhas no máximo e avança +4 a cada clique
  const PASSO_LINHAS = 4;
  const [linhasMaximas, setLinhasMaximas] = useState(PASSO_LINHAS);
  const [temMaisParaLer, setTemMaisParaLer] = useState(false);
  const textoRef = useRef<HTMLParagraphElement>(null);

  const descricaoFormatada = useMemo(() => {
    return organizarSequenciasTexto(descricao);
  }, [descricao]);

  // Medição precisa do elemento para identificar se há texto oculto pelo clamp
  const verificarTruncamento = useCallback(() => {
    const el = textoRef.current;
    if (!el) return;
    const truncado = el.scrollHeight > el.clientHeight + 3;
    setTemMaisParaLer(truncado);
  }, []);

  useEffect(() => {
    verificarTruncamento();
    const idAnim = requestAnimationFrame(verificarTruncamento);
    window.addEventListener("resize", verificarTruncamento);
    return () => {
      cancelAnimationFrame(idAnim);
      window.removeEventListener("resize", verificarTruncamento);
    };
  }, [descricaoFormatada, linhasMaximas, verificarTruncamento]);

  function handleLerMais(e: React.MouseEvent) {
    e.stopPropagation();
    setLinhasMaximas((prev) => prev + PASSO_LINHAS);
  }

  function handleRecolher(e: React.MouseEvent) {
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

      window.open(
        urlFinal,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  return (
    <>
      <article
        style={{
          width: "calc(100% - 32px)",
          maxWidth: "620px",
          background: "#151a21",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          overflow: "hidden",
          margin: "18px auto",
          boxShadow: "0 12px 35px rgba(0,0,0,0.20)",
          position: "relative",
        }}
      >
        {/* BOTÃO DISCRETO DE 3 PONTINHOS PARA ABRIR O CARD DE DENÚNCIA */}
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
            background: "rgba(15, 20, 26, 0.72)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(30, 41, 59, 0.95)";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(15, 20, 26, 0.72)";
            e.currentTarget.style.color = "#cbd5e1";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <MoreVertical size={16} />
        </button>
      {/* FOTO (OPCIONAL: EXIBIDA SE HOUVER FOTO - PROPORÇÃO 16:9) */}
      {foto ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#0f141a",
            overflow: "hidden",
          }}
        >
          <img
            src={foto}
            alt="Mídia da postagem"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
            }}
          />
        </div>
      ) : null}

      {/* CONTEÚDO E DESCRIÇÃO */}
      <div
        style={{
          padding: "20px 16px 16px",
        }}
      >

        {/* TEXTO DA PUBLICAÇÃO COM CLAMP PROGRESSIVO DE 4 EM 4 LINHAS */}
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

        {/* CONTAINER DE CONTROLE DE EXPANSÃO (LER MAIS DE UM LADO, LER MENOS DO OUTRO LADO PARA EVITAR CLIQUE ACIDENTAL) */}
        {(temMaisParaLer || linhasMaximas > PASSO_LINHAS) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: temMaisParaLer ? "flex-start" : "flex-end",
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
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.22)",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease",
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
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Ler menos</span>
                <ChevronUp size={14} />
              </button>
            )}
          </div>
        )}

        {/* TAGS CLICÁVEIS */}
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
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
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
        {/* VISUALIZAÇÕES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            color: "#f1f5f9",
          }}
        >
          <Eye size={19} />
          <span
            style={{
              fontSize: "13px",
              color: "#7f929a",
            }}
          >
            {typeof visualizacoes === "number"
              ? visualizacoes.toLocaleString("pt-BR")
              : visualizacoes}
          </span>
        </div>

        {/* LIKES (CURTIR / DESCURTIR) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!processandoLike && onCurtir) {
              onCurtir();
            }
          }}
          disabled={processandoLike}
          title={
            curtido
              ? "Descurtir publicação (remover curtida)"
              : "Curtir publicação"
          }
          aria-label={curtido ? "Descurtir publicação" : "Curtir publicação"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "none",
            background: "transparent",
            color: curtido ? "#f43f5e" : "#f1f5f9",
            cursor: processandoLike ? "wait" : onCurtir ? "pointer" : "default",
            padding: "4px 6px",
            borderRadius: "8px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
              transition: "transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.18s ease, fill 0.18s ease",
              transform: curtido ? "scale(1.15)" : "scale(1)",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: curtido ? "#f43f5e" : "#7f929a",
              fontWeight: curtido ? 750 : 500,
              transition: "color 0.18s ease",
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
          <MousePointerClick
            size={19}
            strokeWidth={2}
            style={{
              color: "#f1f5f9",
            }}
          />
          <span
            style={{
              fontSize: "13px",
              color: "#7f929a",
            }}
          >
            {typeof cliques === "number"
              ? cliques.toLocaleString("pt-BR")
              : cliques}
          </span>
        </div>
      </div>

      {/* BOTÃO */}
      <div
        style={{
          padding: "14px 16px 16px",
        }}
      >
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
    </article>

    {/* CARD FUNCIONAL DE DENÚNCIA */}
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