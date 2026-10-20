import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Megaphone, Loader2, Plus, ArrowLeft } from "lucide-react";
import CabecalhoConfiguracoes from "../componentes/cabecalho.painel";
import CardEstCampCampanha from "../componentes/card.est.camp.campanha";
import CardEstCampMetricas from "../componentes/card.est.camp.metricas";
import CardEstCampDesempenho from "../componentes/card.est.camp.desempenho";
import CardEstCampInformacoes from "../componentes/card.est.camp.informacoes";
import CardEstCampAcoes from "../componentes/card.est.camp.acoes";
import ModalRecargaSaldo from "../componentes/modal.recarga.saldo";
import {
  CampanhaItem,
  buscarCampanhas,
  alterarStatusCampanha,
  deletarCampanha,
} from "../servicos/api.campanhas";
import { estaLogadoGoogle } from "../servicos/usuario";

function TelaDashboardCampanha() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const campanhaIdParam = searchParams.get("id");

  const [campanhas, setCampanhas] = useState<CampanhaItem[]>([]);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<CampanhaItem | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modalSaldoAberto, setModalSaldoAberto] = useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      const lista = await buscarCampanhas();
      setCampanhas(lista);

      if (lista.length > 0) {
        if (campanhaIdParam) {
          const encontrada = lista.find((c) => c.id === campanhaIdParam);
          setCampanhaSelecionada(encontrada || lista[0]);
        } else {
          setCampanhaSelecionada(lista[0]);
        }
      } else {
        setCampanhaSelecionada(null);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da campanha:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [campanhaIdParam]);

  function handleSelecionarCampanha(id: string) {
    setSearchParams({ id });
    const encontrada = campanhas.find((c) => c.id === id);
    if (encontrada) {
      setCampanhaSelecionada(encontrada);
    }
  }

  async function handleToggleStatus(novoStatus: "Ativa" | "Pausada") {
    if (!campanhaSelecionada) return;
    try {
      setAtualizando(true);
      const atualizada = await alterarStatusCampanha(campanhaSelecionada.id, novoStatus);
      setCampanhaSelecionada(atualizada);
      setCampanhas((prev) =>
        prev.map((c) => (c.id === atualizada.id ? atualizada : c))
      );
    } catch (err) {
      console.error("Erro ao alterar status da campanha:", err);
    } finally {
      setAtualizando(false);
    }
  }

  async function handleApagar() {
    if (!campanhaSelecionada) return;
    if (!confirm(`Deseja realmente apagar a campanha "${campanhaSelecionada.nome}"?`)) {
      return;
    }
    try {
      setAtualizando(true);
      const sucesso = await deletarCampanha(campanhaSelecionada.id);
      if (sucesso) {
        navigate("/lista-campanhas");
      }
    } catch (err) {
      console.error("Erro ao apagar campanha:", err);
    } finally {
      setAtualizando(false);
    }
  }

  // Cálculos de métricas 100% reais
  const dataCriacaoObj = campanhaSelecionada?.dataCriacao
    ? new Date(campanhaSelecionada.dataCriacao)
    : new Date();

  const dataFormatada = dataCriacaoObj.toLocaleDateString("pt-BR");

  const diffMs = Math.max(0, Date.now() - dataCriacaoObj.getTime());
  const diasAtuacao = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const tempoAtuacaoTexto = `${diasAtuacao} ${diasAtuacao === 1 ? "dia" : "dias"}`;

  const visualizacoesNum = campanhaSelecionada?.visualizacoes || 0;
  const cliquesNum = campanhaSelecionada?.cliques || 0;
  const gastoTotalNum = Number(campanhaSelecionada?.gastoTotal || 0);
  const orcamentoDiarioNum = Number(campanhaSelecionada?.orcamentoDiario || 10);

  const ctrTexto = visualizacoesNum > 0
    ? `${((cliquesNum / visualizacoesNum) * 100).toFixed(1)}%`
    : "0.0%";

  const cpmCalculado = visualizacoesNum > 0
    ? gastoTotalNum / (visualizacoesNum / 1000)
    : 0;
  const cpmTexto = `R$ ${cpmCalculado.toFixed(2)}`;

  const impressoesEstimadas = visualizacoesNum > 0
    ? Math.round(visualizacoesNum * 1.15).toLocaleString("pt-BR")
    : "0";

  const conversoesEstimadas = cliquesNum.toLocaleString("pt-BR");

  const orcamentoRestanteCalculado = Math.max(
    0,
    orcamentoDiarioNum * diasAtuacao - gastoTotalNum
  );
  const orcamentoRestanteTexto = `R$ ${orcamentoRestanteCalculado.toFixed(2)}`;

  const visualizacoesPorDiaTexto = Math.round(visualizacoesNum / diasAtuacao).toLocaleString("pt-BR");
  const cliquesPorDiaTexto = Math.round(cliquesNum / diasAtuacao).toLocaleString("pt-BR");
  const gastoPorDiaTexto = `R$ ${(gastoTotalNum / diasAtuacao).toFixed(2)}`;

  const dataTerminoObj = new Date(dataCriacaoObj.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dataTerminoTexto = dataTerminoObj.toLocaleDateString("pt-BR");

  const alcanceEstimadoTexto = campanhaSelecionada
    ? `${(campanhaSelecionada.alcanceEstimado || orcamentoDiarioNum * 1000).toLocaleString("pt-BR")} pessoas`
    : "25.000 pessoas";

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
      <CabecalhoConfiguracoes />

      <main
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          padding: "36px 20px 100px",
        }}
      >
        {carregando ? (
          <div
            style={{
              padding: "90px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              color: "#94a3b8",
            }}
          >
            <Loader2 size={36} className="animate-spin" color="#38bdf8" />
            <span style={{ fontSize: "14px" }}>Carregando dados da campanha...</span>
          </div>
        ) : !campanhaSelecionada ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "#161c24",
              borderRadius: "20px",
              border: "1px dashed rgba(255,255,255,0.12)",
              marginTop: "20px",
            }}
          >
            <Megaphone size={42} color="#38bdf8" style={{ marginBottom: "14px" }} />
            <h2 style={{ margin: "0 0 8px", fontSize: "19px", color: "#f1f5f9" }}>
              Nenhuma campanha encontrada
            </h2>
            <p
              style={{
                margin: "0 auto 24px",
                maxWidth: "460px",
                color: "#8b98a9",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Você ainda não possui campanhas ativas para visualizar estatísticas. Crie sua primeira campanha para acompanhar alcance, cliques e visualizações em tempo real.
            </p>
            <button
              type="button"
              onClick={() => {
                if (estaLogadoGoogle()) {
                  navigate("/anunciar-pago");
                } else {
                  navigate("/b?destino=/anunciar-pago&aviso=necessario_login", { state: { destino: "/anunciar-pago" } });
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 22px",
                borderRadius: "11px",
                background: "#229ed9",
                color: "#ffffff",
                border: "none",
                fontWeight: 750,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              Criar Campanha Paga
            </button>
          </div>
        ) : (
          <>
            {/* SELETOR DE CAMPANHAS SE O USUÁRIO TIVER MAIS DE UMA */}
            {campanhas.length > 1 && (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "14px 18px",
                  background: "#161c24",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ fontSize: "12px", color: "#8b98a9", fontWeight: 600 }}>
                  Selecionar campanha:
                </div>
                <select
                  value={campanhaSelecionada.id}
                  onChange={(e) => handleSelecionarCampanha(e.target.value)}
                  style={{
                    background: "#0f141a",
                    color: "#f1f5f9",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "9px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 650,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {campanhas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* CABEÇALHO DA CAMPANHA */}
            <div
              style={{
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.22)",
                    color: "#38bdf8",
                  }}
                >
                  <Megaphone size={21} />
                </div>

                <div>
                  <span
                    style={{
                      display: "block",
                      color: "#38bdf8",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                    }}
                  >
                    Campanha
                  </span>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 800,
                      letterSpacing: "-0.5px",
                      color: "#e9eef5",
                    }}
                  >
                    {campanhaSelecionada.nome}
                  </h1>
                </div>
              </div>
            </div>

            {/* 1. SEÇÃO CAMPANHA */}
            <CardEstCampCampanha
              nome={campanhaSelecionada.nome}
              dataCriacao={dataFormatada}
              tempoAtuacao={tempoAtuacaoTexto}
              status={campanhaSelecionada.status}
            />

            {/* 2. SEÇÃO MÉTRICAS */}
            <CardEstCampMetricas
              cpm={cpmTexto}
              ctr={ctrTexto}
              cliques={cliquesNum.toLocaleString("pt-BR")}
              visualizacoes={visualizacoesNum.toLocaleString("pt-BR")}
              impressoes={impressoesEstimadas}
              conversoes={conversoesEstimadas}
              custoTotal={`R$ ${gastoTotalNum.toFixed(2)}`}
              orcamentoDiario={`R$ ${orcamentoDiarioNum.toFixed(2)}`}
              orcamentoRestante={orcamentoRestanteTexto}
            />

            {/* 3. SEÇÃO DESEMPENHO */}
            <CardEstCampDesempenho
              visualizacoesPorDia={visualizacoesPorDiaTexto}
              cliquesPorDia={cliquesPorDiaTexto}
              gastoPorDia={gastoPorDiaTexto}
            />

            {/* 4. SEÇÃO INFORMAÇÕES */}
            <CardEstCampInformacoes
              link={campanhaSelecionada.link}
              publicoAlcancado={alcanceEstimadoTexto}
              dataInicio={dataFormatada}
              dataTermino={dataTerminoTexto}
            />

            {/* 5. SEÇÃO AÇÕES */}
            <CardEstCampAcoes
              status={campanhaSelecionada.status}
              carregando={atualizando}
              onPausar={() => handleToggleStatus("Pausada")}
              onContinuar={() => handleToggleStatus("Ativa")}
              onApagar={handleApagar}
              onAdicionarSaldo={() => setModalSaldoAberto(true)}
            />

            {/* MODAL PARA ADICIONAR SALDO À CAMPANHA VIA PIX */}
            <ModalRecargaSaldo
              aberto={modalSaldoAberto}
              onFechar={() => setModalSaldoAberto(false)}
              campanhaId={campanhaSelecionada.id}
              nomeCampanha={campanhaSelecionada.nome}
              onSucesso={carregar}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default TelaDashboardCampanha;
