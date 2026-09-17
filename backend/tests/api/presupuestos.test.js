import { describe, it, expect, beforeEach } from 'vitest';
import { crearAppAutenticada } from '../helpers/appAutenticada.js';

async function crearCliente(agent, datos = { nombre: 'Empresa XYZ', nif: 'B12345678', tipo: 'empresa' }) {
  const respuesta = await agent.post('/api/clientes').send(datos);
  return respuesta.body.id;
}

describe('API presupuestos', () => {
  let agent;

  beforeEach(async () => {
    ({ agent } = await crearAppAutenticada());
  });

  it('guarda un borrador nuevo con líneas', async () => {
    const clienteId = await crearCliente(agent);

    const respuesta = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        autonomoNuevo: false,
        lineas: [{ origen: 'manual', descripcion: 'Diseño', cantidad: 1, precioUnitario: 450 }],
        baseImponible: 450,
        iva: 94.5,
        retencionPorcentaje: 15,
        retencionImporte: 67.5,
        total: 477,
      });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('borrador');
    expect(respuesta.body.lineas).toHaveLength(1);
    expect(respuesta.body.total).toBe(477);
  });

  it('actualiza un borrador existente', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({ clienteId, lineas: [], baseImponible: 0, iva: 0, retencionImporte: 0, total: 0 });

    const actualizado = await agent
      .put(`/api/presupuestos/${creado.body.id}/borrador`)
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Consultoría', cantidad: 2, precioUnitario: 100 }],
        baseImponible: 200,
        iva: 42,
        retencionImporte: 30,
        total: 212,
      });

    expect(actualizado.status).toBe(200);
    expect(actualizado.body.id).toBe(creado.body.id);
    expect(actualizado.body.lineas).toHaveLength(1);
  });

  it('rechaza un borrador sin cliente', async () => {
    const respuesta = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({ lineas: [] });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza una línea con una descripción demasiado larga', async () => {
    const clienteId = await crearCliente(agent);
    const respuesta = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'x'.repeat(501), cantidad: 1, precioUnitario: 1 }],
        baseImponible: 1,
        iva: 0,
        retencionImporte: 0,
        total: 1,
      });
    expect(respuesta.status).toBe(400);
  });

  it('emite un presupuesto con número único', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Diseño', cantidad: 1, precioUnitario: 450 }],
        baseImponible: 450,
        iva: 94.5,
        retencionImporte: 67.5,
        total: 477,
      });

    const emitido = await agent
      .post(`/api/presupuestos/${creado.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    expect(emitido.status).toBe(200);
    expect(emitido.body.estado).toBe('emitido');
    expect(emitido.body.numero).toBe('2026-001');
  });

  it('rechaza emitir un presupuesto sin líneas', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({ clienteId, lineas: [], baseImponible: 0, iva: 0, retencionImporte: 0, total: 0 });

    const emitido = await agent
      .post(`/api/presupuestos/${creado.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    expect(emitido.status).toBe(400);
  });

  it('rechaza editar un presupuesto ya emitido', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Diseño', cantidad: 1, precioUnitario: 450 }],
        baseImponible: 450,
        iva: 94.5,
        retencionImporte: 67.5,
        total: 477,
      });

    await agent
      .post(`/api/presupuestos/${creado.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    const reintento = await agent
      .put(`/api/presupuestos/${creado.body.id}/borrador`)
      .send({ clienteId, lineas: [], baseImponible: 0, iva: 0, retencionImporte: 0, total: 0 });

    expect(reintento.status).toBe(409);
  });

  it('rechaza reemitir un presupuesto ya emitido', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Diseño', cantidad: 1, precioUnitario: 450 }],
        baseImponible: 450,
        iva: 94.5,
        retencionImporte: 67.5,
        total: 477,
      });

    await agent
      .post(`/api/presupuestos/${creado.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    const segundaEmision = await agent
      .post(`/api/presupuestos/${creado.body.id}/emitir`)
      .send({ numero: '2026-002', fechaEmision: '2026-09-15' });

    expect(segundaEmision.status).toBe(409);
  });

  it('rechaza un número de presupuesto duplicado (red de seguridad UNIQUE)', async () => {
    const clienteId = await crearCliente(agent);

    const primero = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Diseño', cantidad: 1, precioUnitario: 450 }],
        baseImponible: 450,
        iva: 94.5,
        retencionImporte: 67.5,
        total: 477,
      });
    await agent
      .post(`/api/presupuestos/${primero.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    const segundo = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({
        clienteId,
        lineas: [{ origen: 'manual', descripcion: 'Consultoría', cantidad: 1, precioUnitario: 100 }],
        baseImponible: 100,
        iva: 21,
        retencionImporte: 15,
        total: 106,
      });

    const emitidoDuplicado = await agent
      .post(`/api/presupuestos/${segundo.body.id}/emitir`)
      .send({ numero: '2026-001', fechaEmision: '2026-09-15' });

    expect(emitidoDuplicado.status).toBe(409);
  });

  it('devuelve el borrador activo para retomarlo', async () => {
    const clienteId = await crearCliente(agent);
    const creado = await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({ clienteId, lineas: [], baseImponible: 0, iva: 0, retencionImporte: 0, total: 0 });

    const activo = await agent.get('/api/presupuestos/borrador-activo');
    expect(activo.status).toBe(200);
    expect(activo.body.id).toBe(creado.body.id);
  });

  it('devuelve null si no hay borrador activo', async () => {
    const respuesta = await agent.get('/api/presupuestos/borrador-activo');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toBeNull();
  });

  it('lista el historial completo incluyendo borradores y emitidos', async () => {
    const clienteId = await crearCliente(agent);
    await agent
      .put('/api/presupuestos/nuevo/borrador')
      .send({ clienteId, lineas: [], baseImponible: 0, iva: 0, retencionImporte: 0, total: 0 });

    const respuesta = await agent.get('/api/presupuestos');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
  });
});
