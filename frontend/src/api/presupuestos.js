import { httpClient } from './httpClient.js';
import { siguienteNumero } from '../domain/numeracion.js';

export function listarPresupuestos() {
  return httpClient.get('/api/presupuestos');
}

export function obtenerBorradorActivo() {
  return httpClient.get('/api/presupuestos/borrador-activo');
}

export function obtenerPresupuesto(id) {
  return httpClient.get(`/api/presupuestos/${id}`);
}

export function guardarBorrador(id, datos) {
  return httpClient.put(`/api/presupuestos/${id || 'nuevo'}/borrador`, datos);
}

export function obtenerContadorAnual(anio) {
  return httpClient.get(`/api/contador-anual/${anio}`);
}

function fechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function emitirPresupuesto(id) {
  const anio = new Date().getFullYear();
  const contadorAnual = await obtenerContadorAnual(anio);
  const numero = siguienteNumero(anio, contadorAnual);
  const fechaEmision = fechaHoyISO();

  return httpClient.post(`/api/presupuestos/${id}/emitir`, { numero, fechaEmision });
}
