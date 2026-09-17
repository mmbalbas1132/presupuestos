import { registrarEvento } from './auditoria.js';

const VENTANA_MS = 15 * 60 * 1000;
const LIMITE_INTENTOS = 5;

const intentosPorIp = new Map();

function limpiarExpirados(ahora) {
  for (const [ip, estado] of intentosPorIp) {
    const bloqueoActivo = estado.bloqueadoHasta > ahora;
    const ventanaActiva = ahora - estado.inicioVentana < VENTANA_MS;
    if (!bloqueoActivo && !ventanaActiva) {
      intentosPorIp.delete(ip);
    }
  }
}

export function registrarIntentoFallido(ip) {
  const ahora = Date.now();
  limpiarExpirados(ahora);

  const estado = intentosPorIp.get(ip) || { intentos: 0, inicioVentana: ahora, bloqueadoHasta: 0 };

  if (ahora - estado.inicioVentana >= VENTANA_MS) {
    estado.intentos = 0;
    estado.inicioVentana = ahora;
  }

  estado.intentos += 1;
  if (estado.intentos >= LIMITE_INTENTOS) {
    estado.bloqueadoHasta = ahora + VENTANA_MS;
  }

  intentosPorIp.set(ip, estado);
}

export function middlewareLimiteIntentos(req, res, next) {
  const estado = intentosPorIp.get(req.ip);
  if (estado && estado.bloqueadoHasta > Date.now()) {
    registrarEvento('bloqueo_origen', 'Límite de intentos de acceso superado', req.ip);
    return res.status(429).json({ error: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.' });
  }
  next();
}

// Solo para tests: evita que el estado de un test contamine el siguiente.
export function _reiniciarParaTests() {
  intentosPorIp.clear();
}
