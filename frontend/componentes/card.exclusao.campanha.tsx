import type { CampanhaItem } from "../servicos/api.campanhas";

export interface CardExclusaoCampanhaProps {
  aberto: boolean;
  campanha: CampanhaItem | null;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function CardExclusaoCampanha({
  aberto,
  campanha,
  carregando = false,
  onConfirmar,
  onCancelar,
}: CardExclusaoCampanhaProps) {
  if (!aberto || !campanha) return null;

  return (
    <div
      onClick={!carregando ? onCancelar : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(2, 6, 23, 0.82)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "340px",
          padding: "22px",
          boxSizing: "border-box",
          borderRadius: "16px",
          background: "rgba(27,33,42,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3
          style={{
            margin: "0 0 22px",
            color: "#f1f5f9",
            fontSize: "16px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Deseja excluir?
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            style={{
              height: "40px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: 700,
              cursor: carregando ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            style={{
              height: "40px",
              borderRadius: "10px",
              border: "none",
              background: "#dc2626",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: carregando ? "not-allowed" : "pointer",
              opacity: carregando ? 0.7 : 1,
            }}
          >
            {carregando ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardExclusaoCampanha;