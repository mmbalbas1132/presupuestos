import { describe, it, expect } from 'vitest';
import {
  calcularBaseImponible,
  calcularIVA,
  calcularRetencion,
  calcularTotal,
} from '../../../src/domain/calculo.js';

describe('calcularBaseImponible', () => {
  it('suma cantidad x precioUnitario de todas las líneas', () => {
    const lineas = [
      { cantidad: 1, precioUnitario: 450 },
      { cantidad: 1, precioUnitario: 320 },
      { cantidad: 2, precioUnitario: 85 },
    ];
    expect(calcularBaseImponible(lineas)).toBe(940);
  });

  it('devuelve 170 para una única línea (2x85,00)', () => {
    expect(calcularBaseImponible([{ cantidad: 2, precioUnitario: 85 }])).toBe(170);
  });

  it('devuelve 0 si no hay líneas', () => {
    expect(calcularBaseImponible([])).toBe(0);
  });
});

describe('calcularIVA', () => {
  it('calcula el 21% de la base imponible', () => {
    expect(calcularIVA(940)).toBe(197.4);
  });
});

describe('calcularRetencion', () => {
  it('particular siempre tiene retención 0, incluso si autonomoNuevo es true', () => {
    expect(calcularRetencion('particular', true, 940)).toEqual({ porcentaje: 0, importe: 0 });
    expect(calcularRetencion('particular', false, 940)).toEqual({ porcentaje: 0, importe: 0 });
  });

  it('empresa tiene retención del 15%', () => {
    expect(calcularRetencion('empresa', false, 940)).toEqual({ porcentaje: 15, importe: 141 });
  });

  it('autonomo con autonomoNuevo=false tiene retención del 15% (igual que empresa)', () => {
    expect(calcularRetencion('autonomo', false, 940)).toEqual({ porcentaje: 15, importe: 141 });
  });

  it('autonomo con autonomoNuevo=true tiene retención del 7%', () => {
    expect(calcularRetencion('autonomo', true, 940)).toEqual({ porcentaje: 7, importe: 65.8 });
  });
});

describe('calcularTotal', () => {
  it('calcula base + iva - retencion (caso empresa CA2)', () => {
    expect(calcularTotal(940, 197.4, 141)).toBe(996.4);
  });

  it('calcula el total para autónomo nuevo (CA3)', () => {
    expect(calcularTotal(940, 197.4, 65.8)).toBe(1071.6);
  });

  it('calcula el total para particular (CA4)', () => {
    expect(calcularTotal(940, 197.4, 0)).toBe(1137.4);
  });

  it('comprobación rápida de la spec', () => {
    expect(calcularTotal(1000, 210, 150)).toBe(1060);
  });
});
