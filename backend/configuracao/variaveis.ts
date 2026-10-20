import dotenv from "dotenv";

// Carrega variáveis locais de arquivo .env caso exista
dotenv.config();

/**
 * Variáveis de Ambiente do Backend (Lidas do Painel de Hospedagem)
 */

// Servidor HTTP
export const PORT: number = Number(process.env.PORT) || 3000;
export const HOST: string = process.env.HOST || "0.0.0.0";
export const NOME_SERVIDOR: string =
  process.env.NOME_SERVIDOR || process.env.APP_NAME || "TeleGroup Servidor";
export const NODE_ENV: string = process.env.NODE_ENV || "development";
export const IS_PRODUCAO: boolean = NODE_ENV === "production";

// ========================================================
// BANCO DE DADOS POSTGRESQL (Apenas DATABASE_URL)
// ========================================================
export const DATABASE_URL: string = process.env.DATABASE_URL || "";

// ========================================================
// SEGURANÇA E INTEGRAÇÕES DO PAINEL (WEBSITE 1 / WEBSITE 2)
// ========================================================
export const API_URL: string =
  process.env.API_URL || process.env.WEBSITE1_URL || process.env.PAINEL_URL || "";

export const CHAVE_SECRETA_TELEGROUP: string =
  process.env.CHAVE_SECRETA_TELEGROUP || process.env.PAINEL_CHAVE_SECRETA || "";

export const PAINEL_CHAVE_SECRETA: string =
  process.env.PAINEL_CHAVE_SECRETA || process.env.CHAVE_SECRETA_TELEGROUP || "";

export const GEMINI_API_KEY: string =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

export const GOOGLE_CLIENT_ID: string =
  process.env.GOOGLE_CLIENT_ID || "";

export const GOOGLE_CLIENT_SECRET: string =
  process.env.GOOGLE_CLIENT_SECRET || "";

export const SYNCPAY_PUBLIC_KEY: string =
  process.env.SYNCPAY_PUBLIC_KEY || process.env.SYNCPAY_CLIENT_ID || "";

export const SYNCPAY_PRIVATE_KEY: string =
  process.env.SYNCPAY_PRIVATE_KEY ||
  process.env.SYNCPAY_CLIENT_SECRET ||
  process.env.SYNCPAY_SECRET ||
  "";

export const SYNCPAY_HOST: string =
  process.env.SYNCPAY_HOST || "https://api.syncpayments.com.br";

export default {
  PORT,
  HOST,
  NOME_SERVIDOR,
  NODE_ENV,
  IS_PRODUCAO,
  DATABASE_URL,
  CHAVE_SECRETA_TELEGROUP,
  PAINEL_CHAVE_SECRETA,
  GEMINI_API_KEY,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SYNCPAY_PUBLIC_KEY,
  SYNCPAY_PRIVATE_KEY,
};
