async function parseRespuesta(respuesta) {
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
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba tu conexión.');
  }

  return parseRespuesta(respuesta);
}

export const httpClient = {
  get: (ruta) => peticion('GET', ruta),
  post: (ruta, cuerpo) => peticion('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => peticion('PUT', ruta, cuerpo),
  delete: (ruta) => peticion('DELETE', ruta),
};
