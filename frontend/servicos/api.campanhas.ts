import { obterUsuarioId, estaLogadoGoogle, obterGoogleUsuario } from "./usuario";

export interface CampanhaItem {
  id: string;
  usuarioId: string;
  nome: string;
  texto?: string;
  orcamentoDiario: number;
  link: string;
  status: "Ativa" | "Pausada" | "Encerrada";
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
  lucroPlataformaGerado?: number;
  consumoHoje?: number;
  indiceQualidade?: number;
  pagoComSaldo?: boolean;
}

export interface InfoSaldoCampanha {
  sucesso: boolean;
  usuarioId: string;
  usuario: string;
  saldo: number;
  saldoFormatado: string;
  investido: number;
  investidoFormatado: string;
  temSaldoSuficiente: boolean;
  saldoRestante: number;
  valorFaltante: number;
}

export interface MetricasCampanhasGerais {
  totalCampanhas: number;
  campanhasAtivas: number;
  visualizacoesTotais: number;
  cliquesTotais: number;
  gastoTotal: number;
  ctrGeral: number;
  cpmMedio: number;
}

export async function buscarCampanhas(busca?: string): Promise<CampanhaItem[]> {
  try {
    const usuarioId = obterUsuarioId();
    const params = new URLSearchParams();
    params.append("usuarioId", usuarioId);
    if (busca) params.append("busca", busca);

    const url = `/api/campanhas?${params.toString()}`;
    const resposta = await fetch(url, {
      headers: {
        "x-user-id": usuarioId,
      },
    });

    if (!resposta.ok) {
      throw new Error("Erro ao buscar campanhas");
    }
    const dados = await resposta.json();
    return dados.dados || [];
  } catch (err) {
    console.error("Falha ao carregar campanhas:", err);
    throw err;
  }
}

export async function buscarMetricasCampanhas(): Promise<MetricasCampanhasGerais> {
  try {
    const usuarioId = obterUsuarioId();
    const resposta = await fetch(`/api/campanhas/metricas?usuarioId=${usuarioId}`, {
      headers: {
        "x-user-id": usuarioId,
      },
    });

    if (!resposta.ok) {
      throw new Error("Erro ao buscar métricas");
    }
    const dados = await resposta.json();
    return dados.dados;
  } catch (err) {
    console.error("Falha ao carregar métricas de campanhas:", err);
    throw err;
  }
}

export async function buscarCampanhaPorId(id: string): Promise<CampanhaItem | null> {
  try {
    const usuarioId = obterUsuarioId();
    const resposta = await fetch(`/api/campanhas/${id}`, {
      headers: {
        "x-user-id": usuarioId,
      },
    });

    if (resposta.status === 404) {
      return null;
    }

    if (!resposta.ok) {
      throw new Error("Erro ao buscar campanha");
    }

    const dados = await resposta.json();
    return dados.dados || null;
  } catch (err) {
    console.error("Falha ao carregar campanha:", err);
    throw err;
  }
}

/**
 * Consulta o saldo de campanhas do usuário no backend
 */
export async function consultarSaldoUsuario(orcamento?: number): Promise<InfoSaldoCampanha> {
  const usuarioId = obterUsuarioId();
  const google = obterGoogleUsuario();
  const nickname = typeof localStorage !== "undefined" ? localStorage.getItem("flux_usuario_nickname") || "" : "";

  const params = new URLSearchParams();
  if (usuarioId) params.set("usuarioId", usuarioId);
  if (nickname) params.set("usuario", nickname);
  if (google?.email) params.set("email", google.email);
  if (orcamento !== undefined) params.set("orcamento", String(orcamento));

  const resposta = await fetch(`/api/usuario/saldo?${params.toString()}`, {
    headers: {
      "x-user-id": usuarioId,
      "x-usuario": nickname,
      ...(google?.email ? { "x-google-email": google.email } : {}),
    },
  });

  if (!resposta.ok) {
    throw new Error("Erro ao consultar saldo de campanhas");
  }

  const dados = await resposta.json();
  return dados;
}

export async function criarCampanha(dados: {
  nome: string;
  texto?: string;
  orcamentoDiario: number;
  link: string;
  categoria?: string;
  dataInicio?: string;
  horaInicio?: string;
  imagem?: string;
  tags?: string[];
  codigoPix?: string;
  usarSaldo?: boolean;
}): Promise<CampanhaItem> {
  if (!estaLogadoGoogle()) {
    throw new Error("Você precisa estar conectado com sua conta Google para criar campanhas.");
  }

  const usuarioId = obterUsuarioId();
  const google = obterGoogleUsuario();
  const nickname = typeof localStorage !== "undefined" ? localStorage.getItem("flux_usuario_nickname") || "" : "";

  const resposta = await fetch("/api/campanhas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
      "x-usuario": nickname,
      "x-google-auth": "true",
      "x-google-email": google?.email || "",
      "x-google-nome": encodeURIComponent(google?.nome || ""),
    },
    body: JSON.stringify({
      ...dados,
      usuarioId,
      usuario: nickname,
      googleEmail: google?.email,
      googleNome: google?.nome,
    }),
  });

  const json = await resposta.json();
  if (!resposta.ok || !json.sucesso) {
    if (json.banido || resposta.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "telegroup_status_banido",
          JSON.stringify({
            banido: true,
            motivo: json.motivo || "Violação das regras e diretrizes da comunidade",
          })
        );
        window.location.href = `/banido?motivo=${encodeURIComponent(json.motivo || "")}`;
      }
    }
    throw new Error(json.erro || "Falha ao criar campanha");
  }

  return json.dados;
}

export async function alterarStatusCampanha(
  id: string,
  status: "Ativa" | "Pausada" | "Encerrada"
): Promise<CampanhaItem> {
  const usuarioId = obterUsuarioId();
  const resposta = await fetch(`/api/campanhas/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
    },
    body: JSON.stringify({ status }),
  });

  const json = await resposta.json();
  if (!resposta.ok || !json.sucesso) {
    throw new Error(json.erro || "Falha ao alterar status");
  }

  return json.dados;
}

export async function deletarCampanha(id: string): Promise<boolean> {
  const usuarioId = obterUsuarioId();
  const resposta = await fetch(`/api/campanhas/${id}`, {
    method: "DELETE",
    headers: {
      "x-user-id": usuarioId,
    },
  });
  const json = await resposta.json();
  return json.sucesso === true;
}

export async function adicionarSaldoCampanha(
  id: string,
  valor: number
): Promise<CampanhaItem> {
  const usuarioId = obterUsuarioId();
  const resposta = await fetch(`/api/campanhas/${id}/saldo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": usuarioId,
    },
    body: JSON.stringify({ valor }),
  });

  const json = await resposta.json();
  if (!resposta.ok || !json.sucesso) {
    throw new Error(json.erro || "Falha ao adicionar saldo à campanha");
  }

  return json.dados;
}

export async function registrarCliqueCampanha(id: string): Promise<void> {
  try {
    const usuarioId = obterUsuarioId();
    await fetch(`/api/campanhas/${id}/clique`, {
      method: "POST",
      headers: {
        "x-user-id": usuarioId,
      },
    });
  } catch {}
}

export async function registrarVisualizacaoCampanha(id: string): Promise<void> {
  try {
    const usuarioId = obterUsuarioId();
    await fetch(`/api/campanhas/${id}/visualizacao`, {
      method: "POST",
      headers: {
        "x-user-id": usuarioId,
      },
    });
  } catch {}
}
