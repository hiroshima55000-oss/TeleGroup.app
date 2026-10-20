import {
    ArrowLeft
} from "lucide-react";


import {
    useNavigate
} from "react-router-dom";


export interface CabecalhoListaCampanhasProps {
    titulo?: string;
    onVoltar?: () => void;
}


export function CabecalhoListaCampanhas({
    titulo = "Meus Anúncios",
    onVoltar,
}: CabecalhoListaCampanhasProps) {


    const navigate = useNavigate();


    function handleVoltar() {

        if (onVoltar) {
            onVoltar();
        } else {
            navigate("/dashboard");
        }

    }


    return (
        <header
            style={{
                width: "100%",
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "0 24px",
                background: "rgba(17, 21, 27, 0.92)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
                position: "sticky",
                top: 0,
                zIndex: 100,
                backdropFilter: "blur(14px)",
                boxSizing: "border-box",
            }}
        >

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                }}
            >

                <button
                    type="button"
                    onClick={handleVoltar}
                    style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "#e9eef5",
                        cursor: "pointer",
                    }}
                    aria-label="Voltar para o painel"
                >

                    <ArrowLeft
                        size={21}
                    />

                </button>


                <strong
                    style={{
                        color: "#e9eef5",
                        fontSize: "16px",
                        fontWeight: 700,
                    }}
                >
                    {titulo}
                </strong>

            </div>

        </header>
    );
}


export default CabecalhoListaCampanhas;