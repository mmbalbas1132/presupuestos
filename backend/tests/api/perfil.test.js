import { describe, it, expect, beforeEach } from 'vitest';
import { crearAppAutenticada } from '../helpers/appAutenticada.js';

describe('API perfil', () => {
  let agent;

  beforeEach(async () => {
    ({ agent } = await crearAppAutenticada());
  });

  it('devuelve null si el perfil no se ha configurado todavía', async () => {
    const respuesta = await agent.get('/api/perfil');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toBeNull();
  });

  it('guarda y recupera el perfil', async () => {
    const guardado = await agent
      .put('/api/perfil')
      .send({ nombre: 'Ana Pérez', nif: '12345678A', contacto: 'ana@example.com' });

    expect(guardado.status).toBe(200);
    expect(guardado.body).toMatchObject({ nombre: 'Ana Pérez', nif: '12345678A', contacto: 'ana@example.com' });

    const recuperado = await agent.get('/api/perfil');
    expect(recuperado.body.nombre).toBe('Ana Pérez');
  });

  it('sustituye el perfil existente al volver a guardarlo (singleton)', async () => {
    await agent.put('/api/perfil').send({ nombre: 'Ana', nif: '11111111A', contacto: 'a@a.com' });
    await agent.put('/api/perfil').send({ nombre: 'Ana Actualizada', nif: '22222222B', contacto: 'b@b.com' });

    const recuperado = await agent.get('/api/perfil');
    expect(recuperado.body.nombre).toBe('Ana Actualizada');
  });

  it('rechaza guardar el perfil sin nombre', async () => {
    const respuesta = await agent.put('/api/perfil').send({ nif: '11111111A', contacto: 'a@a.com' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil sin nif', async () => {
    const respuesta = await agent.put('/api/perfil').send({ nombre: 'Ana', contacto: 'a@a.com' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil sin contacto', async () => {
    const respuesta = await agent.put('/api/perfil').send({ nombre: 'Ana', nif: '11111111A' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil con NIF de formato inválido', async () => {
    const respuesta = await agent.put('/api/perfil').send({ nombre: 'Ana', nif: '???', contacto: 'a@a.com' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza guardar el perfil con contacto irreconocible como email o teléfono', async () => {
    const respuesta = await agent
      .put('/api/perfil')
      .send({ nombre: 'Ana', nif: '11111111A', contacto: 'no es un contacto' });
    expect(respuesta.status).toBe(400);
  });

  it('rechaza un logo que no es un data URL de imagen', async () => {
    const respuesta = await agent
      .put('/api/perfil')
      .send({ nombre: 'Ana', nif: '11111111A', contacto: 'a@a.com', logo: 'data:text/html,<script>1</script>' });
    expect(respuesta.status).toBe(400);
  });
});
