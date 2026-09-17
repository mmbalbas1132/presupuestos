import { httpClient } from './httpClient.js';

export function listarServicios() {
  return httpClient.get('/api/servicios');
}

export function crearServicio({ nombre, precioHabitual }) {
  return httpClient.post('/api/servicios', { nombre, precioHabitual });
}

export function actualizarServicio(id, { nombre, precioHabitual }) {
  return httpClient.put(`/api/servicios/${id}`, { nombre, precioHabitual });
}

export function eliminarServicio(id) {
  return httpClient.delete(`/api/servicios/${id}`);
}
