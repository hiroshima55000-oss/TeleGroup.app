import { Router } from "express";
import { TrafegoControle } from "../controles/c.trafego";

const rotasTrafego = Router();

// Leilão e Anúncios Pagos com Vantagem Competitiva
rotasTrafego.get("/leilao", TrafegoControle.buscarAnuncioLeilao);
rotasTrafego.post("/evento", TrafegoControle.registrarEvento);
rotasTrafego.get("/metricas", TrafegoControle.obterMetricas);
rotasTrafego.get("/campanha/:id/diagnostico", TrafegoControle.obterDiagnosticoCampanha);
rotasTrafego.post("/simulador", TrafegoControle.simularCenario);

export default rotasTrafego;
export { rotasTrafego };
