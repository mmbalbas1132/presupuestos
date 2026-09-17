import { describe, it, expect } from 'vitest';
import { siguienteNumero } from '../../../src/domain/numeracion.js';

describe('siguienteNumero', () => {
  it('genera 2026-001 para el primer presupuesto del año sin contador previo', () => {
    expect(siguienteNumero(2026, { anio: 2026, ultimoNumeroAsignado: 0 })).toBe('2026-001');
  });

  it('genera 2026-002 para el siguiente presupuesto de ese mismo año', () => {
    expect(siguienteNumero(2026, { anio: 2026, ultimoNumeroAsignado: 1 })).toBe('2026-002');
  });

  it('genera 2027-001 para el primer presupuesto de un año nuevo', () => {
    expect(siguienteNumero(2027, null)).toBe('2027-001');
  });
});
