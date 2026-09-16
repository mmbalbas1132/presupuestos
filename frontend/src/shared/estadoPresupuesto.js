export const ESTADOS_VISUALES = {
  borrador: { clave: 'borrador', etiqueta: 'Borrador', clase: 'estado--borrador' },
  enviado: { clave: 'enviado', etiqueta: 'Enviado', clase: 'estado--enviado' },
  aceptado: { clave: 'aceptado', etiqueta: 'Aceptado', clase: 'estado--aceptado' },
  rechazado: { clave: 'rechazado', etiqueta: 'Rechazado', clase: 'estado--rechazado' },
  caducado: { clave: 'caducado', etiqueta: 'Caducado', clase: 'estado--caducado' },
};

export function estadoVisual(estadoInterno) {
  return estadoInterno === 'emitido' ? ESTADOS_VISUALES.enviado : ESTADOS_VISUALES.borrador;
}
