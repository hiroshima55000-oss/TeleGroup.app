import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Eye,
  Heart,
  MousePointerClick,
  Sparkles,
  Calendar,
  RotateCcw,
  Loader2,
  Send,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  PublicacaoItem,
  RespostaHistoricoUsuario,
  CalculoInteressePeriodoItem,
  obterHistoricoUsuarioApi,
  resetarVisualizadosApi,
  curtirPublicacao,
} from "../servicos/api.publicacoes";
import { obterOuCriarUsuario, InfoUsuario } from "../servicos/usuario";
import CardDenunciar from "../componentes/card.denunciar";

type AbaAtiva = "visualizados" | "curtidos" | "clicados";
type PeriodoCalculador = "ontem" | "10d" | "30d";

export function TelaHistoricoInteresses() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState<RespostaHistoricoUsuario | null>(
    null
  );

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("visualizados");
  const [periodoCalculo, setPeriodoCalculo] = useState<PeriodoCalculador>("10d");
  const [resetandoVistos, setResetandoVistos] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Estado do modal de denúncia
  const [modalDenunciarAberto, setModalDenunciarAberto] = useState(false);
  const [publicacaoParaDenunciar, setPublicacaoParaDenunciar] =
    useState<PublicacaoItem | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const user = obterOuCriarUsuario();
      setUsuario(user);

      const res = await obterHistoricoUsuarioApi(user.id);
      setHistorico(res);
    } catch (err) {
      console.error("Erro ao carregar histórico do usuário:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleResetarVistos() {
    if (!usuario?.id) return;
    const confirmou = window.confirm(
      "Deseja permitir que todas as publicações já visualizadas voltem a aparecer no seu feed orgânico?"
    );
    if (!confirmou) return;

    try {
      setResetandoVistos(true);
      const ok = await resetarVisualizadosApi(usuario.id);
      if (ok) {
        setMensagemSucesso(
          "Histórico de visualizações resetado! Você voltará a ver todos os conteúdos no feed."
        );
        setTimeout(() => setMensagemSucesso(null), 4000);
        await carregarDados();
      }
    } catch (err) {
      console.error("Erro ao resetar visualizações:", err);
    } finally {
      setResetandoVistos(false);
    }
  }

  async function handleCurtirItem(pub: PublicacaoItem) {
    const novoStatus = !pub.curtido;
    try {
      const res = await curtirPublicacao(pub.id, novoStatus);
      // Atualiza localmente nas listas do histórico
      setHistorico((prev) => {
        if (!prev) return prev;
        const atualizarLista = (lista: PublicacaoItem[]) =>
          lista.map((item) =>
            item.id === pub.id
              ? {
                  ...item,
                  curtido: res.curtido,
                  likes: res.totalLikes,
                }
              : item
          );

        return {
          ...prev,
          conteudos: {
            ...prev.conteudos,
            visualizados: atualizarLista(prev.conteudos.visualizados),
            curtidos: novoStatus
              ? [...prev.conteudos.curtidos, { ...pub, curtido: true, likes: res.totalLikes }]
              : prev.conteudos.curtidos.filter((item) => item.id !== pub.id),
            clicados: atualizarLista(prev.conteudos.clicados),
            totalCurtidos: novoStatus
              ? prev.conteudos.totalCurtidos + 1
              : Math.max(0, prev.conteudos.totalCurtidos - 1),
          },
        };
      });
    } catch (err) {
      console.error("Erro ao alternar curtida no histórico:", err);
    }
  }

  function handleEntrarGrupo(pub: PublicacaoItem) {
    if (pub.link) {
      const urlFinal = pub.link.startsWith("http") ? pub.link : `https://${pub.link}`;
      window.open(urlFinal, "_blank", "noopener,noreferrer");
    }
  }

  // Dados do período selecionado no calculador
  const calculoAtual: CalculoInteressePeriodoItem | undefined =
    periodoCalculo === "ontem"
      ? historico?.calculadorInteresses?.ontem
      : periodoCalculo === "10d"
      ? historico?.calculadorInteresses?.dezDias
      : historico?.calculadorInteresses?.trintaDias;

  const listaAtual =
    abaAtiva === "visualizados"
      ? historico?.conteudos?.visualizados || []
      : abaAtiva === "curtidos"
      ? historico?.conteudos?.curtidos || []
      : historico?.conteudos?.clicados || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* CABEÇALHO */}
      <header
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: "rgba(17, 21, 27, 0.94)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(14px)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              aria-label="Voltar para o feed"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                border: "1px solid rgba(255, 255, 255, 0.09)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.3px",
                }}
              >
                Histórico & Calculador de Interesses
              </h1>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Identificador: {usuario?.nickname || usuario?.id || "Visitante"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.22)",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Painel
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "24px 16px 100px",
          boxSizing: "border-box",
        }}
      >
        {/* AVISO DE SUCESSO (EX: RESET DE VISTOS) */}
        {mensagemSucesso && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#4ade80",
              fontSize: "13.5px",
              fontWeight: 600,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={18} />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* SEÇÃO 1: CALCULADOR DE INTERESSES (ONTEM, 10D, 30D)      */}
        {/* ======================================================== */}
        <section
          style={{
            background:
              "linear-gradient(135deg, #18212c 0%, #151a22 55%, #18222d 100%)",
            border: "1px solid rgba(56, 189, 248, 0.18)",
            borderRadius: "20px",
            padding: "24px 20px",
            marginBottom: "32px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* TOPO DO CALCULADOR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "19px",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Calculador Dinâmico de Interesses
                </h2>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12.5px",
                    color: "#94a3b8",
                  }}
                >
                  Algoritmo de afinidade baseado nas suas visualizações, curtidas e cliques.
                </p>
              </div>
            </div>

            {/* SELETOR DE PERÍODO: ONTEM, 10D, 30 DIAS */}
            <div
              style={{
                display: "inline-flex",
                background: "rgba(15, 20, 26, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "3px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => setPeriodoCalculo("ontem")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "9px",
                  border: "none",
                  background:
                    periodoCalculo === "ontem"
                      ? "linear-gradient(135deg, #229ED9, #168AC0)"
                      : "transparent",
                  color: periodoCalculo === "ontem" ? "#ffffff" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Calendar size={13} />
                Ontem
              </button>

              <button
                type="button"
                onClick={() => setPeriodoCalculo("10d")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "9px",
                  border: "none",
                  background:
                    periodoCalculo === "10d"
                      ? "linear-gradient(135deg, #229ED9, #168AC0)"
                      : "transparent",
                  color: periodoCalculo === "10d" ? "#ffffff" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Calendar size={13} />
                10 Dias
              </button>

              <button
                type="button"
                onClick={() => setPeriodoCalculo("30d")}
                style={{
                  padding: "7px 14px",
                  borderRadius: "9px",
                  border: "none",
                  background:
                    periodoCalculo === "30d"
                      ? "linear-gradient(135deg, #229ED9, #168AC0)"
                      : "transparent",
                  color: periodoCalculo === "30d" ? "#ffffff" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Calendar size={13} />
                30 Dias
              </button>
            </div>
          </div>

          {/* CARDS DE MÉTRICAS DO PERÍODO */}
          {carregando ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#94a3b8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Loader2 size={24} className="animate-spin" color="#38bdf8" />
              <span>Calculando afinidades de interesse...</span>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Total de Ações
                  </span>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#ffffff",
                      marginTop: "4px",
                    }}
                  >
                    {calculoAtual?.totalAcoes || 0}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    {calculoAtual?.totalVisualizacoes || 0} vistos • {calculoAtual?.totalLikes || 0} likes • {calculoAtual?.totalCliques || 0} cliques
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Pontos Ponderados
                  </span>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#38bdf8",
                      marginTop: "4px",
                    }}
                  >
                    {calculoAtual?.totalPontos || 0} pts
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Pesos: Vis=1 • Like=4 • Clique=6
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Taxa de Conversão (CTR)
                  </span>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#22c55e",
                      marginTop: "4px",
                    }}
                  >
                    {calculoAtual?.taxaCTR || 0}%
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Cliques / Visualizações
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "14px",
                    padding: "14px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Classificação do Perfil
                  </span>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#f59e0b",
                      marginTop: "6px",
                      lineHeight: "1.3",
                    }}
                  >
                    {calculoAtual?.classificacao || "Visitante"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Qualificação algorítmica
                  </div>
                </div>
              </div>

              {/* DISTRIBUIÇÃO PERCENTUAL DE INTERESSES */}
              <div
                style={{
                  background: "rgba(15, 20, 26, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "14px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 750,
                      color: "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <BarChart3 size={15} color="#38bdf8" />
                    Distribuição de Afinidade ({calculoAtual?.label})
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Soma normalizada a 100%
                  </span>
                </div>

                {calculoAtual?.distribuicaoGrupos &&
                calculoAtual.distribuicaoGrupos.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {calculoAtual.distribuicaoGrupos.map((item, idx) => (
                      <div key={item.grupoNome + idx}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12.5px",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 650, color: "#f1f5f9" }}>
                            {item.grupoNome}
                          </span>
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#38bdf8",
                            }}
                          >
                            {item.percentual}% ({item.pontos} pts)
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "7px",
                            borderRadius: "999px",
                            background: "rgba(255, 255, 255, 0.08)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(4, item.percentual))}%`,
                              height: "100%",
                              background:
                                idx === 0
                                  ? "linear-gradient(90deg, #38bdf8, #0ea5e9)"
                                  : idx === 1
                                  ? "linear-gradient(90deg, #a855f7, #8b5cf6)"
                                  : "linear-gradient(90deg, #10b981, #059669)",
                              borderRadius: "999px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Nenhuma interação detectada neste período. Interaja no feed curtindo,
                    visualizando e clicando para alimentar o calculador!
                  </div>
                )}

                {/* TOP TAGS */}
                {calculoAtual?.topTags && calculoAtual.topTags.length > 0 && (
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                      Tags mais frequentes:
                    </span>
                    {calculoAtual.topTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: "rgba(56, 189, 248, 0.08)",
                          border: "1px solid rgba(56, 189, 248, 0.18)",
                          color: "#38bdf8",
                          fontSize: "11.5px",
                          fontWeight: 700,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 2: CONTEÚDOS INTERAGIDOS (VISUALIZADOS, CURTIDOS, CLICADOS) */}
        {/* ======================================================== */}
        <section>
          {/* BARRA DE NAVEGAÇÃO DE ABAS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                background: "rgba(21, 26, 33, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "14px",
                padding: "4px",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={() => setAbaAtiva("visualizados")}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    abaAtiva === "visualizados"
                      ? "rgba(56, 189, 248, 0.15)"
                      : "transparent",
                  color: abaAtiva === "visualizados" ? "#38bdf8" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "all 0.15s ease",
                }}
              >
                <Eye size={16} />
                <span>Visualizados</span>
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.08)",
                    fontSize: "11px",
                  }}
                >
                  {historico?.conteudos?.totalVisualizados || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva("curtidos")}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    abaAtiva === "curtidos"
                      ? "rgba(244, 63, 94, 0.15)"
                      : "transparent",
                  color: abaAtiva === "curtidos" ? "#f43f5e" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "all 0.15s ease",
                }}
              >
                <Heart size={16} fill={abaAtiva === "curtidos" ? "#f43f5e" : "none"} />
                <span>Curtidos</span>
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.08)",
                    fontSize: "11px",
                  }}
                >
                  {historico?.conteudos?.totalCurtidos || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva("clicados")}
                style={{
                  padding: "9px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    abaAtiva === "clicados"
                      ? "rgba(34, 197, 94, 0.15)"
                      : "transparent",
                  color: abaAtiva === "clicados" ? "#4ade80" : "#94a3b8",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "all 0.15s ease",
                }}
              >
                <MousePointerClick size={16} />
                <span>Clicados</span>
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.08)",
                    fontSize: "11px",
                  }}
                >
                  {historico?.conteudos?.totalClicados || 0}
                </span>
              </button>
            </div>

            {/* BOTÃO PARA RESETAR VISUALIZADOS NO FEED */}
            {abaAtiva === "visualizados" && (
              <button
                type="button"
                onClick={handleResetarVistos}
                disabled={resetandoVistos}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  color: "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: resetandoVistos ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <RotateCcw size={14} className={resetandoVistos ? "animate-spin" : ""} />
                <span>Resetar vistos no feed</span>
              </button>
            )}
          </div>

          {/* NOTA INFORMATIVA SOBRE CONTEÚDOS VISTOS NO FEED */}
          {abaAtiva === "visualizados" && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(56, 189, 248, 0.06)",
                border: "1px solid rgba(56, 189, 248, 0.18)",
                fontSize: "12.5px",
                color: "#cbd5e1",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                <strong>Regra ativa do feed:</strong> Publicações já visualizadas 1 vez
                não se repetem no seu feed orgânico (somente anúncios pagos podem
                reaparecer). Você pode revê-las aqui ou clicar em &quot;Resetar vistos no feed&quot;.
              </span>
            </div>
          )}

          {/* LISTA DE CARDS DE CONTEÚDO */}
          {carregando ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#7f8c9d",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Loader2 size={28} className="animate-spin" color="#38bdf8" />
              <span>Carregando seus conteúdos...</span>
            </div>
          ) : listaAtual.length === 0 ? (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "rgba(21, 26, 33, 0.5)",
                borderRadius: "18px",
                border: "1px dashed rgba(255, 255, 255, 0.10)",
              }}
            >
              <Layers size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "17px",
                  fontWeight: 750,
                  color: "#ffffff",
                }}
              >
                Nenhum conteúdo {abaAtiva} ainda
              </h3>
              <p
                style={{
                  margin: "0 auto 18px",
                  fontSize: "13px",
                  color: "#94a3b8",
                  maxWidth: "420px",
                }}
              >
                Navegue pelas comunidades no feed e interaja para acompanhar seu histórico
                completo aqui.
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #229ED9, #168AC0)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Explorar Feed</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
              }}
            >
              {listaAtual.map((pub) => {
                const foto =
                  pub.imagens && pub.imagens.length > 0 ? pub.imagens[0] : undefined;
                return (
                  <article
                    key={pub.id}
                    style={{
                      background: "#151a21",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {/* FOTO SE HOUVER */}
                    {foto && (
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
                          alt={pub.nome}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    )}

                    {/* CORPO */}
                    <div
                      style={{
                        padding: "16px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 800,
                            color: "#ffffff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pub.nome}
                        </h4>

                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(56, 189, 248, 0.1)",
                            color: "#38bdf8",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "capitalize",
                          }}
                        >
                          {pub.categoria || "Geral"}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: "0 0 12px",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "#94a3b8",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 3,
                          overflow: "hidden",
                        }}
                      >
                        {pub.descricao}
                      </p>

                      {/* TAGS */}
                      {pub.tags && pub.tags.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "5px",
                            marginBottom: "14px",
                          }}
                        >
                          {pub.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: "2px 6px",
                                borderRadius: "5px",
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "#94a3b8",
                                fontSize: "11px",
                                fontWeight: 600,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* RODAPÉ DO CARD COM AÇÕES E MÉTRICAS */}
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {/* BOTÃO CURTIR / DESCURTIR SEGURO */}
                          <button
                            type="button"
                            onClick={() => handleCurtirItem(pub)}
                            title={pub.curtido ? "Descurtir" : "Curtir"}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              border: "none",
                              background: "transparent",
                              color: pub.curtido ? "#f43f5e" : "#94a3b8",
                              fontSize: "12.5px",
                              fontWeight: pub.curtido ? 750 : 500,
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <Heart
                              size={16}
                              fill={pub.curtido ? "#f43f5e" : "none"}
                              color={pub.curtido ? "#f43f5e" : "#94a3b8"}
                            />
                            <span>{pub.likes}</span>
                          </button>

                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            <Eye size={15} />
                            <span>{pub.visualizacoes}</span>
                          </div>

                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            <MousePointerClick size={15} />
                            <span>{pub.cliques}</span>
                          </div>
                        </div>

                        {/* BOTÃO ENTRAR */}
                        <button
                          type="button"
                          onClick={() => handleEntrarGrupo(pub)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid rgba(34, 158, 217, 0.25)",
                            background: "rgba(34, 158, 217, 0.12)",
                            color: "#55bee9",
                            fontSize: "12px",
                            fontWeight: 750,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Send size={13} />
                          <span>Entrar</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE DENÚNCIA */}
      <CardDenunciar
        aberto={modalDenunciarAberto}
        publicacao={publicacaoParaDenunciar}
        onFechar={() => {
          setModalDenunciarAberto(false);
          setPublicacaoParaDenunciar(null);
        }}
      />
    </div>
  );
}

export default TelaHistoricoInteresses;
