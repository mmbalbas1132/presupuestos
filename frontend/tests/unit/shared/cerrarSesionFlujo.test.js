import { describe, it, expect, vi } from 'vitest';
import { cerrarSesionFlujo } from '../../../src/shared/cerrarSesionFlujo.js';

describe('cerrarSesionFlujo', () => {
  it('en el flujo feliz, limpia el estado local y navega sin marcar error', async () => {
    const cerrarSesion = vi.fn().mockResolvedValue(undefined);
    const limpiarEstadoLocal = vi.fn();
    const navegarAAcceso = vi.fn();

    await cerrarSesionFlujo({ cerrarSesion, limpiarEstadoLocal, navegarAAcceso });

    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(limpiarEstadoLocal).toHaveBeenCalledTimes(1);
    expect(navegarAAcceso).toHaveBeenCalledTimes(1);
    expect(navegarAAcceso).toHaveBeenCalledWith({ huboError: false });
  });

  it('cuando cerrarSesion() falla, limpia el estado local y navega marcando el error, sin propagar la excepción', async () => {
    const cerrarSesion = vi.fn().mockRejectedValue(new Error('El servidor no responde.'));
    const limpiarEstadoLocal = vi.fn();
    const navegarAAcceso = vi.fn();

    await expect(
      cerrarSesionFlujo({ cerrarSesion, limpiarEstadoLocal, navegarAAcceso })
    ).resolves.toBeUndefined();

    expect(limpiarEstadoLocal).toHaveBeenCalledTimes(1);
    expect(navegarAAcceso).toHaveBeenCalledTimes(1);
    expect(navegarAAcceso).toHaveBeenCalledWith({ huboError: true });
  });
});
