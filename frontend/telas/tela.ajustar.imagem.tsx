import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  SlidersHorizontal,
  Image as ImageIcon,
  Sparkles,
  Download,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ComponenteAjusteImagem from "../componentes/componente.ajuste.imagem";

// Imagens de exemplo para testes instantâneos
const IMAGENS_EXEMPLO = [
  {
    nome: "Banner Tecnológico",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80",
  },
  {
    nome: "Comunidade Cripto / Finanças",
    url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
  },
  {
    nome: "Games & Entretenimento",
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
  },
];

export function TelaAjustarImagem() {
  const navigate = useNavigate();
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const [imagemSelecionada, setImagemSelecionada] = useState<string>(IMAGENS_EXEMPLO[0].url);
  const [imagemAjustada, setImagemAjustada] = useState<string | null>(null);
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagemSelecionada(reader.result);
        setImagemAjustada(null);
        setModalAjusteAberto(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSalvarAjuste(novaImagemUrl: string) {
    setImagemAjustada(novaImagemUrl);
    setModalAjusteAberto(false);
  }

  function baixarImagem() {
    const imgParaBaixar = imagemAjustada || imagemSelecionada;
    const link = document.createElement("a");
    link.href = imgParaBaixar;
    link.download = "imagem-ajustada-telegroup.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top left, #202a35 0%, #151a21 38%, #11151b 100%)",
        color: "#e7edf5",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* CABEÇALHO */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "64px",
          background: "rgba(17, 21, 27, 0.94)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
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
              onClick={() => navigate(-1)}
              title="Voltar"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <SlidersHorizontal size={17} color="#38bdf8" />
                Ajuste de Imagem para Feed e Pesquisa
              </h1>
            </div>
          </div>

          <Link
            to="/"
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.25)",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Ir ao Feed
          </Link>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "36px 20px 80px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(34,158,217,0.14)",
              border: "1px solid rgba(34,158,217,0.25)",
              color: "#38bdf8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Sparkles size={22} />
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 800,
              color: "#f1f5f9",
              letterSpacing: "-0.5px",
            }}
          >
            Ajustar e Simular Enquadramento da Imagem
          </h2>

          <p
            style={{
              margin: "8px auto 0",
              maxWidth: "600px",
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Veja e ajuste em tempo real exatamente como sua imagem ficará no{" "}
            <strong style={{ color: "#38bdf8" }}>Contêiner Feed</strong> e no{" "}
            <strong style={{ color: "#38bdf8" }}>Contêiner de Pesquisa</strong> (com a nova grade de 2 por linha no celular e sem texto).
          </p>
        </div>

        {/* CARD DE SELEÇÃO E CONTROLES */}
        <section
          style={{
            background: "rgba(27,34,43,0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "24px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#cbd5e1" }}>
              Escolha uma imagem para ajustar:
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "9px",
                  background: "rgba(56,189,248,0.14)",
                  border: "1px solid rgba(56,189,248,0.3)",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Upload size={14} />
                Carregar do Dispositivo
              </button>
            </div>
          </div>

          {/* MINIATURAS DE EXEMPLO */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {IMAGENS_EXEMPLO.map((item) => {
              const ativa = imagemSelecionada === item.url;
              return (
                <div
                  key={item.nome}
                  onClick={() => {
                    setImagemSelecionada(item.url);
                    setImagemAjustada(null);
                  }}
                  style={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: ativa
                      ? "2px solid #38bdf8"
                      : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    position: "relative",
                    background: "#151b22",
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.nome}
                    style={{
                      width: "100%",
                      height: "80px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      padding: "6px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: ativa ? "#38bdf8" : "#94a3b8",
                      background: "rgba(15,20,26,0.9)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.nome}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTÃO PRINCIPAL DE AJUSTE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(15, 20, 26, 0.75)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={imagemAjustada || imagemSelecionada}
                alt="Imagem atual"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {imagemAjustada ? (
                    <>
                      <CheckCircle2 size={15} color="#4ade80" />
                      Imagem ajustada com sucesso!
                    </>
                  ) : (
                    "Imagem pronta para ajuste"
                  )}
                </div>
                <div style={{ fontSize: "11px", color: "#8b98a9", marginTop: "2px" }}>
                  Clique no botão para abrir o componente e ajustar zoom, posição e rotação.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setModalAjusteAberto(true)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                }}
              >
                <SlidersHorizontal size={15} />
                Abrir Componente de Ajuste
              </button>

              {imagemAjustada && (
                <button
                  type="button"
                  onClick={baixarImagem}
                  title="Baixar imagem ajustada"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#e2e8f0",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Download size={14} />
                  Baixar Imagem
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ATALHOS PARA USAR NAS PUBLICAÇÕES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <Link
            to="/anunciar-pago"
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(22, 29, 38, 0.7)",
              border: "1px solid rgba(255,255,255,0.07)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#38bdf8" }}>
              Criar Campanha Paga →
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              O componente de ajuste está integrado no formulário de anúncio.
            </span>
          </Link>

          <Link
            to="/anunciar-gratuito"
            style={{
              padding: "16px",
              borderRadius: "14px",
              background: "rgba(22, 29, 38, 0.7)",
              border: "1px solid rgba(255,255,255,0.07)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#38bdf8" }}>
              Criar Postagem Gratuita →
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Ajuste suas fotos diretamente nas miniaturas selecionadas.
            </span>
          </Link>
        </div>
      </main>

      {/* COMPONENTE DE AJUSTE */}
      <ComponenteAjusteImagem
        isOpen={modalAjusteAberto}
        imagemOriginal={imagemSelecionada}
        onSalvar={handleSalvarAjuste}
        onFechar={() => setModalAjusteAberto(false)}
        tituloExemplo="Canal VIP Telegram Exemplo"
        tagsExemplo={["#telegram", "#grupos", "#destaque", "#canal"]}
        nichoExemplo="Tecnologia & Inovação"
      />
    </div>
  );
}

export default TelaAjustarImagem;
