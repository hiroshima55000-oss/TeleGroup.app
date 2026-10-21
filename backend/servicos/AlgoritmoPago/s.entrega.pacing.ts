import { Campanha } from "../../schemas/schema.campanhas";
import { RitmoPacing } from "./tipos.campanhas.pagas";
import { CONFIG_VANTAGEM_PAGA } from "./s.pesos.vantagem";

export const EntregaPacingServico = {
  /**
   * Determina o ritmo de pacing e o multiplicador de velocidade de entrega
   */
  calcularPacing(campanha: Campanha): {
    ritmo: RitmoPacing;
    fatorPacing: number;
    saldoDisponivel: number;
    percentualGasto: number;
    podeEntregar: boolean;
  } {
    const orcamento = Number(campanha.orcamentoDiario || 0);
    const saldoConsumido = Number(campanha.saldoConsumido || campanha.gastoTotal || 0);
    const saldoTotal = Number(campanha.saldoCreditos || orcamento * 3);

    const saldoDisponivel = Math.max(0, saldoTotal - saldoConsumido);
    const percentualGasto = orcamento > 0 ? (saldoConsumido / orcamento) * 100 : 0;

    // Se a campanha estiver pausada, encerrada ou com orçamento esgotado
    if (campanha.status !== "Ativa" || (orcamento > 0 && saldoConsumido >= saldoTotal)) {
      return {
        ritmo: "Cadenciado",
        fatorPacing: 0,
        saldoDisponivel,
        percentualGasto,
        podeEntregar: false,
      };
    }

    // Calcula fração do dia decorrida (0.0 a 1.0)
    const agora = new Date();
    const minutosDecorridos = agora.getHours() * 60 + agora.getMinutes();
    const fracaoDia = Math.max(0.05, minutosDecorridos / 1440);

    // Esperado vs Realizado
    const gastoEsperado = orcamento * fracaoDia;

    let ritmo: RitmoPacing = "Otimizado";
    let fatorPacing = CONFIG_VANTAGEM_PAGA.PACING.OTIMIZADO.fatorVelocidade;

    // Campanhas de alto orçamento (>= R$ 50) ganham modo acelerado natural
    if (orcamento >= CONFIG_VANTAGEM_PAGA.LIMIAR_ORCAMENTO_PREMIUM || saldoConsumido < gastoEsperado * 0.7) {
      ritmo = "Acelerado";
      fatorPacing = CONFIG_VANTAGEM_PAGA.PACING.ACELERADO.fatorVelocidade;
    } else if (saldoConsumido > gastoEsperado * 1.3) {
      ritmo = "Cadenciado";
      fatorPacing = CONFIG_VANTAGEM_PAGA.PACING.CADENCIADO.fatorVelocidade;
    }

    return {
      ritmo,
      fatorPacing,
      saldoDisponivel,
      percentualGasto: Number(percentualGasto.toFixed(2)),
      podeEntregar: saldoDisponivel > 0.05,
    };
  },
};
