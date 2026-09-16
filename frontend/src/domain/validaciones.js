export function validarLinea(cantidad, precioUnitario) {
  if (cantidad <= 0) {
    return { valido: false, error: 'La cantidad debe ser mayor que 0.' };
  }
  if (precioUnitario < 0) {
    return { valido: false, error: 'El precio no puede ser negativo.' };
  }
  return { valido: true };
}

export function validarCliente(nombre, nif, tipo) {
  if (!nombre || !nif || !tipo) {
    return { valido: false, error: 'Faltan datos obligatorios del cliente: nombre, NIF y tipo.' };
  }
  return { valido: true };
}
