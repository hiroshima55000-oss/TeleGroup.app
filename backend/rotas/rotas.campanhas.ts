import { Router } from "express";
import { CampanhasControle } from "../controles/c.campanhas";

const rotasCampanhas = Router();

rotasCampanhas.get("/", CampanhasControle.listarCampanhas);
rotasCampanhas.get("/metricas", CampanhasControle.obterMetricas);
rotasCampanhas.get("/:id", CampanhasControle.obterPorId);
rotasCampanhas.post("/", CampanhasControle.criarCampanha);
rotasCampanhas.patch("/:id/status", CampanhasControle.alterarStatus);
rotasCampanhas.delete("/:id", CampanhasControle.remover);

export default rotasCampanhas;
export { rotasCampanhas };
