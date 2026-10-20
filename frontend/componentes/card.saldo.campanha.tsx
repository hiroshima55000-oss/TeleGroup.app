import { Wallet, Plus, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import {
  CampanhaItem,
  MetricasCampanhasGerais,
  consultarSaldoUsuario,
} from "../servicos/api.campanhas";

import ModalRecargaSaldo from "./modal.recarga.saldo";

export interface CardSaldoCampanhaProps {
  campanhas: CampanhaItem[];
  metricas?: MetricasCampanhasGerais | null;
  onAtualizar?: () => void;
}

export function CardSaldoCampanha({
  campanhas,
  metricas,
  onAtualizar,
}: CardSaldoCampanhaProps) {
  const [modalRecargaAberto, setModalRecargaAberto] = useState(false);
  const [saldoDisponivel, setSaldoDisponivel] = useState<number>(0);
  const [atualizando, setAtualizando] = useState(false);

  const carregarSaldo = useCallback(async () => {
    try {
      setAtualizando(true);
      const res = await consultarSaldoUsuario();
      if (res && typeof res.saldo === "number") {
        setSaldoDisponivel(res.saldo);
      }
    } catch {
    } finally {
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarSaldo();
  }, [carregarSaldo]);

  const totalInvestido = metricas
    ? metricas.gastoTotal
    : campanhas.reduce(
        (total, campanha) =>
          total + (Number(campanha.gastoTotal) || 0),
        0
      );

  return (
    <>
      {/* CARD DE SALDO */}
      <section
        style={{
          marginBottom: "24px",
          padding: "22px",
          borderRadius: "16px",
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.07)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* SALDO DISPONÍVEL */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <Wallet size={15} color="#38bdf8" />
              <span>Saldo disponível de campanhas</span>
              <button
                type="button"
                onClick={carregarSaldo}
                disabled={atualizando}
                title="Atualizar saldo"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                }}
              >
                <RefreshCw size={12} className={atualizando ? "animate-spin" : ""} />
              </button>
            </div>

            <div
              style={{
                fontSize: "32px",
                lineHeight: 1,
                fontWeight: 800,
                color: "#34d399",
                letterSpacing: "-0.8px",
              }}
            >
              R$ {saldoDisponivel.toFixed(2)}
            </div>

            <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
              Total investido em campanhas: R$ {totalInvestido.toFixed(2)}
            </div>
          </div>

          {/* ADICIONAR SALDO */}
          <button
            type="button"
            onClick={() => setModalRecargaAberto(true)}
            style={{
              height: "40px",
              padding: "0 15px",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              borderRadius: "9px",
              border: "1px solid rgba(56,189,248,0.20)",
              background: "rgba(56,189,248,0.08)",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={15} />
            Adicionar saldo
          </button>
        </div>
      </section>

      {/* MODAL RECARGA / PIX */}
      <ModalRecargaSaldo
        aberto={modalRecargaAberto}
        onFechar={() => setModalRecargaAberto(false)}
        campanhaId={
          campanhas.length > 0
            ? campanhas[0].id
            : undefined
        }
        nomeCampanha={
          campanhas.length > 0
            ? campanhas[0].nome
            : undefined
        }
        onSucesso={onAtualizar}
      />
    </>
  );
}

export default CardSaldoCampanha;