import crypto from 'node:crypto';
import { config } from './config.js';
import { registrarEvento } from './auditoria.js';

const NOMBRE_COOKIE_SESION = 'sesion';
const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000;

function firmar(payload, claveFirma = config.accessKey) {
  return crypto.createHmac('sha256', claveFirma).update(payload).digest('base64url');
}

// El segundo parámetro solo se usa en tests, para simular una cookie firmada
// con una ACCESS_KEY anterior a una rotación (FR-017).
export function crearTokenSesion(expiraEn = Date.now() + DURACION_SESION_MS, claveFirma = config.accessKey) {
  const payload = String(expiraEn);
  return `${payload}.${firmar(payload, claveFirma)}`;
}

export function verificarTokenSesion(token) {
  if (!token || typeof token !== 'string') return false;

  const separador = token.lastIndexOf('.');
  if (separador === -1) return false;

  const payload = token.slice(0, separador);
  const firma = token.slice(separador + 1);
  const firmaEsperada = firmar(payload);

  const bufferRecibido = Buffer.from(firma);
  const bufferEsperado = Buffer.from(firmaEsperada);
  if (bufferRecibido.length !== bufferEsperado.length) return false;
  if (!crypto.timingSafeEqual(bufferRecibido, bufferEsperado)) return false;

  const expiraEn = Number(payload);
  return Number.isFinite(expiraEn) && expiraEn > Date.now();
}

function leerCookie(req, nombre) {
  const cabecera = req.headers.cookie;
  if (!cabecera) return undefined;

  for (const parte of cabecera.split(';')) {
    const igual = parte.indexOf('=');
    if (igual === -1) continue;
    const clave = parte.slice(0, igual).trim();
    if (clave === nombre) {
      return decodeURIComponent(parte.slice(igual + 1).trim());
    }
  }
  return undefined;
}

export function fijarCookieSesion(res) {
  res.cookie(NOMBRE_COOKIE_SESION, crearTokenSesion(), {
    httpOnly: true,
    secure: config.forceHttps,
    sameSite: 'strict',
    maxAge: DURACION_SESION_MS,
  });
}

export function borrarCookieSesion(res) {
  res.clearCookie(NOMBRE_COOKIE_SESION);
}

export function middlewareAutenticacion(req, res, next) {
  const token = leerCookie(req, NOMBRE_COOKIE_SESION);

  if (!verificarTokenSesion(token)) {
    registrarEvento('acceso_rechazado', `${req.method} ${req.originalUrl}`, req.ip);
    return res.status(401).json({ error: 'No autenticado.' });
  }

  // Sesión deslizante (FR-014): cada petición autenticada renueva el plazo.
  fijarCookieSesion(res);
  next();
}

export function clavesCoinciden(recibida, esperada) {
  const bufferRecibido = Buffer.from(String(recibida ?? ''));
  const bufferEsperado = Buffer.from(String(esperada ?? ''));
  if (bufferRecibido.length !== bufferEsperado.length) return false;
  return crypto.timingSafeEqual(bufferRecibido, bufferEsperado);
}

export { NOMBRE_COOKIE_SESION };
