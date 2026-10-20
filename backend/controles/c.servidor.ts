import { Request, Response } from "express";
import {
  NOME_SERVIDOR,
  NODE_ENV,
  PORT,
  HOST,
  DATABASE_URL,
} from "../configuracao/variaveis";
import { obterStatusBanco } from "../banco.dados";

export const ServidorControle = {
  /**
   * Retorna os dados do servidor e o estado atual da conexão com o banco de dados PostgreSQL
   * Endpoint: GET / e GET /api/status
   */
  async obterStatusServidor(_req: Request, res: Response): Promise<void> {
    try {
      const statusBanco = await obterStatusBanco();
      res.json({
        servidor: NOME_SERVIDOR,
        mensagem: "Servidor funcionando!",
        ambiente: NODE_ENV,
        timestamp: new Date().toISOString(),
        bancoDeDados: statusBanco,
      });
    } catch (erro: any) {
      res.status(500).json({
        servidor: NOME_SERVIDOR,
        mensagem: "Erro ao obter status do servidor.",
        erro: erro.message,
      });
    }
  },

  /**
   * Endpoint de verificação de integridade (Health Check)
   * Endpoint: GET /api/health
   */
  async obterHealthCheck(_req: Request, res: Response): Promise<void> {
    try {
      const statusBanco = await obterStatusBanco();

      res.status(200).json({
        servidor: NOME_SERVIDOR,
        status: "online",
        uptimeSegundos: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        bancoDeDados: statusBanco,
      });
    } catch (erro: any) {
      res.status(500).json({
        servidor: NOME_SERVIDOR,
        status: "erro",
        erro: erro.message,
      });
    }
  },

  /**
   * Retorna visão geral das variáveis de ambiente configuradas no painel (ocultando senhas)
   * Endpoint: GET /api/ambiente
   */
  async obterAmbienteConfigurado(_req: Request, res: Response): Promise<void> {
    res.json({
      servidor: {
        porta: PORT,
        host: HOST,
        nome: NOME_SERVIDOR,
        ambiente: NODE_ENV,
      },
      bancoDeDados: {
        tipo: "PostgreSQL",
        origem: "DATABASE_URL",
        configurado: Boolean(DATABASE_URL),
      },
      seguranca: {
        chaveTelegroupConfigurada: Boolean(process.env.CHAVE_SECRETA_TELEGROUP),
        painelChaveConfigurada: Boolean(process.env.PAINEL_CHAVE_SECRETA),
      },
    });
  },
};

export default ServidorControle;
