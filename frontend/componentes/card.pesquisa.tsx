import { Sparkles } from "lucide-react";

export interface CardPesquisaTelegramProps {}

export function CardPesquisaTelegram() {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "22px",
        padding: "clamp(26px, 5vw, 50px) clamp(18px, 4vw, 45px)",
        marginBottom: "28px",
        background:
          "radial-gradient(circle at 85% 15%, rgba(34,158,217,0.16), transparent 32%), linear-gradient(135deg, #1b242e 0%, #19212b 55%, #202b35 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: "#ffffff",
        boxShadow: "0 22px 55px rgba(0,0,0,0.18)",
      }}
    >
      {/* Efeito decorativo de fundo */}
      <div
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "rgba(34,158,217,0.06)",
          right: "-100px",
          bottom: "-130px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: "760px",
        }}
      >
        {/* Selo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 11px",
            borderRadius: "999px",
            background: "rgba(34,158,217,0.10)",
            border: "1px solid rgba(80,190,235,0.15)",
            color: "#5fc5ed",
            fontSize: "12px",
            fontWeight: 750,
            marginBottom: "18px",
          }}
        >
          <Sparkles size={14} />
          Comunidades em destaque
        </div>

        {/* Título */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(34px, 5vw, 54px)",
            lineHeight: 1.04,
            letterSpacing: "-2px",
            fontWeight: 850,
          }}
        >
          Encontre seu próximo
          <br />
          <span style={{ color: "#48b8e8" }}>
            grupo no Telegram
          </span>
        </h1>

        {/* Descrição */}
        <p
          style={{
            maxWidth: "650px",
            margin: "18px 0 0",
            color: "#aab5c2",
            fontSize: "15px",
            lineHeight: 1.7,
          }}
        >
          Explore comunidades, descubra novos grupos e encontre pessoas
          com os mesmos interesses que você.
        </p>
      </div>
    </section>
  );
}

export default CardPesquisaTelegram;