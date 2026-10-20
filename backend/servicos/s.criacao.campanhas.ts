import { RepositorioCampanhas } from "../repositorios/repositorio.campanhas";
import {
  Campanha,
  CriarCampanhaInput,
  StatusCampanha,
  MetricasCampanhas,
  validarCriarCampanha,
} from "../schemas/schema.campanhas";

export const CampanhasServico = {
  /**
   * Lista campanhas aplicando regras e filtros de usuário
   */
  async listar(filtros: { usuarioId?: string; busca?: string; status?: string }): Promise<Campanha[]> {
    return await RepositorioCampanhas.buscarTodas(filtros);
  },

  /**
   * Consolida métricas gerais e calcula indicadores de performance (CTR e CPM)
   */
  async obterMetricasConsolidadas(usuarioId?: string): Promise<MetricasCampanhas> {
    const lista = await RepositorioCampanhas.buscarTodas(usuarioId ? { usuarioId } : {});

    const totalCampanhas = lista.length;
    const campanhasAtivas = lista.filter((c) => c.status === "Ativa").length;
    const visualizacoesTotais = lista.reduce((acc, c) => acc + (c.visualizacoes || 0), 0);
    const cliquesTotais = lista.reduce((acc, c) => acc + (c.cliques || 0), 0);
    const gastoTotal = lista.reduce((acc, c) => acc + (c.gastoTotal || 0), 0);

    const ctrGeral = visualizacoesTotais > 0 ? (cliquesTotais / visualizacoesTotais) * 100 : 0;
    const cpmMedio = visualizacoesTotais > 0 ? (gastoTotal / visualizacoesTotais) * 1000 : 0;

    return {
      totalCampanhas,
      campanhasAtivas,
      visualizacoesTotais,
      cliquesTotais,
      gastoTotal: Number(gastoTotal.toFixed(2)),
      ctrGeral: Number(ctrGeral.toFixed(2)),
      cpmMedio: Number(cpmMedio.toFixed(2)),
    };
  },

  /**
   * Busca campanha individual pelo ID
   */
  async buscarPorId(id: string): Promise<Campanha> {
    const campanha = await RepositorioCampanhas.buscarPorId(id);
    if (!campanha) {
      throw new Error("Campanha não encontrada.");
    }
    return campanha;
  },

  /**
   * Valida, calcula regras financeiras e cria a nova campanha
   */
  async criarNovaCampanha(dados: CriarCampanhaInput): Promise<Campanha> {
    const validacao = validarCriarCampanha(dados);
    if (!validacao.valido) {
      throw new Error(validacao.erro || "Dados inválidos para criação da campanha.");
    }

    const orcamento = Number(dados.orcamentoDiario);
    const id = `camp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { PainelAdicionarSaldoServico } = await import("./s.painel.divulgacoes.adcionar.saldo");
    const identificadores = {
      email: dados.googleEmail,
      usuario: dados.usuario,
      usuarioId: dados.usuarioId,
    };
    
    // Verifica o saldo de campanha do usuário
    const infoSaldo = await PainelAdicionarSaldoServico.consultarSaldo(identificadores, orcamento);
    let pagoComSaldo = false;

    if (dados.usarSaldo || (infoSaldo.temSaldoSuficiente && !dados.codigoPix)) {
      if (infoSaldo.saldo < orcamento) {
        throw new Error(
          `Saldo insuficiente para subir a campanha. Disponível: ${infoSaldo.saldoFormatado}, necessário: R$ ${orcamento.toFixed(2)}.`
        );
      }
      // Deduz do saldo de campanhas da conta do usuário
      await PainelAdicionarSaldoServico.deduzirSaldoCampanha(
        identificadores,
        orcamento,
        `Ativação de campanha: ${dados.nome}`
      );
      pagoComSaldo = true;
    }

    // Utiliza o código PIX real da transação se fornecido
    const codigoPix =
      dados.codigoPix ||
      (pagoComSaldo
        ? `SALDO_CAMPANHA_${id}`
        : `00020126580014br.gov.bcb.pix0136${id}-pix-telegroup5204000053039865405${orcamento.toFixed(
            2
          )}5802BR5925TELEGROUP PLATAFORMA6009SAO PAULO62070503***6304`);

    const novaCampanha: Campanha = {
      id,
      usuarioId: dados.usuarioId || `usr_anon_${Date.now()}`,
      nome: dados.nome.trim(),
      texto: dados.texto ? dados.texto.trim() : undefined,
      orcamentoDiario: orcamento,
      link: dados.link.trim(),
      status: "Ativa",
      visualizacoes: 0,
      cliques: 0,
      gastoTotal: 0,
      alcanceEstimado: Math.round(orcamento * 120),
      dataCriacao: new Date().toISOString(),
      codigoPix,
      categoria: dados.categoria || "Geral",
      dataInicio: dados.dataInicio || new Date().toISOString().split("T")[0],
      horaInicio: dados.horaInicio || "12:00",
      imagem: dados.imagem || undefined,
      tags: Array.isArray(dados.tags) ? dados.tags : [],
      saldoCreditos: orcamento,
      saldoConsumido: 0,
      pagoComSaldo,
    };

    const salva = await RepositorioCampanhas.salvar(novaCampanha);

    // Dispara webhook proativo para Website 1 atualizar contadores de anunciantes e divulgações
    import("./s.painel.comunicacao").then((m) => {
      m.ComunicacaoServico.dispararWebhookParaWebsite1("campanha_criada", "usuarios", {
        campanhaId: novaCampanha.id,
        usuarioId: novaCampanha.usuarioId,
      }).catch(() => {});
      m.ComunicacaoServico.dispararWebhookParaWebsite1("campanha_criada", "divulgacoes", {
        campanhaId: novaCampanha.id,
        usuarioId: novaCampanha.usuarioId,
      }).catch(() => {});
      m.ComunicacaoServico.dispararWebhookParaWebsite1("campanhas_ativas_atualizadas", "campanhas_ativas", {
        campanhaId: novaCampanha.id,
      }).catch(() => {});
    }).catch(() => {});

    return salva;
  },

  /**
   * Atualiza o estado da campanha
   */
  async atualizarStatusCampanha(id: string, status: StatusCampanha): Promise<Campanha> {
    if (!["Ativa", "Pausada", "Encerrada"].includes(status)) {
      throw new Error("Status inválido. Permitidos: Ativa, Pausada, Encerrada.");
    }

    const atualizada = await RepositorioCampanhas.atualizarStatus(id, status);
    if (!atualizada) {
      throw new Error("Campanha não encontrada para alteração de status.");
    }

    import("./s.painel.comunicacao").then((m) => {
      m.ComunicacaoServico.dispararWebhookParaWebsite1("campanhas_ativas_atualizadas", "campanhas_ativas", {
        campanhaId: id,
        novoStatus: status,
      }).catch(() => {});
    }).catch(() => {});

    return atualizada;
  },

  /**
   * Exclui uma campanha
   */
  async removerCampanha(id: string): Promise<void> {
    const removido = await RepositorioCampanhas.excluir(id);
    if (!removido) {
      throw new Error("Campanha não encontrada para exclusão.");
    }
  },
};

export default CampanhasServico;
