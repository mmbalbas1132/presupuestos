import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registrarEvento, purgarEventosAntiguos } from '../../src/auditoria.js';

describe('Registro de auditoría', () => {
  let rutaLog;

  beforeEach(() => {
    rutaLog = path.join(os.tmpdir(), `presupuestospro-test-auditoria-${Date.now()}-${Math.random().toString(36).slice(2)}.log`);
  });

  afterEach(() => {
    if (fs.existsSync(rutaLog)) fs.unlinkSync(rutaLog);
  });

  it('añade un evento como una línea JSON', () => {
    registrarEvento('cambio_dato', 'Cliente creado: id=1', '127.0.0.1', rutaLog);

    const contenido = fs.readFileSync(rutaLog, 'utf-8').trim();
    const evento = JSON.parse(contenido);
    expect(evento.tipo).toBe('cambio_dato');
    expect(evento.detalle).toBe('Cliente creado: id=1');
    expect(evento.origen).toBe('127.0.0.1');
    expect(evento.fecha).toBeDefined();
  });

  it('purgarEventosAntiguos elimina entradas con más de 90 días y conserva las recientes', () => {
    const hace100Dias = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const hoy = new Date().toISOString();

    const lineas = [
      JSON.stringify({ fecha: hace100Dias, tipo: 'error_interno', detalle: 'antiguo', origen: null }),
      JSON.stringify({ fecha: hoy, tipo: 'cambio_dato', detalle: 'reciente', origen: null }),
    ];
    fs.writeFileSync(rutaLog, `${lineas.join('\n')}\n`);

    purgarEventosAntiguos(rutaLog);

    const restantes = fs
      .readFileSync(rutaLog, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((linea) => JSON.parse(linea));

    expect(restantes).toHaveLength(1);
    expect(restantes[0].detalle).toBe('reciente');
  });

  it('no falla si el fichero de log no existe todavía', () => {
    expect(() => purgarEventosAntiguos(rutaLog)).not.toThrow();
  });
});
