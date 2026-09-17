import { httpClient } from './httpClient.js';

export function listarClientes() {
  return httpClient.get('/api/clientes');
}

export function obtenerCliente(id) {
  return httpClient.get(`/api/clientes/${id}`);
}

export function crearCliente({ nombre, nif, tipo }) {
  return httpClient.post('/api/clientes', { nombre, nif, tipo });
}
