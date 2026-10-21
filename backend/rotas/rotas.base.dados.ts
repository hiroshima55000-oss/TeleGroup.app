import { Router } from "express";
import { BaseDadosControle } from "../controles/c.base.dados";

const rotasBaseDados = Router();

rotasBaseDados.get("/status", BaseDadosControle.obterStatusCiclo);
rotasBaseDados.get("/ciclo", BaseDadosControle.obterStatusCiclo);
rotasBaseDados.post("/evento", BaseDadosControle.registrarEventoNoCiclo);
rotasBaseDados.post("/ciclo", BaseDadosControle.registrarEventoNoCiclo);
rotasBaseDados.get("/perfil/:usuarioId", BaseDadosControle.obterPerfilOtimizado);
rotasBaseDados.get("/perfil", BaseDadosControle.obterPerfilOtimizado);
rotasBaseDados.get("/entrega/:usuarioId", BaseDadosControle.obterEntrega);
rotasBaseDados.get("/entrega", BaseDadosControle.obterEntrega);

export default rotasBaseDados;
export { rotasBaseDados };
