import { describe, it, expect } from 'vitest';
import { estadoVisual, ESTADOS_VISUALES } from '../../../src/shared/estadoPresupuesto.js';

describe('estadoVisual', () => {
  it("traduce 'borrador' a la etiqueta Borrador", () => {
    expect(estadoVisual('borrador')).toEqual(ESTADOS_VISUALES.borrador);
    expect(estadoVisual('borrador').etiqueta).toBe('Borrador');
  });

  it("traduce 'emitido' a la etiqueta Enviado", () => {
    expect(estadoVisual('emitido')).toEqual(ESTADOS_VISUALES.enviado);
    expect(estadoVisual('emitido').etiqueta).toBe('Enviado');
  });

  it('cualquier otro valor no reconocido se trata como Borrador', () => {
    expect(estadoVisual('desconocido').etiqueta).toBe('Borrador');
  });
});
