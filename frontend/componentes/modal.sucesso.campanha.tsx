import {
  X,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import {
  CampanhaItem,
} from "../servicos/api.campanhas";


export interface ModalSucessoCampanhaProps {
  campanha: Partial<CampanhaItem> & {
    nome: string;
    orcamentoDiario: number;
    link: string;
    alcanceEstimado?: number;
    status?: string;
  };

  onFechar?: () => void;

  renderAsModal?: boolean;
}


export function ModalSucessoCampanha({
  campanha,
  onFechar,
  renderAsModal = false,
}: ModalSucessoCampanhaProps) {


  const alcanceEstimado =
    campanha.alcanceEstimado ??
    (
      campanha.orcamentoDiario
        ? campanha.orcamentoDiario * 1000
        : 25000
    );


  const statusFormatado =
    campanha.status || "Ativa";


  const orcamentoFormatado =
    Number(
      campanha.orcamentoDiario || 25
    ).toFixed(2);


  const conteudoCard = (

    <div>

      {onFechar && (

        <div
          style={{
            display: "flex",

            justifyContent: "flex-end",

            marginBottom: "4px",
          }}
        >

          <button
            type="button"

            onClick={onFechar}

            style={{
              width: "34px",

              height: "34px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              border: "none",

              borderRadius: "9px",

              background:
                "rgba(255,255,255,0.05)",

              color: "#8b98a9",

              cursor: "pointer",
            }}
          >

            <X
              size={18}
            />

          </button>

        </div>

      )}


      <div
        style={{
          textAlign: "center",

          padding:
            "4px 8px 24px",
        }}
      >

        <div
          style={{
            width: "58px",

            height: "58px",

            margin:
              "0 auto 16px",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            borderRadius: "50%",

            background:
              "rgba(34,197,94,0.10)",

            color: "#4ade80",
          }}
        >

          <CheckCircle2
            size={34}

            strokeWidth={2}
          />

        </div>


        <h2
          style={{
            margin: 0,
            color: "#f1f5f9",
            fontSize: "21px",
            fontWeight: 800,
            letterSpacing: "-0.3px",
          }}
        >
          {(campanha as any).pagoComSaldo
            ? "Campanha ativada com saldo!"
            : "Pagamento confirmado"}
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#8b98a9",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          {(campanha as any).pagoComSaldo
            ? "Sua campanha subiu e já está ativa utilizando o saldo disponível da sua conta."
            : "Sua campanha já está ativa e pronta para veiculação."}
        </p>

      </div>


      <div
        style={{
          padding:
            "16px 0",

          borderTop:
            "1px solid rgba(255,255,255,0.06)",

          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >

        <div
          style={{
            marginBottom: "18px",
          }}
        >

          <div
            style={{
              color: "#7f8c9d",

              fontSize: "11px",

              fontWeight: 600,

              marginBottom: "5px",
            }}
          >
            CAMPANHA
          </div>


          <div
            style={{
              color: "#f1f5f9",

              fontSize: "14px",

              fontWeight: 700,

              overflow: "hidden",

              textOverflow: "ellipsis",

              whiteSpace: "nowrap",
            }}
          >

            {campanha.nome}

          </div>

        </div>


        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap: "18px",
          }}
        >

          <div>

            <div
              style={{
                color: "#7f8c9d",

                fontSize: "11px",

                fontWeight: 600,

                marginBottom: "5px",
              }}
            >
              ORÇAMENTO DIÁRIO
            </div>


            <div
              style={{
                color: "#f1f5f9",

                fontSize: "14px",

                fontWeight: 700,
              }}
            >

              R$ {orcamentoFormatado}

            </div>

          </div>


          <div>

            <div
              style={{
                color: "#7f8c9d",

                fontSize: "11px",

                fontWeight: 600,

                marginBottom: "5px",
              }}
            >
              STATUS
            </div>


            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: "6px",

                color: "#4ade80",

                fontSize: "14px",

                fontWeight: 700,
              }}
            >

              <span
                style={{
                  width: "6px",

                  height: "6px",

                  borderRadius: "50%",

                  background: "#4ade80",
                }}
              />

              {statusFormatado}

            </div>

          </div>


          <div>

            <div
              style={{
                color: "#7f8c9d",

                fontSize: "11px",

                fontWeight: 600,

                marginBottom: "5px",
              }}
            >
              ALCANCE ESTIMADO
            </div>


            <div
              style={{
                color: "#f1f5f9",

                fontSize: "14px",

                fontWeight: 700,
              }}
            >

              {
                alcanceEstimado.toLocaleString(
                  "pt-BR"
                )
              }

            </div>

          </div>


          <div>

            <div
              style={{
                color: "#7f8c9d",

                fontSize: "11px",

                fontWeight: 600,

                marginBottom: "5px",
              }}
            >
              DESTINO
            </div>


            <div
              style={{
                color: "#38bdf8",

                fontSize: "14px",

                fontWeight: 600,

                overflow: "hidden",

                textOverflow: "ellipsis",

                whiteSpace: "nowrap",
              }}
            >

              {campanha.link}

            </div>

          </div>

        </div>

      </div>


      <div
        style={{
          paddingTop: "18px",
        }}
      >

        <a
          href="/lista-campanhas"

          style={{
            width: "100%",

            boxSizing: "border-box",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            gap: "8px",

            padding:
              "12px 16px",

            borderRadius: "10px",

            background: "#229ed9",

            color: "#ffffff",

            textDecoration: "none",

            fontSize: "13px",

            fontWeight: 750,
          }}
        >

          Ver campanhas

          <ArrowRight
            size={16}
          />

        </a>

      </div>

    </div>
  );


  if (renderAsModal) {

    return (

      <div
        onClick={onFechar}

        style={{
          position: "fixed",

          inset: 0,

          zIndex: 9999,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          padding: "20px",

          background:
            "rgba(0,0,0,0.72)",

          backdropFilter:
            "blur(8px)",
        }}
      >

        <div
          onClick={(e) =>
            e.stopPropagation()
          }

          style={{
            width: "100%",

            maxWidth: "440px",

            maxHeight: "92vh",

            overflowY: "auto",

            padding: "22px",

            boxSizing: "border-box",

            borderRadius: "18px",

            border:
              "1px solid rgba(255,255,255,0.08)",

            background: "#151a21",

            color: "#e7edf5",

            boxShadow:
              "0 25px 70px rgba(0,0,0,0.55)",
          }}
        >

          {conteudoCard}

        </div>

      </div>

    );
  }


  return conteudoCard;
}


export default ModalSucessoCampanha;