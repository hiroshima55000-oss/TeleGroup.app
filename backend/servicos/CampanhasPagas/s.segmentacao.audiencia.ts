import { Campanha } from "../../schemas/schema.campanhas";
import { PerfilInteressesServico } from "../interesses/s.perfil.interesses";
import { CONFIG_VANTAGEM_PAGA } from "./s.pesos.vantagem";

export const SegmentacaoAudienciaServico = {
  /**
   * Avalia a aderência do anúncio ao perfil do usuário atual
   * utilizando a matriz de 100% de interesses e a qualificação comportamental.
   */
  calcularAfinidadeAudiencia(campanha: Campanha, usuarioId?: string): {
    fatorRelevancia: number;
    publicoQualificado: boolean;
    tagsCoincidentes: string[];
    motivoSegmentacao: string;
  } {
    if (!usuarioId) {
      return {
        fatorRelevancia: 1.0,
        publicoQualificado: false,
        tagsCoincidentes: [],
        motivoSegmentacao: "Audiência ampla (sem identificador de perfil).",
      };
    }

    const perfil = PerfilInteressesServico.obterPerfil(usuarioId);
    const tagsCampanha = Array.isArray(campanha.tags)
      ? campanha.tags.map((t) => t.toLowerCase().replace(/^#/, "").trim())
      : [];
    const categoriaCampanha = (campanha.categoria || "").toLowerCase().trim();

    const tagsCoincidentes: string[] = [];
    let pontosAfinidade = 0;

    // 1. Verifica sobreposição com as tags do anúncio
    for (const tag of tagsCampanha) {
      if (perfil.hashtags[tag]) {
        tagsCoincidentes.push(tag);
        pontosAfinidade += (perfil.hashtags[tag].percentual || 0) / 100;
      }
    }

    // 2. Verifica se a categoria da campanha bate com os grupos do usuário
    if (tagsCoincidentes.length === 0 && categoriaCampanha) {
      for (const grupo of perfil.distribuicaoGrupos) {
        if (grupo.grupoNome.includes(categoriaCampanha) || categoriaCampanha.includes(grupo.grupoNome)) {
          pontosAfinidade += (grupo.percentual / 100) * 0.8;
          break;
        }
      }
    }

    // 3. Verifica se o usuário é qualificado como "Público de Alto Clique (Tráfego Focado)"
    const ehAltoClique = perfil.classificacaoPublico === "Público de Alto Clique (Tráfego Focado)";

    let fatorRelevancia = 1.0 + pontosAfinidade * CONFIG_VANTAGEM_PAGA.BOOST_COINCIDENCIA_TAG;

    if (ehAltoClique) {
      fatorRelevancia *= CONFIG_VANTAGEM_PAGA.BOOST_PUBLICO_QUALIFICADO;
    }

    // Teto de relevância para manter equilíbrio no leilão
    const fatorFinal = Number(Math.min(2.5, Math.max(0.8, fatorRelevancia)).toFixed(2));

    const motivos: string[] = [];
    if (ehAltoClique) motivos.push("Usuário de Alto CTR (Tráfego Focado)");
    if (tagsCoincidentes.length > 0) motivos.push(`Afinidade com as tags: #${tagsCoincidentes.join(", #")}`);
    if (motivos.length === 0) motivos.push("Segmentação por categoria geral");

    return {
      fatorRelevancia: fatorFinal,
      publicoQualificado: ehAltoClique,
      tagsCoincidentes,
      motivoSegmentacao: motivos.join(" | "),
    };
  },
};
