import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  RespostaHistoricoUsuario,
  CalculoInteressePeriodoItem,
  TagRankeadaInteresse,
  obterHistoricoUsuarioApi,
} from "../servicos/api.publicacoes";
import { obterOuCriarUsuario, InfoUsuario } from "../servicos/usuario";
import CabecalhoInteresses from "../componentes/cabecalho.interesses";
import CardCalculadorInteresses from "../componentes/card.interesses.calculador";
import CardDistribuicaoInteresses from "../componentes/card.interesses.distribuicao";
import CardTagsRankeadasInteresses from "../componentes/card.interesses.tags.rankeadas";

type PeriodoCalculador = "ontem" | "10d" | "30d";

export function TelaHistoricoInteresses() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<InfoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [historico, setHistorico] = useState<RespostaHistoricoUsuario | null>(null);
  const [periodoCalculo, setPeriodoCalculo] = useState<PeriodoCalculador>("10d");

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
      {/* CABEÇALHO LIMPO COM BOTÃO VOLTAR PARA O PAINEL */}
      <CabecalhoInteresses />

      {/* CONTEÚDO PRINCIPAL - CARDS ISOLADOS DE INTERESSES */}
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
      </main>
    </div>
  );
}

export default TelaHistoricoInteresses;
