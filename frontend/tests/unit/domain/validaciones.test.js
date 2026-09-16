import { describe, it, expect } from 'vitest';
import { validarLinea, validarCliente } from '../../../src/domain/validaciones.js';

describe('validarLinea', () => {
  it('rechaza cantidad <= 0', () => {
    const resultado = validarLinea(-1, 10);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBeTruthy();
  });

  it('rechaza cantidad igual a 0', () => {
    expect(validarLinea(0, 10).valido).toBe(false);
  });

  it('rechaza precioUnitario negativo', () => {
    const resultado = validarLinea(2, -10);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBeTruthy();
  });

  it('acepta cantidad y precio válidos', () => {
    expect(validarLinea(2, 0)).toEqual({ valido: true });
    expect(validarLinea(1, 85)).toEqual({ valido: true });
  });
});

describe('validarCliente', () => {
  it('rechaza si falta el nombre', () => {
    expect(validarCliente('', '12345678A', 'particular').valido).toBe(false);
  });

  it('rechaza si falta el nif', () => {
    expect(validarCliente('Juan', '', 'particular').valido).toBe(false);
  });

  it('rechaza si falta el tipo', () => {
    expect(validarCliente('Juan', '12345678A', '').valido).toBe(false);
  });

  it('acepta datos completos', () => {
    expect(validarCliente('Juan', '12345678A', 'particular')).toEqual({ valido: true });
  });
});
