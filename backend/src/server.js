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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db) {
  const app = express();

  app.use(express.json());

  app.use((req, _res, next) => {
    req.db = db;
    next();
  });

  app.use('/api/clientes', clientesRouter);
  app.use('/api/presupuestos', presupuestosRouter);
  app.use('/api/contador-anual', contadorAnualRouter);
  app.use('/api/perfil', perfilRouter);
  app.use('/api/servicios', serviciosRouter);

  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const mensaje = err.expose ? err.message : 'Ha ocurrido un error inesperado.';
    res.status(status).json({ error: mensaje });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const db = createConnection();
  const app = createApp(db);
  app.listen(config.port, () => {
    console.log(`PresupuestosPro backend escuchando en el puerto ${config.port}`);
  });
}
