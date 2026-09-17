import { describe, it, expect, beforeEach } from 'vitest';
import { crearAppAutenticada } from '../helpers/appAutenticada.js';

describe('API servicios', () => {
  let agent;

  beforeEach(async () => {
    ({ agent } = await crearAppAutenticada());
  });

  it('crea un servicio', async () => {
    const respuesta = await agent
      .post('/api/servicios')
      .send({ nombre: 'Diseño de logotipo', precioHabitual: 450 });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ nombre: 'Diseño de logotipo', precioHabitual: 450 });
  });

  it('rechaza crear un servicio sin nombre', async () => {
    const respuesta = await agent.post('/api/servicios').send({ precioHabitual: 450 });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un servicio con precio negativo', async () => {
    const respuesta = await agent
      .post('/api/servicios')
      .send({ nombre: 'Servicio', precioHabitual: -10 });
    expect(respuesta.status).toBe(400);
  });

  it('lista los servicios del catálogo', async () => {
    await agent.post('/api/servicios').send({ nombre: 'A', precioHabitual: 10 });
    await agent.post('/api/servicios').send({ nombre: 'B', precioHabitual: 20 });

    const respuesta = await agent.get('/api/servicios');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
  });

  it('edita un servicio existente', async () => {
    const creado = await agent.post('/api/servicios').send({ nombre: 'A', precioHabitual: 10 });

    const editado = await agent
      .put(`/api/servicios/${creado.body.id}`)
      .send({ nombre: 'A editado', precioHabitual: 15 });

    expect(editado.status).toBe(200);
    expect(editado.body.nombre).toBe('A editado');
    expect(editado.body.precioHabitual).toBe(15);
  });

  it('elimina un servicio', async () => {
    const creado = await agent.post('/api/servicios').send({ nombre: 'A', precioHabitual: 10 });

    const eliminado = await agent.delete(`/api/servicios/${creado.body.id}`);
    expect(eliminado.status).toBe(204);

    const listado = await agent.get('/api/servicios');
    expect(listado.body).toHaveLength(0);
  });
});
