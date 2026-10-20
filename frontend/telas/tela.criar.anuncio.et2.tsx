import {
  DollarSign,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Edit3,
  ExternalLink,
  Megaphone,
  TrendingUp,
  Wallet,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CabecalhoCampanhaPaga from "../componentes/cabecalho.campanha.paga";
import BotaoPublicarCampanha from "../componentes/BotaoPublicarCampanha";
import CardOrcamentoDiario from "../componentes/card.criar.camp.orcamento.diario";
import CardAlcanceEstimado from "../componentes/card.criar.camp.alcance.estimado";
import { estaLogadoGoogle, checarStatusBanimento } from "../servicos/usuario";
import { consultarSaldoUsuario, InfoSaldoCampanha } from "../servicos/api.campanhas";
import { rolarParaCampo } from "../servicos/rolagem";

function TelaCriarCampanhaEtapa2() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [foto, setFoto] = useState("");
  const [orcamentoDiario, setOrcamentoDiario] = useState<number>(25);
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [infoSaldo, setInfoSaldo] = useState<InfoSaldoCampanha | null>(null);
  const [carregandoSaldo, setCarregandoSaldo] = useState<boolean>(false);

  const buscarSaldo = useCallback(async () => {
    try {
      setCarregandoSaldo(true);
      const res = await consultarSaldoUsuario(orcamentoDiario);
      setInfoSaldo(res);
    } catch (e) {
      console.warn("Falha ao carregar saldo de campanhas:", e);
    } finally {
      setCarregandoSaldo(false);
    }
  }, [orcamentoDiario]);

  useEffect(() => {
    buscarSaldo();
    const interval = setInterval(buscarSaldo, 5000);
    return () => clearInterval(interval);
  }, [buscarSaldo]);

  // Carrega os dados preenchidos na Etapa 1
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

  // Salva alterações de orçamento no sessionStorage
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

  // Se o usuário estiver banido ou não estiver logado com Google, redireciona
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
        navigate("/b?destino=/anunciar-pago-et2&aviso=necessario_login", { replace: true });
      }
    }
    checarPermissao();
  }, [navigate]);

  function validarAntesDePublicar(): boolean {
    setErro(null);

    if (!nome.trim() || !texto.trim() || !link.trim()) {
      setErro("Dados da Etapa 1 incompletos. Retorne à Etapa 1 para preencher os campos obrigatórios.");
      return false;
    }

    if (!orcamentoDiario || orcamentoDiario < 10 || orcamentoDiario > 100) {
      setErro("O orçamento diário deve estar entre R$ 10 e R$ 100.");
      rolarParaCampo("campo-orcamento-diario");
      return false;
    }

    return true;
  }

  function voltarParaEtapa1() {
    navigate("/anunciar-pago");
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
        titulo="Criar Campanha Paga · Etapa 2 de 2"
        onVoltar={voltarParaEtapa1}
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
            <DollarSign size={23} />
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
            Etapa 2: Orçamento & Ativação
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#8b98a9",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Defina o orçamento diário para a entrega do seu anúncio no Telegram.
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
          {/* SEÇÃO 1: RESUMO DO ANÚNCIO CRIADO */}
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
              Resumo do Anúncio Criado
            </h2>

            <div
              style={{
                background: "rgba(27,33,42,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  marginBottom: "14px",
                }}
              >
                <button
                  type="button"
                  onClick={voltarParaEtapa1}
                  style={{
                    background: "rgba(56,189,248,0.10)",
                    border: "1px solid rgba(56,189,248,0.25)",
                    borderRadius: "8px",
                    color: "#38bdf8",
                    padding: "6px 11px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Edit3 size={13} />
                  Editar anúncio (Etapa 1)
                </button>
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {foto ? (
                  <img
                    src={foto}
                    alt={nome}
                    style={{
                      width: "80px",
                      height: "50px",
                      borderRadius: "8px",
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.1)",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "50px",
                      borderRadius: "8px",
                      background: "rgba(34,158,217,0.12)",
                      border: "1px solid rgba(34,158,217,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#38bdf8",
                      flexShrink: 0,
                    }}
                  >
                    <Megaphone size={18} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "#ffffff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {nome || "Campanha sem nome"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#94a3b8",
                      flexWrap: "wrap",
                    }}
                  >
                    {dataInicio ? (
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: "rgba(56,189,248,0.12)",
                          color: "#7dd3fc",
                          fontWeight: 700,
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Calendar size={11} />
                        Início: {dataInicio.split("-").reverse().join("/")} {horaInicio ? `às ${horaInicio}` : ""}
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "5px",
                          background: "rgba(56,189,248,0.12)",
                          color: "#7dd3fc",
                          fontWeight: 700,
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Clock size={11} />
                        Início Imediato
                      </span>
                    )}

                    {link && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          color: "#38bdf8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "180px",
                        }}
                      >
                        <ExternalLink size={11} />
                        {link}
                      </span>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "5px",
                        flexWrap: "wrap",
                        marginTop: "7px",
                      }}
                    >
                      {tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: "11px",
                            color: "#7dd3fc",
                            background: "rgba(56,189,248,0.08)",
                            padding: "2px 6px",
                            borderRadius: "5px",
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                      {tags.length > 4 && (
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: ORÇAMENTO DIÁRIO */}
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
              <Wallet size={14} />
              Orçamento Diário
            </h2>
            <CardOrcamentoDiario
              orcamentoDiario={orcamentoDiario}
              setOrcamentoDiario={setOrcamentoDiario}
              semTituloInterno
            />
          </div>

          {/* SEÇÃO 3: ALCANCE ESTIMADO */}
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
              <TrendingUp size={14} />
              Alcance Estimado
            </h2>
            <CardAlcanceEstimado
              orcamentoDiario={orcamentoDiario}
              semTituloInterno
            />
          </div>

          {/* SEÇÃO 4: VERIFICAÇÃO DE SALDO DE CAMPANHA */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                margin: "0 0 10px 4px",
              }}
            >
              <h2
                style={{
                  margin: 0,
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
                <Wallet size={14} />
                Saldo de Campanhas na Conta
              </h2>

              <button
                type="button"
                onClick={buscarSaldo}
                disabled={carregandoSaldo}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 6px",
                  borderRadius: "6px",
                }}
              >
                <RefreshCw size={12} className={carregandoSaldo ? "animate-spin" : ""} />
                Atualizar saldo
              </button>
            </div>

            <div
              style={{
                background:
                  infoSaldo?.temSaldoSuficiente && (infoSaldo?.saldo || 0) >= orcamentoDiario
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(27, 33, 42, 0.92)",
                border:
                  infoSaldo?.temSaldoSuficiente && (infoSaldo?.saldo || 0) >= orcamentoDiario
                    ? "1px solid rgba(16, 185, 129, 0.35)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "16px",
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>
                    Saldo disponível para veiculação
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      color:
                        infoSaldo?.temSaldoSuficiente && (infoSaldo?.saldo || 0) >= orcamentoDiario
                          ? "#34d399"
                          : "#f8fafc",
                    }}
                  >
                    R$ {(infoSaldo?.saldo || 0).toFixed(2)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                    Orçamento desta campanha
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#38bdf8" }}>
                    R$ {orcamentoDiario.toFixed(2)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  lineHeight: 1.45,
                }}
              >
                {infoSaldo?.temSaldoSuficiente && (infoSaldo?.saldo || 0) >= orcamentoDiario ? (
                  <>
                    <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
                    <span style={{ color: "#a7f3d0" }}>
                      <strong>Saldo suficiente!</strong> Ao clicar no botão abaixo, sua campanha subirá imediatamente sem necessidade de pagamento via PIX.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <span style={{ color: "#94a3b8" }}>
                      Saldo insuficiente para ativação direta (faltam R${" "}
                      {Math.max(0, orcamentoDiario - (infoSaldo?.saldo || 0)).toFixed(2)}). Ao avançar, realize o pagamento via PIX para adicionar créditos e ativar a campanha.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO: PUBLICAR COM PIX OU VOLTAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <BotaoPublicarCampanha
              nomeCampanha={nome}
              texto={texto}
              orcamentoDiario={orcamentoDiario}
              link={link}
              categoria={categoria}
              dataInicio={dataInicio}
              horaInicio={horaInicio}
              imagem={foto}
              tags={tags}
              validarAntes={validarAntesDePublicar}
              onCampanhaCriada={() => {
                setNome("");
                setTexto("");
                setFoto("");
                setLink("");
                setTags([]);
                try {
                  sessionStorage.removeItem("telegroup_draft_campanha");
                } catch {}
              }}
            />

            <button
              type="button"
              onClick={voltarParaEtapa1}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.04)",
                color: "#cbd5e1",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s ease",
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar e editar conteúdo (Etapa 1)</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TelaCriarCampanhaEtapa2;
