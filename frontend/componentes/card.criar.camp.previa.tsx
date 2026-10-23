import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  Image as ImageIcon,
  Sparkles,
  Eye,
  Heart,
  MousePointerClick,
  Send,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink,
  Smartphone,
} from "lucide-react";

import { organizarSequenciasTexto } from "./Container.Grupo.Telegram";
import { ComponenteAjusteImagem } from "./componente.ajuste.imagem";

export interface CardCriarCampPreviaProps {
  foto: string;
  texto?: string;
  link?: string;
  tags?: string[];
  onAjustarFoto?: (novaFoto: string) => void;
  semTituloInterno?: boolean;
}

type ModoPrevia = "feed" | "pesquisa";

const LINHAS_INICIAIS = 4;
const PASSO_LINHAS = 4;

const ESTILOS = {
  fundo: "#1b212a",
  fundoCard: "#151a21",
  fundoEscuro: "#0f141a",
  texto: "#f1f5f9",
  textoSecundario: "#8b98a9",
  textoFraco: "#64748b",
  azul: "#38bdf8",
  borda: "rgba(255,255,255,0.08)",
};

const botaoBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  borderRadius: "7px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

export function CardCriarCampPrevia({
  foto,
  texto = "",
  link = "",
  tags = [],
  onAjustarFoto,
  semTituloInterno = false,
}: CardCriarCampPreviaProps) {
  const [modoPrevia, setModoPrevia] = useState<ModoPrevia>("feed");
  const [linhasMaximas, setLinhasMaximas] = useState(LINHAS_INICIAIS);
  const [temMaisParaLer, setTemMaisParaLer] = useState(false);
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);

  const textoRef = useRef<HTMLParagraphElement>(null);

  const descricaoExibicao = useMemo(() => {
    if (!texto.trim()) {
      return "O texto e descrição do seu anúncio aparecerão aqui em destaque para milhares de usuários no Feed do Telegram...";
    }

    return organizarSequenciasTexto(texto);
  }, [texto]);

  const tagsExibicao = useMemo(() => {
    return tags.length > 0 ? tags : ["destaque", "telegram"];
  }, [tags]);

  const urlFinal = useMemo(() => {
    const url = link.trim();

    if (!url) return "";

    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }, [link]);

  const verificarTruncamento = useCallback(() => {
    const elemento = textoRef.current;

    if (!elemento) return;

    setTemMaisParaLer(
      elemento.scrollHeight > elemento.clientHeight + 3,
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
  }, [descricaoExibicao, linhasMaximas, verificarTruncamento]);

  const lerMais = (evento: React.MouseEvent<HTMLButtonElement>) => {
    evento.stopPropagation();
    setLinhasMaximas((atual) => atual + PASSO_LINHAS);
  };

  const lerMenos = (evento: React.MouseEvent<HTMLButtonElement>) => {
    evento.stopPropagation();
    setLinhasMaximas(LINHAS_INICIAIS);
  };

  const acessarLink = () => {
    if (!urlFinal) return;

    window.open(urlFinal, "_blank", "noopener,noreferrer");
  };

  const alternarModo = (modo: ModoPrevia) => {
    setModoPrevia(modo);
  };

  const renderizarFoto = (descricao: string, tamanhoIcone = 32) => {
    if (foto) {
      return (
        <img
          src={foto}
          alt={descricao}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box",
          textAlign: "center",
          color: ESTILOS.textoFraco,
        }}
      >
        <ImageIcon
          size={tamanhoIcone}
          style={{ opacity: 0.4, marginBottom: "6px" }}
        />

        <span
          style={{
            fontSize: "11px",
            color: ESTILOS.textoSecundario,
            fontWeight: 600,
          }}
        >
          Nenhuma foto adicionada
        </span>

        <span style={{ fontSize: "11px", marginTop: "3px" }}>
          Adicione uma foto para visualizar
        </span>
      </div>
    );
  };

  const renderizarMetricas = (tamanho = 16) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "18px",
      }}
    >
      <div style={estiloMetrica}>
        <Eye size={tamanho} />
        <span>0</span>
      </div>

      <div style={estiloMetrica}>
        <Heart size={tamanho} />
        <span>0</span>
      </div>

      <div style={estiloMetrica}>
        <MousePointerClick size={tamanho} />
        <span>0</span>
      </div>
    </div>
  );

  const renderizarFeed = () => (
    <article
      style={{
        width: "100%",
        maxWidth: "620px",
        margin: "0 auto",
        overflow: "hidden",
        background: ESTILOS.fundoCard,
        border: ESTILOS.borda,
        borderRadius: "16px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.20)",
      }}
    >
      {/* IMAGEM ESTILO TWITTER: EXIBE INTEIRA COM BORDAS ARREDONDADAS */}
      {foto ? (
        <div
          style={{
            margin: "14px 14px 0",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0c1015",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={foto}
            alt="Prévia no feed"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "560px",
              display: "block",
              objectFit: "contain",
              borderRadius: "16px",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            margin: "14px 14px 0",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "#0c1015",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 0",
          }}
        >
          {renderizarFoto("Prévia no feed", 36)}
        </div>
      )}

      {/* DESCRIÇÃO */}
      <div style={{ padding: "16px 14px 14px" }}>
        <p
          ref={textoRef}
          style={{
            margin: 0,
            lineHeight: 1.6,
            color: "#edf2f7",
            fontSize: "14px",
            whiteSpace: "pre-line",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: linhasMaximas,
            overflow: "hidden",
          }}
        >
          {descricaoExibicao}
        </p>

        {(temMaisParaLer || linhasMaximas > LINHAS_INICIAIS) && (
          <div
            style={{
              display: "flex",
              justifyContent: temMaisParaLer ? "flex-start" : "flex-end",
              marginTop: "6px",
            }}
          >
            {temMaisParaLer ? (
              <button
                type="button"
                onClick={lerMais}
                style={{
                  ...botaoBase,
                  padding: "3px 8px",
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.20)",
                  color: ESTILOS.azul,
                }}
              >
                Ler mais
                <ChevronDown size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={lerMenos}
                style={{
                  ...botaoBase,
                  padding: "3px 8px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#94a3b8",
                }}
              >
                Ler menos
                <ChevronUp size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* MÉTRICAS */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          color: ESTILOS.texto,
        }}
      >
        {renderizarMetricas(17)}
      </div>

      {/* BOTÃO DE ACESSO */}
      <div style={{ padding: "10px 14px 14px" }}>
        <button
          type="button"
          onClick={acessarLink}
          disabled={!urlFinal}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "11px",
            border: "1px solid rgba(34,158,217,0.22)",
            background: "rgba(34,158,217,0.10)",
            color: "#55bee9",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: urlFinal ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Send size={14} />
          Entrar no grupo
        </button>
      </div>
    </article>
  );

  const renderizarPesquisa = () => (
    <article
      className="card-feed-pesquisa"
      style={{
        width: "100%",
        maxWidth: "340px",
        margin: "0 auto",
      }}
    >
      {/* IMAGEM */}
      <div className="card-feed-pesquisa-foto">
        {renderizarFoto("Prévia na tela de pesquisa", 30)}
      </div>

      {/* TAGS */}
      <div className="card-feed-pesquisa-corpo">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "2px",
          }}
        >
          {tagsExibicao.map((tag, indice) => (
            <span
              key={`${tag}-${indice}`}
              style={{
                padding: "3px 7px",
                borderRadius: "6px",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.20)",
                color: ESTILOS.azul,
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              #
              {tag.replace(/^#/, "")}
            </span>
          ))}
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="card-feed-pesquisa-metricas-wrap">
        <div className="card-feed-pesquisa-metricas">
          {renderizarMetricas(15)}
        </div>
      </div>

      {/* BOTÃO DE ACESSO */}
      <div className="card-feed-pesquisa-botao-wrap">
        <button
          type="button"
          onClick={acessarLink}
          disabled={!urlFinal}
          className="card-feed-pesquisa-botao"
          style={{
            cursor: urlFinal ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <ExternalLink size={13} />
          Acessar
        </button>
      </div>
    </article>
  );

  return (
    <section
      style={{
        padding: "22px",
        borderRadius: "18px",
        border: ESTILOS.borda,
        background: "rgba(27,33,42,0.92)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* CABEÇALHO */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: semTituloInterno ? "flex-end" : "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        {!semTituloInterno && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sparkles size={17} color="#facc15" />

            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: ESTILOS.texto,
              }}
            >
              Prévias em Tempo Real
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {foto && onAjustarFoto && (
            <button
              type="button"
              onClick={() => setModalAjusteAberto(true)}
              style={{
                ...botaoBase,
                padding: "5px 10px",
                background: "rgba(56,189,248,0.14)",
                border: "1px solid rgba(56,189,248,0.3)",
                color: ESTILOS.azul,
              }}
            >
              <SlidersHorizontal size={12} />
              Ajustar foto
            </button>
          )}

          {/* SELETOR: FEED / PESQUISA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "3px",
              borderRadius: "8px",
              background: "rgba(15,20,26,0.8)",
              border: ESTILOS.borda,
            }}
          >
            <button
              type="button"
              onClick={() => alternarModo("feed")}
              aria-pressed={modoPrevia === "feed"}
              style={{
                ...botaoBase,
                padding: "5px 9px",
                border: "none",
                background:
                  modoPrevia === "feed"
                    ? "rgba(56,189,248,0.2)"
                    : "transparent",
                color:
                  modoPrevia === "feed"
                    ? ESTILOS.azul
                    : "#94a3b8",
              }}
            >
              <Smartphone size={12} />
              Feed
            </button>

            <button
              type="button"
              onClick={() => alternarModo("pesquisa")}
              aria-pressed={modoPrevia === "pesquisa"}
              style={{
                ...botaoBase,
                padding: "5px 9px",
                border: "none",
                background:
                  modoPrevia === "pesquisa"
                    ? "rgba(56,189,248,0.2)"
                    : "transparent",
                color:
                  modoPrevia === "pesquisa"
                    ? ESTILOS.azul
                    : "#94a3b8",
              }}
            >
              <ExternalLink size={12} />
              Pesquisa
            </button>
          </div>
        </div>
      </header>

      {/* DESCRIÇÃO */}
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: ESTILOS.textoSecundario,
          lineHeight: 1.5,
        }}
      >
        Visualize como sua publicação aparecerá no{" "}
        <strong style={{ color: ESTILOS.azul }}>Feed</strong> ou na{" "}
        <strong style={{ color: ESTILOS.azul }}>Tela de Pesquisa</strong>.
      </p>

      {/* PRÉVIA SELECIONADA */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {modoPrevia === "feed" ? renderizarFeed() : renderizarPesquisa()}
      </div>

      {/* MODAL DE AJUSTE DA FOTO */}
      {modalAjusteAberto && foto && onAjustarFoto && (
        <ComponenteAjusteImagem
          isOpen={modalAjusteAberto}
          imagemOriginal={foto}
          onSalvar={(novaFoto) => {
            onAjustarFoto(novaFoto);
            setModalAjusteAberto(false);
          }}
          onFechar={() => setModalAjusteAberto(false)}
        />
      )}
    </section>
  );
}

const estiloMetrica: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#f1f5f9",
};

export default CardCriarCampPrevia;







