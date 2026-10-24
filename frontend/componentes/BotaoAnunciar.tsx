import {
    Plus,
    Megaphone
} from "lucide-react";

import {
    useNavigate
} from "react-router-dom";
import { checarStatusBanimento } from "../servicos/usuario";


function BotaoAnunciar() {

    const navigate = useNavigate();


    async function abrirAnunciar() {
        const banInfo = await checarStatusBanimento();
        if (banInfo.banido) {
            navigate(`/banido?usuario=${encodeURIComponent(banInfo.usuario || "")}&motivo=${encodeURIComponent(banInfo.motivo || "")}`);
            return;
        }
        navigate("/anunciar");
    }


    return (

        <button
            type="button"
            onClick={abrirAnunciar}
            style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background:
                    "linear-gradient(135deg, #229ED9 0%, #168AC0 55%, #1078A8 100%)",
                color: "#ffffff",
                padding: "13px 19px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                cursor: "pointer",
                fontWeight: 800,
                fontSize: "13px",
                letterSpacing: "0.1px",
                boxShadow:
                    "0 12px 30px rgba(34,158,217,0.28), 0 4px 10px rgba(0,0,0,0.20)",
                transition:
                    "transform 0.2s ease, box-shadow 0.2s ease"
            }}
            onMouseEnter={(event) => {

                event.currentTarget.style.transform =
                    "translateY(-2px)";

                event.currentTarget.style.boxShadow =
                    "0 16px 35px rgba(34,158,217,0.36), 0 6px 14px rgba(0,0,0,0.24)";

            }}
            onMouseLeave={(event) => {

                event.currentTarget.style.transform =
                    "translateY(0)";

                event.currentTarget.style.boxShadow =
                    "0 12px 30px rgba(34,158,217,0.28), 0 4px 10px rgba(0,0,0,0.20)";

            }}
        >

            <span
                style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        "rgba(255,255,255,0.16)",
                    border:
                        "1px solid rgba(255,255,255,0.14)"
                }}
            >

                <Megaphone
                    size={15}
                    strokeWidth={2.4}
                />

            </span>


            <span>
                Publicar
            </span>


            <Plus
                size={16}
                strokeWidth={2.6}
            />

        </button>

    );

}


export default BotaoAnunciar;