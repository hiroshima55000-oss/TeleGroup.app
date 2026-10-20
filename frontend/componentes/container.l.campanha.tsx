import {
  Megaphone,
  Eye,
  MousePointerClick,
  DollarSign,
  Calendar,
  Pause,
  Play,
  Trash2,
  BarChart3,
  Plus,
} from "lucide-react";


import {
  useNavigate,
} from "react-router-dom";


import type {
  CampanhaItem,
} from "../servicos/api.campanhas";


export interface ContainerCampanhaProps {

  campanha: CampanhaItem;

  carregando?: boolean;

  onToggleStatus?: (
    campanha: CampanhaItem
  ) => void;

  onDeletar?: (
    campanha: CampanhaItem
  ) => void;

  onAdicionarSaldo?: (
    campanha: CampanhaItem
  ) => void;
}


function ContainerCampanha({
  campanha,
  carregando = false,
  onToggleStatus,
  onDeletar,
  onAdicionarSaldo,
}: ContainerCampanhaProps) {


  const navigate =
    useNavigate();


  const estaAtiva =
    campanha.status === "Ativa";


  const estaPausada =
    campanha.status === "Pausada";


  function handleToggle() {

    if (onToggleStatus) {

      onToggleStatus(
        campanha
      );

    }

  }


  function handleExcluir() {

    if (onDeletar) {

      onDeletar(
        campanha
      );

    }

  }


  function handleEstatisticas() {

    navigate(
      `/estatisticas?id=${campanha.id}`
    );

  }


  function formatarNumero(
    valor: string | number
  ) {

    return typeof valor === "number"
      ? valor.toLocaleString("pt-BR")
      : valor;

  }


  const statusColor =
    estaAtiva
      ? "#4ade80"
      : estaPausada
        ? "#facc15"
        : "#94a3b8";


  const statusBackground =
    estaAtiva
      ? "rgba(74,222,128,0.08)"
      : estaPausada
        ? "rgba(250,204,21,0.08)"
        : "rgba(148,163,184,0.08)";


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

          <div
            style={{
              width: "40px",

              height: "40px",

              flexShrink: 0,

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              borderRadius: "10px",

              background:
                "rgba(34,158,217,0.10)",

              color: "#38bdf8",
            }}
          >

            <Megaphone
              size={19}
            />

          </div>


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

                {campanha.nome}

              </h3>


              <span
                style={{
                  display: "inline-flex",

                  alignItems: "center",

                  gap: "5px",

                  padding:
                    "4px 8px",

                  borderRadius: "6px",

                  background:
                    statusBackground,

                  color:
                    statusColor,

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
                      statusColor,
                  }}
                />

                {campanha.status}

              </span>

            </div>


            <div
              style={{
                color: "#6f7d8d",

                fontSize: "12px",
              }}
            >

              {campanha.categoria}

            </div>

          </div>

        </div>

      </div>


      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",

          borderTop:
            "1px solid rgba(255,255,255,0.055)",

          borderBottom:
            "1px solid rgba(255,255,255,0.055)",

          padding: "17px 0",

          marginBottom: "16px",
        }}
      >

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
              campanha.visualizacoes
            )}

          </strong>

        </div>


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
              campanha.cliques
            )}

          </strong>

        </div>


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

            <DollarSign
              size={13}
            />

            Orçamento

          </div>


          <strong
            style={{
              color: "#e8edf3",

              fontSize: "15px",

              fontWeight: 700,
            }}
          >

            R${" "}

            {campanha.orcamentoDiario.toFixed(
              2
            )}

          </strong>

        </div>


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

            <DollarSign
              size={13}
            />

            Gasto

          </div>


          <strong
            style={{
              color: "#e8edf3",

              fontSize: "15px",

              fontWeight: 700,
            }}
          >

            R${" "}

            {campanha.gastoTotal.toFixed(
              2
            )}

          </strong>

        </div>

      </div>


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

          {campanha.dataCriacao
            ? new Date(
                campanha.dataCriacao
              ).toLocaleDateString(
                "pt-BR"
              )
            : "Sem data"}

        </div>


        <div
          style={{
            display: "flex",

            alignItems: "center",

            gap: "8px",
          }}
        >

          <button
            type="button"

            onClick={
              handleEstatisticas
            }

            title="Ver estatísticas"

            style={{
              width: "34px",

              height: "34px",

              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              padding: 0,

              border:
                "1px solid rgba(56,189,248,0.18)",

              borderRadius: "8px",

              background:
                "rgba(56,189,248,0.07)",

              color: "#38bdf8",

              cursor: "pointer",
            }}
          >

            <BarChart3
              size={15}
            />

          </button>


          {onAdicionarSaldo && (
            <button
              type="button"
              disabled={carregando}
              onClick={() => onAdicionarSaldo(campanha)}
              title="Adicionar saldo à campanha"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                padding: "8px 12px",
                border: "1px solid rgba(56,189,248,0.22)",
                borderRadius: "8px",
                background: "rgba(56,189,248,0.08)",
                color: "#38bdf8",
                fontSize: "11px",
                fontWeight: 700,
                cursor: carregando ? "not-allowed" : "pointer",
              }}
            >
              <Plus size={13} />
              Saldo
            </button>
          )}


          <button
            type="button"

            disabled={carregando}

            onClick={
              handleToggle
            }

            title={
              estaAtiva
                ? "Pausar campanha"
                : "Ativar campanha"
            }

            style={{
              display: "flex",

              alignItems: "center",

              justifyContent:
                "center",

              gap: "7px",

              padding:
                "8px 13px",

              borderRadius: "8px",

              border: estaAtiva
                ? "1px solid rgba(250,204,21,0.18)"
                : "1px solid rgba(74,222,128,0.18)",

              background:
                estaAtiva
                  ? "rgba(250,204,21,0.07)"
                  : "rgba(74,222,128,0.07)",

              color:
                estaAtiva
                  ? "#facc15"
                  : "#4ade80",

              fontSize: "11px",

              fontWeight: 700,

              cursor: carregando
                ? "not-allowed"
                : "pointer",

              opacity:
                carregando
                  ? 0.5
                  : 1,
            }}
          >

            {estaAtiva ? (

              <>

                <Pause
                  size={13}
                />

                Pausar campanha

              </>

            ) : (

              <>

                <Play
                  size={13}
                />

                Ativar campanha

              </>

            )}

          </button>


          <button
            type="button"

            disabled={carregando}

            onClick={
              handleExcluir
            }

            title="Excluir campanha"

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

              cursor: carregando
                ? "not-allowed"
                : "pointer",

              opacity:
                carregando
                  ? 0.5
                  : 1,
            }}
          >

            <Trash2
              size={15}
            />

          </button>

        </div>

      </div>

    </article>
  );
}


export default ContainerCampanha;


export {
  ContainerCampanha,
};