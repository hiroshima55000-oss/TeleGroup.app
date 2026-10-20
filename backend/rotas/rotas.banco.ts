import { Router } from "express";
import { BancoControle } from "../controles/c.banco";

const rotasBanco = Router();

rotasBanco.get("/status", BancoControle.obterStatus);
rotasBanco.get("/teste", BancoControle.testarConexao);
rotasBanco.post("/reconectar", BancoControle.reconectar);

export default rotasBanco;
export { rotasBanco };
