import { describe, it, expect, beforeEach } from 'vitest';
import { crearAppAutenticada } from '../helpers/appAutenticada.js';

describe('API clientes', () => {
  let agent;

  beforeEach(async () => {
    ({ agent } = await crearAppAutenticada());
  });

  it('crea un cliente con datos válidos', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', nif: 'B12345678', tipo: 'empresa' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({ nombre: 'Empresa XYZ', nif: 'B12345678', tipo: 'empresa' });
    expect(respuesta.body.id).toBeDefined();
  });

  it('rechaza crear un cliente sin nombre', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nif: 'B12345678', tipo: 'empresa' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un cliente sin nif', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', tipo: 'empresa' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un cliente sin tipo', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', nif: 'B12345678' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza crear un cliente con NIF de formato inválido', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nombre: 'Empresa XYZ', nif: '???', tipo: 'empresa' });
    expect(respuesta.status).toBe(400);
  });

  it('crea un cliente cuyo nombre incluye código sin ejecutarlo (se guarda como texto literal)', async () => {
    const respuesta = await agent
      .post('/api/clientes')
      .send({ nombre: '<script>alert(1)</script>', nif: 'B12345678', tipo: 'empresa' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.nombre).toBe('<script>alert(1)</script>');
  });

  it('no rompe la consulta ni afecta a otros registros ante un intento de inyección SQL', async () => {
    await agent.post('/api/clientes').send({ nombre: 'Cliente sano', nif: '11111111A', tipo: 'particular' });

    const intento = await agent
      .post('/api/clientes')
      .send({ nombre: "'; DROP TABLE clientes; --", nif: '22222222B', tipo: 'particular' });
    expect([201, 400]).toContain(intento.status);

    const listado = await agent.get('/api/clientes');
    expect(listado.status).toBe(200);
    expect(listado.body.some((c) => c.nombre === 'Cliente sano')).toBe(true);
  });

  it('lista los clientes creados', async () => {
    await agent.post('/api/clientes').send({ nombre: 'Cliente 1', nif: '11111111A', tipo: 'particular' });
    await agent.post('/api/clientes').send({ nombre: 'Cliente 2', nif: '22222222B', tipo: 'empresa' });

    const respuesta = await agent.get('/api/clientes');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
  });

  it('recupera un cliente concreto por id', async () => {
    const creado = await agent
      .post('/api/clientes')
      .send({ nombre: 'Cliente 1', nif: '11111111A', tipo: 'particular' });

    const respuesta = await agent.get(`/api/clientes/${creado.body.id}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.nombre).toBe('Cliente 1');
  });

  it('registra un evento de auditoría al crear un cliente', async () => {
    const fs = await import('node:fs');
    const { config } = await import('../../src/config.js');

    await agent.post('/api/clientes').send({ nombre: 'Cliente auditado', nif: '11111111A', tipo: 'particular' });

    const contenido = fs.readFileSync(config.logPath, 'utf-8');
    const ultimaLinea = contenido.trim().split('\n').pop();
    const evento = JSON.parse(ultimaLinea);
    expect(evento.tipo).toBe('cambio_dato');
    expect(evento.detalle).toContain('Cliente creado');
  });
});
