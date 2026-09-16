import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

const migraciones = [
  `CREATE TABLE IF NOT EXISTS perfil_freelancer (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    nombre TEXT NOT NULL,
    nif TEXT NOT NULL,
    contacto TEXT NOT NULL,
    logo TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    nif TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('particular', 'empresa', 'autonomo'))
  )`,
  `CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    autonomo_nuevo INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'emitido')),
    numero TEXT UNIQUE,
    fecha_emision TEXT,
    validez_dias INTEGER NOT NULL DEFAULT 30,
    base_imponible REAL NOT NULL DEFAULT 0,
    iva REAL NOT NULL DEFAULT 0,
    retencion_porcentaje REAL NOT NULL DEFAULT 0,
    retencion_importe REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS lineas_presupuesto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    presupuesto_id INTEGER NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id),
    origen TEXT NOT NULL CHECK (origen IN ('catalogo', 'manual')),
    descripcion TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS contador_anual (
    anio INTEGER PRIMARY KEY,
    ultimo_numero_asignado INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio_habitual REAL NOT NULL CHECK (precio_habitual >= 0)
  )`,
];

export function createConnection(dbPath = config.dbPath) {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  for (const sentencia of migraciones) {
    db.exec(sentencia);
  }

  return db;
}
