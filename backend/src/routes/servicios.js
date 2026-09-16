import { Router } from 'express';

export const serviciosRouter = Router();

function errorApi(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.expose = true;
  return err;
}

function mapServicio(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    precioHabitual: fila.precio_habitual,
  };
}

serviciosRouter.get('/', (req, res) => {
  const filas = req.db.prepare('SELECT * FROM servicios ORDER BY nombre').all();
  res.json(filas.map(mapServicio));
});

serviciosRouter.post('/', (req, res, next) => {
  const { nombre, precioHabitual } = req.body || {};

  if (!nombre || precioHabitual === undefined || precioHabitual === null || precioHabitual < 0) {
    return next(errorApi(400, 'Falta el nombre o el precio no es válido.'));
  }

  const resultado = req.db
    .prepare('INSERT INTO servicios (nombre, precio_habitual) VALUES (?, ?)')
    .run(nombre, precioHabitual);

  const fila = req.db.prepare('SELECT * FROM servicios WHERE id = ?').get(resultado.lastInsertRowid);
  res.status(201).json(mapServicio(fila));
});

serviciosRouter.put('/:id', (req, res, next) => {
  const { nombre, precioHabitual } = req.body || {};

  if (!nombre || precioHabitual === undefined || precioHabitual === null || precioHabitual < 0) {
    return next(errorApi(400, 'Falta el nombre o el precio no es válido.'));
  }

  const existente = req.db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id);
  if (!existente) {
    return next(errorApi(404, 'Servicio no encontrado.'));
  }

  req.db
    .prepare('UPDATE servicios SET nombre = ?, precio_habitual = ? WHERE id = ?')
    .run(nombre, precioHabitual, req.params.id);

  const fila = req.db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id);
  res.json(mapServicio(fila));
});

serviciosRouter.delete('/:id', (req, res, next) => {
  const existente = req.db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id);
  if (!existente) {
    return next(errorApi(404, 'Servicio no encontrado.'));
  }

  req.db.prepare('DELETE FROM servicios WHERE id = ?').run(req.params.id);
  res.status(204).send();
});
