import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../../src/shared/escapeHtml.js';

describe('escapeHtml', () => {
  it('neutraliza etiquetas de script, sin dejarlas interpretables', () => {
    const resultado = escapeHtml('<script>alert(1)</script>');
    expect(resultado).not.toContain('<script>');
    expect(resultado).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapa comillas, usadas para escapar de un atributo HTML', () => {
    expect(escapeHtml('"><img src=x onerror=alert(1)>')).not.toContain('">');
  });

  it('deja el texto normal intacto', () => {
    expect(escapeHtml('Empresa XYZ')).toBe('Empresa XYZ');
  });

  it('trata valores nulos o indefinidos como cadena vacía', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
