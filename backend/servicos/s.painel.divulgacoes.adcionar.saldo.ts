import fs from "fs";
import path from "path";
import { pool, obterStatusBanco } from "../banco.dados";
import { API_URL, PAINEL_CHAVE_SECRETA, CHAVE_SECRETA_TELEGROUP } from "../configuracao/variaveis";
import { LoggerInformativo } from "./s.comunicacao";
import { formatarMoedaReais, ArrecadacaoServico } from "./s.painel.arrecadacao";
import { ComunicacaoServico } from "./s.painel.comunicacao";

export interface EntradaAdicionarSaldo {
  usuario: string; // Ex: "@licasd", "licasd", "usr_123" ou email
  valor: number | string; // Ex: 12.90, "12,90", "12.90", "R$ 12,90"
  motivo?: string;
  origem?: string;
  operador?: string;
}

export interface RespostaAdicionarSaldo {
  sucesso: boolean;
  mensagem: string;
  usuario: string;
  usuarioId: string;
  nome: string;
  valor: number;
  valorFormatado: string;
  saldoAnterior: number;
  saldoAnteriorFormatado: string;
  novoSaldo: number;
  novoSaldoFormatado: string;
  totalInvestido: number;
  totalInvestidoFormatado: string;
  transacaoId: string;
  campanhasAtualizadas: number;
  timestamp: string;
}

const ARQUIVO_USUARIOS_METRICAS = path.resolve(process.cwd(), "usuarios_metricas.dados.json");
const ARQUIVO_CAMPANHAS = path.resolve(process.cwd(), "campanhas.dados.json");
const ARQUIVO_TRANSACOES = path.resolve(process.cwd(), "transacoes_pix.dados.json");

function lerJsonSeguro<T>(caminho: string, padrao: T): T {
  try {
    if (fs.existsSync(caminho)) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return JSON.parse(conteudo || "{}");
    }
  } catch (err) {
    console.warn(`[AdicionarSaldo] Erro ao ler ${caminho}:`, err);
  }
  return padrao;
}

function salvarJsonSeguro(caminho: string, dados: any): void {
  try {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf-8");
  } catch (err) {
    console.error(`[AdicionarSaldo] Erro ao salvar ${caminho}:`, err);
  }
}

/**
 * Converte qualquer formato de valor (ex: "12,90", "12.90", "R$ 12,90", 12.9) para number
 */
export function converterValorNumerico(valor: number | string): number {
  if (typeof valor === "number") {
    if (isNaN(valor) || valor <= 0) {
      throw new Error("O valor informado deve ser um número positivo maior que zero.");
    }
    return Number(valor.toFixed(2));
  }

  if (typeof valor === "string") {
    const limpo = valor
      .replace(/r\$/gi, "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    const num = parseFloat(limpo);
    if (isNaN(num) || num <= 0) {
      throw new Error(`Valor monetário inválido: "${valor}". Exemplo esperado: 12,90 ou 12.90`);
    }
    return Number(num.toFixed(2));
  }

  throw new Error("Formato de valor inválido.");
}

/**
 * Normaliza o handle/identificador de usuário (ex: "@licasd" -> "@licasd")
 */
export function normalizarHandleUsuario(identificador: string): { handle: string; nicknameLimpo: string } {
  const limpo = (identificador || "").trim();
  if (!limpo) {
    throw new Error("O identificador do usuário (@) é obrigatório.");
  }

  const handle = limpo.startsWith("@") ? limpo.toLowerCase() : `@${limpo.toLowerCase()}`;
  const nicknameLimpo = handle.replace(/^@/, "");

  return { handle, nicknameLimpo };
}

export const PainelAdicionarSaldoServico = {
  /**
   * Adiciona saldo diretamente na conta de um usuário definido pelo painel através do @
   * Exemplo: @licasd e 12,90
   * O valor fica disponível imediatamente para realização de campanhas.
   */
  async adicionarSaldo(entrada: EntradaAdicionarSaldo): Promise<RespostaAdicionarSaldo> {
    const valorNumerico = converterValorNumerico(entrada.valor);
    const { handle, nicknameLimpo } = normalizarHandleUsuario(entrada.usuario);

    const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    if (!dadosUsuarios.visitas) {
      dadosUsuarios.visitas = {};
    }

    // 1. Localiza o usuário em memória / arquivo local
    let usuarioEncontradoId: string | null = null;
    let usuarioObj: any = null;

    for (const [id, u] of Object.entries(dadosUsuarios.visitas as Record<string, any>)) {
      const uNick = (u.nickname || "").trim().toLowerCase();
      const uNome = (u.nome || "").trim().toLowerCase();
      const uEmail = (u.email || "").trim().toLowerCase();
      const uId = (u.usuarioId || id || "").trim().toLowerCase();

      if (
        uNick === handle ||
        uNick === nicknameLimpo ||
        uNick.replace(/^@/, "") === nicknameLimpo ||
        uNome === handle ||
        uNome === nicknameLimpo ||
        uEmail === nicknameLimpo ||
        uEmail === handle ||
        uEmail.split("@")[0] === nicknameLimpo ||
        uId === nicknameLimpo ||
        uId === handle ||
        uId.includes(nicknameLimpo)
      ) {
        usuarioEncontradoId = id;
        usuarioObj = u;
        break;
      }
    }

    // 2. Se não encontrou no JSON, tenta buscar no PostgreSQL caso conectado
    let usouPostgres = false;
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado) {
        const res = await pool.query(
          `SELECT id, email, nome, nickname FROM usuarios 
           WHERE LOWER(nickname) = $1 
              OR LOWER(nickname) = $2 
              OR LOWER(REPLACE(nickname, '@', '')) = $2
              OR LOWER(nome) = $1 
              OR LOWER(nome) = $2 
              OR LOWER(SPLIT_PART(email, '@', 1)) = $2
              OR LOWER(email) = $2 
              OR LOWER(id) = $2 
           LIMIT 1`,
          [handle, nicknameLimpo]
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];
          usuarioEncontradoId = row.id;
          if (!usuarioObj) {
            usuarioObj = {
              usuarioId: row.id,
              nome: row.nome || handle,
              nickname: row.nickname || handle,
              email: row.email,
              primeiroAcesso: new Date().toISOString(),
              ultimoAcesso: new Date().toISOString(),
              cadastrado: true,
              saldo: 0,
              investido: 0,
            };
          }
          usouPostgres = true;
        }
      }
    } catch (err: any) {
      console.warn("[AdicionarSaldo] Erro na consulta PostgreSQL:", err.message);
    }

    // 3. Se o usuário ainda não existir na plataforma, cria a conta dele automaticamente
    // garantindo que o saldo seja creditado na hora
    const agoraIso = new Date().toISOString();
    if (!usuarioObj || !usuarioEncontradoId) {
      usuarioEncontradoId = `usr_${nicknameLimpo}_${Date.now().toString(36)}`;
      const nomeFormatado = nicknameLimpo.charAt(0).toUpperCase() + nicknameLimpo.slice(1);
      usuarioObj = {
        usuarioId: usuarioEncontradoId,
        primeiroAcesso: agoraIso,
        ultimoAcesso: agoraIso,
        cadastrado: false,
        totalRequisicoes: 1,
        nome: nomeFormatado,
        nickname: handle,
        saldo: 0,
        investido: 0,
        campanhas: 0,
        publicacoes: 0,
      };
      dadosUsuarios.visitas[usuarioEncontradoId] = usuarioObj;
    }

    // 4. Calcula o novo saldo e o total investido
    const saldoAnterior = Number(usuarioObj.saldo || 0);
    const novoSaldo = Number((saldoAnterior + valorNumerico).toFixed(2));

    const investidoAnterior = Number(usuarioObj.investido || 0);
    const novoInvestido = Number((investidoAnterior + valorNumerico).toFixed(2));

    usuarioObj.saldo = novoSaldo;
    usuarioObj.saldoCampanhas = novoSaldo;
    usuarioObj.investido = novoInvestido;
    usuarioObj.ultimoAcesso = agoraIso;
    dadosUsuarios.visitas[usuarioEncontradoId] = usuarioObj;
    dadosUsuarios.ultimaAtualizacao = agoraIso;

    // Salva no arquivo de métricas de usuários
    salvarJsonSeguro(ARQUIVO_USUARIOS_METRICAS, dadosUsuarios);

    // 5. Atualiza créditos nas campanhas do usuário (se houver alguma ativa ou precisando de saldo)
    let campanhasAtualizadas = 0;
    const listaCampanhas = lerJsonSeguro<any[]>(ARQUIVO_CAMPANHAS, []);
    let alterouCampanhas = false;

    for (const c of listaCampanhas) {
      const matchUsuario =
        c.usuarioId === usuarioEncontradoId ||
        c.usuario === usuarioEncontradoId ||
        (c.usuario && c.usuario.toLowerCase() === handle) ||
        (c.usuario && c.usuario.toLowerCase() === nicknameLimpo) ||
        (c.usuario && c.usuario.toLowerCase().replace(/^@/, "") === nicknameLimpo) ||
        (usuarioObj && c.usuarioId === usuarioObj.usuarioId);

      if (matchUsuario) {
        c.saldoCreditos = Number(((c.saldoCreditos || 0) + valorNumerico).toFixed(2));
        if (
          (c.status === "Pausada" || c.status === "Aguardando Pagamento" || (c as any).status === "Pendente") &&
          (c.saldoCreditos || valorNumerico) >= Number(c.orcamentoDiario || 0)
        ) {
          c.status = "Ativa";
        }
        campanhasAtualizadas++;
        alterouCampanhas = true;
      }
    }

    if (alterouCampanhas) {
      salvarJsonSeguro(ARQUIVO_CAMPANHAS, listaCampanhas);
    }

    // 6. Atualiza no PostgreSQL caso conectado
    try {
      const statusBanco = await obterStatusBanco();
      if (statusBanco.conectado && usuarioEncontradoId) {
        await pool.query(
          `INSERT INTO usuarios (id, nome, nickname, cadastrado, ultimo_acesso)
           VALUES ($1, $2, $3, false, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             ultimo_acesso = NOW()`,
          [usuarioEncontradoId, usuarioObj.nome || handle, handle]
        );

        if (alterouCampanhas) {
          await pool.query(
            `UPDATE campanhas 
             SET saldo_creditos = saldo_creditos + $1 
             WHERE usuario_id = $2 OR usuario = $3`,
            [valorNumerico, usuarioEncontradoId, handle]
          );
        }
      }
    } catch (errPostgres: any) {
      console.warn("[AdicionarSaldo] Erro ao sincronizar saldo no PostgreSQL:", errPostgres.message);
    }

    // 7. Registra transação financeira correspondente para que apareça na arrecadação real
    const transacaoId = `recarga_painel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const transacoesMap = lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {});

    transacoesMap[transacaoId] = {
      txId: transacaoId,
      usuarioId: usuarioEncontradoId,
      usuario: handle,
      nome: usuarioObj.nome || handle,
      valor: valorNumerico,
      status: "PAID",
      pagoEm: agoraIso,
      criadoEm: agoraIso,
      origem: entrada.origem || "painel_administrativo",
      descricao: entrada.motivo || `Saldo adicionado via painel para campanhas: ${formatarMoedaReais(valorNumerico)}`,
      operador: entrada.operador || "administrador",
    };
    salvarJsonSeguro(ARQUIVO_TRANSACOES, transacoesMap);

    // Registra no serviço de arrecadação em memória
    await ArrecadacaoServico.registrarTransacao({
      valor: valorNumerico,
      origem: "painel",
      descricao: `Saldo creditado para ${handle}: ${formatarMoedaReais(valorNumerico)}`,
      data: agoraIso,
    });

    const valorFormatado = formatarMoedaReais(valorNumerico);
    const saldoAnteriorFormatado = formatarMoedaReais(saldoAnterior);
    const novoSaldoFormatado = formatarMoedaReais(novoSaldo);
    const totalInvestidoFormatado = formatarMoedaReais(novoInvestido);

    LoggerInformativo.info(
      `[s.painel.adcionar.saldo] Saldo de ${valorFormatado} adicionado para ${handle}. Saldo atual: ${novoSaldoFormatado}`
    );

    // 8. Notifica o Website 1 (Painel) em tempo real sobre a recarga concluída
    ComunicacaoServico.dispararWebhookParaWebsite1("saldo_adicionado_painel", "arrecadacao", {
      usuario: handle,
      usuarioId: usuarioEncontradoId,
      valor: valorNumerico,
      valorFormatado,
      novoSaldo,
      novoSaldoFormatado,
      transacaoId,
    }).catch(() => {});

    return {
      sucesso: true,
      mensagem: `Saldo de ${valorFormatado} adicionado com sucesso na conta de ${handle}. O valor já está disponível para criação de campanhas!`,
      usuario: handle,
      usuarioId: usuarioEncontradoId,
      nome: usuarioObj.nome || handle,
      valor: valorNumerico,
      valorFormatado,
      saldoAnterior,
      saldoAnteriorFormatado,
      novoSaldo,
      novoSaldoFormatado,
      totalInvestido: novoInvestido,
      totalInvestidoFormatado,
      transacaoId,
      campanhasAtualizadas,
      timestamp: agoraIso,
    };
  },

  /**
   * Consulta o saldo atual de um usuário pelo @, usuarioId, email ou filtros combinados
   */
  async consultarSaldo(
    identificador: string | {
      usuario?: string;
      arroba?: string;
      handle?: string;
      nickname?: string;
      usuarioId?: string;
      id?: string;
      email?: string;
      googleEmail?: string;
    },
    orcamento?: number
  ): Promise<{
    sucesso: boolean;
    usuario: string;
    usuarioId: string;
    saldo: number;
    saldoFormatado: string;
    investido: number;
    investidoFormatado: string;
    temSaldoSuficiente: boolean;
    saldoRestante: number;
    valorFaltante: number;
  }> {
    const termos: string[] = [];
    if (typeof identificador === "string") {
      const limpo = identificador.trim();
      if (limpo) {
        termos.push(limpo);
        if (limpo.startsWith("@")) termos.push(limpo.substring(1));
        else if (!limpo.includes("@")) termos.push(`@${limpo}`);
      }
    } else if (identificador && typeof identificador === "object") {
      const valores = [
        identificador.usuario,
        identificador.arroba,
        identificador.handle,
        identificador.nickname,
        identificador.usuarioId,
        identificador.id,
        identificador.email,
        identificador.googleEmail,
      ];
      for (const v of valores) {
        if (v && typeof v === "string" && v.trim()) {
          const limpo = v.trim();
          termos.push(limpo);
          if (limpo.startsWith("@")) termos.push(limpo.substring(1));
          else if (!limpo.includes("@")) termos.push(`@${limpo}`);
        }
      }
    }

    const termosLower = termos.map((t) => t.toLowerCase());
    const handlePadrao = termos[0]
      ? termos[0].startsWith("@")
        ? termos[0]
        : `@${termos[0]}`
      : "@usuario";

    const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    let usuarioObj: any = null;
    let usuarioId: string = "";

    const candidatos: Array<{ id: string; obj: any; saldo: number }> = [];

    for (const [id, u] of Object.entries(dadosUsuarios.visitas as Record<string, any>)) {
      const uNick = (u.nickname || "").trim().toLowerCase();
      const uNickSemArroba = uNick.replace(/^@/, "");
      const uNome = (u.nome || "").trim().toLowerCase();
      const uEmail = (u.email || "").trim().toLowerCase();
      const uEmailPrefixo = uEmail.split("@")[0];
      const uId = (u.usuarioId || id || "").trim().toLowerCase();
      const saldo = Number(u.saldo || u.saldoCampanhas || 0);

      const deuMatch = termosLower.some((t) => {
        const tSemArroba = t.replace(/^@/, "");
        const tEmailPrefixo = t.includes("@") ? t.split("@")[0] : tSemArroba;

        return (
          uId === t ||
          uId === tSemArroba ||
          uEmail === t ||
          uEmail === tSemArroba ||
          uNick === t ||
          uNick === `@${tSemArroba}` ||
          uNickSemArroba === tSemArroba ||
          uNome === t ||
          uNome === tSemArroba ||
          (tEmailPrefixo && (uEmailPrefixo === tEmailPrefixo || uNickSemArroba === tEmailPrefixo))
        );
      });

      if (deuMatch) {
        candidatos.push({ id, obj: u, saldo });
      }
    }

    // Se encontrou candidatos, prioriza o que possui maior saldo disponível
    if (candidatos.length > 0) {
      candidatos.sort((a, b) => b.saldo - a.saldo);
      usuarioObj = candidatos[0].obj;
      usuarioId = candidatos[0].id;
    }

    // Se não encontrou no JSON, busca no PostgreSQL caso conectado
    if (!usuarioObj) {
      try {
        const statusBanco = await obterStatusBanco();
        if (statusBanco.conectado && termosLower.length > 0) {
          const res = await pool.query(
            `SELECT id, email, nome, nickname FROM usuarios 
             WHERE LOWER(nickname) = ANY($1) 
                OR LOWER(REPLACE(nickname, '@', '')) = ANY($1)
                OR LOWER(email) = ANY($1) 
                OR LOWER(id) = ANY($1) 
             LIMIT 1`,
            [termosLower]
          );
          if (res.rows.length > 0) {
            usuarioId = res.rows[0].id;
          }
        }
      } catch {}
    }

    const saldo = Number(usuarioObj?.saldo ?? usuarioObj?.saldoCampanhas ?? 0);
    const investido = Number(usuarioObj?.investido || 0);
    const orcamentoNum = Number(orcamento || 0);
    const temSaldoSuficiente = orcamentoNum > 0 ? saldo >= orcamentoNum : saldo > 0;
    const saldoRestante = Math.max(0, Number((saldo - orcamentoNum).toFixed(2)));
    const valorFaltante = Math.max(0, Number((orcamentoNum - saldo).toFixed(2)));

    return {
      sucesso: true,
      usuario: usuarioObj?.nickname || handlePadrao,
      usuarioId: usuarioId || usuarioObj?.usuarioId || handlePadrao,
      saldo,
      saldoFormatado: formatarMoedaReais(saldo),
      investido,
      investidoFormatado: formatarMoedaReais(investido),
      temSaldoSuficiente,
      saldoRestante,
      valorFaltante,
    };
  },

  /**
   * Deduz saldo da conta do usuário para ativação de campanha
   */
  async deduzirSaldoCampanha(
    identificador: string | {
      usuario?: string;
      arroba?: string;
      handle?: string;
      nickname?: string;
      usuarioId?: string;
      id?: string;
      email?: string;
      googleEmail?: string;
    },
    valor: number,
    motivo: string = "Consumo de saldo para ativação de campanha"
  ): Promise<{ sucesso: boolean; novoSaldo: number; saldoAnterior: number; usuarioId: string }> {
    const valorNum = Number(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      throw new Error("Valor a deduzir inválido.");
    }

    const termos: string[] = [];
    if (typeof identificador === "string") {
      const limpo = identificador.trim();
      if (limpo) {
        termos.push(limpo);
        if (limpo.startsWith("@")) termos.push(limpo.substring(1));
        else if (!limpo.includes("@")) termos.push(`@${limpo}`);
      }
    } else if (identificador && typeof identificador === "object") {
      const valores = [
        identificador.usuario,
        identificador.arroba,
        identificador.handle,
        identificador.nickname,
        identificador.usuarioId,
        identificador.id,
        identificador.email,
        identificador.googleEmail,
      ];
      for (const v of valores) {
        if (v && typeof v === "string" && v.trim()) {
          const limpo = v.trim();
          termos.push(limpo);
          if (limpo.startsWith("@")) termos.push(limpo.substring(1));
          else if (!limpo.includes("@")) termos.push(`@${limpo}`);
        }
      }
    }

    const termosLower = termos.map((t) => t.toLowerCase());
    const handlePadrao = termos[0]
      ? termos[0].startsWith("@")
        ? termos[0]
        : `@${termos[0]}`
      : "@usuario";

    const dadosUsuarios = lerJsonSeguro<any>(ARQUIVO_USUARIOS_METRICAS, { visitas: {} });
    let usuarioObj: any = null;
    let usuarioId: string = "";

    const candidatos: Array<{ id: string; obj: any; saldo: number }> = [];

    for (const [id, u] of Object.entries(dadosUsuarios.visitas as Record<string, any>)) {
      const uNick = (u.nickname || "").trim().toLowerCase();
      const uNickSemArroba = uNick.replace(/^@/, "");
      const uNome = (u.nome || "").trim().toLowerCase();
      const uEmail = (u.email || "").trim().toLowerCase();
      const uEmailPrefixo = uEmail.split("@")[0];
      const uId = (u.usuarioId || id || "").trim().toLowerCase();
      const saldo = Number(u.saldo || u.saldoCampanhas || 0);

      const deuMatch = termosLower.some((t) => {
        const tSemArroba = t.replace(/^@/, "");
        const tEmailPrefixo = t.includes("@") ? t.split("@")[0] : tSemArroba;

        return (
          uId === t ||
          uId === tSemArroba ||
          uEmail === t ||
          uEmail === tSemArroba ||
          uNick === t ||
          uNick === `@${tSemArroba}` ||
          uNickSemArroba === tSemArroba ||
          uNome === t ||
          uNome === tSemArroba ||
          (tEmailPrefixo && (uEmailPrefixo === tEmailPrefixo || uNickSemArroba === tEmailPrefixo))
        );
      });

      if (deuMatch) {
        candidatos.push({ id, obj: u, saldo });
      }
    }

    if (candidatos.length > 0) {
      candidatos.sort((a, b) => b.saldo - a.saldo);
      usuarioObj = candidatos[0].obj;
      usuarioId = candidatos[0].id;
    }

    if (!usuarioObj) {
      throw new Error(`Usuário ${handlePadrao} não encontrado para dedução de saldo.`);
    }

    const saldoAnterior = Number(usuarioObj.saldo ?? usuarioObj.saldoCampanhas ?? 0);
    if (saldoAnterior < valorNum) {
      throw new Error(
        `Saldo insuficiente para dedução. Disponível: ${formatarMoedaReais(saldoAnterior)}, necessário: ${formatarMoedaReais(valorNum)}.`
      );
    }

    const novoSaldo = Number((saldoAnterior - valorNum).toFixed(2));
    usuarioObj.saldo = novoSaldo;
    usuarioObj.saldoCampanhas = novoSaldo;
    usuarioObj.ultimoAcesso = new Date().toISOString();

    dadosUsuarios.visitas[usuarioId] = usuarioObj;
    dadosUsuarios.ultimaAtualizacao = new Date().toISOString();
    salvarJsonSeguro(ARQUIVO_USUARIOS_METRICAS, dadosUsuarios);

    // Registra auditoria na tabela de transações
    const transacaoId = `uso_saldo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const transacoesMap = lerJsonSeguro<Record<string, any>>(ARQUIVO_TRANSACOES, {});
    transacoesMap[transacaoId] = {
      txId: transacaoId,
      usuarioId,
      usuario: usuarioObj.nickname || handlePadrao,
      nome: usuarioObj.nome || handlePadrao,
      valor: valorNum,
      status: "PAID",
      pagoEm: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
      origem: "saldo_campanhas",
      descricao: motivo,
      operador: "sistema",
    };
    salvarJsonSeguro(ARQUIVO_TRANSACOES, transacoesMap);

    return {
      sucesso: true,
      novoSaldo,
      saldoAnterior,
      usuarioId,
    };
  },
};

export default PainelAdicionarSaldoServico;
