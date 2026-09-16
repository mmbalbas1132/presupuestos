import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server.js';
import { createConnection } from '../../src/db/connection.js';

function crearAppDePrueba() {
  const db = createConnection(':memory:');
  return createApp(db);
}

describe('API perfil', () => {
  let app;

  beforeEach(() => {
    app = crearAppDePrueba();
  });

  it('devuelve null si el perfil no se ha configurado todavía', async () => {
    const respuesta = await request(app).get('/api/perfil');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toBeNull();
  });

  it('guarda y recupera el perfil', async () => {
    const guardado = await request(app)
      .put('/api/perfil')
      .send({ nombre: 'Ana Pérez', nif: '12345678A', contacto: 'ana@example.com' });

    expect(guardado.status).toBe(200);
    expect(guardado.body).toMatchObject({ nombre: 'Ana Pérez', nif: '12345678A', contacto: 'ana@example.com' });

    const recuperado = await request(app).get('/api/perfil');
    expect(recuperado.body.nombre).toBe('Ana Pérez');
  });

  it('sustituye el perfil existente al volver a guardarlo (singleton)', async () => {
    await request(app).put('/api/perfil').send({ nombre: 'Ana', nif: '111', contacto: 'a@a.com' });
    await request(app).put('/api/perfil').send({ nombre: 'Ana Actualizada', nif: '222', contacto: 'b@b.com' });

    const recuperado = await request(app).get('/api/perfil');
    expect(recuperado.body.nombre).toBe('Ana Actualizada');
  });

  it('rechaza guardar el perfil sin nombre', async () => {
    const respuesta = await request(app).put('/api/perfil').send({ nif: '111', contacto: 'a@a.com' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil sin nif', async () => {
    const respuesta = await request(app).put('/api/perfil').send({ nombre: 'Ana', contacto: 'a@a.com' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil sin contacto', async () => {
    const respuesta = await request(app).put('/api/perfil').send({ nombre: 'Ana', nif: '111' });
    expect(respuesta.status).toBe(400);
  });
});
