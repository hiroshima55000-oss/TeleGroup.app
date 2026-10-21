export interface InfoUsuarioGoogle {
  email: string;
  nome: string;
  foto?: string;
  googleId: string;
  conectadoEm: string;
  token?: string;
}

export interface InfoUsuario {
  id: string;
  idCurto: string;
  criadoEm: string;
  ePrimeiroAcesso: boolean;
  nome: string; // Espelha o nickname (sempre com @)
  nickname: string; // Identificador único (sempre @...)
  google?: InfoUsuarioGoogle | null;
}

const CHAVE_ID = "flux_usuario_id";
const CHAVE_CRIADO_EM = "flux_usuario_criado_em";
const CHAVE_NOTIFICADO = "flux_usuario_notificado";
const CHAVE_NICKNAME = "flux_usuario_nickname";
const CHAVE_NOME = "flux_usuario_nome";

const CHAVE_GOOGLE_LOGADO = "flux_google_logado";
const CHAVE_GOOGLE_EMAIL = "flux_google_email";
const CHAVE_GOOGLE_NOME = "flux_google_nome";
const CHAVE_GOOGLE_FOTO = "flux_google_foto";
const CHAVE_GOOGLE_ID = "flux_google_id";
const CHAVE_GOOGLE_CONECTADO_EM = "flux_google_conectado_em";
const CHAVE_GOOGLE_TOKEN = "flux_google_token";

export const EVENTO_USUARIO_MUDOU = "flux_usuario_mudou";

function dispararEventoUsuarioMudou() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_MUDOU));
  }
}

export function ouvirMudancaUsuario(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO_USUARIO_MUDOU, callback);
  return () => {
    window.removeEventListener(EVENTO_USUARIO_MUDOU, callback);
  };
}

export function extrairArrobaDoEmail(email: string): string {
  if (!email || !email.includes("@")) return "@usuario";
  const prefixo = email.split("@")[0].trim().toLowerCase();
  const limpo = prefixo.replace(/[^a-zA-Z0-9_]/g, "");
  return `@${limpo || "usuario"}`;
}

export function gerarNicknameAleatorio(): string {
  const sufixo = Math.random().toString(36).replace(/[^a-z0-9]/g, "").substring(0, 5);
  return `@usuario_${sufixo}`;
}

export function obterGoogleUsuario(): InfoUsuarioGoogle | null {
  if (typeof localStorage === "undefined") return null;
  const logado = localStorage.getItem(CHAVE_GOOGLE_LOGADO) === "true";
  const email = localStorage.getItem(CHAVE_GOOGLE_EMAIL);
  if (!logado || !email) return null;

  return {
    email,
    nome: localStorage.getItem(CHAVE_GOOGLE_NOME) || email.split("@")[0],
    foto: localStorage.getItem(CHAVE_GOOGLE_FOTO) || undefined,
    googleId: localStorage.getItem(CHAVE_GOOGLE_ID) || `g_${Date.now()}`,
    conectadoEm: localStorage.getItem(CHAVE_GOOGLE_CONECTADO_EM) || new Date().toISOString(),
    token: localStorage.getItem(CHAVE_GOOGLE_TOKEN) || undefined,
  };
}

export function estaLogadoGoogle(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(CHAVE_GOOGLE_LOGADO) === "true" && Boolean(localStorage.getItem(CHAVE_GOOGLE_EMAIL));
}

export function salvarLoginGoogle(dados: {
  email: string;
  nome?: string;
  foto?: string;
  googleId?: string;
  token?: string;
  nickname?: string;
  id?: string;
}): InfoUsuario {
  const emailLimpo = dados.email.trim().toLowerCase();
  const nomePadrao = dados.nome?.trim() || emailLimpo.split("@")[0] || "Usuário Google";
  const googleId = dados.googleId || `gid_${Date.now()}`;
  const conectadoEm = new Date().toISOString();

  if (dados.id) {
    localStorage.setItem(CHAVE_ID, dados.id);
  }
  localStorage.setItem(CHAVE_GOOGLE_LOGADO, "true");
  localStorage.setItem(CHAVE_GOOGLE_EMAIL, emailLimpo);
  localStorage.setItem(CHAVE_GOOGLE_NOME, nomePadrao);
  if (dados.foto) {
    localStorage.setItem(CHAVE_GOOGLE_FOTO, dados.foto);
  }
  localStorage.setItem(CHAVE_GOOGLE_ID, googleId);
  localStorage.setItem(CHAVE_GOOGLE_CONECTADO_EM, conectadoEm);
  if (dados.token) {
    localStorage.setItem(CHAVE_GOOGLE_TOKEN, dados.token);
  }

  // O @ da pessoa atualiza e se torna o @ prefixo do email (ex: deepweb3036@gmail.com -> @deepweb3036)
  const arrobaGoogle = extrairArrobaDoEmail(emailLimpo);
  const nickFinal = dados.nickname && !dados.nickname.startsWith("@usuario_")
    ? (dados.nickname.startsWith("@") ? dados.nickname : `@${dados.nickname}`)
    : arrobaGoogle;

  localStorage.setItem(CHAVE_NICKNAME, nickFinal);

  dispararEventoUsuarioMudou();
  return obterOuCriarUsuario();
}

export function fazerLogoutGoogle(): InfoUsuario {
  localStorage.removeItem(CHAVE_GOOGLE_LOGADO);
  localStorage.removeItem(CHAVE_GOOGLE_EMAIL);
  localStorage.removeItem(CHAVE_GOOGLE_NOME);
  localStorage.removeItem(CHAVE_GOOGLE_FOTO);
  localStorage.removeItem(CHAVE_GOOGLE_ID);
  localStorage.removeItem(CHAVE_GOOGLE_CONECTADO_EM);
  localStorage.removeItem(CHAVE_GOOGLE_TOKEN);

  // Ao sair do Google, gera um novo @ aleatório para o uso anônimo
  const novoNick = gerarNicknameAleatorio();
  localStorage.setItem(CHAVE_NICKNAME, novoNick);

  dispararEventoUsuarioMudou();
  return obterOuCriarUsuario();
}

export function obterOuCriarUsuario(): InfoUsuario {
  let id = localStorage.getItem(CHAVE_ID);
  let criadoEm = localStorage.getItem(CHAVE_CRIADO_EM);
  let nickname = localStorage.getItem(CHAVE_NICKNAME);
  let ePrimeiroAcesso = false;

  // Limpeza de resquício legado de mock caso ainda exista
  if (
    id === "usr_deutscher3036_mvfos8lr" &&
    localStorage.getItem(CHAVE_GOOGLE_EMAIL) === "hiroshima55000@gmail.com"
  ) {
    localStorage.removeItem(CHAVE_GOOGLE_LOGADO);
    localStorage.removeItem(CHAVE_GOOGLE_EMAIL);
    localStorage.removeItem(CHAVE_GOOGLE_NOME);
    localStorage.removeItem(CHAVE_GOOGLE_FOTO);
    localStorage.removeItem(CHAVE_GOOGLE_ID);
    localStorage.removeItem(CHAVE_GOOGLE_CONECTADO_EM);
    localStorage.removeItem(CHAVE_NICKNAME);
    localStorage.removeItem(CHAVE_ID);
    id = null;
    nickname = null;
  }

  const logadoGoogle = estaLogadoGoogle();
  const google = obterGoogleUsuario();

  if (!id) {
    const timestamp = Date.now().toString(36);
    const aleatorio = Math.random().toString(36).substring(2, 8);
    id = `usr_${timestamp}_${aleatorio}`;
    criadoEm = new Date().toISOString();
    ePrimeiroAcesso = true;

    localStorage.setItem(CHAVE_ID, id);
    localStorage.setItem(CHAVE_CRIADO_EM, criadoEm);
  }

  // ID curto para exibição amigável, ex: "usr_k9x2_a7b" -> "#k9x2"
  const partes = id.split("_");
  const idCurto = partes.length >= 2 ? `#${partes[1]}` : `#${id.substring(0, 6)}`;

  // Quando a pessoa loga com Google: o @ dela atualiza e se torna o @ prefixo do email (ex: deepweb3036@gmail.com -> @deepweb3036)
  if (logadoGoogle && google?.email) {
    nickname = extrairArrobaDoEmail(google.email);
    localStorage.setItem(CHAVE_NICKNAME, nickname);
  } else if (!nickname) {
    // Quando a pessoa entra no app: ganha um @ aleatório pra ficar usando (ex: @usuariox ou @usuario_8k2a)
    nickname = gerarNicknameAleatorio();
    localStorage.setItem(CHAVE_NICKNAME, nickname);
  } else if (!nickname.startsWith("@")) {
    nickname = `@${nickname}`;
    localStorage.setItem(CHAVE_NICKNAME, nickname);
  }

  const nomeSalvo = localStorage.getItem(CHAVE_NOME);
  const nomeFinal = (logadoGoogle && google?.nome) ? google.nome : (nomeSalvo || nickname);

  return {
    id,
    idCurto,
    criadoEm: criadoEm || new Date().toISOString(),
    ePrimeiroAcesso,
    nome: nomeFinal,
    nickname,
    google,
  };
}

/**
 * Atualiza o perfil (nome e/ou nickname) no banco de dados PostgreSQL
 */
export async function atualizarPerfilUsuarioNoBanco(dados: {
  nickname: string;
  nome?: string;
}): Promise<{ sucesso: boolean; usuario: InfoUsuario; erro?: string }> {
  const usuarioAtual = obterOuCriarUsuario();
  let nickLimpo = dados.nickname.trim();
  if (nickLimpo && !nickLimpo.startsWith("@")) {
    nickLimpo = `@${nickLimpo}`;
  }
  const nomeLimpo = (dados.nome || "").trim();

  try {
    const resp = await fetch("/api/usuario/perfil", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": usuarioAtual.id,
      },
      body: JSON.stringify({
        nickname: nickLimpo,
        nome: nomeLimpo,
      }),
    });

    const resultado = await resp.json();

    if (!resultado.sucesso) {
      return {
        sucesso: false,
        usuario: usuarioAtual,
        erro: resultado.erro || "Falha ao atualizar perfil no banco de dados.",
      };
    }

    if (nickLimpo) {
      localStorage.setItem(CHAVE_NICKNAME, nickLimpo);
    }
    if (nomeLimpo) {
      localStorage.setItem(CHAVE_NOME, nomeLimpo);
      if (usuarioAtual.google) {
        localStorage.setItem(CHAVE_GOOGLE_NOME, nomeLimpo);
      }
    }

    dispararEventoUsuarioMudou();
    const atualizado = obterOuCriarUsuario();

    return {
      sucesso: true,
      usuario: atualizado,
    };
  } catch (err: any) {
    if (nickLimpo) localStorage.setItem(CHAVE_NICKNAME, nickLimpo);
    if (nomeLimpo) localStorage.setItem(CHAVE_NOME, nomeLimpo);
    dispararEventoUsuarioMudou();
    return {
      sucesso: true,
      usuario: obterOuCriarUsuario(),
      erro: "Aviso: Salvo localmente, erro ao sincronizar com banco de dados: " + (err?.message || err),
    };
  }
}

export function salvarPerfilUsuario(novoNickname: string, novoNome?: string): InfoUsuario {
  let nickLimpo = novoNickname.trim();
  if (nickLimpo && !nickLimpo.startsWith("@")) {
    nickLimpo = `@${nickLimpo}`;
  }
  if (!nickLimpo || nickLimpo === "@") {
    nickLimpo = "@usuario";
  }

  localStorage.setItem(CHAVE_NICKNAME, nickLimpo);
  if (novoNome && novoNome.trim()) {
    localStorage.setItem(CHAVE_NOME, novoNome.trim());
  }

  // Sincroniza em segundo plano com o PostgreSQL
  const usuarioId = obterUsuarioId();
  fetch("/api/usuario/perfil", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
    },
    body: JSON.stringify({
      nickname: nickLimpo,
      nome: novoNome || "",
    }),
  }).catch((err) => console.warn("[PostgreSQL] Erro ao sincronizar update de perfil em segundo plano:", err));

  dispararEventoUsuarioMudou();
  return obterOuCriarUsuario();
}

export function obterUsuarioId(): string {
  return obterOuCriarUsuario().id;
}

export function jaNotificouPrimeiroAcesso(): boolean {
  return localStorage.getItem(CHAVE_NOTIFICADO) === "true";
}

export function marcarComoNotificado(): void {
  localStorage.setItem(CHAVE_NOTIFICADO, "true");
}

export async function registrarVisitaNoBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const usr = obterOuCriarUsuario();
    const google = obterGoogleUsuario();
    await fetch("/api/usuario/registrar-visita", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usuarioId: usr.id,
        nickname: usr.nickname,
        nome: usr.nome,
        email: google?.email,
        foto: google?.foto,
        googleId: google?.googleId,
        cadastrado: Boolean(google?.email),
      }),
    });
  } catch (err) {
    console.warn("Falha ao registrar visita do usuário no backend:", err);
  }
}

export interface InfoStatusBanido {
  banido: boolean;
  usuario?: string;
  motivo?: string;
  dataBanimento?: string;
}

export async function checarStatusBanimento(): Promise<InfoStatusBanido> {
  if (typeof window === "undefined") return { banido: false };

  const usuario = obterOuCriarUsuario();
  const google = obterGoogleUsuario();

  // Se já houver flag local
  const cachedBan = localStorage.getItem("telegroup_status_banido");
  let cachedInfo: InfoStatusBanido | null = null;
  if (cachedBan) {
    try {
      cachedInfo = JSON.parse(cachedBan);
    } catch {}
  }

  try {
    const params = new URLSearchParams();
    if (usuario.id) params.set("usuarioId", usuario.id);
    if (usuario.nickname) params.set("usuario", usuario.nickname);
    if (google?.email) params.set("email", google.email);

    const res = await fetch(`/api/usuario/status-banimento?${params.toString()}`, {
      headers: {
        "x-user-id": usuario.id,
        ...(google?.email ? { "x-google-email": google.email } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.banido) {
        const info: InfoStatusBanido = {
          banido: true,
          usuario: data.usuario || usuario.nickname,
          motivo: data.motivo || "Violação das regras e diretrizes da comunidade",
          dataBanimento: data.dataBanimento || new Date().toISOString(),
        };
        localStorage.setItem("telegroup_status_banido", JSON.stringify(info));
        return info;
      } else {
        localStorage.removeItem("telegroup_status_banido");
        return { banido: false };
      }
    }
  } catch {
    if (cachedInfo?.banido) return cachedInfo;
  }

  return cachedInfo?.banido ? cachedInfo : { banido: false };
}

