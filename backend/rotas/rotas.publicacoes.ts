import { Router } from "express";
import { PublicacoesControle } from "../controles/c.publicacoes";

const rotasPublicacoes = Router();

// Endpoints de interesses e eventos
rotasPublicacoes.get("/interesses", PublicacoesControle.obterPerfilInteresses);
rotasPublicacoes.get("/interesses/:usuarioId", PublicacoesControle.obterPerfilInteresses);
rotasPublicacoes.post("/interesses/evento", PublicacoesControle.registrarEventoInteresse);
rotasPublicacoes.post("/visualizacoes-em-lote", PublicacoesControle.registrarVisualizacoesEmLote);

// Endpoints principais de publicações
rotasPublicacoes.get("/", PublicacoesControle.listarPublicacoes);
rotasPublicacoes.get("/:id", PublicacoesControle.obterPorId);
rotasPublicacoes.post("/", PublicacoesControle.criarPublicacao);
rotasPublicacoes.post("/:id/like", PublicacoesControle.curtirPublicacao);
rotasPublicacoes.post("/:id/curtir", PublicacoesControle.curtirPublicacao);
rotasPublicacoes.post("/:id/clique", PublicacoesControle.registrarClique);
rotasPublicacoes.post("/:id/visualizacao", PublicacoesControle.registrarVisualizacao);
rotasPublicacoes.post("/:id/denunciar", PublicacoesControle.denunciarPublicacao);
rotasPublicacoes.post("/denunciar", PublicacoesControle.denunciarPublicacao);
rotasPublicacoes.delete("/:id", PublicacoesControle.remover);

export default rotasPublicacoes;
export { rotasPublicacoes };
