import {
  CheckCircle2,
  QrCode,
  X,
  Copy,
  Check,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { obterUsuarioId, obterGoogleUsuario } from "../servicos/usuario";
import { adicionarSaldoCampanha } from "../servicos/api.campanhas";

export interface ModalRecargaSaldoProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
  campanhaId?: string;
  nomeCampanha?: string;
}

export function ModalRecargaSaldo({
  aberto,
  onFechar,
  onSucesso,
  campanhaId,
  nomeCampanha,
}: ModalRecargaSaldoProps) {
  const [valorInput, setValorInput] = useState("");
  const [valorRecarga, setValorRecarga] = useState<number | null>(null);
  const [codigoPixRecarga, setCodigoPixRecarga] = useState("");
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [sucessoRecarga, setSucessoRecarga] = useState(false);
  const [transacaoId, setTransacaoId] = useState<string | null>(null);
  const [statusResultado, setStatusResultado] = useState<"CONFIRMADO" | "NAO_CONFIRMADO" | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const transacaoIdRef = useRef<string | null>(null);
  transacaoIdRef.current = transacaoId;

  function fecharModal() {
    if (verificando || confirmandoPagamento) return;
    onFechar();
    setValorInput("");
    setValorRecarga(null);
    setCodigoPixRecarga("");
    setTransacaoId(null);
    setCodigoCopiado(false);
    setSucessoRecarga(false);
    setConfirmandoPagamento(false);
    setStatusResultado(null);
    setErroValidacao(null);
  }

  async function gerarPix() {
    setErroValidacao(null);
    const valor = Number(valorInput.replace(",", "."));

    if (!valor || isNaN(valor) || valor < 10) {
      setErroValidacao("O valor mínimo para adicionar saldo é de R$ 10,00.");
      return;
    }

    const valorFormatado = valor.toFixed(2);
    setValorRecarga(valor);
    setCodigoCopiado(false);
    setStatusResultado(null);

    const usuarioId = obterUsuarioId();
    const googleUser = obterGoogleUsuario();
    const descricao = nomeCampanha
      ? `Saldo para Campanha: ${nomeCampanha.slice(0, 40)} - R$ ${valorFormatado}`
      : `Adição de Saldo TeleGroup - R$ ${valorFormatado}`;

    try {
      const resp = await fetch("/api/pagamento/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": usuarioId,
          "x-google-email": googleUser?.email || "",
          "x-google-nome": encodeURIComponent(googleUser?.nome || ""),
        },
        body: JSON.stringify({
          valor,
          descricao,
          referenciaId: `rec_${Date.now()}`,
          nome: googleUser?.nome,
          email: googleUser?.email,
        }),
      });

      const dados = await resp.json();
      if (!resp.ok || dados?.sucesso === false) {
        setErroValidacao(dados?.erro || dados?.mensagem || "Não foi possível gerar a cobrança PIX.");
        return;
      }

      const codigo = dados.pix_code || dados.codigoPix;
      if (codigo) {
        setCodigoPixRecarga(codigo);
        const idRecebido = dados.identifier || dados.transacaoId;
        if (idRecebido) {
          setTransacaoId(idRecebido);
        }
        return;
      }
    } catch (err: any) {
      console.error("Erro ao gerar PIX para saldo:", err);
      setErroValidacao(err?.message || "Erro de conexão ao gerar cobrança PIX.");
      return;
    }
  }

  // Consulta 100% REAL do status da transação
  async function verificarStatusPagamento() {
    if (verificando || confirmandoPagamento || sucessoRecarga) return;

    const idAtual = transacaoIdRef.current || transacaoId;
    if (!idAtual) {
      setStatusResultado("NAO_CONFIRMADO");
      return;
    }

    setVerificando(true);

    try {
      const resp = await fetch(`/api/pagamento/status/${idAtual}`);
      const dados = await resp.json();

      if (dados && dados.pago === true) {
        // Status 100% REAL: Pagamento confirmado
        setStatusResultado("CONFIRMADO");
        setConfirmandoPagamento(true);

        // Se uma campanha específica foi informada, credita o saldo diretamente nela
        if (campanhaId && valorRecarga) {
          try {
            await adicionarSaldoCampanha(campanhaId, valorRecarga);
          } catch (err) {
            console.error("Aviso ao creditar saldo na campanha:", err);
          }
        }

        setSucessoRecarga(true);
        onSucesso?.();
      } else {
        // Status 100% REAL: Pagamento não confirmado
        setStatusResultado("NAO_CONFIRMADO");
      }
    } catch (err) {
      console.error("Erro ao verificar status real do PIX:", err);
      setStatusResultado("NAO_CONFIRMADO");
    } finally {
      setVerificando(false);
      setConfirmandoPagamento(false);
    }
  }

  // Monitoramento passivo caso webhook do banco aprove a transação enquanto o modal estiver aberto
  useEffect(() => {
    if (!aberto || !transacaoId || sucessoRecarga || confirmandoPagamento) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagamento/status/${transacaoId}`);
        if (res.ok) {
          const dados = await res.json();
          if (dados?.pago === true) {
            clearInterval(timer);
            verificarStatusPagamento();
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(timer);
  }, [aberto, transacaoId, sucessoRecarga, confirmandoPagamento]);

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(codigoPixRecarga);
      setCodigoCopiado(true);
      setTimeout(() => {
        setCodigoCopiado(false);
      }, 2500);
    } catch (erro) {
      console.error("Falha ao copiar PIX:", erro);
    }
  }

  const urlQrCodeRecarga = codigoPixRecarga
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
        codigoPixRecarga
      )}`
    : "";

  if (!aberto) {
    return null;
  }

  return (
    <div
      onClick={fecharModal}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(2, 6, 23, 0.80)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "390px",
          padding: "22px",
          boxSizing: "border-box",
          borderRadius: "16px",
          background: "#111827",
          color: "#f8fafc",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.50)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {sucessoRecarga ? (
          <div
            style={{
              textAlign: "center",
              padding: "10px 0",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34, 197, 94, 0.25)",
              }}
            >
              <CheckCircle2 size={30} />
            </div>

            <h3
              style={{
                margin: "0 0 6px",
                fontSize: "19px",
                fontWeight: 800,
                color: "#f8fafc",
              }}
            >
              Saldo adicionado com sucesso
            </h3>

            <p
              style={{
                margin: "0 0 8px",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              R$ {valorRecarga?.toFixed(2)} foi creditado com confirmação real.
            </p>

            {nomeCampanha && (
              <div
                style={{
                  margin: "0 auto 18px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.20)",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 650,
                  display: "inline-block",
                }}
              >
                Campanha: {nomeCampanha}
              </div>
            )}

            <button
              type="button"
              onClick={fecharModal}
              style={{
                width: "100%",
                height: "44px",
                border: "none",
                borderRadius: "9px",
                background: "#229ed9",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 750,
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Concluir
            </button>
          </div>
        ) : (
          <>
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
                  gap: "8px",
                }}
              >
                <QrCode size={18} color="#38bdf8" />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  {nomeCampanha ? "Adicionar saldo à campanha" : "Adicionar saldo"}
                </span>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={verificando || confirmandoPagamento}
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#64748b",
                  cursor: verificando || confirmandoPagamento ? "not-allowed" : "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {nomeCampanha && (
              <div
                style={{
                  marginBottom: "14px",
                  padding: "8px 12px",
                  borderRadius: "9px",
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.18)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Megaphone size={14} color="#38bdf8" />
                <span style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: 650 }}>
                  Campanha: <span style={{ color: "#38bdf8" }}>{nomeCampanha}</span>
                </span>
              </div>
            )}

            {!codigoPixRecarga ? (
              <>
                <div style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      marginBottom: "6px",
                      color: "#94a3b8",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Valor da recarga (mínimo R$ 10,00)
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "48px",
                      padding: "0 12px",
                      borderRadius: "9px",
                      background: "#0b1220",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        marginRight: "6px",
                      }}
                    >
                      R$
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorInput}
                      onChange={(event) => setValorInput(event.target.value)}
                      placeholder="50,00"
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: "#f8fafc",
                        fontSize: "18px",
                        fontWeight: 800,
                      }}
                    />
                  </div>

                  {erroValidacao && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#f87171",
                        fontSize: "11px",
                      }}
                    >
                      {erroValidacao}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={gerarPix}
                  style={{
                    width: "100%",
                    height: "45px",
                    border: "none",
                    borderRadius: "9px",
                    background: "#229ed9",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Gerar PIX
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "2px",
                      color: "#64748b",
                      fontSize: "11px",
                    }}
                  >
                    Valor da recarga
                  </div>

                  <div
                    style={{
                      color: "#38bdf8",
                      fontSize: "26px",
                      fontWeight: 900,
                    }}
                  >
                    R$ {valorRecarga?.toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "10px",
                      background: "#ffffff",
                    }}
                  >
                    <img
                      src={urlQrCodeRecarga}
                      alt="QR Code PIX"
                      style={{
                        width: "160px",
                        height: "160px",
                        display: "block",
                      }}
                    />
                  </div>
                </div>

                <p
                  style={{
                    margin: "0 0 10px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "11px",
                  }}
                >
                  Escaneie o QR Code pelo aplicativo do seu banco.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
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
                      padding: "0 10px",
                      boxSizing: "border-box",
                      borderRadius: "8px",
                      background: "#0b1220",
                      color: "#64748b",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {codigoPixRecarga}
                  </div>

                  <button
                    type="button"
                    onClick={copiarPix}
                    style={{
                      height: "40px",
                      padding: "0 11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      border: "none",
                      borderRadius: "8px",
                      background: codigoCopiado
                        ? "rgba(34,197,94,0.10)"
                        : "rgba(56,189,248,0.10)",
                      color: codigoCopiado ? "#4ade80" : "#38bdf8",
                      fontSize: "10px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {codigoCopiado ? (
                      <>
                        <Check size={13} />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
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
                        A transferência ainda não foi confirmada pelo banco. Realize o pagamento pelo app bancário e clique novamente em &quot;Verificar status&quot;.
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
                        Transação Pix confirmada! Adicionando saldo à campanha...
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTÃO VERIFICAR STATUS */}
                <button
                  type="button"
                  disabled={verificando || confirmandoPagamento}
                  onClick={verificarStatusPagamento}
                  style={{
                    width: "100%",
                    height: "45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    border: "none",
                    borderRadius: "9px",
                    background: verificando || confirmandoPagamento ? "#1585b8" : "#229ed9",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: verificando || confirmandoPagamento ? "not-allowed" : "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  {verificando || confirmandoPagamento ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Verificando status...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Verificar status
                    </>
                  )}
                </button>

                <div
                  style={{
                    marginTop: "9px",
                    textAlign: "center",
                    color: "#475569",
                    fontSize: "10px",
                  }}
                >
                  Consulta em tempo real baseada na confirmação oficial da transação PIX.
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ModalRecargaSaldo;
