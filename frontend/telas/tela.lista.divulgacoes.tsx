import {
  Plus,
  Users,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CabecalhoListaPublicacoes from "../componentes/cabecalho.lista.publicacoes";
import ContainerPublicacao from "../componentes/container.l.publicacao";
import CardMetricasPublicacoes from "../componentes/card.metricas.publicacoes";
import CardTopoPublicacoes from "../componentes/card.topo.publicacoes";
import CardExclusaoPublicacoes from "../componentes/card.exclusao.publicacoes";
import {
  PublicacaoItem,
  buscarPublicacoes,
  deletarPublicacao,
  registrarCliqueLink,
  obterMinhasPubsCacheLocal,
} from "../servicos/api.publicacoes";
import { estaLogadoGoogle, checarStatusBanimento } from "../servicos/usuario";

function TelaPublicarGrupo() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [grupos, setGrupos] = useState<PublicacaoItem[]>(() => obterMinhasPubsCacheLocal());
  const [carregando, setCarregando] = useState(() => obterMinhasPubsCacheLocal().length === 0);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [publicacaoExclusao, setPublicacaoExclusao] = useState<PublicacaoItem | null>(null);
  const [excluindoPublicacao, setExcluindoPublicacao] = useState(false);

  async function carregar() {
    try {
      setCarregando((prev) => (obterMinhasPubsCacheLocal().length === 0 ? true : prev));
      const lista = await buscarPublicacoes(true);
      setGrupos(lista);
    } catch (err) {
      console.error("Erro ao carregar publicações:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModalExclusao(grupo: PublicacaoItem) {
    setPublicacaoExclusao(grupo);
  }

  async function confirmarExclusaoPublicacao() {
    if (!publicacaoExclusao) return;

    try {
      setExcluindoPublicacao(true);
      setDeletandoId(publicacaoExclusao.id);
      const ok = await deletarPublicacao(publicacaoExclusao.id);
      if (ok) {
        setGrupos((prev) => prev.filter((g) => g.id !== publicacaoExclusao.id));
      }
      setPublicacaoExclusao(null);
    } catch (err) {
      console.error("Erro ao deletar publicação:", err);
    } finally {
      setExcluindoPublicacao(false);
      setDeletandoId(null);
    }
  }

  function abrirLinkTelegram(grupo: PublicacaoItem) {
    registrarCliqueLink(grupo.id);
    const linkFinal = grupo.link.startsWith("http") ? grupo.link : `https://${grupo.link}`;
    window.open(linkFinal, "_blank", "noopener,noreferrer");
  }

  const gruposFiltrados = grupos.filter(
    (grupo) =>
      grupo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      grupo.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      grupo.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const gruposExibidos = gruposFiltrados;

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
      <CabecalhoListaPublicacoes />

      {/* CONTEÚDO */}
      <main
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        {/* CARD INFORMATIVO DE TOPO (PUBLICAÇÕES) */}
        <CardTopoPublicacoes />

        {/* CARD UNIFICADO DE MÉTRICAS (LARGURA TOTAL) */}
        <CardMetricasPublicacoes grupos={grupos} />

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

        {/* LISTAGEM DE PUBLICAÇÕES */}
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
            <span>Carregando suas publicações...</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {gruposExibidos.map((grupo) => (
              <ContainerPublicacao
                key={grupo.id}
                grupo={grupo}
                deletando={deletandoId === grupo.id}
                onAcessar={abrirLinkTelegram}
                onDeletar={() => abrirModalExclusao(grupo)}
              />
            ))}

            {gruposFiltrados.length === 0 && (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  color: "#778397",
                }}
              >
                <Users size={36} color="#38bdf8" style={{ marginBottom: "12px" }} />
                <h3 style={{ margin: "0 0 6px", color: "#e2e8f0", fontSize: "16px" }}>
                  {busca ? "Nenhuma publicação encontrada" : "Você ainda não possui publicações"}
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#94a3b8" }}>
                  {busca
                    ? "Tente buscar por outro termo ou limpe o campo de busca."
                    : "Crie sua primeira postagem gratuita no Telegram para divulgar seu canal."}
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
                      navigate("/anunciar-gratuito");
                    } else {
                      navigate("/b?destino=/anunciar-gratuito&aviso=necessario_login", { state: { destino: "/anunciar-gratuito" } });
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
                  Criar postagem gratuita agora
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CARD / MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE PUBLICAÇÃO */}
      <CardExclusaoPublicacoes
        aberto={Boolean(publicacaoExclusao)}
        publicacao={publicacaoExclusao}
        carregando={excluindoPublicacao}
        onConfirmar={confirmarExclusaoPublicacao}
        onCancelar={() => {
          if (!excluindoPublicacao) setPublicacaoExclusao(null);
        }}
      />
    </div>
  );
}

export default TelaPublicarGrupo;
