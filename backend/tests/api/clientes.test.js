import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server.js';
import { createConnection } from '../../src/db/connection.js';

function crearAppDePrueba() {
  const db = createConnection(':memory:');
  return createApp(db);
}

describe('API clientes', () => {
  let app;

  beforeEach(() => {
    app = crearAppDePrueba();
  });

  it('crea un cliente con datos válidos', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', nif: 'B12345678', tipo: 'empresa' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ nombre: 'Empresa XYZ', nif: 'B12345678', tipo: 'empresa' });
    expect(respuesta.body.id).toBeDefined();
  });

  it('rechaza crear un cliente sin nombre', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .send({ nif: 'B12345678', tipo: 'empresa' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un cliente sin nif', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', tipo: 'empresa' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un cliente sin tipo', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', nif: 'B12345678' });
    expect(respuesta.status).toBe(400);
  });

  it('lista los clientes creados', async () => {
    await request(app).post('/api/clientes').send({ nombre: 'Cliente 1', nif: '111', tipo: 'particular' });
    await request(app).post('/api/clientes').send({ nombre: 'Cliente 2', nif: '222', tipo: 'empresa' });

    const respuesta = await request(app).get('/api/clientes');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
  });

  it('recupera un cliente concreto por id', async () => {
    const creado = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Cliente 1', nif: '111', tipo: 'particular' });

    const respuesta = await request(app).get(`/api/clientes/${creado.body.id}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.nombre).toBe('Cliente 1');
  });
});
