const TIPO_IVA = 0.21;
const RETENCION_ESTANDAR = 0.15;
const RETENCION_AUTONOMO_NUEVO = 0.07;

function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularBaseImponible(lineas) {
  const total = (lineas || []).reduce((acumulado, linea) => acumulado + linea.cantidad * linea.precioUnitario, 0);
  return redondear(total);
}

export function calcularIVA(baseImponible) {
  return redondear(baseImponible * TIPO_IVA);
}

export function calcularRetencion(tipoCliente, autonomoNuevo, baseImponible) {
  if (tipoCliente === 'particular') {
    return { porcentaje: 0, importe: 0 };
  }

  if (tipoCliente === 'autonomo' && autonomoNuevo) {
    return { porcentaje: 7, importe: redondear(baseImponible * RETENCION_AUTONOMO_NUEVO) };
  }

  return { porcentaje: 15, importe: redondear(baseImponible * RETENCION_ESTANDAR) };
}

export function calcularTotal(baseImponible, iva, retencionImporte) {
  return redondear(baseImponible + iva - retencionImporte);
}
