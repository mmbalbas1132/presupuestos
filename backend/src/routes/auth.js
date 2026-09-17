import { Router } from 'express';
import { config } from '../config.js';
import { clavesCoinciden, fijarCookieSesion, borrarCookieSesion } from '../auth.js';
import { registrarEvento } from '../auditoria.js';
import { registrarIntentoFallido } from '../rateLimit.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { clave } = req.body || {};

  if (!clavesCoinciden(clave, config.accessKey)) {
    registrarIntentoFallido(req.ip);
    registrarEvento('acceso_rechazado', 'POST /api/auth/login (clave incorrecta)', req.ip);
    return res.status(401).json({ error: 'Clave incorrecta.' });
  }

  fijarCookieSesion(res);
  res.status(204).end();
});

authRouter.post('/logout', (req, res) => {
  borrarCookieSesion(res);
  res.status(204).end();
});
