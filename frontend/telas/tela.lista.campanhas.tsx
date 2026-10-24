import {
  Plus,
  Search,
  Megaphone,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CabecalhoListaCampanhas from "../componentes/cabecalho.lista.campanhas";
import ContainerCampanha from "../componentes/container.l.campanha";
import CardSaldoCampanha from "../componentes/card.saldo.campanha";
import CardMetricasCampanhas from "../componentes/card.metricas.campanhas";
import CardTopoCampanhas from "../componentes/card.topo.campanhas";
import ModalRecargaSaldo from "../componentes/modal.recarga.saldo";
import CardExclusaoCampanha from "../componentes/card.exclusao.campanha";
import {
  CampanhaItem,
  MetricasCampanhasGerais,
  buscarCampanhas,
  buscarMetricasCampanhas,
  alterarStatusCampanha,
  deletarCampanha,
  obterCampanhasCacheLocal,
  obterMetricasCampanhasCacheLocal,
} from "../servicos/api.campanhas";
import { estaLogadoGoogle, checarStatusBanimento } from "../servicos/usuario";

const LIMITE_POR_PAGINA = 4;

function TelaCampanhas() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [campanhas, setCampanhas] = useState<CampanhaItem[]>(() => obterCampanhasCacheLocal());
  const [metricas, setMetricas] = useState<MetricasCampanhasGerais | null>(() => obterMetricasCampanhasCacheLocal());
  const [carregando, setCarregando] = useState(() => {
    return obterCampanhasCacheLocal().length === 0 && !obterMetricasCampanhasCacheLocal();
  });
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);
  const [campanhaRecarga, setCampanhaRecarga] = useState<CampanhaItem | null>(null);
  const [campanhaExclusao, setCampanhaExclusao] = useState<CampanhaItem | null>(null);
  const [excluindoCampanha, setExcluindoCampanha] = useState(false);
  const [limiteExibicao, setLimiteExibicao] = useState(LIMITE_POR_PAGINA);
  const sentinelaRef = useRef<HTMLDivElement | null>(null);

  async function carregarDados() {
    try {
      setCarregando((prev) => {
        return obterCampanhasCacheLocal().length === 0 && !obterMetricasCampanhasCacheLocal();
      });
      const [lista, stats] = await Promise.all([
        buscarCampanhas(),
        buscarMetricasCampanhas(),
      ]);
      setCampanhas(lista);
      setMetricas(stats);
      setLimiteExibicao(LIMITE_POR_PAGINA);
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleToggleStatus(campanha: CampanhaItem) {
    const novoStatus = campanha.status === "Ativa" ? "Pausada" : "Ativa";
    try {
      setAtualizandoId(campanha.id);
      const atualizada = await alterarStatusCampanha(campanha.id, novoStatus);
      setCampanhas((prev) =>
        prev.map((c) => (c.id === campanha.id ? atualizada : c))
      );
      // Atualiza métricas
      const novasMetricas = await buscarMetricasCampanhas();
      setMetricas(novasMetricas);
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    } finally {
      setAtualizandoId(null);
    }
  }

  function abrirModalExclusao(campanha: CampanhaItem) {
    setCampanhaExclusao(campanha);
  }

  async function confirmarExclusaoCampanha() {
    if (!campanhaExclusao) return;

    try {
      setExcluindoCampanha(true);
      const ok = await deletarCampanha(campanhaExclusao.id);
      if (ok) {
        setCampanhas((prev) => prev.filter((c) => c.id !== campanhaExclusao.id));
        const novasMetricas = await buscarMetricasCampanhas();
        setMetricas(novasMetricas);
      }
      setCampanhaExclusao(null);
    } catch (err) {
      console.error("Erro ao excluir campanha:", err);
    } finally {
      setExcluindoCampanha(false);
    }
  }

  const campanhasFiltradas = campanhas.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.status.toLowerCase().includes(busca.toLowerCase()) ||
      c.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const temMais = limiteExibicao < campanhasFiltradas.length;

  const carregarMais = useCallback(() => {
    if (limiteExibicao >= campanhasFiltradas.length) return;
    setLimiteExibicao((prev) => Math.min(prev + LIMITE_POR_PAGINA, campanhasFiltradas.length));
  }, [limiteExibicao, campanhasFiltradas.length]);

  // Observer de rolagem infinita
  useEffect(() => {
    const sentinela = sentinelaRef.current;
    if (!sentinela || !temMais) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          carregarMais();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinela);
    return () => observer.disconnect();
  }, [carregarMais, temMais]);

  // Scroll listener de fallback
  useEffect(() => {
    function handleScroll() {
      if (!temMais) return;
      const scrollAtual = window.innerHeight + window.scrollY;
      const fimPagina = document.documentElement.scrollHeight - 250;
      if (scrollAtual >= fimPagina) {
        carregarMais();
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [carregarMais, temMais]);

  // Reseta para 4 ao filtrar
  useEffect(() => {
    setLimiteExibicao(LIMITE_POR_PAGINA);
  }, [busca]);

  const campanhasExibidas = campanhasFiltradas.slice(0, limiteExibicao);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#11151B",
        color: "#e9eef5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* CABEÇALHO ISOLADO */}
      <CabecalhoListaCampanhas />

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        {/* CARD INFORMATIVO DE TOPO (CAMPANHAS) */}
        <CardTopoCampanhas />

        {/* CARD SALDO DE CAMPANHA */}
        <CardSaldoCampanha
          campanhas={campanhas}
          metricas={metricas}
          onAtualizar={carregarDados}
        />

        {/* CARD UNIFICADO DE MÉTRICAS (LARGURA TOTAL) */}
        <CardMetricasCampanhas
          campanhas={campanhas}
          metricas={metricas}
        />

        {/* CAMPO DE BUSCA */}
        <div
          style={{
            padding: "5px",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              height: "48px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "0 15px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.035)",
            }}
          >
            <Search size={18} color="#657286" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome ou categoria..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                color: "#e9eef5",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* LISTAGEM DE CAMPANHAS */}
        {carregando ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#94a3b8",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Loader2 size={32} className="animate-spin" color="#38bdf8" />
            <span>Carregando campanhas do servidor...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {campanhasExibidas.map((campanha) => (
              <ContainerCampanha
                key={campanha.id}
                campanha={campanha}
                carregando={atualizandoId === campanha.id}
                onToggleStatus={handleToggleStatus}
                onDeletar={abrirModalExclusao}
                onAdicionarSaldo={(c) => setCampanhaRecarga(c)}
              />
            ))}

            {/* Sentinela de rolagem infinita */}
            <div ref={sentinelaRef} style={{ width: "100%", height: "20px" }} />

            {campanhasFiltradas.length === 0 && (
              <div
                style={{
                  padding: "55px 20px",
                  textAlign: "center",
                  borderRadius: "15px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px dashed rgba(255,255,255,0.09)",
                  color: "#778397",
                }}
              >
                <Megaphone size={34} color="#38bdf8" style={{ marginBottom: "12px" }} />
                <h3 style={{ margin: "0 0 6px", color: "#e2e8f0", fontSize: "16px" }}>
                  {busca ? "Nenhuma campanha encontrada" : "Nenhuma campanha criada ainda"}
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#94a3b8" }}>
                  {busca
                    ? "Tente buscar com outro termo."
                    : "Crie sua primeira campanha paga para impulsionar seu canal com destaque."}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const banInfo = await checarStatusBanimento();
                    if (banInfo.banido) {
                      navigate(`/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`);
                      return;
                    }
                    if (estaLogadoGoogle()) {
                      navigate("/anunciar-pago");
                    } else {
                      navigate("/b?destino=/anunciar-pago&aviso=necessario_login", { state: { destino: "/anunciar-pago" } });
                    }
                  }}
                  style={{
                    padding: "11px 20px",
                    borderRadius: "10px",
                    background: "#229ed9",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Criar campanha paga agora
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PARA RECARGA/ADIÇÃO DE SALDO VIA PIX REAL */}
      <ModalRecargaSaldo
        aberto={Boolean(campanhaRecarga)}
        onFechar={() => setCampanhaRecarga(null)}
        campanhaId={campanhaRecarga?.id}
        nomeCampanha={campanhaRecarga?.nome}
        onSucesso={carregarDados}
      />

      {/* CARD / MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CAMPANHA */}
      <CardExclusaoCampanha
        aberto={Boolean(campanhaExclusao)}
        campanha={campanhaExclusao}
        carregando={excluindoCampanha}
        onConfirmar={confirmarExclusaoCampanha}
        onCancelar={() => {
          if (!excluindoCampanha) setCampanhaExclusao(null);
        }}
      />
    </div>
  );
}

export default TelaCampanhas;
