// Mantener sincronizado manualmente con frontend/src/styles/base.css :root
// (jsPDF no puede leer CSS — ver contracts/sistema-visual-contract.md, regla 2).

export const COLOR_PRIMARIO = [31, 111, 92]; // --color-primario #1f6f5c
export const COLOR_TEXTO = [31, 41, 51]; // --color-texto #1f2933
export const COLOR_TEXTO_SUAVE = [82, 96, 109]; // --color-texto-suave #52606d
export const COLOR_BORDE = [217, 221, 225]; // --color-borde #d9dde1

export const FUENTE_BASE = 'helvetica'; // fuente core de jsPDF más próxima a --fuente-base (sans-serif)

export const TAMANOS = {
  titulo: 16,
  subtitulo: 11,
  texto: 9,
  textoPequeno: 8,
};
