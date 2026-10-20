import { Send, Loader2, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";
import { CampanhaItem, consultarSaldoUsuario, criarCampanha } from "../servicos/api.campanhas";
import ModalPagamento from "./modal.pagamento";
import ModalSucessoCampanha from "./modal.sucesso.campanha";

export interface BotaoPublicarCampanhaProps {
  nomeCampanha: string;
  texto?: string;
  orcamentoDiario: number;
  link: string;
  categoria?: string;
  dataInicio?: string;
  horaInicio?: string;
  imagem?: string;
  tags?: string[];
  validarAntes?: () => boolean;
  onCampanhaCriada?: (campanha: CampanhaItem) => void;
}

export function BotaoPublicarCampanha({
  nomeCampanha,
  texto = "",
  orcamentoDiario,
  link,
  categoria = "Geral",
  dataInicio,
  horaInicio,
  imagem = "",
  tags = [],
  validarAntes,
  onCampanhaCriada,
}: BotaoPublicarCampanhaProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [verificandoSaldo, setVerificandoSaldo] = useState(false);
  const [campanhaSucesso, setCampanhaSucesso] = useState<CampanhaItem | null>(null);
  const [erroPublicacao, setErroPublicacao] = useState<string | null>(null);

  async function handleClicarPublicar() {
    if (validarAntes && !validarAntes()) {
      return;
    }

    setVerificandoSaldo(true);
    setErroPublicacao(null);

    try {
      // 1. Verifica o saldo de campanha do usuário
      const infoSaldo = await consultarSaldoUsuario(orcamentoDiario);

      // 2. Se tiver saldo suficiente, a campanha SOBE IMEDIATAMENTE!
      if (infoSaldo.temSaldoSuficiente && infoSaldo.saldo >= orcamentoDiario) {
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

        setCampanhaSucesso(novaCampanha);
        if (onCampanhaCriada) {
          onCampanhaCriada(novaCampanha);
        }
      } else {
        // 3. Se NÃO tiver saldo suficiente, abre o modal de pagamento com as informações necessárias
        setModalAberto(true);
      }
    } catch (err: any) {
      console.warn("Falha na checagem prévia de saldo, abrindo modal de pagamento:", err);
      // Se a consulta falhar por qualquer motivo de rede, abre o modal de pagamento
      setModalAberto(true);
    } finally {
      setVerificandoSaldo(false);
    }
  }

  function handleFecharModal() {
    setModalAberto(false);
  }

  function handleSucesso(campanha: CampanhaItem) {
    if (onCampanhaCriada) {
      onCampanhaCriada(campanha);
    }
  }

  return (
    <>
      {erroPublicacao && (
        <div
          style={{
            marginBottom: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
            fontSize: "12px",
          }}
        >
          {erroPublicacao}
        </div>
      )}

      <button
        type="button"
        disabled={verificandoSaldo}
        onClick={handleClicarPublicar}
        style={{
          width: "100%",
          padding: "16px",
          marginTop: "6px",
          border: "none",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #229ed9 0%, #168ac0 100%)",
          color: "#ffffff",
          cursor: verificandoSaldo ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "9px",
          fontSize: "15px",
          fontWeight: 800,
          boxShadow: "0 10px 25px rgba(34,158,217,0.30)",
          transition: "transform 0.2s ease, opacity 0.2s ease",
          opacity: verificandoSaldo ? 0.75 : 1,
        }}
      >
        {verificandoSaldo ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Verificando saldo de campanha...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Publicar Campanha</span>
          </>
        )}
      </button>

      {/* MODAL DE PAGAMENTO (ABERTO QUANDO NÃO HÁ SALDO SUFICIENTE) */}
      <ModalPagamento
        aberto={modalAberto}
        onFechar={handleFecharModal}
        nomeCampanha={nomeCampanha}
        texto={texto}
        orcamentoDiario={orcamentoDiario}
        link={link}
        categoria={categoria}
        dataInicio={dataInicio}
        horaInicio={horaInicio}
        imagem={imagem}
        tags={tags}
        onCampanhaCriada={handleSucesso}
      />

      {/* MODAL DE SUCESSO (EXIBIDO QUANDO A CAMPANHA SOBE COM SALDO) */}
      {campanhaSucesso && (
        <ModalSucessoCampanha
          campanha={campanhaSucesso}
          renderAsModal
          onFechar={() => setCampanhaSucesso(null)}
        />
      )}
    </>
  );
}

export default BotaoPublicarCampanha;
