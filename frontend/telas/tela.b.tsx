import {
  Loader2,
  ShieldCheck,
  Users,
  CheckCircle2,
  LogOut,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { useState, useEffect } from "react";

import {
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";

import {
  obterGoogleUsuario,
  salvarLoginGoogle,
  fazerLogoutGoogle,
  InfoUsuarioGoogle,
  obterOuCriarUsuario,
} from "../servicos/usuario";

import CabecalhoLoginGoogle from "../componentes/cabecalho.login.google";

function GoogleIconSvg({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function TelaBloqueioLoginGoogle() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const destino =
    searchParams.get("destino") ||
    (location.state as { destino?: string })?.destino ||
    "/";

  const [usuarioGoogle, setUsuarioGoogle] =
    useState<InfoUsuarioGoogle | null>(null);

  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [popupBloqueado, setPopupBloqueado] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");

  useEffect(() => {
    const atual = obterGoogleUsuario();
    setUsuarioGoogle(atual);
  }, []);

  // Carrega o Client ID do Google sem renderizar um segundo botão.
  useEffect(() => {
    let montado = true;

    async function carregarConfigGoogle() {
      try {
        let clientId =
          (
            import.meta as unknown as {
              env?: {
                VITE_GOOGLE_CLIENT_ID?: string;
              };
            }
          ).env?.VITE_GOOGLE_CLIENT_ID || "";

        if (!clientId) {
          try {
            const resp = await fetch("/api/auth/google-config");

            if (resp.ok) {
              const dados = await resp.json();

              if (dados?.clientId) {
                clientId = dados.clientId;
              }
            }
          } catch {
            // A configuração também pode vir da variável de ambiente.
          }
        }

        if (montado) {
          setGoogleClientId(clientId);
        }
      } catch (err) {
        console.warn(
          "[Google Auth] Não foi possível carregar a configuração.",
          err
        );
      }
    }

    carregarConfigGoogle();

    return () => {
      montado = false;
    };
  }, []);

  function abrirJanelaGoogleOficial() {
    setErroLogin(null);
    setPopupBloqueado(false);

    const win = window as any;

    if (!googleClientId) {
      setErroLogin(
        "O Client ID do Google não está configurado no servidor (GOOGLE_CLIENT_ID). Configure suas credenciais para permitir o login oficial."
      );
      return;
    }

    if (!win.google?.accounts?.oauth2) {
      setErroLogin(
        "A biblioteca do Google ainda está carregando. Aguarde 2 segundos e clique novamente."
      );
      return;
    }

    try {
      setCarregando(true);

      const tokenClient =
        win.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",

          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setCarregando(false);

              if (
                tokenResponse.error === "popup_blocked_by_browser" ||
                tokenResponse.error === "popup_failed_to_open"
              ) {
                setPopupBloqueado(true);
                setErroLogin(
                  "O pop-up do Google foi bloqueado pelo navegador. Permita pop-ups para este site e tente novamente."
                );
              } else if (
                tokenResponse.error === "popup_closed_by_user"
              ) {
                setErroLogin(
                  "A janela do Google foi fechada antes de concluir o login."
                );
              } else {
                setErroLogin(
                  `Erro de autenticação Google: ${tokenResponse.error}`
                );
              }

              return;
            }

            if (!tokenResponse?.access_token) {
              setCarregando(false);
              setErroLogin(
                "Nenhum token de acesso foi retornado pelo Google. Tente novamente."
              );
              return;
            }

            try {
              const userinfoRes = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                  headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                  },
                }
              );

              if (!userinfoRes.ok) {
                throw new Error(
                  "Não foi possível obter os dados da sua conta Google."
                );
              }

              const perfilGoogle = await userinfoRes.json();

              if (!perfilGoogle?.email) {
                throw new Error(
                  "Sua conta Google não forneceu um endereço de email."
                );
              }

              await finalizarAutenticacaoNoServidor({
                email: perfilGoogle.email,
                name: perfilGoogle.name,
                picture: perfilGoogle.picture,
                googleId: perfilGoogle.sub,
                accessToken: tokenResponse.access_token,
              });
            } catch (err: any) {
              console.error(
                "[Google Auth] Erro ao obter perfil:",
                err
              );

              setErroLogin(
                err?.message ||
                  "Erro ao obter informações do perfil Google."
              );

              setCarregando(false);
            }
          },

          error_callback: (err: any) => {
            setCarregando(false);
            setPopupBloqueado(true);

            const msg =
              err?.message ||
              "O pop-up de login do Google foi bloqueado. Habilite pop-ups nas configurações do navegador.";

            setErroLogin(msg);
          },
        });

      tokenClient.requestAccessToken({
        prompt: "select_account",
      });
    } catch (err: any) {
      setCarregando(false);
      setPopupBloqueado(true);

      setErroLogin(
        "Não foi possível abrir o pop-up do Google. Verifique se os pop-ups estão habilitados."
      );
    }
  }

  async function finalizarAutenticacaoNoServidor(
    dadosGoogle: {
      email: string;
      name?: string;
      picture?: string;
      googleId?: string;
      accessToken?: string;
    }
  ) {
    try {
      const idAnonimoAtual = obterOuCriarUsuario().id;

      const resp = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": idAnonimoAtual,
        },
        body: JSON.stringify({
          ...dadosGoogle,
          idAnonimo: idAnonimoAtual,
        }),
      });

      const resultado = await resp.json();

      if (
        !resp.ok ||
        !resultado.sucesso ||
        !resultado.usuario
      ) {
        throw new Error(
          resultado.erro ||
            "Falha ao registrar conta Google no servidor."
        );
      }

      const usuarioSalvo = resultado.usuario;

      const usuarioFinal = salvarLoginGoogle({
        email: usuarioSalvo.email,
        nome: usuarioSalvo.nome,
        foto: usuarioSalvo.foto,
        googleId: usuarioSalvo.googleId,
        nickname: usuarioSalvo.nickname,
        id: usuarioSalvo.id,
      });

      setUsuarioGoogle(usuarioFinal.google || null);
      setCarregando(false);

      navigate(destino, { replace: true });
    } catch (err: any) {
      console.error(
        "[Servidor] Erro ao salvar login Google:",
        err
      );

      // Mantém o fallback local existente.
      try {
        const usuarioFinal = salvarLoginGoogle({
          email: dadosGoogle.email,
          nome:
            dadosGoogle.name ||
            dadosGoogle.email.split("@")[0],
          foto: dadosGoogle.picture,
          googleId:
            dadosGoogle.googleId || `gid_${Date.now()}`,
        });

        setUsuarioGoogle(usuarioFinal.google || null);
        setCarregando(false);

        navigate(destino, { replace: true });
      } catch (localErr: any) {
        setErroLogin(
          err?.message || "Erro ao conectar conta Google."
        );

        setCarregando(false);
      }
    }
  }

  function handleLogout() {
    fazerLogoutGoogle();
    setUsuarioGoogle(null);
  }

  function continuarParaDestino() {
    navigate(destino, { replace: true });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(ellipse at top, #182b46 0%, #11151b 48%, #0b0e13 100%)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <CabecalhoLoginGoogle />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(27, 38, 55, 0.98), rgba(17, 23, 33, 0.98))",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              borderRadius: "20px",
              padding: "32px 26px",
              boxSizing: "border-box",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.35)",
            }}
          >
            {/* Logo TeleGroup */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                marginBottom: "26px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  background:
                    "linear-gradient(145deg, #3b82f6, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  boxShadow:
                    "0 8px 28px rgba(37, 99, 235, 0.3)",
                }}
              >
                <Users
                  size={30}
                  color="#ffffff"
                  strokeWidth={2.2}
                />
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#f8fafc",
                  fontSize: "27px",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                }}
              >
                Tele
                <span style={{ color: "#60a5fa" }}>
                  Group
                </span>
              </h1>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                Sua comunidade começa aqui.
              </p>
            </div>

            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.2), transparent)",
                marginBottom: "22px",
              }}
            />

            {/* Usuário já conectado com o Google */}
            {usuarioGoogle ? (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(34, 197, 94, 0.12)",
                    border:
                      "1px solid rgba(34, 197, 94, 0.3)",
                    padding: "8px 16px",
                    borderRadius: "30px",
                    color: "#4ade80",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "16px",
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Conta Google conectada</span>
                </div>

                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border:
                      "1px solid rgba(148, 163, 184, 0.12)",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "20px",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      color: "#f8fafc",
                      fontWeight: 700,
                      fontSize: "15px",
                    }}
                  >
                    {usuarioGoogle.nome}
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      marginTop: "2px",
                    }}
                  >
                    {usuarioGoogle.email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={continuarParaDestino}
                  style={{
                    width: "100%",
                    minHeight: "48px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    background:
                      "linear-gradient(145deg, #2563eb, #1d4ed8)",
                    border: "none",
                    borderRadius: "11px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow:
                      "0 4px 14px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  <span>Continuar</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    marginTop: "12px",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <LogOut size={13} />
                  <span>Trocar de conta Google</span>
                </button>
              </div>
            ) : (
              /* Usuário ainda não conectado */
              <div>
                <div
                  style={{
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#e2e8f0",
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Acesse com sua Conta Google
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Para garantir a segurança da comunidade, o
                    cadastro e a publicação exigem autenticação
                    com conta Google.
                  </p>
                </div>

                {/* Mensagem de erro */}
                {erroLogin && (
                  <div
                    role="alert"
                    style={{
                      marginBottom: "18px",
                      padding: "14px 16px",
                      background: popupBloqueado
                        ? "rgba(245, 158, 11, 0.12)"
                        : "rgba(239, 68, 68, 0.10)",
                      border: popupBloqueado
                        ? "1px solid rgba(245, 158, 11, 0.35)"
                        : "1px solid rgba(239, 68, 68, 0.28)",
                      borderRadius: "12px",
                      color: popupBloqueado
                        ? "#fcd34d"
                        : "#fca5a5",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        marginBottom: popupBloqueado ? "8px" : 0,
                      }}
                    >
                      <AlertTriangle
                        size={18}
                        style={{
                          flexShrink: 0,
                          marginTop: "2px",
                          color: popupBloqueado
                            ? "#fbbf24"
                            : "#f87171",
                        }}
                      />

                      <div>
                        {popupBloqueado ? (
                          <>
                            <strong
                              style={{
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Pop-up bloqueado pelo navegador
                            </strong>
                            <span>{erroLogin}</span>
                          </>
                        ) : (
                          <span>{erroLogin}</span>
                        )}
                      </div>
                    </div>

                    {popupBloqueado && (
                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "8px",
                          borderTop:
                            "1px solid rgba(245, 158, 11, 0.2)",
                          fontSize: "12px",
                          color: "#fde68a",
                        }}
                      >
                        💡 <strong>Como desbloquear:</strong>{" "}
                        clique no ícone de pop-up bloqueado na
                        barra de endereços e escolha{" "}
                        <em>"Sempre permitir pop-ups"</em>. Em
                        seguida, tente novamente.
                      </div>
                    )}
                  </div>
                )}

                {/* Único botão de login com Google */}
                <button
                  type="button"
                  onClick={abrirJanelaGoogleOficial}
                  disabled={carregando}
                  style={{
                    width: "100%",
                    minHeight: "50px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    background: "#ffffff",
                    border: "1px solid #dadce0",
                    borderRadius: "11px",
                    color: "#3c4043",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: carregando ? "wait" : "pointer",
                    opacity: carregando ? 0.7 : 1,
                    boxShadow:
                      "0 2px 8px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {carregando ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      <span>Conectando com o Google...</span>
                    </>
                  ) : popupBloqueado ? (
                    <>
                      <RefreshCw
                        size={18}
                        color="#2563eb"
                      />
                      <span>
                        Tentar novamente com o Google
                      </span>
                    </>
                  ) : (
                    <>
                      <GoogleIconSvg size={19} />
                      <span>Entrar com o Google</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Selo de segurança */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                marginTop: "20px",
                color: "#64748b",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              <ShieldCheck
                size={15}
                color="#60a5fa"
              />
              <span>
                Autenticação protegida exclusivamente pelo Google
              </span>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "12px",
              marginTop: "18px",
              lineHeight: 1.6,
            }}
          >
            TeleGroup · Somente contas Google autênticas são aceitas
          </p>
        </div>
      </div>
    </div>
  );
}