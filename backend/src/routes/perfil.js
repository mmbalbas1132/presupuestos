import { Router } from 'express';

export const perfilRouter = Router();

function errorApi(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.expose = true;
  return err;
}

function mapPerfil(fila) {
  if (!fila) return null;
  return {
    nombre: fila.nombre,
    nif: fila.nif,
    contacto: fila.contacto,
    logo: fila.logo,
  };
}

perfilRouter.get('/', (req, res) => {
  const fila = req.db.prepare('SELECT * FROM perfil_freelancer WHERE id = 1').get();
  res.json(mapPerfil(fila));
});

perfilRouter.put('/', (req, res, next) => {
  const { nombre, nif, contacto, logo = null } = req.body || {};

  if (!nombre || !nif || !contacto) {
    return next(errorApi(400, 'Faltan campos obligatorios: nombre, nif y contacto.'));
  }

  req.db
    .prepare(
      `INSERT INTO perfil_freelancer (id, nombre, nif, contacto, logo) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre, nif = excluded.nif,
         contacto = excluded.contacto, logo = excluded.logo`
    )
    .run(nombre, nif, contacto, logo);

  const fila = req.db.prepare('SELECT * FROM perfil_freelancer WHERE id = 1').get();
  res.json(mapPerfil(fila));
});
