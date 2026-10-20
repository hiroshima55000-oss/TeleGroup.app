import {
    ArrowDownToLine,
    CheckCircle2,
    X,
    Loader2,
    ShieldCheck,
    AlertCircle
} from "lucide-react";


import {
    useState
} from "react";


export interface ModalSaqueSaldoProps {
    aberto: boolean;
    onFechar: () => void;
    saldoDisponivel: number;
    onSucesso?: () => void;
}


export function ModalSaqueSaldo({
    aberto,
    onFechar,
    saldoDisponivel,
    onSucesso
}: ModalSaqueSaldoProps) {

    const TAXA_SAQUE = 5;

    const [valorSaque, setValorSaque] = useState("");
    const [processandoSaque, setProcessandoSaque] = useState(false);
    const [sucessoSaque, setSucessoSaque] = useState(false);
    const [erroSaque, setErroSaque] = useState("");

    function handleFechar() {

        onFechar();

        setSucessoSaque(false);
        setValorSaque("");
        setErroSaque("");
        setProcessandoSaque(false);
    }


    async function handleConfirmarSaque() {

        setErroSaque("");

        const valor = Number(valorSaque);

        const totalDescontado = valor + TAXA_SAQUE;


        if (!valor || valor <= 0) {

            setErroSaque(
                "Informe um valor válido para o saque."
            );

            return;
        }


        if (totalDescontado > saldoDisponivel) {

            setErroSaque(
                `Saldo insuficiente. Você precisa de R$ ${totalDescontado.toFixed(2)} incluindo a taxa de R$ ${TAXA_SAQUE.toFixed(2)}.`
            );

            return;
        }


        setProcessandoSaque(true);


        await new Promise((resolve) =>
            setTimeout(resolve, 1200)
        );


        setProcessandoSaque(false);
        setSucessoSaque(true);

        onSucesso?.();
    }


    const valorNumerico = Number(valorSaque);

    const totalDescontado =
        valorNumerico > 0
            ? valorNumerico + TAXA_SAQUE
            : TAXA_SAQUE;

    if (!aberto) {
        return null;
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
                backdropFilter: "blur(8px)"
            }}
        >

            <div
                onClick={(event) => event.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "380px",
                    padding: "22px",
                    boxSizing: "border-box",
                    borderRadius: "16px",
                    background: "#111827",
                    color: "#f8fafc",
                    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.55)"
                }}
            >

                {sucessoSaque ? (

                    <div
                        style={{
                            textAlign: "center",
                            padding: "12px 4px"
                        }}
                    >

                        <div
                            style={{
                                width: "52px",
                                height: "52px",
                                margin: "0 auto 15px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                background: "rgba(34, 197, 94, 0.10)",
                                color: "#4ade80"
                            }}
                        >

                            <CheckCircle2
                                size={28}
                            />

                        </div>


                        <h3
                            style={{
                                margin: "0 0 6px",
                                fontSize: "18px",
                                fontWeight: 800
                            }}
                        >
                            Saque solicitado
                        </h3>


                        <p
                            style={{
                                margin: "0 0 8px",
                                color: "#94a3b8",
                                fontSize: "13px",
                                lineHeight: 1.5
                            }}
                        >
                            Seu saque de R$ {valorNumerico.toFixed(2)} foi solicitado.
                        </p>


                        <p
                            style={{
                                margin: "0 0 20px",
                                color: "#64748b",
                                fontSize: "11px"
                            }}
                        >
                            Taxa de saque: R$ {TAXA_SAQUE.toFixed(2)}
                        </p>


                        <button
                            type="button"
                            onClick={handleFechar}
                            style={{
                                width: "100%",
                                height: "44px",
                                border: "none",
                                borderRadius: "9px",
                                background: "#229ed9",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}
                        >
                            Concluir
                        </button>

                    </div>

                ) : (

                    <>

                        {/* CABEÇALHO */}

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "20px"
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >

                                <ArrowDownToLine
                                    size={18}
                                    color="#4ade80"
                                />

                                <span
                                    style={{
                                        fontSize: "15px",
                                        fontWeight: 800
                                    }}
                                >
                                    Sacar saldo
                                </span>

                            </div>


                            <button
                                type="button"
                                onClick={handleFechar}
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
                                    cursor: "pointer"
                                }}
                            >

                                <X
                                    size={16}
                                />

                            </button>

                        </div>


                        {/* SALDO */}

                        <div
                            style={{
                                marginBottom: "18px",
                                padding: "14px",
                                borderRadius: "10px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.06)"
                            }}
                        >

                            <div
                                style={{
                                    marginBottom: "5px",
                                    color: "#64748b",
                                    fontSize: "10px"
                                }}
                            >
                                Saldo disponível
                            </div>


                            <div
                                style={{
                                    color: "#4ade80",
                                    fontSize: "20px",
                                    fontWeight: 800
                                }}
                            >
                                R$ {saldoDisponivel.toFixed(2)}
                            </div>

                        </div>


                        {/* VALOR */}

                        <div
                            style={{
                                marginBottom: "14px"
                            }}
                        >

                            <div
                                style={{
                                    marginBottom: "7px",
                                    color: "#94a3b8",
                                    fontSize: "11px",
                                    fontWeight: 600
                                }}
                            >
                                Valor do saque
                            </div>


                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    height: "48px",
                                    padding: "0 13px",
                                    borderRadius: "9px",
                                    background: "#0b1220",
                                    border: erroSaque
                                        ? "1px solid rgba(239, 68, 68, 0.5)"
                                        : "1px solid rgba(255, 255, 255, 0.07)"
                                }}
                            >

                                <span
                                    style={{
                                        marginRight: "7px",
                                        color: "#64748b",
                                        fontSize: "14px"
                                    }}
                                >
                                    R$
                                </span>


                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorSaque}
                                    onChange={(event) => {

                                        setValorSaque(
                                            event.target.value
                                        );

                                        if (erroSaque) {
                                            setErroSaque("");
                                        }

                                    }}
                                    placeholder="0,00"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                        outline: "none",
                                        background: "transparent",
                                        color: "#f8fafc",
                                        fontSize: "16px",
                                        fontWeight: 700
                                    }}
                                />

                            </div>


                            {erroSaque && (

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        marginTop: "7px",
                                        color: "#ef4444",
                                        fontSize: "11px"
                                    }}
                                >

                                    <AlertCircle
                                        size={13}
                                    />

                                    <span>
                                        {erroSaque}
                                    </span>

                                </div>

                            )}

                        </div>


                        {/* RESUMO DO SAQUE */}

                        <div
                            style={{
                                marginBottom: "16px",
                                padding: "12px",
                                borderRadius: "9px",
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.06)"
                            }}
                        >

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px"
                                }}
                            >

                                <span
                                    style={{
                                        color: "#64748b",
                                        fontSize: "10px"
                                    }}
                                >
                                    Valor do saque
                                </span>

                                <span
                                    style={{
                                        color: "#f8fafc",
                                        fontSize: "11px",
                                        fontWeight: 700
                                    }}
                                >
                                    R$ {valorNumerico > 0
                                        ? valorNumerico.toFixed(2)
                                        : "0,00"}
                                </span>

                            </div>


                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px"
                                }}
                            >

                                <span
                                    style={{
                                        color: "#64748b",
                                        fontSize: "10px"
                                    }}
                                >
                                    Taxa de saque
                                </span>

                                <span
                                    style={{
                                        color: "#f87171",
                                        fontSize: "11px",
                                        fontWeight: 700
                                    }}
                                >
                                    R$ {TAXA_SAQUE.toFixed(2)}
                                </span>

                            </div>


                            <div
                                style={{
                                    height: "1px",
                                    margin: "8px 0",
                                    background: "rgba(255, 255, 255, 0.06)"
                                }}
                            />


                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}
                            >

                                <span
                                    style={{
                                        color: "#94a3b8",
                                        fontSize: "10px",
                                        fontWeight: 700
                                    }}
                                >
                                    Total descontado
                                </span>

                                <span
                                    style={{
                                        color: "#f8fafc",
                                        fontSize: "13px",
                                        fontWeight: 800
                                    }}
                                >
                                    R$ {totalDescontado.toFixed(2)}
                                </span>

                            </div>

                        </div>


                        {/* AVISO */}

                        <div
                            style={{
                                marginBottom: "16px",
                                padding: "11px",
                                borderRadius: "9px",
                                background: "rgba(56, 189, 248, 0.05)",
                                border: "1px solid rgba(56, 189, 248, 0.08)",
                                color: "#64748b",
                                fontSize: "10px",
                                lineHeight: 1.5
                            }}
                        >
                            Uma taxa fixa de R$ 5,00 será descontada junto com o valor do saque.
                        </div>


                        {/* BOTÃO */}

                        <button
                            type="button"
                            disabled={
                                processandoSaque ||
                                !valorSaque ||
                                Number(valorSaque) <= 0 ||
                                totalDescontado > saldoDisponivel
                            }
                            onClick={handleConfirmarSaque}
                            style={{
                                width: "100%",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "7px",
                                border: "none",
                                borderRadius: "9px",
                                background: processandoSaque
                                    ? "#1585b8"
                                    : "#10b981",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 800,
                                cursor:
                                    processandoSaque ||
                                    !valorSaque ||
                                    Number(valorSaque) <= 0 ||
                                    totalDescontado > saldoDisponivel
                                        ? "not-allowed"
                                        : "pointer",
                                opacity:
                                    !valorSaque ||
                                    Number(valorSaque) <= 0 ||
                                    totalDescontado > saldoDisponivel
                                        ? 0.5
                                        : 1
                            }}
                        >

                            {processandoSaque ? (

                                <>

                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />

                                    Processando saque...

                                </>

                            ) : (

                                <>

                                    <ShieldCheck
                                        size={15}
                                    />

                                    Confirmar saque

                                </>

                            )}

                        </button>


                        <div
                            style={{
                                marginTop: "8px",
                                textAlign: "center",
                                color: "#475569",
                                fontSize: "9px"
                            }}
                        >
                            O processamento será realizado com segurança.
                        </div>

                    </>

                )}

            </div>

        </div>
    );
}


export default ModalSaqueSaldo;