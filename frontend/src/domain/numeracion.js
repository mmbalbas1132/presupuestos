export function siguienteNumero(anio, contadorAnual) {
  const ultimo = contadorAnual && contadorAnual.anio === anio ? contadorAnual.ultimoNumeroAsignado : 0;
  const siguiente = ultimo + 1;
  const nnn = String(siguiente).padStart(3, '0');
  return `${anio}-${nnn}`;
}
