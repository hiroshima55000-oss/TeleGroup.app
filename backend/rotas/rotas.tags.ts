import { Router } from "express";
import { RankHashtagsControle } from "../controles/c.rank.hastags";

const rotasTags = Router();

// Endpoints públicos de ranking de hashtags para usuários
rotasTags.get("/", RankHashtagsControle.listarTags);
rotasTags.get("/ranking", RankHashtagsControle.listarTags);
rotasTags.get("/consultar", RankHashtagsControle.consultarTag);
rotasTags.post("/sincronizar", RankHashtagsControle.sincronizar);
rotasTags.get("/nichos", RankHashtagsControle.listarNichos);

export default rotasTags;
export { rotasTags };
