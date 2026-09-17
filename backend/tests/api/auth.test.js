import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server.js';
import { createConnection } from '../../src/db/connection.js';
import { config } from '../../src/config.js';
import { crearTokenSesion, NOMBRE_COOKIE_SESION } from '../../src/auth.js';
import { _reiniciarParaTests } from '../../src/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, '..', '..');

function crearAppDePrueba() {
  const db = createConnection(':memory:');
  return createApp(db);
}

describe('Autenticación y sesión (US1)', () => {
  let app;

  beforeEach(() => {
    app = crearAppDePrueba();
    _reiniciarParaTests();
  });

  it('rechaza una petición a /api/clientes sin cookie de sesión', async () => {
    const respuesta = await request(app).get('/api/clientes');
    expect(respuesta.status).toBe(401);
    expect(respuesta.body.error).toBeDefined();
  });

  it('POST /api/auth/login con clave incorrecta responde 401 y no fija cookie', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({ clave: 'clave-incorrecta' });
    expect(respuesta.status).toBe(401);
    expect(respuesta.headers['set-cookie']).toBeUndefined();
  });

  it('POST /api/auth/login con clave correcta abre una sesión que da acceso a la API', async () => {
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ clave: config.accessKey });
    expect(login.status).toBe(204);
    expect(login.headers['set-cookie']).toBeDefined();

    const clientes = await agent.get('/api/clientes');
    expect(clientes.status).toBe(200);
  });

  it('bloquea temporalmente tras 5 intentos fallidos de login desde el mismo origen', async () => {
    const agent = request.agent(app);
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await agent.post('/api/auth/login').send({ clave: 'incorrecta' });
    }

    const sexto = await agent.post('/api/auth/login').send({ clave: config.accessKey });
    expect(sexto.status).toBe(429);
  });

  it('rechaza una cookie de sesión firmada con una ACCESS_KEY distinta (clave rotada)', async () => {
    const tokenConClaveAntigua = crearTokenSesion(Date.now() + 60_000, 'otra-clave-distinta-1234567890');
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Cookie', `${NOMBRE_COOKIE_SESION}=${tokenConClaveAntigua}`);
    expect(respuesta.status).toBe(401);
  });
});

describe('HTTPS y CORS (US2)', () => {
  it('redirige a HTTPS cuando FORCE_HTTPS está activo y la petición no llega cifrada', async () => {
    const original = config.forceHttps;
    config.forceHttps = true;
    try {
      const app = crearAppDePrueba();
      const respuesta = await request(app).get('/api/clientes').set('Host', 'ejemplo.test');
      expect(respuesta.status).toBe(301);
      expect(respuesta.headers.location).toMatch(/^https:\/\//);
    } finally {
      config.forceHttps = original;
    }
  });

  it('rechaza una petición con un origen web no autorizado', async () => {
    const original = config.allowedOrigin;
    config.allowedOrigin = 'https://presupuestos.ejemplo.com';
    try {
      const app = crearAppDePrueba();
      const respuesta = await request(app)
        .get('/api/clientes')
        .set('Origin', 'https://sitio-no-autorizado.test');
      expect(respuesta.status).toBe(403);
    } finally {
      config.allowedOrigin = original;
    }
  });
});

describe('Configuración de secretos (US3)', () => {
  it('lee ACCESS_KEY de process.env sin necesitar un fichero .env físico', () => {
    expect(config.accessKey).toBeDefined();
    expect(config.accessKey.length).toBeGreaterThanOrEqual(16);
  });

  it('impide arrancar si ACCESS_KEY tiene menos de 16 caracteres (fuera del entorno de test)', () => {
    expect(() => {
      execFileSync(process.execPath, ['src/config.js'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, NODE_ENV: 'production', ACCESS_KEY: 'corta' },
        stdio: 'pipe',
      });
    }).toThrow();
  });
});

describe('Manejo seguro de errores (US5)', () => {
  it('no filtra detalles técnicos ante un error interno inesperado', async () => {
    const db = createConnection(':memory:');
    db.close(); // fuerza que cualquier consulta posterior falle de forma inesperada
    const app = createApp(db);
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ clave: config.accessKey });

    const respuesta = await agent.get('/api/clientes');
    expect(respuesta.status).toBe(500);
    expect(respuesta.body.error).toBe('Ha ocurrido un error inesperado.');
    expect(JSON.stringify(respuesta.body)).not.toMatch(/at Object|node_modules|\.js:\d+/);
  });
});
