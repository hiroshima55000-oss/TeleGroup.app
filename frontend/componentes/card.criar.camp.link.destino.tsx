import { Link as LinkIcon } from "lucide-react";

export interface CardLinkDestinoProps {
  link: string;
  setLink: (link: string) => void;
  placeholder?: string;
}

export function CardLinkDestino({
  link,
  setLink,
  placeholder = "https://t.me/seugrupo ou https://seusite.com",
}: CardLinkDestinoProps) {
  return (
    <section
      style={{
        padding: "22px",
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(27,33,42,0.92)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <LinkIcon size={19} color="#38bdf8" />
        <span
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#f1f5f9",
          }}
        >
          Link de Destino
        </span>
      </div>

      <input
        type="url"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "14px",
          borderRadius: "11px",
          border: "1px solid rgba(255,255,255,0.09)",
          outline: "none",
          background: "#151a21",
          color: "#e7edf5",
          fontSize: "14px",
        }}
      />
    </section>
  );
}

export default CardLinkDestino;
