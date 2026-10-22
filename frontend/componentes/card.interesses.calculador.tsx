import React from "react";
import {
  Sparkles,
  CalendarDays,
  TrendingUp,
  LoaderCircle,
  MousePointerClick,
  Eye,
  Heart,
  Target,
} from "lucide-react";

import { CalculoInteressePeriodoItem } from "../servicos/api.publicacoes";

type PeriodoCalculo = "ontem" | "10d" | "30d";

export interface CardCalculadorInteressesProps {
  periodoCalculo: PeriodoCalculo;
  aoMudarPeriodo: (periodo: PeriodoCalculo) => void;
  calculoAtual?: CalculoInteressePeriodoItem;
  carregando: boolean;
}

const CORES = {
  fundo: "#151b24",
  card: "rgba(255,255,255,0.035)",
  borda: "rgba(255,255,255,0.08)",
  azul: "#38bdf8",
  texto: "#f1f5f9",
  secundario: "#94a3b8",
  verde: "#4ade80",
  amarelo: "#fbbf24",
};

const periodos: { valor: PeriodoCalculo; label: string }[] = [
  { valor: "ontem", label: "Ontem" },
  { valor: "10d", label: "10 dias" },
  { valor: "30d", label: "30 dias" },
];

const estilos = {
  card: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "22px",
    borderRadius: "18px",
    background: `linear-gradient(145deg, #1b2531, ${CORES.fundo})`,
    border: `1px solid ${CORES.borda}`,
    color: CORES.texto,
    fontFamily: "Inter, Arial, sans-serif",
  },

  cabecalho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "18px",
    paddingBottom: "20px",
    borderBottom: `1px solid ${CORES.borda}`,
  },

  tituloGrupo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
    flex: "1 1 260px",
  },

  icone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    flexShrink: 0,
    borderRadius: "13px",
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.22)",
    color: CORES.azul,
  },

  titulo: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 800,
    letterSpacing: "-0.4px",
  },

  descricao: {
    margin: "5px 0 0",
    color: CORES.secundario,
    fontSize: "12px",
    lineHeight: 1.6,
  },

  seletor: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "4px",
    padding: "4px",
    borderRadius: "11px",
    background: "rgba(0,0,0,0.2)",
    border: `1px solid ${CORES.borda}`,
  },

  conteudo: {
    paddingTop: "20px",
  },

  subtitulo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 0 15px",
    fontSize: "14px",
    fontWeight: 750,
  },

  grade: {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  },

  metrica: {
    minWidth: 0,
    padding: "16px",
    borderRadius: "13px",
    background: CORES.card,
    border: `1px solid ${CORES.borda}`,
  },

  rotulo: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: CORES.secundario,
    fontSize: "12px",
    fontWeight: 600,
  },

  valor: {
    marginTop: "12px",
    fontSize: "27px",
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: "-0.7px",
    overflowWrap: "anywhere" as const,
  },

  detalhe: {
    marginTop: "7px",
    color: "#718096",
    fontSize: "11px",
    lineHeight: 1.5,
  },
};

interface MetricaProps {
  titulo: string;
  valor: React.ReactNode;
  detalhe: string;
  icone: React.ReactNode;
  cor?: string;
}

function Metrica({
  titulo,
  valor,
  detalhe,
  icone,
  cor = CORES.texto,
}: MetricaProps) {
  return (
    <div style={estilos.metrica}>
      <div style={estilos.rotulo}>
        {icone}
        <span>{titulo}</span>
      </div>

      <div style={{ ...estilos.valor, color: cor }}>
        {valor}
      </div>

      <div style={estilos.detalhe}>{detalhe}</div>
    </div>
  );
}

export function CardCalculadorInteresses({
  periodoCalculo,
  aoMudarPeriodo,
  calculoAtual,
  carregando,
}: CardCalculadorInteressesProps) {
  const dados = calculoAtual;

  return (
    <section style={estilos.card}>
      {/* Cabeçalho */}
      <header style={estilos.cabecalho}>
        <div style={estilos.tituloGrupo}>
          <div style={estilos.icone}>
            <Sparkles size={21} />
          </div>

          <div>
            <h2 style={estilos.titulo}>
              Calculador de Interesses
            </h2>

            <p style={estilos.descricao}>
              Afinidade calculada com base nas interações.
            </p>
          </div>
        </div>

        {/* Seleção de período */}
        <div style={estilos.seletor}>
          {periodos.map((periodo) => {
            const selecionado =
              periodoCalculo === periodo.valor;

            return (
              <button
                key={periodo.valor}
                type="button"
                aria-pressed={selecionado}
                onClick={() => aoMudarPeriodo(periodo.valor)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: selecionado
                    ? "linear-gradient(135deg, #229ed9, #168ac0)"
                    : "transparent",
                  color: selecionado ? "#fff" : CORES.secundario,
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <CalendarDays size={13} />
                {periodo.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Métricas */}
      <div style={estilos.conteudo}>
        <div
          style={{
            ...estilos.subtitulo,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={17} color={CORES.azul} />
            <span>
              Métricas · {dados?.label || "10 dias"}
            </span>
          </div>

          <span
            style={{
              color: CORES.secundario,
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            Visualização 1 · Like 4 · Clique 6
          </span>
        </div>

        {carregando ? (
          <div
            role="status"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "40px 12px",
              color: CORES.secundario,
              fontSize: "13px",
            }}
          >
            <LoaderCircle
              size={27}
              color={CORES.azul}
              className="animate-spin"
            />
            Calculando métricas...
          </div>
        ) : (
          <div style={estilos.grade}>
            <Metrica
              titulo="Total de ações"
              valor={dados?.totalAcoes ?? 0}
              detalhe={`${dados?.totalVisualizacoes ?? 0} visualizações · ${dados?.totalLikes ?? 0} likes · ${dados?.totalCliques ?? 0} cliques`}
              icone={<MousePointerClick size={15} />}
            />

            <Metrica
              titulo="Pontos ponderados"
              valor={`${dados?.totalPontos ?? 0} pts`}
              detalhe="Pontuação acumulada de afinidade"
              icone={<Sparkles size={15} />}
              cor={CORES.azul}
            />

            <Metrica
              titulo="Taxa de cliques (CTR)"
              valor={`${dados?.taxaCTR ?? 0}%`}
              detalhe="Cliques em relação às visualizações"
              icone={<TrendingUp size={15} />}
              cor={CORES.verde}
            />

            <Metrica
              titulo="Classificação do perfil"
              valor={dados?.classificacao || "Visitante"}
              detalhe="Qualificação algorítmica"
              icone={<Target size={15} />}
              cor={CORES.amarelo}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default CardCalculadorInteresses;


