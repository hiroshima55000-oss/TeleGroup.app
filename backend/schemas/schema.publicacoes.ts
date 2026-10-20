/**
 * Schema e Tipagens para Publicações (Canais e Grupos do Telegram)
 */

export interface Publicacao {
  id: string;
  usuarioId: string;
  nome: string;
  categoria: string;
  descricao: string;
  link: string;
  imagens: string[];
  tipo: "foto" | "texto";
  destaque: boolean;
  isAnuncio?: boolean;
  visualizacoes: number;
  likes: number;
  cliques: number;
  status: "Publicado" | "Pendente" | "Encerrado";
  dataCriacao: string;
  membros: string;
  tags?: string[];
  nicho?: string;
  nomeNicho?: string;
  iconeNicho?: string;
}

export interface CriarPublicacaoInput {
  nome: string;
  categoria: string;
  descricao?: string;
  link: string;
  imagens?: string[];
  tipo?: "foto" | "texto";
  tags?: string[];
  membros?: string;
  nicho?: string;
  nomeNicho?: string;
  iconeNicho?: string;
  destaque?: boolean;
  usuarioId?: string;
}

export interface FiltrosPublicacoes {
  busca?: string;
  categoria?: string;
  tag?: string;
  nicho?: string;
  apenasComImagem?: boolean;
  apenasMinhas?: boolean;
  usuarioId?: string;
  pagina?: number;
  limite?: number;
}

export interface RespostaPaginadaPublicacoes {
  sucesso: boolean;
  dados: Publicacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  temMais: boolean;
  categoriasDisponiveis: string[];
}

export const DDL_TABELA_PUBLICACOES = `
CREATE TABLE IF NOT EXISTS publicacoes (
  id VARCHAR(100) PRIMARY KEY,
  usuario_id VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT,
  link TEXT NOT NULL,
  imagens TEXT[],
  tipo VARCHAR(20) DEFAULT 'texto',
  destaque BOOLEAN DEFAULT FALSE,
  is_anuncio BOOLEAN DEFAULT FALSE,
  visualizacoes INT DEFAULT 0,
  likes INT DEFAULT 0,
  cliques INT DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Publicado',
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  membros VARCHAR(100) DEFAULT 'Comunidade Ativa',
  tags TEXT[],
  nicho VARCHAR(100),
  nome_nicho VARCHAR(100),
  icone_nicho VARCHAR(20)
);
`;

export function validarCriarPublicacao(dados: any): { valido: boolean; erro?: string } {
  if (!dados.nome || typeof dados.nome !== "string" || !dados.nome.trim()) {
    return { valido: false, erro: "O campo 'nome' é obrigatório." };
  }
  if (!dados.link || typeof dados.link !== "string" || !dados.link.trim()) {
    return { valido: false, erro: "O campo 'link' é obrigatório." };
  }
  if (!dados.categoria || typeof dados.categoria !== "string" || !dados.categoria.trim()) {
    return { valido: false, erro: "O campo 'categoria' é obrigatório." };
  }
  return { valido: true };
}
