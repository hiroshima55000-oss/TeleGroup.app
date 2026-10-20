/**
 * Cliente de API Unificado para o Painel Administrativo e Moderação
 * Suporta chave/token de autenticação, URL de backend configurável (local ou produção)
 * e dispara eventos customizados para sincronização em tempo real das telas.
 */

export interface RespostaPadrao {
  sucesso: boolean;
  mensagem?: string;
  erro?: string;
  [key: string]: any;
}

import { obterBaseUrl, obterChaveSecretaTelegroup } from "../variaveis.ts";

const CHAVE_STORAGE_BACKEND_URL = "telegroup_admin_backend_url";
const CHAVE_STORAGE_ADMIN_TOKEN = "telegroup_admin_token";

export function obterUrlBaseBackend(): string {
  if (typeof window !== "undefined") {
    const configurada = localStorage.getItem(CHAVE_STORAGE_BACKEND_URL);
    if (configurada && configurada.trim()) {
      return configurada.trim().replace(/\/$/, "");
    }
  }
  return obterBaseUrl();
}

export function definirUrlBaseBackend(url: string): void {
  if (typeof window !== "undefined") {
    if (!url || !url.trim()) {
      localStorage.removeItem(CHAVE_STORAGE_BACKEND_URL);
    } else {
      localStorage.setItem(CHAVE_STORAGE_BACKEND_URL, url.trim().replace(/\/$/, ""));
    }
    notificarEvento("admin:config_backend_alterada", { url });
  }
}

export function obterTokenAdmin(): string {
  if (typeof window !== "undefined") {
    const configurado = localStorage.getItem(CHAVE_STORAGE_ADMIN_TOKEN);
    if (configurado && configurado.trim()) {
      return configurado.trim();
    }
  }
  return obterChaveSecretaTelegroup();
}

export function definirTokenAdmin(token: string): void {
  if (typeof window !== "undefined") {
    if (!token || !token.trim()) {
      localStorage.removeItem(CHAVE_STORAGE_ADMIN_TOKEN);
    } else {
      localStorage.setItem(CHAVE_STORAGE_ADMIN_TOKEN, token.trim());
    }
  }
}

function notificarEvento(nomeEvento: string, detalhe: any = {}): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(nomeEvento, { detail: detalhe }));
    window.dispatchEvent(new CustomEvent("admin:dados_atualizados", { detail: { evento: nomeEvento, ...detalhe } }));
  }
}

async function requisicaoAdmin<T = any>(
  endpoint: string,
  opcoes: RequestInit = {}
): Promise<T> {
  const urlBase = obterUrlBaseBackend();
  const token = obterTokenAdmin();
  const urlCompleta = `${urlBase}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headersPadrao: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headersPadrao["Authorization"] = `Bearer ${token}`;
    headersPadrao["x-admin-token"] = token;
  }

  const res = await fetch(urlCompleta, {
    ...opcoes,
    headers: {
      ...headersPadrao,
      ...(opcoes.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.erro || json.mensagem || `Erro ${res.status}: Falha na requisição`);
  }

  return json as T;
}

export const api = {
  // ==========================================
  // BANIMENTO E MODERAÇÃO
  // ==========================================

  async banirUsuario(usuario: string, motivo: string = "Violação das regras da comunidade"): Promise<RespostaPadrao> {
    const res = await requisicaoAdmin<RespostaPadrao>("/api/admin/banir", {
      method: "POST",
      body: JSON.stringify({ usuario, motivo }),
    });
    notificarEvento("admin:usuario_banido", { usuario, motivo, dados: res });
    return res;
  },

  async desbanirUsuario(usuario: string): Promise<RespostaPadrao> {
    const res = await requisicaoAdmin<RespostaPadrao>("/api/admin/desbanir", {
      method: "POST",
      body: JSON.stringify({ usuario }),
    });
    notificarEvento("admin:usuario_desbanido", { usuario, dados: res });
    return res;
  },

  async obterBanidos(): Promise<RespostaPadrao> {
    return await requisicaoAdmin<RespostaPadrao>("/api/admin/banidos", {
      method: "GET",
    });
  },

  async checarStatusBanimento(usuario: string): Promise<RespostaPadrao> {
    return await requisicaoAdmin<RespostaPadrao>(`/api/usuario/status-banimento?usuario=${encodeURIComponent(usuario)}`, {
      method: "GET",
    });
  },

  // ==========================================
  // DENÚNCIAS E OCORRÊNCIAS
  // ==========================================

  async obterRankingDenuncias(): Promise<RespostaPadrao> {
    return await requisicaoAdmin<RespostaPadrao>("/api/admin/denuncias/ranking", {
      method: "GET",
    });
  },

  async obterOcorrenciaUsuario(usuario: string): Promise<RespostaPadrao> {
    const encoded = encodeURIComponent(usuario);
    return await requisicaoAdmin<RespostaPadrao>(`/api/admin/denuncias/ocorrencias?usuario=${encoded}`, {
      method: "GET",
    });
  },

  async removerPostagemDenunciada(id: string): Promise<RespostaPadrao> {
    const res = await requisicaoAdmin<RespostaPadrao>(`/api/admin/denuncias/postagens/${encodeURIComponent(id)}/remover`, {
      method: "POST",
    });
    notificarEvento("admin:postagem_removida", { id, dados: res });
    return res;
  },

  // ==========================================
  // SALDO E CAMPANHAS (FINANCEIRO)
  // ==========================================

  async obterSaldoEFinanceiro(): Promise<RespostaPadrao> {
    return await requisicaoAdmin<RespostaPadrao>("/api/admin/financeiro/saldo", {
      method: "GET",
    });
  },

  async obterCampanhas(periodo: string = "dias"): Promise<RespostaPadrao> {
    return await requisicaoAdmin<RespostaPadrao>(`/api/admin/campanhas?periodo=${encodeURIComponent(periodo)}`, {
      method: "GET",
    });
  },

  // ==========================================
  // STATUS E CONECTIVIDADE
  // ==========================================

  async verificarConexao(): Promise<{ online: boolean; latenciaMs: number; dados?: any }> {
    const inicio = performance.now();
    try {
      const dados = await requisicaoAdmin<any>("/api/health", { method: "GET" });
      const fim = performance.now();
      return {
        online: true,
        latenciaMs: Math.round(fim - inicio),
        dados,
      };
    } catch {
      return {
        online: false,
        latenciaMs: -1,
      };
    }
  },
};

export default api;
