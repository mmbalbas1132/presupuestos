const CARACTERES_ESPECIALES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (caracter) => CARACTERES_ESPECIALES[caracter]);
}
