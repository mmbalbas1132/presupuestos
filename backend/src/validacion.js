const REGEX_NIF = /^(\d{8}[A-Za-z]|[XYZxyz]\d{7}[A-Za-z]|[A-Za-z]\d{7}[0-9A-Za-z])$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[+()\d\s-]{6,20}$/;
const REGEX_LOGO_DATA_URL = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

export function validarNif(valor) {
  return typeof valor === 'string' && REGEX_NIF.test(valor.trim());
}

export function validarLongitudMaxima(valor, maximo) {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.length <= maximo;
}

export function validarContacto(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return false;
  const texto = valor.trim();
  return REGEX_EMAIL.test(texto) || REGEX_TELEFONO.test(texto);
}

export function validarLogoDataUrl(valor) {
  if (!valor) return true; // el logo es opcional
  return typeof valor === 'string' && REGEX_LOGO_DATA_URL.test(valor);
}
