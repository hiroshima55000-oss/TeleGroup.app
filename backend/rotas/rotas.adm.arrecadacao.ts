import { Router } from "express";
import { AdmArrecadacaoControle } from "../controles/c.adm.arrecadacao";

const rotasAdmArrecadacao = Router();

/**
 * =========================================================
 * ROTAS: adm.arrecadacao (ou adm.arrecadação)
 * Endpoints dedicados para envio de dados de arrecadação financeira
 * =========================================================
 */

// Envio de métricas consolidadas de quanto a plataforma arrecadou
rotasAdmArrecadacao.get("/", AdmArrecadacaoControle.obterDados);
rotasAdmArrecadacao.post("/", AdmArrecadacaoControle.obterDados);
rotasAdmArrecadacao.get("/dados", AdmArrecadacaoControle.obterDados);
rotasAdmArrecadacao.post("/dados", AdmArrecadacaoControle.obterDados);
rotasAdmArrecadacao.get("/metricas", AdmArrecadacaoControle.obterDados);
rotasAdmArrecadacao.post("/metricas", AdmArrecadacaoControle.obterDados);

// Histórico de transferências
rotasAdmArrecadacao.get("/transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);
rotasAdmArrecadacao.post("/transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);
rotasAdmArrecadacao.get("/h-transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);
rotasAdmArrecadacao.post("/h-transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);
rotasAdmArrecadacao.get("/historico-transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);
rotasAdmArrecadacao.post("/historico-transferencias", AdmArrecadacaoControle.obterHistoricoTransferencias);

// Total por ano
rotasAdmArrecadacao.get("/ano", AdmArrecadacaoControle.obterTotalAno);
rotasAdmArrecadacao.post("/ano", AdmArrecadacaoControle.obterTotalAno);
rotasAdmArrecadacao.get("/total-ano", AdmArrecadacaoControle.obterTotalAno);
rotasAdmArrecadacao.post("/total-ano", AdmArrecadacaoControle.obterTotalAno);
rotasAdmArrecadacao.get("/anos", AdmArrecadacaoControle.obterTotalAno);
rotasAdmArrecadacao.post("/anos", AdmArrecadacaoControle.obterTotalAno);

// Total por mês
rotasAdmArrecadacao.get("/mes", AdmArrecadacaoControle.obterTotalMes);
rotasAdmArrecadacao.post("/mes", AdmArrecadacaoControle.obterTotalMes);
rotasAdmArrecadacao.get("/total-mes", AdmArrecadacaoControle.obterTotalMes);
rotasAdmArrecadacao.post("/total-mes", AdmArrecadacaoControle.obterTotalMes);
rotasAdmArrecadacao.get("/meses", AdmArrecadacaoControle.obterTotalMes);
rotasAdmArrecadacao.post("/meses", AdmArrecadacaoControle.obterTotalMes);

// Total por dia
rotasAdmArrecadacao.get("/dia", AdmArrecadacaoControle.obterTotalDia);
rotasAdmArrecadacao.post("/dia", AdmArrecadacaoControle.obterTotalDia);
rotasAdmArrecadacao.get("/total-dia", AdmArrecadacaoControle.obterTotalDia);
rotasAdmArrecadacao.post("/total-dia", AdmArrecadacaoControle.obterTotalDia);
rotasAdmArrecadacao.get("/dias", AdmArrecadacaoControle.obterTotalDia);
rotasAdmArrecadacao.post("/dias", AdmArrecadacaoControle.obterTotalDia);

// Disparo proativo para API_URL (painel administrativo)
rotasAdmArrecadacao.post("/enviar", AdmArrecadacaoControle.enviarParaPainel);
rotasAdmArrecadacao.post("/disparar", AdmArrecadacaoControle.enviarParaPainel);

// Ajustes e transações de arrecadação
rotasAdmArrecadacao.post("/ajuste", AdmArrecadacaoControle.atualizarAjustes);
rotasAdmArrecadacao.post("/transacao", AdmArrecadacaoControle.registrarTransacao);

export default rotasAdmArrecadacao;
export { rotasAdmArrecadacao };
