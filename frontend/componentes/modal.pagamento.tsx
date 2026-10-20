import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  QrCode,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { CampanhaItem, criarCampanha } from "../servicos/api.campanhas";
import { obterUsuarioId, obterGoogleUsuario } from "../servicos/usuario";
import ModalSucessoCampanha from "./modal.sucesso.campanha";

export interface ModalPagamentoProps {
  aberto: boolean;
  onFechar: () => void;
  nomeCampanha: string;
  orcamentoDiario: number;
  link: string;
  texto?: string;
  categoria?: string;
  dataInicio?: string;
  horaInicio?: string;
  imagem?: string;
  tags?: string[];
  onCampanhaCriada?: (campanha: CampanhaItem) => void;
}

export function ModalPagamento({
  aberto,
  onFechar,
  nomeCampanha,
  orcamentoDiario,
  link,
  texto = "",
  categoria = "Geral",
  dataInicio,
  horaInicio,
  imagem = "",
  tags = [],
  onCampanhaCriada,
}: ModalPagamentoProps) {
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [processandoAtivacao, setProcessandoAtivacao] = useState(false);
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
  const [campanhaCriada, setCampanhaCriada] = useState<CampanhaItem | null>(null);
  const [statusResultado, setStatusResultado] = useState<"CONFIRMADO" | "NAO_CONFIRMADO" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [codigoPix, setCodigoPix] = useState("");
  const [transacaoId, setTransacaoId] = useState<string | null>(null);
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>("Pagamento confirmado");

  const transacaoIdRef = useRef<string | null>(null);
  transacaoIdRef.current = transacaoId;

  // Consulta o saldo atual da conta
  async function checarSaldo() {
    try {
      const { consultarSaldoUsuario } = await import("../servicos/api.campanhas");
      const info = await consultarSaldoUsuario(orcamentoDiario);
      if (info && typeof info.saldo === "number") {
        setSaldoAtual(info.saldo);
        if (info.temSaldoSuficiente && info.saldo >= orcamentoDiario) {
          return true;
        }
      }
    } catch {}
    return false;
  }

  // Ativa a campanha imediatamente utilizando saldo recarregado
  async function ativarComSaldo() {
    if (processandoAtivacao || pagamentoConcluido) return;
    setProcessandoAtivacao(true);
    setMensagemSucesso("Saldo de créditos detectado na sua conta!");
    setStatusResultado("CONFIRMADO");

    try {
      const novaCampanha = await criarCampanha({
        nome: nomeCampanha,
        texto,
        orcamentoDiario,
        link,
        categoria,
        dataInicio,
        horaInicio,
        imagem: imagem || undefined,
        tags,
        usarSaldo: true,
      });

      setCampanhaCriada(novaCampanha);
      setPagamentoConcluido(true);

      if (onCampanhaCriada) {
        onCampanhaCriada(novaCampanha);
      }
    } catch (err: any) {
      console.error("Erro ao ativar campanha com saldo:", err);
      setErro(err?.message || "Erro ao ativar campanha com saldo.");
      setStatusResultado("NAO_CONFIRMADO");
    } finally {
      setProcessandoAtivacao(false);
      setVerificando(false);
    }
  }

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setCodigoCopiado(false);
    setVerificando(false);
    setProcessandoAtivacao(false);
    setPagamentoConcluido(false);
    setCampanhaCriada(null);
    setStatusResultado(null);
    setErro(null);

    // Consulta inicial do saldo
    checarSaldo().then((temSaldo) => {
      if (temSaldo) {
        ativarComSaldo();
      }
    });

    const val = orcamentoDiario || 10;
    const usuarioId = obterUsuarioId();
    const googleUser = obterGoogleUsuario();

    fetch("/api/pagamento/pix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioId,
        "x-google-email": googleUser?.email || "",
        "x-google-nome": encodeURIComponent(googleUser?.nome || ""),
      },
      body: JSON.stringify({
        valor: val,
        descricao: `Campanha de Anúncio - R$ ${val.toFixed(2)}`,
        referenciaId: `camp_${Date.now()}`,
        nome: googleUser?.nome,
        email: googleUser?.email,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.sucesso === false) {
          setErro(d.erro || d.mensagem || "Não foi possível gerar a cobrança PIX.");
          return;
        }
        const codigoRecebido = d?.pix_code || d?.codigoPix;
        if (codigoRecebido) {
          setCodigoPix(codigoRecebido);
        }
        const idRecebido = d?.identifier || d?.transacaoId;
        if (idRecebido) {
          setTransacaoId(idRecebido);
        }
      })
      .catch((err) => {
        console.error("Erro ao solicitar PIX:", err);
        setErro("Não foi possível gerar a cobrança PIX. Verifique a conexão.");
      });
  }, [aberto, orcamentoDiario]);

  // Consulta 100% REAL do status da transação ou de recarga do painel
  async function verificarStatusPagamento() {
    if (verificando || processandoAtivacao || pagamentoConcluido) return;

    setVerificando(true);
    setErro(null);

    try {
      // 1. Verifica se houve recarga de saldo pelo painel administrativo
      const temSaldo = await checarSaldo();
      if (temSaldo) {
        await ativarComSaldo();
        return;
      }

      // 2. Verifica status do PIX
      const idAtual = transacaoIdRef.current || transacaoId;
      if (idAtual) {
        const resp = await fetch(`/api/pagamento/status/${idAtual}`);
        const dados = await resp.json();

        if (dados && dados.pago === true) {
          setStatusResultado("CONFIRMADO");
          setProcessandoAtivacao(true);
          setMensagemSucesso("Pagamento PIX confirmado!");

          const novaCampanha = await criarCampanha({
            nome: nomeCampanha,
            texto,
            orcamentoDiario,
            link,
            categoria,
            dataInicio,
            horaInicio,
            imagem: imagem || undefined,
            tags,
            codigoPix,
          });

          setCampanhaCriada(novaCampanha);
          setPagamentoConcluido(true);

          if (onCampanhaCriada) {
            onCampanhaCriada(novaCampanha);
          }
          return;
        }
      }

      setStatusResultado("NAO_CONFIRMADO");
    } catch (err: unknown) {
      console.error("Erro ao verificar status do pagamento:", err);
      setStatusResultado("NAO_CONFIRMADO");
    } finally {
      setVerificando(false);
      setProcessandoAtivacao(false);
    }
  }

  // Monitoramento passivo para caso o webhook confirme o PIX ou o Painel Administrativo recarregue o saldo
  useEffect(() => {
    if (!aberto || pagamentoConcluido || processandoAtivacao) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        // Checa se o painel administrativo recarregou o saldo da conta
        const temSaldo = await checarSaldo();
        if (temSaldo) {
          clearInterval(timer);
          await ativarComSaldo();
          return;
        }

        // Checa se o PIX foi confirmado pelo banco
        if (transacaoId) {
          const res = await fetch(`/api/pagamento/status/${transacaoId}`);
          if (res.ok) {
            const dados = await res.json();
            if (dados?.pago === true) {
              clearInterval(timer);
              verificarStatusPagamento();
            }
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(timer);
  }, [aberto, transacaoId, pagamentoConcluido, processandoAtivacao]);

  if (!aberto) {
    return null;
  }

  const valorFormatado = (orcamentoDiario || 10).toFixed(2);
  const urlQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    codigoPix || "PIX"
  )}`;

  async function copiarCodigoPix() {
    try {
      await navigator.clipboard.writeText(codigoPix);
      setCodigoCopiado(true);
      setTimeout(() => {
        setCodigoCopiado(false);
      }, 2500);
    } catch (e) {
      console.error("Falha ao copiar código PIX:", e);
    }
  }

  function handleFechar() {
    if (!processandoAtivacao && !verificando) {
      onFechar();
    }
  }

  return (
    <div
      onClick={handleFechar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(2, 6, 23, 0.82)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "22px",
          boxSizing: "border-box",
          borderRadius: "18px",
          background: "#111827",
          color: "#f8fafc",
          boxShadow: "0 25px 70px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {pagamentoConcluido && campanhaCriada ? (
          <ModalSucessoCampanha campanha={campanhaCriada} onFechar={onFechar} />
        ) : (
          <>
            {/* CABEÇALHO */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                }}
              >
                <QrCode size={19} color="#38bdf8" />
                <span style={{ fontSize: "16px", fontWeight: 800 }}>
                  Pagamento PIX
                </span>
              </div>

              <button
                type="button"
                onClick={handleFechar}
                disabled={processandoAtivacao || verificando}
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  color: "#64748b",
                  cursor: processandoAtivacao || verificando ? "not-allowed" : "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* VALOR */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "2px",
                }}
              >
                Valor da campanha
              </div>
              <div
                style={{
                  fontSize: "27px",
                  fontWeight: 900,
                  color: "#38bdf8",
                }}
              >
                R$ {valorFormatado}
              </div>

              {/* SALDO ATUAL DO USUÁRIO */}
              <div
                style={{
                  marginTop: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: saldoAtual > 0 ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "11px",
                  color: saldoAtual > 0 ? "#7dd3fc" : "#94a3b8",
                  fontWeight: 600,
                }}
              >
                <span>Saldo em conta: R$ {saldoAtual.toFixed(2)}</span>
                {saldoAtual < (orcamentoDiario || 10) && (
                  <span style={{ color: "#f59e0b" }}>
                    · Faltam R$ {Math.max(0, (orcamentoDiario || 10) - saldoAtual).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* AVISO DE ATIVAÇÃO EM TEMPO REAL */}
            <div
              style={{
                marginBottom: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.20)",
                fontSize: "11px",
                color: "#7dd3fc",
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              ⚡ <strong>Ativação Automática:</strong> Assim que a transferência via PIX for identificada, sua campanha será ativada instantaneamente!
            </div>

            {/* QR CODE */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  background: "#ffffff",
                  borderRadius: "13px",
                }}
              >
                <img
                  src={urlQrCode}
                  alt="QR Code PIX"
                  style={{
                    width: "175px",
                    height: "175px",
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* TEXTO */}
            <div
              style={{
                marginBottom: "12px",
                textAlign: "center",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              Escaneie o QR Code pelo app do seu banco ou copie o código Pix abaixo.
            </div>

            {/* COPIA E COLA */}
            <div
              style={{
                display: "flex",
                gap: "7px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 11px",
                  boxSizing: "border-box",
                  borderRadius: "9px",
                  background: "#0b1220",
                  color: "#64748b",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {codigoPix}
              </div>

              <button
                type="button"
                onClick={copiarCodigoPix}
                style={{
                  height: "40px",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  border: "none",
                  borderRadius: "9px",
                  background: codigoCopiado
                    ? "rgba(34,197,94,0.10)"
                    : "rgba(56,189,248,0.10)",
                  color: codigoCopiado ? "#4ade80" : "#38bdf8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {codigoCopiado ? (
                  <>
                    <Check size={14} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* EXIBIÇÃO DE RESULTADO REAL DO STATUS: APRESENTA SOMENTE UM DOS DOIS RESULTADOS */}
            {statusResultado === "NAO_CONFIRMADO" && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.10)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#fca5a5",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <AlertCircle
                  size={18}
                  color="#f87171"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#f87171",
                      marginBottom: "2px",
                      fontSize: "13px",
                    }}
                  >
                    Pagamento não confirmado
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "11px" }}>
                    A transferência ainda não foi confirmada pelo banco. Conclua o pagamento no aplicativo bancário e clique novamente em &quot;Verificar status&quot;.
                  </div>
                </div>
              </div>
            )}

            {statusResultado === "CONFIRMADO" && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.30)",
                  color: "#86efac",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <CheckCircle2
                  size={18}
                  color="#4ade80"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "#4ade80",
                      marginBottom: "2px",
                      fontSize: "13px",
                    }}
                  >
                    Pagamento confirmado
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "11px" }}>
                    Transação Pix identificada com sucesso! Ativando campanha...
                  </div>
                </div>
              </div>
            )}

            {erro && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "9px 11px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.08)",
                  color: "#fca5a5",
                  fontSize: "11px",
                }}
              >
                {erro}
              </div>
            )}

            {/* BOTÃO VERIFICAR STATUS */}
            <button
              type="button"
              disabled={verificando || processandoAtivacao}
              onClick={verificarStatusPagamento}
              style={{
                width: "100%",
                height: "46px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "none",
                borderRadius: "10px",
                background: verificando || processandoAtivacao ? "#1585b8" : "#229ed9",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 800,
                cursor: verificando || processandoAtivacao ? "not-allowed" : "pointer",
                transition: "background 0.2s ease",
              }}
            >
              {verificando || processandoAtivacao ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verificando status...
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Verificar status
                </>
              )}
            </button>

            {/* RODAPÉ */}
            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
                fontSize: "10px",
                color: "#475569",
              }}
            >
              Consulta em tempo real baseada na confirmação oficial da transação PIX.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ModalPagamento;
