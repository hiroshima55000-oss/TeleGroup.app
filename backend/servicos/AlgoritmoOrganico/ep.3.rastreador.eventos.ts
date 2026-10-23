import { TipoAcaoInteresse, PerfilInteresseUsuario } from "./tipos.interesses";
import { PerfilInteressesServico } from "./ep.4.perfil.interesses";
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
};
