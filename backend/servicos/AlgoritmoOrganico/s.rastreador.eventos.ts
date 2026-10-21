import { TipoAcaoInteresse, PerfilInteresseUsuario } from "./tipos.interesses";
import { PerfilInteressesServico } from "./s.perfil.interesses";
import { RepositorioPublicacoes } from "../../repositorios/repositorio.publicacoes";

export const RastreadorEventosServico = {
  /**
   * Rastreia uma ação do usuário e atualiza automaticamente os interesses
   */
  async rastrearAcao(params: {
    usuarioId: string;
    nickname?: string;
    tipo: TipoAcaoInteresse;
    publicacaoId?: string;
    tag?: string;
    nicho?: string;
    duracaoSegundos?: number;
  }): Promise<PerfilInteresseUsuario> {
    let tagsFinais: string[] = [];
    let nichoFinal = params.nicho;

    if (params.tag) {
      tagsFinais.push(params.tag);
    }

    // Se forneceu publicacaoId, extrai as tags e categoria da publicação
    if (params.publicacaoId) {
      try {
        const pub = await RepositorioPublicacoes.buscarPorId(params.publicacaoId);
        if (pub) {
          if (Array.isArray(pub.tags) && pub.tags.length > 0) {
            tagsFinais = Array.from(new Set([...tagsFinais, ...pub.tags]));
          }
          if (!nichoFinal && pub.categoria) {
            nichoFinal = pub.categoria;
          }
        }
      } catch {}
    }

    return PerfilInteressesServico.registrarInteracao({
      usuarioId: params.usuarioId,
      nickname: params.nickname,
      tipo: params.tipo,
      publicacaoId: params.publicacaoId,
      tags: tagsFinais,
      nicho: nichoFinal,
      duracaoSegundos: params.duracaoSegundos,
    });
  },

  /**
   * Inicializa dados de exemplo para demonstração de perfis reais
   * (como @vitinho, @amanda e @julia solicitados pelo usuário)
   */
  popularPerfisExemplo(): void {
    const exemplos = [
      {
        usuarioId: "usr_vitinho",
        nickname: "@vitinho",
        acoes: [
          { tag: "marketing", tipo: "like" as const, repeticoes: 50 },
          { tag: "porn", tipo: "like" as const, repeticoes: 23 },
          { tag: "moda", tipo: "clique_link" as const, repeticoes: 32 },
          { tag: "carros", tipo: "clique_link" as const, repeticoes: 22 },
        ],
      },
      {
        usuarioId: "usr_amanda",
        nickname: "@amanda",
        acoes: [
          { tag: "marketing", tipo: "like" as const, repeticoes: 50 },
          { tag: "porn", tipo: "like" as const, repeticoes: 23 },
          { tag: "moda", tipo: "clique_link" as const, repeticoes: 32 },
          { tag: "carros", tipo: "clique_link" as const, repeticoes: 22 },
        ],
      },
      {
        usuarioId: "usr_julia",
        nickname: "@julia",
        acoes: [
          { tag: "marketing", tipo: "like" as const, repeticoes: 50 },
          { tag: "porn", tipo: "like" as const, repeticoes: 23 },
          { tag: "moda", tipo: "clique_link" as const, repeticoes: 32 },
          { tag: "carros", tipo: "clique_link" as const, repeticoes: 22 },
        ],
      },
    ];

    for (const ex of exemplos) {
      for (const a of ex.acoes) {
        for (let i = 0; i < a.repeticoes; i++) {
          PerfilInteressesServico.registrarInteracao({
            usuarioId: ex.usuarioId,
            nickname: ex.nickname,
            tipo: a.tipo,
            tags: [a.tag],
          });
        }
      }
    }
  },
};
