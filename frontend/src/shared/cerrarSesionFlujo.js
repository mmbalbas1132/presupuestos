import { cerrarSesion as cerrarSesionApi } from '../api/auth.js';

const CLAVE_AVISO_ACCESO = 'avisoAcceso';
const TEXTO_AVISO_FALLO =
  'No se ha podido cerrar sesión en el servidor, pero se ha cerrado en este dispositivo.';

function limpiarEstadoLocalPorDefecto() {
  try {
    sessionStorage.removeItem('rutaTrasAcceso');
  } catch {
    // Almacenamiento no disponible (p. ej. navegación privada); se ignora.
  }
}

function navegarAAccesoPorDefecto({ huboError }) {
  if (huboError) {
    try {
      sessionStorage.setItem(CLAVE_AVISO_ACCESO, TEXTO_AVISO_FALLO);
    } catch {
      // Almacenamiento no disponible; se pierde el aviso, pero se sigue cerrando sesión.
    }
  }
  window.location.hash = '#/acceso';
  window.location.reload();
}

export async function cerrarSesionFlujo({
  cerrarSesion = cerrarSesionApi,
  limpiarEstadoLocal = limpiarEstadoLocalPorDefecto,
  navegarAAcceso = navegarAAccesoPorDefecto,
} = {}) {
  let huboError = false;

  try {
    await cerrarSesion();
  } catch {
    huboError = true;
  }

  limpiarEstadoLocal();
  navegarAAcceso({ huboError });
}

export { CLAVE_AVISO_ACCESO };
