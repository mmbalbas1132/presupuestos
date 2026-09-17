import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from './config.js';
import { createConnection } from './db/connection.js';
import { clientesRouter } from './routes/clientes.js';
import { presupuestosRouter } from './routes/presupuestos.js';
import { contadorAnualRouter } from './routes/contadorAnual.js';
import { perfilRouter } from './routes/perfil.js';
import { serviciosRouter } from './routes/servicios.js';
import { authRouter } from './routes/auth.js';
import { middlewareAutenticacion } from './auth.js';
import { middlewareLimiteIntentos } from './rateLimit.js';
import { middlewareHttps } from './https.js';
import { middlewareCors } from './cors.js';
import { registrarEvento, purgarEventosAntiguos } from './auditoria.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UN_DIA_MS = 24 * 60 * 60 * 1000;

export function createApp(db) {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json());

  app.use((req, _res, next) => {
    req.db = db;
    next();
  });

  app.use(middlewareHttps);
  app.use(middlewareCors);

  app.use('/api/auth', middlewareLimiteIntentos, authRouter);

  app.use('/api/clientes', middlewareAutenticacion, clientesRouter);
  app.use('/api/presupuestos', middlewareAutenticacion, presupuestosRouter);
  app.use('/api/contador-anual', middlewareAutenticacion, contadorAnualRouter);
  app.use('/api/perfil', middlewareAutenticacion, perfilRouter);
  app.use('/api/servicios', middlewareAutenticacion, serviciosRouter);

  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));

  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    const mensaje = err.expose ? err.message : 'Ha ocurrido un error inesperado.';
    if (!err.expose || status >= 500) {
      registrarEvento('error_interno', `${req.method} ${req.originalUrl}: ${err.stack || err.message}`, req.ip);
    }
    res.status(status).json({ error: mensaje });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  purgarEventosAntiguos();
  setInterval(() => purgarEventosAntiguos(), UN_DIA_MS).unref();

  const db = createConnection();
  const app = createApp(db);
  app.listen(config.port, () => {
    console.log(`PresupuestosPro backend escuchando en el puerto ${config.port}`);
  });
}
