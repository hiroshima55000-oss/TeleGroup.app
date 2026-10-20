import { Megaphone, Calendar, Clock, Zap, Settings2 } from "lucide-react";
import { useState } from "react";

export const CATEGORIAS_CAMPANHA_PADRAO = [
  "Tecnologia",
  "Programação",
  "Negócios & Empreendedorismo",
  "Marketing Digital",
  "Finanças & Investimentos",
  "Games & eSports",
  "Cripto & Web3",
  "Educação & Cursos",
  "Geral",
];

export interface CardInformacoesCampanhaProps {
  nome: string;
  setNome: (nome: string) => void;
  dataInicio?: string;
  setDataInicio?: (data: string) => void;
  horaInicio?: string;
  setHoraInicio?: (hora: string) => void;
  categoria?: string;
  setCategoria?: (categoria: string) => void;
  categorias?: string[];
  texto?: string;
  setTexto?: (texto: string) => void;
  semTituloInterno?: boolean;
}

export function obterDataHojeLocal(): string {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function obterHoraAtualLocal(): string {
  const data = new Date();
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");

  return `${hora}:${minuto}`;
}

export function CardInformacoesCampanha({
  nome,
  setNome,
  dataInicio,
  setDataInicio,
  horaInicio,
  setHoraInicio,
  semTituloInterno = false,
}: CardInformacoesCampanhaProps) {
  const [modoInicio, setModoInicio] = useState<"agora" | "personalizado">(
    "agora"
  );

  const hoje = obterDataHojeLocal();
  const horaAtual = obterHoraAtualLocal();

  const valorData = dataInicio || hoje;
  const valorHora = horaInicio || horaAtual;

  function iniciarAgora() {
    setModoInicio("agora");
    setDataInicio?.(obterDataHojeLocal());
    setHoraInicio?.(obterHoraAtualLocal());
  }

  function selecionarPersonalizado() {
    setModoInicio("personalizado");

    if (!dataInicio) setDataInicio?.(obterDataHojeLocal());
    if (!horaInicio) setHoraInicio?.(obterHoraAtualLocal());
  }

  const estiloCampo = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "12px 13px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.09)",
    outline: "none",
    background: "#151a21",
    color: "#e7edf5",
    fontSize: "13px",
    colorScheme: "dark" as const,
  };

  function estiloOpcao(ativa: boolean) {
    return {
      flex: 1,
      minWidth: "120px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px",
      borderRadius: "10px",
      border: ativa
        ? "1px solid rgba(56,189,248,0.45)"
        : "1px solid rgba(255,255,255,0.08)",
      background: ativa
        ? "rgba(56,189,248,0.10)"
        : "rgba(255,255,255,0.025)",
      color: ativa ? "#38bdf8" : "#94a3b8",
      fontSize: "13px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "all 0.2s ease",
    };
  }

  return (
    <section
      style={{
        padding: "20px",
        borderRadius: "15px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(27,33,42,0.92)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {!semTituloInterno && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
          }}
        >
          <Megaphone size={18} color="#38bdf8" />

          <span
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#f1f5f9",
            }}
          >
            Informações da Campanha
          </span>
        </div>
      )}

      {/* NOME DA CAMPANHA */}
      <div>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#cbd5e1",
          }}
        >
          Nome da campanha
        </label>

        <input
          id="campo-nome-campanha"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Campanha Telegram VIP"
          maxLength={70}
          style={estiloCampo}
        />

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "11px",
            color: "#64748b",
            textAlign: "right",
          }}
        >
          {nome.length}/70 caracteres
        </p>
      </div>

      {/* AGENDAMENTO */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <Calendar size={16} color="#38bdf8" />

          <label
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#cbd5e1",
            }}
          >
            Quando iniciar?
          </label>
        </div>

        {/* OPÇÕES DE INÍCIO */}
        <div
          style={{
            display: "flex",
            gap: "9px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={iniciarAgora}
            style={estiloOpcao(modoInicio === "agora")}
          >
            <Zap size={16} />
            Agora
          </button>

          <button
            type="button"
            onClick={selecionarPersonalizado}
            style={estiloOpcao(modoInicio === "personalizado")}
          >
            <Settings2 size={16} />
            Personalizado
          </button>
        </div>

        {/* DATA E HORA PERSONALIZADAS */}
        {modoInicio === "personalizado" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: "10px",
              marginTop: "16px",
              padding: "14px",
              borderRadius: "11px",
              border: "1px solid rgba(56,189,248,0.15)",
              background: "rgba(56,189,248,0.035)",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  fontWeight: 600,
                }}
              >
                Data de início
              </label>

              <input
                id="campo-data-inicio"
                type="date"
                min={hoje}
                value={valorData}
                onChange={(e) => setDataInicio?.(e.target.value)}
                style={estiloCampo}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "12px",
                  color: "#cbd5e1",
                  fontWeight: 600,
                }}
              >
                Horário de início
              </label>

              <input
                id="campo-hora-inicio"
                type="time"
                value={valorHora}
                onChange={(e) => setHoraInicio?.(e.target.value)}
                style={estiloCampo}
              />
            </div>
          </div>
        )}

        {/* DESCRIÇÃO */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "9px",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <Clock
            size={14}
            color="#64748b"
            style={{ marginTop: "2px", flexShrink: 0 }}
          />

          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              lineHeight: 1.5,
              color: "#94a3b8",
            }}
          >
            {modoInicio === "agora"
              ? "A campanha será configurada para iniciar agora, conforme a disponibilidade de publicação."
              : "Escolha a data e o horário em que deseja programar o início da campanha."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default CardInformacoesCampanha;