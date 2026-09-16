const formateador = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(valor) {
  const numero = Number.isFinite(valor) ? valor : 0;
  return `${formateador.format(numero)} €`;
}
