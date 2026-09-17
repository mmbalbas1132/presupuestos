import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const NOVENTA_DIAS_MS = 90 * 24 * 60 * 60 * 1000;

export function registrarEvento(tipo, detalle, origen = null, rutaLog = config.logPath) {
  const evento = { fecha: new Date().toISOString(), tipo, detalle, origen };
  try {
    fs.mkdirSync(path.dirname(rutaLog), { recursive: true });
    fs.appendFileSync(rutaLog, `${JSON.stringify(evento)}\n`);
  } catch (err) {
    // Un fallo al escribir el registro no debe interrumpir la operación
    // original (spec.md → Edge Cases); se deja constancia mínima en stderr.
    console.error('No se pudo escribir en el registro de auditoría:', err.message);
  }
}

export function purgarEventosAntiguos(rutaLog = config.logPath, antiguedadMaximaMs = NOVENTA_DIAS_MS) {
  if (!fs.existsSync(rutaLog)) return;

  let lineas;
  try {
    lineas = fs.readFileSync(rutaLog, 'utf-8').split('\n').filter(Boolean);
  } catch (err) {
    console.error('No se pudo leer el registro de auditoría para purgarlo:', err.message);
    return;
  }

  const limite = Date.now() - antiguedadMaximaMs;
  const conservadas = lineas.filter((linea) => {
    try {
      const evento = JSON.parse(linea);
      return new Date(evento.fecha).getTime() >= limite;
    } catch {
      return false;
    }
  });

  if (conservadas.length === lineas.length) return;

  try {
    fs.writeFileSync(rutaLog, conservadas.length ? `${conservadas.join('\n')}\n` : '');
  } catch (err) {
    console.error('No se pudo reescribir el registro de auditoría al purgarlo:', err.message);
  }
}
