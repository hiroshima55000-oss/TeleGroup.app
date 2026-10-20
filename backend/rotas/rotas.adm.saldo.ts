import { Router } from "express";
import { AdmSaldoControle } from "../controles/c.adm.saldo";

const rotasAdmSaldo = Router();

/**
 * =========================================================
 * ROTAS: adm.saldo
 * Endpoints dedicados para adicionar saldo na conta de usuários
 * definindo um @ e um valor pelo painel administrativo
 * =========================================================
 */

// Adicionar saldo
rotasAdmSaldo.post("/", AdmSaldoControle.adicionarSaldo);
rotasAdmSaldo.post("/adicionar", AdmSaldoControle.adicionarSaldo);
rotasAdmSaldo.post("/adcionar", AdmSaldoControle.adicionarSaldo);
rotasAdmSaldo.post("/creditar", AdmSaldoControle.adicionarSaldo);
rotasAdmSaldo.post("/recarga", AdmSaldoControle.adicionarSaldo);

// Consultar saldo de um @
rotasAdmSaldo.get("/", AdmSaldoControle.consultarSaldo);
rotasAdmSaldo.get("/consultar", AdmSaldoControle.consultarSaldo);

export default rotasAdmSaldo;
export { rotasAdmSaldo };
