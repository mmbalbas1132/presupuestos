import { httpClient } from './httpClient.js';

export function obtenerPerfil() {
  return httpClient.get('/api/perfil');
}

export function guardarPerfil({ nombre, nif, contacto, logo }) {
  return httpClient.put('/api/perfil', { nombre, nif, contacto, logo });
}
