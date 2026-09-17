let redirigiendo = false;

function redirigirAAcceso() {
  // Recarga completa (no solo un cambio de hash): así se descartan las
  // peticiones ya en curso de la pantalla anterior, que de otro modo
  // podrían resolverse después y sobreescribir la pantalla de acceso
  // (condición de carrera).
  if (redirigiendo || window.location.hash === '#/acceso') return;
  redirigiendo = true;

  const rutaActual = window.location.hash.replace(/^#/, '') || '/inicio';
  try {
    sessionStorage.setItem('rutaTrasAcceso', rutaActual);
  } catch {
    // Almacenamiento no disponible (p. ej. navegación privada); se ignora,
    // tras acceder se volverá a la pantalla de inicio.
  }
  window.location.hash = '#/acceso';
  window.location.reload();
}

async function parseRespuesta(respuesta, ruta) {
  const esLogin = ruta === '/api/auth/login';

  if (respuesta.status === 401 && !esLogin) {
    redirigirAAcceso();
    throw new Error('No autenticado.');
  }

  const texto = await respuesta.text();
  const cuerpo = texto ? JSON.parse(texto) : null;

  if (!respuesta.ok) {
    const mensaje = cuerpo && cuerpo.error ? cuerpo.error : 'Ha ocurrido un error inesperado.';
    throw new Error(mensaje);
  }

  return cuerpo;
}

async function peticion(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      credentials: 'include',
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba tu conexión.');
  }

  return parseRespuesta(respuesta, ruta);
}

export const httpClient = {
  get: (ruta) => peticion('GET', ruta),
  post: (ruta, cuerpo) => peticion('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => peticion('PUT', ruta, cuerpo),
  delete: (ruta) => peticion('DELETE', ruta),
};
