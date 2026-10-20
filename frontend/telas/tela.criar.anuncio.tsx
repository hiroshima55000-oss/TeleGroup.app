import {
  Megaphone,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Tags,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CabecalhoCampanhaPaga from "../componentes/cabecalho.campanha.paga";
import CardInformacoesCampanha, {
  obterDataHojeLocal,
  obterHoraAtualLocal,
} from "../componentes/card.criar.camp.Inf.campanha";
import CardCriarCampConteudo from "../componentes/card.criar.camp.conteudo";
import CardCriarCampPrevia from "../componentes/card.criar.camp.previa";
import CardCriarCampTags from "../componentes/card.criar.camp.tags";
import { estaLogadoGoogle, checarStatusBanimento } from "../servicos/usuario";
import { rolarParaCampo } from "../servicos/rolagem";

function TelaCriarCampanha() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState("");
  const [orcamentoDiario, setOrcamentoDiario] = useState<number>(25);
  const [dataInicio, setDataInicio] = useState(obterDataHojeLocal());
  const [horaInicio, setHoraInicio] = useState(obterHoraAtualLocal());
  const [categoria, setCategoria] = useState("Geral");
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // Restaura dados do rascunho persistido
  useEffect(() => {
    try {
      const rascunhoRaw = sessionStorage.getItem("telegroup_draft_campanha");
      if (rascunhoRaw) {
        const dados = JSON.parse(rascunhoRaw);
        if (dados.nome) setNome(dados.nome);
        if (dados.texto) setTexto(dados.texto);
        if (dados.foto) setFoto(dados.foto);
        if (dados.orcamentoDiario && dados.orcamentoDiario >= 10)
          setOrcamentoDiario(dados.orcamentoDiario);
        if (dados.dataInicio) setDataInicio(dados.dataInicio);
        if (dados.horaInicio) setHoraInicio(dados.horaInicio);
        if (dados.categoria) setCategoria(dados.categoria);
        if (dados.link) setLink(dados.link);
        if (Array.isArray(dados.tags)) setTags(dados.tags);
      }
    } catch {}
  }, []);

  // Salva no sessionStorage sempre que os dados da campanha forem modificados
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "telegroup_draft_campanha",
        JSON.stringify({
          nome,
          texto,
          foto,
          orcamentoDiario,
          dataInicio,
          horaInicio,
          categoria,
          tags,
          link,
        })
      );
    } catch {}
  }, [nome, texto, foto, orcamentoDiario, dataInicio, horaInicio, categoria, tags, link]);

  // Bloqueio obrigatório: verifica banimento e login com o Google
  useEffect(() => {
    async function checarPermissao() {
      const banInfo = await checarStatusBanimento();
      if (banInfo.banido) {
        navigate(
          `/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`,
          { replace: true }
        );
        return;
      }

      if (!estaLogadoGoogle()) {
        navigate("/b?destino=/anunciar-pago&aviso=necessario_login", { replace: true });
      }
    }
    checarPermissao();
  }, [navigate]);

  function validarEtapa1(): boolean {
    setErro(null);

    if (!estaLogadoGoogle()) {
      setErro("Você precisa estar conectado com sua conta Google para criar uma campanha.");
      navigate("/b?destino=/anunciar-pago&aviso=necessario_login");
      return false;
    }

    if (!nome.trim()) {
      setErro("Por favor, digite o nome da sua campanha antes de continuar.");
      rolarParaCampo("campo-nome-campanha");
      return false;
    }

    if (!texto.trim()) {
      setErro("Por favor, digite o texto do anúncio para exibição no Feed.");
      rolarParaCampo("campo-texto-campanha");
      return false;
    }

    if (!link.trim()) {
      setErro("Informe o link de destino da campanha (ex: https://t.me/seugrupo).");
      rolarParaCampo("campo-link-campanha");
      return false;
    }

    const linkNormalizado = link.trim();
    if (
      !linkNormalizado.startsWith("http://") &&
      !linkNormalizado.startsWith("https://") &&
      !linkNormalizado.startsWith("t.me/")
    ) {
      setErro(
        "Link inválido. Insira uma URL completa (ex: https://t.me/seugrupo ou https://seusite.com)."
      );
      rolarParaCampo("campo-link-campanha");
      return false;
    }

    return true;
  }

  function handleAvancarParaEtapa2() {
    if (validarEtapa1()) {
      setErro(null);
      navigate("/anunciar-pago-et2");
    }
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
      <CabecalhoCampanhaPaga
        titulo="Criar Campanha Paga · Etapa 1 de 2"
        onVoltar={() => navigate("/anunciar")}
      />

      {/* CONTEÚDO */}
      <main
        style={{
          width: "100%",
          maxWidth: "640px",
          margin: "0 auto",
          padding: "36px 20px 100px",
          boxSizing: "border-box",
        }}
      >
        {/* TÍTULO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 14px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34,158,217,0.12)",
              border: "1px solid rgba(34,158,217,0.25)",
              color: "#38bdf8",
            }}
          >
            <Megaphone size={23} />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.6px",
              color: "#e9eef5",
            }}
          >
            Etapa 1: Conteúdo do Anúncio
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#8b98a9",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Defina o visual, data e hora de início, texto, tags e link do seu anúncio no Telegram.
          </p>
        </div>

        {/* ALERTA DE ERRO */}
        {erro && (
          <div
            style={{
              marginBottom: "18px",
              padding: "13px 16px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#fca5a5",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* SEÇÃO 1: INFORMAÇÕES DA CAMPANHA */}
          <div>
            <h2
              style={{
                margin: "0 0 10px 4px",
                fontSize: "12px",
                color: "#38bdf8",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Megaphone size={14} />
              Informações da Campanha
            </h2>
            <CardInformacoesCampanha
              nome={nome}
              setNome={setNome}
              dataInicio={dataInicio}
              setDataInicio={setDataInicio}
              horaInicio={horaInicio}
              setHoraInicio={setHoraInicio}
              semTituloInterno
            />
          </div>

          {/* SEÇÃO 2: CONTEÚDO DO ANÚNCIO */}
          <div>
            <h2
              style={{
                margin: "0 0 10px 4px",
                fontSize: "12px",
                color: "#38bdf8",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <FileText size={14} />
              Conteúdo do Anúncio
            </h2>
            <CardCriarCampConteudo
              texto={texto}
              setTexto={setTexto}
              foto={foto}
              setFoto={setFoto}
              link={link}
              setLink={setLink}
              semTituloInterno
            />
          </div>

          {/* SEÇÃO 3: TAGS E SEGMENTAÇÃO */}
          <div>
            <h2
              style={{
                margin: "0 0 10px 4px",
                fontSize: "12px",
                color: "#38bdf8",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Tags size={14} />
              Tags e Segmentação
            </h2>
            <CardCriarCampTags
              tags={tags}
              setTags={setTags}
              categoria={categoria}
              textoConteudo={texto}
              semTituloInterno
            />
          </div>

          {/* SEÇÃO 4: PRÉVIA DO ANÚNCIO */}
          <div>
            <h2
              style={{
                margin: "0 0 10px 4px",
                fontSize: "12px",
                color: "#38bdf8",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Sparkles size={14} color="#facc15" />
              Prévia do Anúncio
            </h2>
            <CardCriarCampPrevia
              foto={foto}
              texto={texto}
              link={link}
              tags={tags}
              onAjustarFoto={setFoto}
              semTituloInterno
            />
          </div>

          {/* BOTÃO PARA AVANÇAR PARA A ETAPA 2 */}
          <button
            type="button"
            onClick={handleAvancarParaEtapa2}
            style={{
              width: "100%",
              padding: "16px",
              marginTop: "4px",
              border: "none",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #229ed9 0%, #168ac0 100%)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              fontSize: "15px",
              fontWeight: 800,
              boxShadow: "0 10px 25px rgba(34,158,217,0.30)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>Avançar para Orçamento e Publicação (Etapa 2)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

export default TelaCriarCampanha;
