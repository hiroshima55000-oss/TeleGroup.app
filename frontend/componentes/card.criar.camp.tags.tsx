import React, { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Hash,
  Plus,
  X,
  Tags,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  consultarUsoTag,
  identificarNichoConteudo,
} from "../servicos/api.publicacoes";

interface NichoDetectado {
  id: string;
  nome: string;
  icone: string;
  confianca: number;
  secundarios: string[];
}

interface ContagemTag {
  contagemFormatada: string;
}

export interface CardCriarCampTagsProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  categoria?: string;
  textoConteudo?: string;
  limiteMaximo?: number;
  semTituloInterno?: boolean;
  onNichoIdentificado?: (nicho: {
    id: string;
    nome: string;
    icone: string;
  }) => void;
}

const estilos = {
  container: {
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(27,33,42,0.92)",
    boxSizing: "border-box" as const,
  },

  cabecalho: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap" as const,
  },

  identificacao: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  icone: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    color: "#38bdf8",
    background: "rgba(56,189,248,0.10)",
    border: "1px solid rgba(56,189,248,0.18)",
  },

  titulo: {
    margin: 0,
    color: "#f1f5f9",
    fontSize: "15px",
    fontWeight: 800,
  },

  descricao: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  contador: {
    padding: "5px 9px",
    borderRadius: "8px",
    color: "#cbd5e1",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap" as const,
  },

  formulario: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
  },

  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box" as const,
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.09)",
    outline: "none",
    background: "#151a21",
    color: "#e7edf5",
    fontSize: "13px",
  },

  botaoAdicionar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "0 12px",
    border: "none",
    borderRadius: "10px",
    background: "#168ac0",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },

  listaTags: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    padding: "10px",
    borderRadius: "11px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(15,20,26,0.45)",
  },

  itemTag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
    padding: "8px",
    borderRadius: "9px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
  },

  posicao: {
    width: "25px",
    height: "25px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "rgba(56,189,248,0.10)",
    color: "#38bdf8",
    fontSize: "11px",
    fontWeight: 800,
  },

  nomeTag: {
    flex: 1,
    minWidth: 0,
    color: "#7dd3fc",
    fontSize: "12px",
    fontWeight: 650,
    overflowWrap: "anywhere" as const,
  },

  contagem: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
  },

  grupoAcoes: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    flexShrink: 0,
  },

  botaoMover: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#cbd5e1",
    cursor: "pointer",
  },

  botaoRemover: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
  },

  aviso: {
    margin: "0 0 12px",
    color: "#f87171",
    fontSize: "12px",
  },

  rodape: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap" as const,
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },

  dica: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  botaoExplorar: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "9px 13px",
    borderRadius: "9px",
    border: "1px solid rgba(56,189,248,0.25)",
    background: "rgba(56,189,248,0.09)",
    color: "#38bdf8",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
};

function formatarTag(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_áéíóúãõâêîôûç]/g, "");
}

function extrairTags(entrada: string): string[] {
  if (!entrada.trim()) return [];

  return Array.from(
    new Set(
      entrada
        .split(/[\s,;]+/)
        .map(formatarTag)
        .filter((tag) => tag.length >= 2 && tag.length <= 25),
    ),
  );
}

function identificarNichoFallback(tag: string): NichoDetectado {
  const valor = tag.toLowerCase();

  const regras = [
    {
      termos: ["carro", "auto", "moto"],
      id: "automotivo",
      nome: "Automotivo",
      icone: "🚗",
    },
    {
      termos: ["tech", "dev", "tecnologia"],
      id: "tecnologia",
      nome: "Tecnologia",
      icone: "💻",
    },
    {
      termos: ["game", "jogo", "gamer"],
      id: "games",
      nome: "Games",
      icone: "🎮",
    },
    {
      termos: ["moda", "style"],
      id: "moda",
      nome: "Moda",
      icone: "👗",
    },
  ];

  const encontrado = regras.find((regra) =>
    regra.termos.some((termo) => valor.includes(termo)),
  );

  if (!encontrado) {
    return {
      id: "geral",
      nome: "Geral",
      icone: "💬",
      confianca: 85,
      secundarios: [],
    };
  }

  return {
    ...encontrado,
    confianca: 85,
    secundarios: [],
  };
}

export function CardCriarCampTags({
  tags,
  setTags,
  categoria = "Geral",
  textoConteudo = "",
  limiteMaximo = 5,
  semTituloInterno = false,
  onNichoIdentificado,
}: CardCriarCampTagsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [inputValor, setInputValor] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [contagensConsultadas, setContagensConsultadas] = useState<
    Record<string, string>
  >({});

  const limiteAtingido = tags.length >= limiteMaximo;
  const inputDesabilitado = limiteAtingido || limiteMaximo <= 0;

  function abrirPaginaTags() {
    try {
      const rascunhoRaw = sessionStorage.getItem(
        "telegroup_draft_campanha",
      );

      const rascunho = rascunhoRaw ? JSON.parse(rascunhoRaw) : {};

      rascunho.tags = tags;

      sessionStorage.setItem(
        "telegroup_draft_campanha",
        JSON.stringify(rascunho),
      );
    } catch {
      // A navegação continua mesmo se não for possível salvar o rascunho.
    }

    const origem = location.pathname.includes("gratuito")
      ? "publicacao"
      : "campanha";

    navigate(`/ranking-tags?origem=${origem}`);
  }

  // Consultar contagens das tags adicionadas.
  useEffect(() => {
    let cancelado = false;

    async function carregarContagens() {
      const slugs = Array.from(new Set(tags.map(formatarTag))).filter(
        (slug) => slug && !contagensConsultadas[slug],
      );

      const resultados = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const resultado: ContagemTag | null =
              await consultarUsoTag(slug);

            if (resultado?.contagemFormatada) {
              return [slug, resultado.contagemFormatada] as const;
            }
          } catch {
            // Uma falha na consulta não impede a edição das tags.
          }

          return null;
        }),
      );

      if (cancelado) return;

      const novasContagens = Object.fromEntries(
        resultados.filter(
          (item): item is readonly [string, string] => item !== null,
        ),
      );

      if (Object.keys(novasContagens).length > 0) {
        setContagensConsultadas((anterior) => ({
          ...anterior,
          ...novasContagens,
        }));
      }
    }

    void carregarContagens();

    return () => {
      cancelado = true;
    };
  }, [tags, contagensConsultadas]);

  // Identificar o nicho automaticamente.
  useEffect(() => {
    let cancelado = false;

    if (tags.length === 0 && !textoConteudo.trim()) {
      onNichoIdentificado?.({
        id: "geral",
        nome: "Geral",
        icone: "💬",
      });

      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const resultado = await identificarNichoConteudo({
          tags,
          texto: textoConteudo,
          categoria,
        });

        if (cancelado || !resultado) return;

        onNichoIdentificado?.({
          id: resultado.nichoPrincipal,
          nome: resultado.nomeNicho,
          icone: resultado.icone,
        });
      } catch {
        if (cancelado) return;

        const fallback =
          tags.length > 0
            ? identificarNichoFallback(tags[0])
            : {
                id: "geral",
                nome: "Geral",
                icone: "💬",
                confianca: 85,
                secundarios: [],
              };

        onNichoIdentificado?.({
          id: fallback.id,
          nome: fallback.nome,
          icone: fallback.icone,
        });
      }
    }, 250);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [tags, textoConteudo, categoria, onNichoIdentificado]);

  // Adicionar tags sem alterar a ordem das que já existem.
  function adicionarTag(entrada: string) {
    setAviso(null);

    const novasTags = extrairTags(entrada);

    if (novasTags.length === 0) {
      const tag = formatarTag(entrada);

      if (tag.length === 1) {
        setAviso("A tag deve ter pelo menos 2 caracteres.");
      } else if (tag.length > 25) {
        setAviso("Cada tag pode ter no máximo 25 caracteres.");
      } else if (entrada.trim()) {
        setAviso("Digite uma tag válida.");
      }

      return;
    }

    const existentes = new Set(tags.map(formatarTag));
    const adicionadas: string[] = [];

    let duplicada = false;
    let atingiuLimite = false;

    for (const tag of novasTags) {
      if (existentes.has(tag)) {
        duplicada = true;
        continue;
      }

      if (tags.length + adicionadas.length >= limiteMaximo) {
        atingiuLimite = true;
        break;
      }

      adicionadas.push(tag);
      existentes.add(tag);
    }

    if (adicionadas.length > 0) {
      setTags([...tags, ...adicionadas]);
      setInputValor("");
    } else if (duplicada && !atingiuLimite) {
      setAviso("Essa tag já foi adicionada.");
    }

    if (atingiuLimite) {
      setAviso(`Limite máximo de ${limiteMaximo} tags atingido.`);
    }
  }

  // Remover uma tag.
  function removerTag(tagRemover: string) {
    setTags(
      tags.filter(
        (tag) => formatarTag(tag) !== formatarTag(tagRemover),
      ),
    );

    setAviso(null);
  }

  // Mover uma tag sem excluí-la ou adicioná-la novamente.
  function moverTag(indice: number, direcao: -1 | 1) {
    const novoIndice = indice + direcao;

    if (novoIndice < 0 || novoIndice >= tags.length) return;

    const novasTags = [...tags];

    [novasTags[indice], novasTags[novoIndice]] = [
      novasTags[novoIndice],
      novasTags[indice],
    ];

    setTags(novasTags);
    setAviso(null);
  }

  function handleKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter" || evento.key === ",") {
      evento.preventDefault();
      adicionarTag(inputValor);
    }
  }

  return (
    <section style={estilos.container}>
      {!semTituloInterno ? (
        <header style={estilos.cabecalho}>
          <div style={estilos.identificacao}>
            <div style={estilos.icone}>
              <Hash size={18} />
            </div>

            <div>
              <h3 style={estilos.titulo}>Hashtags da publicação</h3>
              <p style={estilos.descricao}>
                Defina as tags e organize a sequência.
              </p>
            </div>
          </div>

          <span style={estilos.contador}>
            {tags.length}/{limiteMaximo}
          </span>
        </header>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <span style={estilos.contador}>
            {tags.length}/{limiteMaximo} tags
          </span>
        </div>
      )}

      {/* CAMPO DE ADIÇÃO */}
      <div style={estilos.formulario}>
        <input
          type="text"
          value={inputValor}
          onChange={(evento) => {
            setInputValor(evento.target.value.toLowerCase());
            setAviso(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={inputDesabilitado}
          placeholder={
            inputDesabilitado
              ? "Limite máximo atingido"
              : "Digite uma tag..."
          }
          maxLength={25}
          aria-label="Digite uma ou mais tags"
          style={{
            ...estilos.input,
            opacity: inputDesabilitado ? 0.55 : 1,
          }}
        />

        <button
          type="button"
          onClick={() => adicionarTag(inputValor)}
          disabled={!inputValor.trim() || inputDesabilitado}
          style={{
            ...estilos.botaoAdicionar,
            ...(!inputValor.trim() || inputDesabilitado
              ? {
                  background: "rgba(255,255,255,0.07)",
                  color: "#64748b",
                  cursor: "not-allowed",
                }
              : {}),
          }}
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>

      {aviso && (
        <p role="alert" style={estilos.aviso}>
          {aviso}
        </p>
      )}

      {/* LISTA ORDENÁVEL */}
      {tags.length > 0 && (
        <div
          style={estilos.listaTags}
          aria-label="Tags selecionadas em ordem de prioridade"
        >
          {tags.map((tag, indice) => {
            const slug = formatarTag(tag);

            return (
              <div key={slug} style={estilos.itemTag}>
                <span
                  style={estilos.posicao}
                  title={`Posição ${indice + 1}`}
                >
                  {indice + 1}
                </span>

                <span style={estilos.nomeTag}>#{slug}</span>

                <span style={estilos.contagem}>
                  {contagensConsultadas[slug] ?? "..."}
                </span>

                <div style={estilos.grupoAcoes}>
                  <button
                    type="button"
                    onClick={() => moverTag(indice, -1)}
                    disabled={indice === 0}
                    aria-label={`Mover ${slug} para a esquerda`}
                    title="Mover para a esquerda"
                    style={{
                      ...estilos.botaoMover,
                      opacity: indice === 0 ? 0.3 : 1,
                      cursor: indice === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moverTag(indice, 1)}
                    disabled={indice === tags.length - 1}
                    aria-label={`Mover ${slug} para a direita`}
                    title="Mover para a direita"
                    style={{
                      ...estilos.botaoMover,
                      opacity: indice === tags.length - 1 ? 0.3 : 1,
                      cursor:
                        indice === tags.length - 1
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removerTag(slug)}
                    title={`Remover tag ${slug}`}
                    aria-label={`Remover tag ${slug}`}
                    style={estilos.botaoRemover}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RODAPÉ */}
      <footer style={estilos.rodape}>
        <p style={estilos.dica}>
          Use as setas para mudar a ordem das tags.
        </p>

        <button
          type="button"
          onClick={abrirPaginaTags}
          style={estilos.botaoExplorar}
        >
          <Tags size={15} />
          Explorar tags
        </button>
      </footer>
    </section>
  );
}

export default CardCriarCampTags;