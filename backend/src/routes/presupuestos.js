import { Router } from 'express';
import { validarLongitudMaxima } from '../validacion.js';
import { registrarEvento } from '../auditoria.js';

export const presupuestosRouter = Router();

function errorApi(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.expose = true;
  return err;
}

function mapPresupuesto(db, fila) {
  const lineas = db
    .prepare('SELECT * FROM lineas_presupuesto WHERE presupuesto_id = ? ORDER BY orden')
    .all(fila.id)
    .map((linea) => ({
      id: linea.id,
      origen: linea.origen,
      servicioId: linea.servicio_id,
      descripcion: linea.descripcion,
      cantidad: linea.cantidad,
      precioUnitario: linea.precio_unitario,
    }));

  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    autonomoNuevo: Boolean(fila.autonomo_nuevo),
    estado: fila.estado,
    numero: fila.numero,
    fechaEmision: fila.fecha_emision,
    validezDias: fila.validez_dias,
    baseImponible: fila.base_imponible,
    iva: fila.iva,
    retencionPorcentaje: fila.retencion_porcentaje,
    retencionImporte: fila.retencion_importe,
    total: fila.total,
    lineas,
  };
}

function guardarLineas(db, presupuestoId, lineas) {
  db.prepare('DELETE FROM lineas_presupuesto WHERE presupuesto_id = ?').run(presupuestoId);
  const insertar = db.prepare(
    `INSERT INTO lineas_presupuesto
      (presupuesto_id, servicio_id, origen, descripcion, cantidad, precio_unitario, orden)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  lineas.forEach((linea, indice) => {
    insertar.run(
      presupuestoId,
      linea.servicioId || null,
      linea.origen,
      linea.descripcion,
      linea.cantidad,
      linea.precioUnitario,
      indice
    );
  });
}

presupuestosRouter.get('/borrador-activo', (req, res) => {
  const fila = req.db
    .prepare("SELECT * FROM presupuestos WHERE estado = 'borrador' ORDER BY actualizado_en DESC, id DESC LIMIT 1")
    .get();
  res.json(fila ? mapPresupuesto(req.db, fila) : null);
});

presupuestosRouter.get('/', (req, res) => {
  const filas = req.db.prepare('SELECT * FROM presupuestos ORDER BY id DESC').all();
  res.json(filas.map((fila) => mapPresupuesto(req.db, fila)));
});

presupuestosRouter.get('/:id', (req, res, next) => {
  const fila = req.db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
  if (!fila) {
    return next(errorApi(404, 'Presupuesto no encontrado.'));
  }
  res.json(mapPresupuesto(req.db, fila));
});

presupuestosRouter.put('/:id/borrador', (req, res, next) => {
  const {
    clienteId,
    autonomoNuevo = false,
    lineas = [],
    baseImponible = 0,
    iva = 0,
    retencionPorcentaje = 0,
    retencionImporte = 0,
    total = 0,
  } = req.body || {};

  if (!clienteId) {
    return next(errorApi(400, 'Falta el cliente del presupuesto.'));
  }
  const lineaInvalida = lineas.find((linea) => !validarLongitudMaxima(linea.descripcion, 500));
  if (lineaInvalida) {
    return next(errorApi(400, 'La descripción de una línea no es válida (máximo 500 caracteres).'));
  }

  const db = req.db;
  const esNuevo = req.params.id === 'nuevo';

  let presupuestoId;

  const transaccion = db.transaction(() => {
    if (esNuevo) {
      const resultado = db
        .prepare(
          `INSERT INTO presupuestos
            (cliente_id, autonomo_nuevo, estado, base_imponible, iva, retencion_porcentaje, retencion_importe, total, actualizado_en)
           VALUES (?, ?, 'borrador', ?, ?, ?, ?, ?, datetime('now'))`
        )
        .run(clienteId, autonomoNuevo ? 1 : 0, baseImponible, iva, retencionPorcentaje, retencionImporte, total);
      presupuestoId = resultado.lastInsertRowid;
    } else {
      const existente = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
      if (!existente) {
        throw errorApi(404, 'Presupuesto no encontrado.');
      }
      if (existente.estado === 'emitido') {
        throw errorApi(409, 'Este presupuesto ya se ha emitido y no se puede modificar.');
      }
      db.prepare(
        `UPDATE presupuestos
         SET cliente_id = ?, autonomo_nuevo = ?, base_imponible = ?, iva = ?,
             retencion_porcentaje = ?, retencion_importe = ?, total = ?, actualizado_en = datetime('now')
         WHERE id = ?`
      ).run(
        clienteId,
        autonomoNuevo ? 1 : 0,
        baseImponible,
        iva,
        retencionPorcentaje,
        retencionImporte,
        total,
        req.params.id
      );
      presupuestoId = Number(req.params.id);
    }

    guardarLineas(db, presupuestoId, lineas);
  });

  try {
    transaccion();
  } catch (err) {
    return next(err.status ? err : errorApi(500, err.message));
  }

  registrarEvento('cambio_dato', `Presupuesto guardado (borrador): id=${presupuestoId}`, req.ip);
  const fila = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(presupuestoId);
  res.json(mapPresupuesto(db, fila));
});

presupuestosRouter.post('/:id/emitir', (req, res, next) => {
  const { numero, fechaEmision } = req.body || {};
  const db = req.db;

  if (!numero || !fechaEmision) {
    return next(errorApi(400, 'Faltan el número o la fecha de emisión.'));
  }

  const existente = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
  if (!existente) {
    return next(errorApi(404, 'Presupuesto no encontrado.'));
  }
  if (existente.estado === 'emitido') {
    return next(errorApi(409, 'Este presupuesto ya se ha emitido.'));
  }

  const numLineas = db
    .prepare('SELECT COUNT(*) AS total FROM lineas_presupuesto WHERE presupuesto_id = ?')
    .get(req.params.id).total;
  if (numLineas === 0) {
    return next(errorApi(400, 'El presupuesto no tiene ninguna línea.'));
  }

  const numeroDuplicado = db.prepare('SELECT id FROM presupuestos WHERE numero = ?').get(numero);
  if (numeroDuplicado) {
    return next(errorApi(409, 'Ya existe un presupuesto con ese número.'));
  }

  const coincide = /^(\d{4})-(\d{3})$/.exec(numero);
  if (!coincide) {
    return next(errorApi(400, 'El número de presupuesto no tiene el formato AAAA-NNN.'));
  }
  const [, anioStr, nnnStr] = coincide;

  const transaccion = db.transaction(() => {
    db.prepare(
      `UPDATE presupuestos
       SET estado = 'emitido', numero = ?, fecha_emision = ?, actualizado_en = datetime('now')
       WHERE id = ?`
    ).run(numero, fechaEmision, req.params.id);

    db.prepare(
      `INSERT INTO contador_anual (anio, ultimo_numero_asignado) VALUES (?, ?)
       ON CONFLICT(anio) DO UPDATE SET ultimo_numero_asignado = MAX(ultimo_numero_asignado, excluded.ultimo_numero_asignado)`
    ).run(Number(anioStr), Number(nnnStr));
  });

  transaccion();

  registrarEvento('cambio_dato', `Presupuesto emitido: id=${req.params.id}, numero=${numero}`, req.ip);
  const fila = db.prepare('SELECT * FROM presupuestos WHERE id = ?').get(req.params.id);
  res.json(mapPresupuesto(db, fila));
});
