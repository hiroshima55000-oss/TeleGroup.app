/**
 * Utilitário para rolar a tela suavemente até o campo que falta ser preenchido
 * e aplicar foco e destaque visual temporário.
 */
export function rolarParaCampo(idDoCampo: string) {
  setTimeout(() => {
    const elemento = document.getElementById(idDoCampo);
    if (elemento) {
      elemento.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Tenta focar o elemento se for input/textarea/select/button
      try {
        elemento.focus({ preventScroll: true });
      } catch {
        try {
          elemento.focus();
        } catch {}
      }

      // Adiciona classe de destaque visual pulsante
      elemento.classList.add("campo-faltante-destaque");
      setTimeout(() => {
        elemento.classList.remove("campo-faltante-destaque");
      }, 2500);
    }
  }, 60);
}
