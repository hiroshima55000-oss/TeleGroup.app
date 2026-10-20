/**
 * Schema e Tipagens para Campanhas e Anúncios Pagos
 */

export type StatusCampanha = "Ativa" | "Pausada" | "Encerrada";

export interface Campanha {
  id: string;
  usuarioId: string;
  nome: string;
  texto?: string;
  orcamentoDiario: number;
  link: string;
  status: StatusCampanha;
  visualizacoes: number;
  cliques: number;
  gastoTotal: number;
  alcanceEstimado: number;
  dataCriacao: string;
  codigoPix: string;
  categoria: string;
  dataInicio?: string;
  horaInicio?: string;
  imagem?: string;
  tags?: string[];
  saldoCreditos?: number;
  saldoConsumido?: number;
  pagoComSaldo?: boolean;
}

export interface CriarCampanhaInput {
  nome: string;
  texto?: string;
  orcamentoDiario: number;
  link: string;
  categoria?: string;
  dataInicio?: string;
  horaInicio?: string;
  imagem?: string;
  tags?: string[];
  usuarioId?: string;
  codigoPix?: string;
  usarSaldo?: boolean;
  pagoComSaldo?: boolean;
  googleEmail?: string;
  usuario?: string;
}

export interface MetricasCampanhas {
  totalCampanhas: number;
  campanhasAtivas: number;
  visualizacoesTotais: number;
  cliquesTotais: number;
  gastoTotal: number;
  ctrGeral: number;
  cpmMedio: number;
}

export const DDL_TABELA_CAMPANHAS = `
CREATE TABLE IF NOT EXISTS campanhas (
  id VARCHAR(100) PRIMARY KEY,
  usuario_id VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  texto TEXT,
  orcamento_diario NUMERIC(10, 2) NOT NULL,
  link TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Ativa',
  visualizacoes INT DEFAULT 0,
  cliques INT DEFAULT 0,
  gasto_total NUMERIC(10, 2) DEFAULT 0,
  alcance_estimado INT DEFAULT 0,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  codigo_pix TEXT,
  categoria VARCHAR(100) DEFAULT 'Geral',
  data_inicio DATE,
  hora_inicio VARCHAR(10),
  imagem TEXT,
  tags TEXT[],
  saldo_creditos NUMERIC(10, 2) DEFAULT 0,
  saldo_consumido NUMERIC(10, 2) DEFAULT 0
);
`;

export function validarCriarCampanha(dados: any): { valido: boolean; erro?: string } {
  if (!dados.nome || typeof dados.nome !== "string" || !dados.nome.trim()) {
    return { valido: false, erro: "O campo 'nome' é obrigatório." };
  }
  if (!dados.link || typeof dados.link !== "string" || !dados.link.trim()) {
    return { valido: false, erro: "O campo 'link' é obrigatório." };
  }
  const orcamento = Number(dados.orcamentoDiario);
  if (isNaN(orcamento) || orcamento <= 0) {
    return { valido: false, erro: "O 'orcamentoDiario' deve ser um número maior que zero." };
  }
  return { valido: true };
}
