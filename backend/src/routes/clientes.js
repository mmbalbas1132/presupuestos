import { Router } from 'express';

export const clientesRouter = Router();

function errorApi(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.expose = true;
  return err;
}

clientesRouter.get('/', (req, res) => {
  const clientes = req.db.prepare('SELECT * FROM clientes ORDER BY id').all();
  res.json(clientes.map(mapCliente));
});

clientesRouter.get('/:id', (req, res, next) => {
  const cliente = req.db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) {
    return next(errorApi(404, 'Cliente no encontrado.'));
  }
  res.json(mapCliente(cliente));
});

clientesRouter.post('/', (req, res, next) => {
  const { nombre, nif, tipo } = req.body || {};

  if (!nombre || !nif || !tipo) {
    return next(errorApi(400, 'Faltan campos obligatorios: nombre, nif y tipo.'));
  }

  const resultado = req.db
    .prepare('INSERT INTO clientes (nombre, nif, tipo) VALUES (?, ?, ?)')
    .run(nombre, nif, tipo);

  const cliente = req.db.prepare('SELECT * FROM clientes WHERE id = ?').get(resultado.lastInsertRowid);
  res.status(201).json(mapCliente(cliente));
});

function mapCliente(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    nif: fila.nif,
    tipo: fila.tipo,
  };
}
