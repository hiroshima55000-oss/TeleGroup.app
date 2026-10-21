import {
  Eye,
  Heart,
  MousePointerClick,
  ExternalLink,
  MoreVertical,
} from "lucide-react";

import {
  useState,
  useEffect,
} from "react";
import CardDenunciar from "./card.denunciar";

import type {
  PublicacaoItem,
} from "../servicos/api.publicacoes";

import {
  registrarCliqueLink,
  curtirPublicacao,
  jaCurtiuLocal,
  registrarVisualizacao,
} from "../servicos/api.publicacoes";


export interface ConteinerFeedPesquisaProps {
  grupo?: PublicacaoItem;

  nome?: string;

  descricao?: string;

  link?: string;

  foto?: string;

  imagens?: string[];

  visualizacoes?: number | string;

  likes?: number | string;

  cliques?: number | string;

  destaque?: boolean;

  isAnuncio?: boolean;

  onCurtir?: () => void;

  onEntrar?: () => void;

  onAcessar?: (
    grupo?: PublicacaoItem
  ) => void;

  onTagClick?: (tag: string) => void;
}


export function ConteinerFeedPesquisa({
  grupo,

  link: linkProp,

  foto: fotoProp,

  imagens: imagensProp,

  visualizacoes: visualizacoesProp,

  likes: likesProp,

  cliques: cliquesProp,

  onCurtir,

  onEntrar,

  onAcessar,

  onTagClick,
}: ConteinerFeedPesquisaProps) {

  const link =
    grupo?.link ??
    linkProp ??
    "";

  const foto =
    fotoProp ??
    (
      grupo?.imagens &&
      grupo.imagens.length > 0
        ? grupo.imagens[0]
        : undefined
    ) ??
    (
      imagensProp &&
      imagensProp.length > 0
        ? imagensProp[0]
        : undefined
    );

  const visualizacoes =
    grupo?.visualizacoes ??
    visualizacoesProp ??
    0;

  const initialLikes =
    typeof grupo?.likes === "number"
      ? grupo.likes
      : Number(likesProp) || 0;

  const cliques =
    grupo?.cliques ??
    cliquesProp ??
    0;

  const jaCurtiuInicial = Boolean(grupo?.curtido);

  const [curtido, setCurtido] = useState(jaCurtiuInicial);
  const [totalLikes, setTotalLikes] = useState(initialLikes);
  const [denunciarAberto, setDenunciarAberto] = useState(false);

  useEffect(() => {
    if (grupo?.id) {
      setCurtido(Boolean(grupo.curtido));
      setTotalLikes(typeof grupo.likes === "number" ? grupo.likes : initialLikes);
      // Registra a visualização desde a primeira impressão no feed (1 vez por usuário)
      registrarVisualizacao(grupo.id);
    }
  }, [grupo?.id, grupo?.curtido, grupo?.likes, initialLikes]);

  async function handleCurtir(e: React.MouseEvent) {
    e.stopPropagation();

    // Se o callback pai onCurtir estiver presente, delega para ele para evitar chamada dupla
    if (onCurtir) {
      onCurtir();
      return;
    }

    if (!grupo?.id) return;

    const novoStatus = !curtido;
    setCurtido(novoStatus);
    setTotalLikes((prev) => Math.max(0, novoStatus ? prev + 1 : prev - 1));

    const res = await curtirPublicacao(grupo.id, novoStatus);
    if (res.pub) {
      setTotalLikes(res.totalLikes);
      setCurtido(res.curtido);
    }
  }


  function handleAcessar(
    e?: React.MouseEvent
  ) {
    e?.stopPropagation();

    if (grupo?.id) {
      registrarCliqueLink(
        grupo.id
      );
    }

    if (onAcessar) {
      onAcessar(grupo);

      return;
    }

    if (onEntrar) {
      onEntrar();

      return;
    }

    if (link) {
      const urlFinal =
        link.startsWith("http")
          ? link
          : `https://${link}`;

      window.open(
        urlFinal,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }


  // Apenas aparece o contêiner na tela de pesquisa se tiver imagem (imagem é obrigatória)
  if (!foto) {
    return null;
  }


  return (
    <>
      <article className="card-feed-pesquisa" style={{ position: "relative" }}>
        {/* BOTÃO DISCRETO DE 3 PONTINHOS PARA ABRIR O CARD DE DENÚNCIA */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDenunciarAberto(true);
          }}
          aria-label="Denunciar publicação"
          title="Denunciar publicação"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 15,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(15, 20, 26, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.3)",
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
          <MoreVertical size={14} />
        </button>

        {/* CONTEÚDO */}

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* FOTO */}

        {foto ? (
          <div className="card-feed-pesquisa-foto">

            <img
              src={foto}

              alt="Imagem da publicação"

              loading="lazy"

              style={{
                width: "100%",

                height: "100%",

                display: "block",

                objectFit: "cover",

                objectPosition: "center",
              }}
            />

          </div>
        ) : null}


        {/* NICHOS E HASHTAGS (SEM TEXTO DE DESCRIÇÃO) */}

        <div className="card-feed-pesquisa-corpo">

          {/* HASHTAGS (SEM NICHO, CONFORME SOLICITADO) */}
          {grupo?.tags && grupo.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                marginTop: "2px",
              }}
            >
              {grupo.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  style={{
                    padding: "3px 7px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.20)",
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 700,
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

      </div>


      {/* MÉTRICAS */}

      <div className="card-feed-pesquisa-metricas-wrap">

        <div className="card-feed-pesquisa-metricas">

          {/* VISUALIZAÇÕES */}

          <div className="card-feed-pesquisa-metrica-item">

            <Eye
              size={15}
            />

            <span
              style={{
                color: "#7f929a",
              }}
            >

              {
                typeof visualizacoes === "number"
                  ? visualizacoes.toLocaleString(
                      "pt-BR"
                    )
                  : visualizacoes
              }

            </span>

          </div>


          {/* LIKES (CURTIR / DESCURTIR) */}

          <button
            type="button"

            onClick={handleCurtir}

            title={
              curtido
                ? "Descurtir comunidade"
                : "Curtir comunidade"
            }

            className="card-feed-pesquisa-metrica-item"

            style={{
              border: "none",

              background: "transparent",

              color:
                curtido
                  ? "#f43f5e"
                  : "#f1f5f9",

              cursor: "pointer",

              padding: 0,

              transition: "all 0.2s ease",
            }}
          >

            <Heart
              size={15}

              fill={
                curtido
                  ? "#f43f5e"
                  : "none"
              }

              style={{
                color:
                  curtido
                    ? "#f43f5e"
                    : "#f1f5f9",
              }}
            />

            <span
              style={{
                color:
                  curtido
                    ? "#f43f5e"
                    : "#7f929a",
              }}
            >

              {
                totalLikes.toLocaleString(
                  "pt-BR"
                )
              }

            </span>

          </button>


          {/* CLIQUES */}

          <div className="card-feed-pesquisa-metrica-item">

            <MousePointerClick
              size={15}

              strokeWidth={2}

              style={{
                color: "#f1f5f9",
              }}
            />

            <span
              style={{
                color: "#7f929a",
              }}
            >

              {
                typeof cliques === "number"
                  ? cliques.toLocaleString(
                      "pt-BR"
                    )
                  : cliques
              }

            </span>

          </div>

        </div>


        {/* BOTÃO */}

        <div className="card-feed-pesquisa-botao-wrap">

          <button
            type="button"

            onClick={() =>
              handleAcessar()
            }

            className="card-feed-pesquisa-botao"
          >

            Acessar grupo

            <ExternalLink
              size={13}
            />

          </button>

        </div>

      </div>

    </article>

    {/* CARD FUNCIONAL DE DENÚNCIA */}
    <CardDenunciar
      aberto={denunciarAberto}
      publicacao={
        grupo || {
          id: "",
          nome: grupo?.nome || "Publicação",
          descricao: grupo?.descricao,
          link,
          foto,
        }
      }
      onFechar={() => setDenunciarAberto(false)}
    />
  </>
  );
}


/*
  GRADE DOS CARDS
*/

export interface GradeFeedPesquisaProps {
  publicacoes: PublicacaoItem[];

  onAcessar?: (
    grupo: PublicacaoItem
  ) => void;

  onCurtir?: (
    id: string
  ) => void;

  onTagClick?: (
    tag: string
  ) => void;
}


export function GradeFeedPesquisa({
  publicacoes,

  onAcessar,

  onCurtir,

  onTagClick,
}: GradeFeedPesquisaProps) {

  // Apenas publicações que possuem imagem aparecem na grade da pesquisa
  const publicacoesComImagem = publicacoes.filter((p) =>
    Boolean(
      (p.imagens && p.imagens.length > 0 && p.imagens[0]) ||
      (p as unknown as { foto?: string }).foto
    )
  );

  return (
    <div className="grade-feed-pesquisa">
      {publicacoesComImagem.map((publicacao) => (
        <ConteinerFeedPesquisa
          key={publicacao.id}
          grupo={publicacao}
          onAcessar={onAcessar}
          onCurtir={() => onCurtir?.(publicacao.id)}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
}


export default ConteinerFeedPesquisa;