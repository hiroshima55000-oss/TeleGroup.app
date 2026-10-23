export * from "./repositorio.usuario";
export * from "./repositorio.campanhas";
export * from "./repositorio.publicacoes";
export * from "./repositorio.interesses";

import { RepositorioUsuario } from "./repositorio.usuario";
import { RepositorioCampanhas } from "./repositorio.campanhas";
import { RepositorioPublicacoes } from "./repositorio.publicacoes";
import { RepositorioInteresses } from "./repositorio.interesses";

/**
 * Função utilitária para inicializar todas as tabelas no PostgreSQL se conectado
 */
export async function inicializarTodasTabelas(): Promise<void> {
  await Promise.all([
    RepositorioUsuario.inicializarTabelas().catch(() => {}),
    RepositorioCampanhas.inicializarTabelas().catch(() => {}),
    RepositorioPublicacoes.inicializarTabelas().catch(() => {}),
    RepositorioInteresses.inicializarTabelas().catch(() => {}),
  ]);
}
