import {
  Search,
  Users,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PublicacaoItem } from "../servicos/api.publicacoes";
import { estaLogadoGoogle } from "../servicos/usuario";
import { GradeFeedPesquisa } from "./conteiner.feed.pesquisa";

export interface ContainerPesquisaProps {
  pesquisa: string;
  setPesquisa: (valor: string) => void;
  categoriaAtiva: string;
  setCategoriaAtiva: (categoria: string) => void;
  categoriasDisponiveis: string[];
  gruposFiltrados: PublicacaoItem[];
  carregando: boolean;
  carregandoMais?: boolean;
  temMais?: boolean;
  sentinelaRef?: React.Ref<HTMLDivElement>;
  onAcessar: (grupo: PublicacaoItem) => void;
  onCurtir?: (id: string) => void;
  onVoltar?: () => void;
  onTagClick?: (tag: string) => void;
}

export function ContainerPesquisa({
  pesquisa,
  setPesquisa,
  categoriaAtiva,
  setCategoriaAtiva,
  categoriasDisponiveis,
  gruposFiltrados,
  carregando,
  carregandoMais = false,
  temMais = false,
  sentinelaRef,
  onAcessar,
  onCurtir,
  onTagClick,
}: ContainerPesquisaProps) {
  const navigate = useNavigate();

  return (
    <main className="container-pesquisa-principal">
      {/* BARRA DE PESQUISA SEM CARD */}
      <section style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#182029",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            padding: "14px 16px",
            width: "100%",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease",
          }}
        >
          <Search
            size={20}
            color="#38bdf8"
            style={{ flexShrink: 0 }}
          />

          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por nome, categoria ou tema..."
            aria-label="Pesquisar comunidades"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#ffffff",
              fontSize: "14px",
            }}
          />

          {pesquisa && (
            <button
              type="button"
              onClick={() => setPesquisa("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "12px",
                cursor: "pointer",
                padding: "4px",
                flexShrink: 0,
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* FILTROS DE CATEGORIA */}
      {categoriasDisponiveis.length > 0 && (
        <section style={{ marginBottom: "26px" }}>
          <div
            className="no-scrollbar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {categoriasDisponiveis.map((cat) => {
              const ativo = categoriaAtiva === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setCategoriaAtiva(ativo ? "" : cat)
                  }
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: ativo
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: ativo
                      ? "rgba(56,189,248,0.15)"
                      : "rgba(255,255,255,0.03)",
                    color: ativo ? "#38bdf8" : "#94a3b8",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <section>
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
            <Loader2
              size={32}
              className="animate-spin"
              color="#38bdf8"
            />
            <span>Buscando publicações reais...</span>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              borderRadius: "16px",
              background: "#182029",
              border: "1px dashed rgba(255,255,255,0.10)",
              color: "#94a3b8",
            }}
          >
            <Users
              size={38}
              color="#38bdf8"
              style={{ marginBottom: "14px" }}
            />

            <h3
              style={{
                margin: "0 0 8px",
                color: "#f1f5f9",
                fontSize: "18px",
                fontWeight: 800,
              }}
            >
              {pesquisa || categoriaAtiva
                ? "Nenhuma comunidade encontrada com os filtros selecionados"
                : "Nenhuma comunidade com imagem publicada ainda"}
            </h3>

            <p
              style={{
                margin: "0 auto 24px",
                fontSize: "14px",
                color: "#94a3b8",
                maxWidth: "460px",
                lineHeight: 1.6,
              }}
            >
              {pesquisa || categoriaAtiva
                ? "Tente buscar por outro termo ou desmarque o filtro de categoria para ver as publicações disponíveis."
                : "Na tela de pesquisa, apenas publicações com imagem são exibidas no catálogo. Cadastre seu grupo com imagem para aparecer aqui!"}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (estaLogadoGoogle()) {
                    navigate("/anunciar-gratuito");
                  } else {
                    navigate(
                      "/b?destino=/anunciar-gratuito&aviso=necessario_login",
                      {
                        state: {
                          destino: "/anunciar-gratuito",
                        },
                      }
                    );
                  }
                }}
                style={{
                  padding: "12px 22px",
                  borderRadius: "11px",
                  background:
                    "linear-gradient(135deg, #229ED9, #168AC0)",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 750,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Publicar Gratuitamente Agora
              </button>

              <button
                type="button"
                onClick={() => {
                  if (estaLogadoGoogle()) {
                    navigate("/anunciar-pago");
                  } else {
                    navigate(
                      "/b?destino=/anunciar-pago&aviso=necessario_login",
                      {
                        state: {
                          destino: "/anunciar-pago",
                        },
                      }
                    );
                  }
                }}
                style={{
                  padding: "12px 20px",
                  borderRadius: "11px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Criar Campanha Paga
              </button>
            </div>
          </div>
        ) : (
          <>
            <GradeFeedPesquisa
              publicacoes={gruposFiltrados}
              onAcessar={onAcessar}
              onCurtir={onCurtir}
              onTagClick={onTagClick}
            />

            {/* SENTINELA DE ROLAGEM INFINITA */}
            {sentinelaRef && <div ref={sentinelaRef} style={{ width: "100%", height: "20px" }} />}

            {/* INDICADOR DE CARREGAMENTO DE MAIS RESULTADOS */}
            {carregandoMais && (
              <div
                style={{
                  padding: "24px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  color: "#38bdf8",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <Loader2 size={18} className="animate-spin" />
                <span>Carregando mais resultados...</span>
              </div>
            )}

            {/* AVISO DE FIM DOS RESULTADOS */}
            {!temMais && gruposFiltrados.length > 0 && (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                ✨ Todos os resultados disponíveis foram exibidos.
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default ContainerPesquisa;




