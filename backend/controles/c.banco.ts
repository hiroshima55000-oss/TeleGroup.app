import { Request, Response } from "express";
import {
  obterStatusBanco,
  iniciarBancoDeDados,
  executarQuery,
} from "../banco.dados";

export const BancoControle = {
  /**
   * Retorna o status da conexão com o banco de dados PostgreSQL
   * Endpoint: GET /api/banco/status
   */
  async obterStatus(req: Request, res: Response): Promise<void> {
    try {
      const reconectar = req.query.reconectar === "true";
      const statusBanco = await obterStatusBanco(reconectar);

      res.status(statusBanco.conectado ? 200 : 503).json(statusBanco);
    } catch (erro: any) {
      res.status(500).json({
        conectado: false,
        tipo: "PostgreSQL",
        erro: erro.message,
      });
    }
  },

  /**
   * Força uma tentativa de reconexão ao PostgreSQL
   * Endpoint: POST /api/banco/reconectar
   */
  async reconectar(_req: Request, res: Response): Promise<void> {
    try {
      console.log("🔄 [Controle Banco] Forçando reconexão com o PostgreSQL...");
      const statusBanco = await iniciarBancoDeDados();
      res.status(statusBanco.conectado ? 200 : 503).json({
        sucesso: statusBanco.conectado,
        mensagem: statusBanco.conectado
          ? "Reconectado com sucesso ao banco PostgreSQL!"
          : "Falha ao conectar ao banco de dados.",
        status: statusBanco,
      });
    } catch (erro: any) {
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao reconectar ao banco de dados.",
        erro: erro.message,
      });
    }
  },

  /**
   * Executa uma consulta SQL de teste no banco PostgreSQL
   * Endpoint: GET /api/banco/teste
   */
  async testarConexao(_req: Request, res: Response): Promise<void> {
    try {
      const resultado = await executarQuery(
        "SELECT NOW() as data_hora, current_database() as banco_atual, current_user as usuario_atual, version() as versao"
      );

      res.json({
        sucesso: true,
        mensagem: "Consulta executada com sucesso no PostgreSQL!",
        dados: resultado.rows[0],
      });
    } catch (erro: any) {
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao executar consulta no banco de dados.",
        erro: erro.message,
        dica: "Verifique se o PostgreSQL está ativo e as variáveis de ambiente corretas no painel de hospedagem.",
      });
    }
  },
};

export default BancoControle;
