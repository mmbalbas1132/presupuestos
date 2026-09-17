import { httpClient } from './httpClient.js';

export function iniciarSesion(clave) {
  return httpClient.post('/api/auth/login', { clave });
}

export function cerrarSesion() {
  return httpClient.post('/api/auth/logout');
}
