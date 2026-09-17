import { Router } from 'express';
import { validarNif, validarLongitudMaxima, validarContacto, validarLogoDataUrl } from '../validacion.js';
import { registrarEvento } from '../auditoria.js';

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
  if (!validarLongitudMaxima(nombre, 200)) {
    return next(errorApi(400, 'El nombre no es válido (máximo 200 caracteres).'));
  }
  if (!validarNif(nif)) {
    return next(errorApi(400, 'El NIF no tiene un formato válido.'));
  }
  if (!validarContacto(contacto)) {
    return next(errorApi(400, 'El contacto debe parecer un email o un teléfono.'));
  }
  if (!validarLogoDataUrl(logo)) {
    return next(errorApi(400, 'El logo no tiene un formato de imagen válido.'));
  }

  req.db
    .prepare(
      `INSERT INTO perfil_freelancer (id, nombre, nif, contacto, logo) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre, nif = excluded.nif,
         contacto = excluded.contacto, logo = excluded.logo`
    )
    .run(nombre, nif, contacto, logo);

  registrarEvento('cambio_dato', 'Perfil actualizado', req.ip);
  const fila = req.db.prepare('SELECT * FROM perfil_freelancer WHERE id = 1').get();
  res.json(mapPerfil(fila));
});
