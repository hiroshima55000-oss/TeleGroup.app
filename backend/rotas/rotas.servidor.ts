import { Router } from "express";
import { ServidorControle } from "../controles/c.servidor";

const rotasServidor = Router();

rotasServidor.get("/", ServidorControle.obterStatusServidor);
rotasServidor.get("/status", ServidorControle.obterStatusServidor);
rotasServidor.get("/health", ServidorControle.obterHealthCheck);
rotasServidor.get("/ambiente", ServidorControle.obterAmbienteConfigurado);

export default rotasServidor;
export { rotasServidor };
