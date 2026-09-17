import request from 'supertest';
import { createApp } from '../../src/server.js';
import { createConnection } from '../../src/db/connection.js';
import { config } from '../../src/config.js';

/**
 * Crea una app de pruebas con una base de datos en memoria y devuelve un
 * agente de supertest ya autenticado (con la cookie de sesión), para que
 * los tests de cada recurso no tengan que repetir el login.
 */
export async function crearAppAutenticada() {
  const db = createConnection(':memory:');
  const app = createApp(db);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ clave: config.accessKey });
  return { app, agent, db };
}
