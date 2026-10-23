/**
 * Schema e DDL para Interesses e Interações de Usuários no PostgreSQL
 */

export const DDL_TABELAS_INTERESSES = `
CREATE TABLE IF NOT EXISTS usuarios_interesses (
  usuario_id VARCHAR(100) PRIMARY KEY,
  nickname VARCHAR(100),
  total_interacoes INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_cliques INT DEFAULT 0,
  total_visualizacoes INT DEFAULT 0,
  tempo_retencao_segundos INT DEFAULT 0,
  classificacao_publico VARCHAR(100) DEFAULT 'Passivo',
  taxa_cliques_ctr NUMERIC(6,2) DEFAULT 0,
  descricao_qualificacao TEXT,
  hashtags JSONB DEFAULT '{}'::jsonb,
  distribuicao_grupos JSONB DEFAULT '[]'::jsonb,
  distribuicao_percentual JSONB DEFAULT '{}'::jsonb,
  sequencia_sessao JSONB DEFAULT '[]'::jsonb,
  dados_base_dados JSONB DEFAULT '{}'::jsonb,
  primeira_interacao TIMESTAMPTZ DEFAULT NOW(),
  ultima_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios_interacoes (
  id VARCHAR(100) PRIMARY KEY,
  usuario_id VARCHAR(100) NOT NULL,
  publicacao_id VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  categoria VARCHAR(100),
  nicho VARCHAR(100),
  duracao_segundos INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_interacoes_usuario_id ON usuarios_interacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_interacoes_pub_id ON usuarios_interacoes(publicacao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_interacoes_tipo ON usuarios_interacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_interacoes_criado_em ON usuarios_interacoes(criado_em);
`;

export interface RegistroInteracaoBanco {
  id: string;
  usuario_id: string;
  publicacao_id: string;
  tipo: string;
  tags?: any;
  categoria?: string;
  nicho?: string;
  duracao_segundos?: number;
  criado_em: Date | string;
}

export interface PerfilInteresseBanco {
  usuario_id: string;
  nickname: string;
  total_interacoes: number;
  total_likes: number;
  total_cliques: number;
  total_visualizacoes: number;
  tempo_retencao_segundos: number;
  classificacao_publico: string;
  taxa_cliques_ctr: number | string;
  descricao_qualificacao: string;
  hashtags: any;
  distribuicao_grupos: any;
  distribuicao_percentual: any;
  sequencia_sessao: any;
  dados_base_dados?: any;
  primeira_interacao: Date | string;
  ultima_atualizacao: Date | string;
}
