import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import {
  PublicacaoItem,
  RespostaHistoricoUsuario,
  CalculoInteressePeriodoItem,
  TagRankeadaInteresse,
  obterHistoricoUsuarioApi,
  curtirPublicacao,
} from "../servicos/api.publicacoes";
import { obterOuCriarUsuario, InfoUsuario } from "../servicos/usuario";
import CardDenunciar from "../componentes/card.denunciar";
import CardCalculadorInteresses from "../componentes/card.interesses.calculador";
import CardDistribuicaoInteresses from "../componentes/card.interesses.distribuicao";
import CardTagsRankeadasInteresses from "../componentes/card.interesses.tags.rankeadas";
import CardConteudosInteresses from "../componentes/card.interesses.conteudos";

type AbaAtiva = "visualizados" | "curtidos" | "clicados";
type PeriodoCalculador = "ontem" | "10d" | "30d";

export function TelaHistoricoInteresses() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState<RespostaHistoricoUsuario | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("visualizados");
  const [periodoCalculo, setPeriodoCalculo] = useState<PeriodoCalculador>("10d");

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

  function handleClicarTag(tag: string) {
    navigate(`/?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`);
  }

  // Dados do período selecionado no calculador
  const calculoAtual: CalculoInteressePeriodoItem | undefined =
    periodoCalculo === "ontem"
      ? historico?.calculadorInteresses?.ontem
      : periodoCalculo === "10d"
      ? historico?.calculadorInteresses?.dezDias
      : historico?.calculadorInteresses?.trintaDias;

  // Tags rankeadas com base no período selecionado ou acumulado geral
  const tagsRankeadasExibidas: TagRankeadaInteresse[] =
    calculoAtual?.tagsRankeadas && calculoAtual.tagsRankeadas.length > 0
      ? calculoAtual.tagsRankeadas
      : historico?.tagsRankeadasGerais && historico.tagsRankeadasGerais.length > 0
      ? historico.tagsRankeadasGerais
      : (calculoAtual?.topTags || []).map((t, idx) => ({
          posicao: idx + 1,
          tag: t,
          slug: t,
          pontos: Math.max(1, ((calculoAtual?.topTags.length || 1) - idx) * 4),
          percentual: Number(
            (
              (((calculoAtual?.topTags.length || 1) - idx) /
                Math.max(
                  1,
                  ((calculoAtual?.topTags.length || 1) *
                    ((calculoAtual?.topTags.length || 1) + 1)) /
                    2
                )) *
              100
            ).toFixed(1)
          ),
          totalAcoes: Math.max(1, 4 - idx),
          visualizacoes: 1,
          likes: idx === 0 ? 1 : 0,
          cliques: idx <= 1 ? 1 : 0,
          nivelAfinidade: idx < 2 ? "Alta" : idx < 4 ? "Média" : "Em Alta",
        }));

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
              padding: "7px 14px",
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

      {/* CONTEÚDO PRINCIPAL - CARDS MODULARES E ISOLADOS */}
      <main
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "24px 16px 100px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* CARD 1: CALCULADOR DINÂMICO DE INTERESSES + MÉTRICAS DO PERÍODO NO MESMO COMPONENTE */}
        <CardCalculadorInteresses
          periodoCalculo={periodoCalculo}
          aoMudarPeriodo={setPeriodoCalculo}
          calculoAtual={calculoAtual}
          carregando={carregando}
        />

        {/* CARD 2: DISTRIBUIÇÃO DE AFINIDADE POR CATEGORIA/GRUPOS */}
        <CardDistribuicaoInteresses
          calculoAtual={calculoAtual}
          carregando={carregando}
        />

        {/* CARD 3: TAGS RANKEADAS PELO INTERESSE DO USUÁRIO */}
        <CardTagsRankeadasInteresses
          tags={tagsRankeadasExibidas}
          carregando={carregando}
          aoClicarTag={handleClicarTag}
        />

        {/* CARD 4: CONTEÚDOS COM QUE VOCÊ INTERAGIU */}
        <CardConteudosInteresses
          abaAtiva={abaAtiva}
          aoMudarAba={setAbaAtiva}
          listaAtual={listaAtual}
          totalVisualizados={historico?.conteudos?.totalVisualizados || 0}
          totalCurtidos={historico?.conteudos?.totalCurtidos || 0}
          totalClicados={historico?.conteudos?.totalClicados || 0}
          carregando={carregando}
          aoCurtir={handleCurtirItem}
          aoEntrar={handleEntrarGrupo}
          aoClicarTag={handleClicarTag}
          aoExplorarFeed={() => navigate("/")}
        />
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
