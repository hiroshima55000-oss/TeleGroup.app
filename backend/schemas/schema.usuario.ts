/**
 * Schema e Tipagens para Usuários e Métricas de Acesso
 */

export interface Usuario {
  usuarioId: string;
  primeiroAcesso: string;
  ultimoAcesso: string;
  cadastrado: boolean;
  totalRequisicoes: number;
  email?: string;
  nome?: string;
  foto?: string;
  googleId?: string;
  nickname?: string;
  banido?: boolean;
  motivoBanimento?: string;
}

export interface RegistroVisitaInput {
  usuarioId?: string;
  email?: string;
  nome?: string;
  nickname?: string;
  foto?: string;
  googleId?: string;
  cadastrado?: boolean;
}

export interface LoginGoogleInput {
  email: string;
  name?: string;
  nome?: string;
  picture?: string;
  foto?: string;
  googleId?: string;
  token?: string;
  idAnonimo?: string;
}

export interface MetricasUsuariosResponse {
  sucesso: boolean;
  totalUsuarios: number;
  cadastrados: number;
  anonimos: number;
  ultimaAtualizacao: string;
}

export const DDL_TABELA_USUARIOS = `
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  nome VARCHAR(255),
  foto TEXT,
  google_id VARCHAR(150),
  nickname VARCHAR(100),
  cadastrado BOOLEAN DEFAULT FALSE,
  total_requisicoes INT DEFAULT 1,
  primeiro_acesso TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  banido BOOLEAN DEFAULT FALSE,
  motivo_banimento TEXT
);

CREATE TABLE IF NOT EXISTS admin_banidos (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(150),
  email VARCHAR(255),
  usuario_id VARCHAR(100),
  motivo TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);
`;

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
