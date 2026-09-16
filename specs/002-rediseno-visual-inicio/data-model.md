# Data Model: Página de inicio y rediseño visual profesional

**Feature**: 002-rediseno-visual-inicio | **Fecha**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

Esta funcionalidad **no introduce ni modifica ninguna tabla ni columna**
de la base de datos SQLite. El modelo de datos persistente sigue siendo
exactamente el descrito en
[`specs/001-presupuestos-pro-v0/data-model.md`](../001-presupuestos-pro-v0/data-model.md),
incluido el enum `estado` de `Presupuesto` (`'borrador'` | `'emitido'`),
que se mantiene sin ampliar (ver Clarifications de `spec.md`, sesión
2026-09-16).

Las únicas "entidades" que aparecen en esta funcionalidad son
conceptuales, viven solo en el front-end (memoria/presentación) y se
derivan siempre de datos ya persistidos; no requieren ninguna tabla nueva.

## Resumen de actividad (derivado, no persistido)

Vista agregada de solo lectura que se calcula en el navegador a partir de
los datos que ya devuelven las llamadas existentes a la API
(`listarPresupuestos()`, `listarClientes()`, `listarServicios()`).

| Campo | Tipo | Origen |
|---|---|---|
| totalPresupuestos | entero | `listarPresupuestos().length` |
| presupuestosPorEstado | mapa `{ borrador: n, emitido: n }` | agregación en cliente de `listarPresupuestos()` agrupado por `estado` |
| totalClientes | entero | `listarClientes().length` |
| totalServiciosCatalogo | entero | `listarServicios().length` |

**Reglas**:
- No se crea ningún endpoint nuevo; el resumen se calcula combinando
  llamadas ya existentes (FR-003).
- Si alguna llamada falla, esa parte del resumen se marca como "no
  disponible" sin bloquear el resto de la página de inicio (FR-005).
- Con cero elementos, cada contador simplemente vale 0 (FR-004).

## Estado visual del presupuesto (derivado, no persistido)

Capa de presentación sobre el campo real `estado` de `Presupuesto` (spec
001). Vive como una constante y una función pura en
`frontend/src/shared/estadoPresupuesto.js`.

| Estado interno real (`Presupuesto.estado`) | Etiqueta visual | Alcanzable hoy |
|---|---|---|
| `borrador` | "Borrador" | Sí |
| `emitido` | "Enviado" | Sí |
| *(no existe en el esquema)* | "Aceptado" | No — solo definido visualmente (CSS) para consistencia y uso futuro |
| *(no existe en el esquema)* | "Rechazado" | No — ídem |
| *(no existe en el esquema)* | "Caducado" | No — ídem |

**Reglas**:
- `estadoVisual(estadoInterno)` solo puede devolver "Borrador" o "Enviado",
  porque son los únicos valores que el esquema real permite (FR-011,
  Clarifications).
- Las entradas "Aceptado", "Rechazado" y "Caducado" existen únicamente como
  definición visual (color + etiqueta en CSS) para que el lenguaje de
  diseño quede completo y listo si en el futuro se amplía el ciclo de vida
  real del presupuesto; ninguna acción de la aplicación las produce en el
  alcance de esta funcionalidad.

## Relaciones

Sin cambios respecto a `specs/001-presupuestos-pro-v0/data-model.md`. El
"Resumen de actividad" y el "Estado visual" no son entidades con
identidad propia ni se guardan: son vistas calculadas sobre
`PerfilFreelancer`, `Cliente`, `Servicio` y `Presupuesto` ya existentes.
