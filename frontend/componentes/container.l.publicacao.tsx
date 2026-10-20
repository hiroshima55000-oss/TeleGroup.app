
import {
  Users,
  ExternalLink,
  Trash2,
  Eye,
  Heart,
  MousePointerClick,
  Loader2,
  Calendar,
} from "lucide-react";


import type {
  PublicacaoItem,
} from "../servicos/api.publicacoes";


import {
  registrarCliqueLink,
} from "../servicos/api.publicacoes";


export interface ContainerPublicacaoProps {

  grupo: PublicacaoItem;

  deletando?: boolean;

  onAcessar?: (
    grupo: PublicacaoItem
  ) => void;

  onDeletar?: (
    grupo: PublicacaoItem
  ) => void;
}


function ContainerPublicacao({
  grupo,
  deletando = false,
  onAcessar,
  onDeletar,
}: ContainerPublicacaoProps) {


  function handleAcessar() {

    if (onAcessar) {

      onAcessar(
        grupo
      );

      return;

    }


    registrarCliqueLink(
      grupo.id
    );


    const linkFinal =
      grupo.link.startsWith("http")
        ? grupo.link
        : `https://${grupo.link}`;


    window.open(
      linkFinal,
      "_blank",
      "noopener,noreferrer"
    );

  }


  function handleDeletar() {

    if (onDeletar) {

      onDeletar(
        grupo
      );

    }

  }


  function formatarNumero(
    valor: string | number
  ) {

    return typeof valor === "number"
      ? valor.toLocaleString("pt-BR")
      : valor;

  }


  return (
    <article
      style={{
        width: "100%",

        boxSizing: "border-box",

        padding: "20px",

        borderRadius: "14px",

        background: "#151a21",

        border:
          "1px solid rgba(255,255,255,0.07)",

        boxShadow:
          "0 8px 30px rgba(0,0,0,0.16)",
      }}
    >

      {/* CABEÇALHO */}

      <div
        style={{
          display: "flex",

          alignItems: "flex-start",

          justifyContent:
            "space-between",

          gap: "20px",

          marginBottom: "20px",
        }}
      >

        <div
          style={{
            display: "flex",

            alignItems: "flex-start",

            gap: "13px",

            minWidth: 0,

            flex: 1,
          }}
        >

          {/* AVATAR */}

          <div
            style={{
              width: "40px",

              height: "40px",

              flexShrink: 0,

              overflow: "hidden",

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              borderRadius: "10px",

              background:
                "rgba(34,158,217,0.10)",

              border:
                "1px solid rgba(255,255,255,0.05)",

              color: "#38bdf8",
            }}
          >

            {grupo.imagens &&
            grupo.imagens.length > 0 ? (

              <img
                src={
                  grupo.imagens[0]
                }

                alt={
                  grupo.nome
                }

                style={{
                  width: "100%",

                  height: "100%",

                  objectFit: "cover",
                }}
              />

            ) : (

              <Users
                size={19}
              />

            )}

          </div>


          {/* INFORMAÇÕES */}

          <div
            style={{
              minWidth: 0,

              flex: 1,
            }}
          >

            <div
              style={{
                display: "flex",

                alignItems: "center",

                flexWrap: "wrap",

                gap: "8px",

                marginBottom: "5px",
              }}
            >

              <h3
                style={{
                  margin: 0,

                  color: "#f1f5f9",

                  fontSize: "15px",

                  fontWeight: 700,

                  overflow: "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",
                }}
              >

                {grupo.nome}

              </h3>


              {/* STATUS */}

              <span
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "5px",

                  padding:
                    "4px 8px",

                  borderRadius: "6px",

                  background:
                    "rgba(74,222,128,0.08)",

                  color: "#4ade80",

                  fontSize: "10px",

                  fontWeight: 700,
                }}
              >

                <span
                  style={{
                    width: "5px",

                    height: "5px",

                    borderRadius:
                      "50%",

                    background:
                      "#4ade80",
                  }}
                />

                {grupo.status}

              </span>

            </div>


            <div
              style={{
                color: "#6f7d8d",

                fontSize: "12px",
              }}
            >

              {grupo.categoria}

            </div>

          </div>

        </div>

      </div>


      {/* DESCRIÇÃO */}

      {grupo.descricao && (

        <div
          style={{
            color: "#94a3b8",

            fontSize: "12px",

            lineHeight: 1.5,

            marginBottom: "16px",

            overflowWrap:
              "anywhere",
          }}
        >

          {grupo.descricao}

        </div>

      )}


      {/* MÉTRICAS */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",

          borderTop:
            "1px solid rgba(255,255,255,0.055)",

          borderBottom:
            "1px solid rgba(255,255,255,0.055)",

          padding: "17px 0",

          marginBottom: "16px",
        }}
      >

        {/* VISUALIZAÇÕES */}

        <div
          style={{
            padding:
              "0 16px 0 2px",

            borderRight:
              "1px solid rgba(255,255,255,0.055)",
          }}
        >

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "6px",

              marginBottom: "7px",

              color: "#667487",

              fontSize: "10px",

              fontWeight: 600,

              textTransform:
                "uppercase",
            }}
          >

            <Eye
              size={13}
            />

            Visualizações

          </div>


          <strong
            style={{
              color: "#e8edf3",

              fontSize: "15px",

              fontWeight: 700,
            }}
          >

            {formatarNumero(
              grupo.visualizacoes
            )}

          </strong>

        </div>


        {/* CURTIDAS */}

        <div
          style={{
            padding:
              "0 16px",

            borderRight:
              "1px solid rgba(255,255,255,0.055)",
          }}
        >

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "6px",

              marginBottom: "7px",

              color: "#667487",

              fontSize: "10px",

              fontWeight: 600,

              textTransform:
                "uppercase",
            }}
          >

            <Heart
              size={13}
            />

            Curtidas

          </div>


          <strong
            style={{
              color: "#e8edf3",

              fontSize: "15px",

              fontWeight: 700,
            }}
          >

            {formatarNumero(
              grupo.likes
            )}

          </strong>

        </div>


        {/* CLIQUES */}

        <div
          style={{
            padding:
              "0 0 0 16px",
          }}
        >

          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "6px",

              marginBottom: "7px",

              color: "#667487",

              fontSize: "10px",

              fontWeight: 600,

              textTransform:
                "uppercase",
            }}
          >

            <MousePointerClick
              size={13}
            />

            Cliques

          </div>


          <strong
            style={{
              color: "#e8edf3",

              fontSize: "15px",

              fontWeight: 700,
            }}
          >

            {formatarNumero(
              grupo.cliques
            )}

          </strong>

        </div>

      </div>


      {/* RODAPÉ */}

      <div
        style={{
          display: "flex",

          alignItems: "center",

          justifyContent:
            "space-between",

          gap: "15px",

          flexWrap: "wrap",
        }}
      >

        {/* DATA */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "6px",

            color: "#667487",

            fontSize: "11px",
          }}
        >

          <Calendar
            size={13}
          />

          {grupo.dataCriacao
            ? new Date(
                grupo.dataCriacao
              ).toLocaleDateString(
                "pt-BR"
              )
            : "Sem data"}

        </div>


        {/* AÇÕES */}

        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "8px",
          }}
        >

          {/* ACESSAR */}

          <button
            type="button"

            onClick={
              handleAcessar
            }

            title="Acessar publicação"

            style={{
              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              gap: "7px",

              padding:
                "8px 13px",

              borderRadius: "8px",

              border:
                "1px solid rgba(56,189,248,0.18)",

              background:
                "rgba(56,189,248,0.07)",

              color: "#38bdf8",

              fontSize: "11px",

              fontWeight: 700,

              cursor: "pointer",
            }}
          >

            <ExternalLink
              size={13}
            />

            Acessar publicação

          </button>


          {/* EXCLUIR */}

          <button
            type="button"

            disabled={
              deletando
            }

            onClick={
              handleDeletar
            }

            title="Excluir publicação"

            style={{
              width: "34px",

              height: "34px",

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              padding: 0,

              border:
                "1px solid rgba(239,68,68,0.18)",

              borderRadius: "8px",

              background:
                "rgba(239,68,68,0.07)",

              color: "#f87171",

              cursor:
                deletando
                  ? "not-allowed"
                  : "pointer",

              opacity:
                deletando
                  ? 0.5
                  : 1,
            }}
          >

            {deletando ? (

              <Loader2
                size={15}
                className="animate-spin"
              />

            ) : (

              <Trash2
                size={15}
              />

            )}

          </button>

        </div>

      </div>

    </article>
  );
}


export default ContainerPublicacao;


export {
  ContainerPublicacao,
};