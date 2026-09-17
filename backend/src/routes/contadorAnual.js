import { Router } from 'express';

export const contadorAnualRouter = Router();

contadorAnualRouter.get('/:anio', (req, res) => {
  const fila = req.db
    .prepare('SELECT ultimo_numero_asignado FROM contador_anual WHERE anio = ?')
    .get(req.params.anio);

  res.json({
    anio: Number(req.params.anio),
    ultimoNumeroAsignado: fila ? fila.ultimo_numero_asignado : 0,
  });
});
