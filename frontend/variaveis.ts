/// <reference types="vite/client" />

/**
 * Variáveis de Ambiente do Frontend (Lidas diretamente do painel de hospedagem)
 * Compatível com Vercel, Render, Railway, Cloud Run, VPS e ambientes Docker.
 */

// Chaves de armazenamento local para sobrescrita manual via painel se necessário
const CHAVE_STORAGE_BACKEND_URL = "telegroup_admin_backend_url";
const CHAVE_STORAGE_ADMIN_TOKEN = "telegroup_admin_token";

/**
 * URL Base do Backend
 * Lida via variáveis de ambiente da hospedagem:
 * - import.meta.env.VITE_BACKEND_URL
 * - import.meta.env.BASE_URL_HOST
 * - import.meta.env.BASE_URL
 * Com fallback dinâmico para configuração salva em runtime (localStorage) ou vazio (mesma origem)
 */
export function obterBaseUrl(): string {
  const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;

  // 1. Prioridade para variáveis injetadas na hospedagem
  const envUrl =
    metaEnv.VITE_BACKEND_URL ||
    metaEnv.BASE_URL_HOST ||
    metaEnv.BASE_URL ||
    "";

  if (envUrl && envUrl.trim() && !envUrl.startsWith("/")) {
    return envUrl.trim().replace(/\/$/, "");
  }

  // 2. Fallback para configuração manual no painel de administração via localStorage
  if (typeof window !== "undefined") {
    const configurada = localStorage.getItem(CHAVE_STORAGE_BACKEND_URL);
    if (configurada && configurada.trim()) {
      return configurada.trim().replace(/\/$/, "");
    }
  }

  // 3. Mesma origem (local/proxy relativo)
  return "";
}

/**
 * Chave Secreta de Administração do TeleGroup
 * Lida via variáveis de ambiente da hospedagem:
 * - import.meta.env.VITE_CHAVE_SECRETA_TELEGROUP
 * - import.meta.env.CHAVE_SECRETA_TELEGROUP
 * Com fallback para token configurado no painel via localStorage
 */
export function obterChaveSecretaTelegroup(): string {
  const envChave =
    (import.meta.env.VITE_CHAVE_SECRETA_TELEGROUP as string | undefined) ||
    ((import.meta.env as any).CHAVE_SECRETA_TELEGROUP as string | undefined) ||
    "";

  if (envChave && envChave.trim()) {
    return envChave.trim();
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem(CHAVE_STORAGE_ADMIN_TOKEN) || "";
  }

  return "";
}

export const BASE_URL = obterBaseUrl();
export const CHAVE_SECRETA_TELEGROUP = obterChaveSecretaTelegroup();

export default {
  obterBaseUrl,
  obterChaveSecretaTelegroup,
  BASE_URL,
  CHAVE_SECRETA_TELEGROUP,
};
