# Data Model: PresupuestosPro v0

**Feature**: PresupuestosPro v0 | **Fecha**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

Todas las entidades se guardan en una base de datos SQLite (un único
fichero) en el servidor donde corre el backend Node.js (ver
[research.md](./research.md) §1-2). El navegador nunca accede a la base de
datos directamente: siempre pasa por la API del backend
(`contracts/api-contract.md`). Cada entidad corresponde a una tabla.

## PerfilFreelancer (singleton — un único registro por instalación)

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| nombre | texto | Sí | FR-001 |
| nif | texto | Sí | FR-001 |
| contacto | texto (email y/o teléfono) | Sí | FR-001 |
| logo | imagen (guardada como data URL) | No | FR-001; si falta, el PDF se genera sin logo (Assumptions) |

**Uso**: se muestra automáticamente como cabecera de marca en pantalla y en
el PDF de todo presupuesto (FR-002).

## Cliente

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| id | identificador interno | Sí | generado al crear el cliente |
| nombre | texto | Sí | FR-024 |
| nif | texto | Sí | FR-024 |
| tipo | enum: `particular` \| `empresa` \| `autonomo` | Sí | FR-024 |

**Reglas**:
- Se crea y se guarda automáticamente la primera vez que se usa en un
  presupuesto (FR-005); queda disponible para seleccionarse en presupuestos
  futuros.
- Un cliente con el mismo nombre que otro ya existente pero con datos
  distintos (p. ej. otro NIF) se trata como un cliente nuevo e independiente
  (Edge Cases).
- La condición de "autónomo nuevo" **no** es un campo del Cliente: se indica
  en cada Presupuesto (ver más abajo), porque ese estatus puede caducar con
  el tiempo (Assumptions).

## Servicio (catálogo)

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| id | identificador interno | Sí | generado al crear el servicio |
| nombre | texto | Sí | FR-003 |
| precioHabitual | número decimal, ≥ 0 | Sí | FR-003 |

**Uso**: al seleccionarse desde el catálogo para una línea, rellena nombre y
precio de esa línea, quedando editables (FR-006, Acceptance US3.2).

## Presupuesto

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| id | identificador interno | Sí | generado al crear el borrador |
| clienteId | referencia a Cliente | Sí | FR-004 |
| autonomoNuevo | booleano | Solo si el cliente es `autonomo` | FR-008 (RF8), editable mientras el presupuesto sea borrador |
| lineas | lista de LineaPresupuesto | Sí (≥ 1 para emitir) | FR-015 |
| estado | enum: `borrador` \| `emitido` | Sí | FR-025, FR-020 |
| numero | texto `AAAA-NNN` o vacío | Solo si `estado = emitido` | FR-017, RN4 |
| fechaEmision | fecha o vacía | Solo si `estado = emitido` | FR-018 |
| validezDias | número fijo = 30 | Sí | FR-018, RN5 |
| baseImponible | número decimal, derivado | — | FR-009: Σ (cantidad × precioUnitario) de las líneas |
| iva | número decimal, derivado | — | FR-010: baseImponible × 21 % |
| retencionPorcentaje | 0 % \| 7 % \| 15 %, derivado | — | FR-011, FR-012, FR-013 según tipo de cliente y `autonomoNuevo` |
| retencionImporte | número decimal, derivado | — | baseImponible × retencionPorcentaje |
| total | número decimal, derivado | — | FR-014: baseImponible + iva − retencionImporte |

**Ciclo de vida (estado)**:

```
borrador ──(generar PDF)──> emitido
   │                            │
   └─ editable, autoguardado    └─ inmutable (FR-020); para cambiar algo
      en local (FR-025)            se crea un presupuesto nuevo
```

- Mientras `estado = borrador`: las líneas, el cliente y la condición de
  "autónomo nuevo" son editables; los campos derivados (base, IVA, retención,
  total) se recalculan automáticamente en cada cambio (FR-023).
- Al pasar a `estado = emitido`: se congelan `numero`, `fechaEmision` y todos
  los importes; el registro pasa a formar parte del historial consultable
  (FR-021) y ya no admite edición ni borrado (FR-020).
- Solo puede existir como máximo un `numero` por combinación de año y NNN
  (unicidad garantizada por el ContadorAnual, ver abajo).

## LineaPresupuesto

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| id | identificador interno | Sí | generado al añadir la línea |
| origen | enum: `catalogo` \| `manual` | Sí | FR-006, FR-007 |
| servicioId | referencia a Servicio, o vacío si `origen = manual` | No | FR-007 (una línea manual no crea ni modifica el catálogo) |
| descripcion | texto | Sí | FR-006 |
| cantidad | número decimal, > 0 | Sí | FR-016 |
| precioUnitario | número decimal, ≥ 0 | Sí | FR-016 |
| importe | número decimal, derivado | — | cantidad × precioUnitario |

**Reglas**: no se permite guardar una línea con `cantidad` o
`precioUnitario` negativos (FR-016); el sistema avisa y no la guarda.

## ContadorAnual (detalle interno de numeración, no visible como pantalla)

| Campo | Tipo | Regla |
|---|---|---|
| anio | número (AAAA) | RN4 |
| ultimoNumeroAsignado | entero, empieza en 0 cada año | FR-017 |

**Regla**: al emitir un presupuesto, se toma el año natural de la fecha de
emisión, se incrementa en 1 el `ultimoNumeroAsignado` de ese año (creando el
registro del año si no existe) y se compone el número como
`AAAA-NNN` (NNN con ceros a la izquierda, 3 dígitos). Esto garantiza la
secuencia sin huecos dentro de un año (los borradores nunca consumen número,
Assumptions) y el reinicio a `001` en cada año natural (RN4, CA5).

## Relaciones

```
PerfilFreelancer (1)            ── aparece en ──>  Presupuesto (N)
Cliente (1) ──── es titular de ────────────────>  Presupuesto (N)
Servicio (0..1) ── origen de ──────────────────>  LineaPresupuesto (N)
Presupuesto (1) ── contiene ────────────────────> LineaPresupuesto (N)
```

## Tablas SQLite (correspondencia directa con las entidades)

- `perfil_freelancer` — una única fila (singleton).
- `clientes` — una fila por Cliente.
- `servicios` — una fila por Servicio del catálogo.
- `presupuestos` — una fila por Presupuesto, con `cliente_id` como clave
  foránea a `clientes`. Tanto los importes derivados (base, IVA, retención,
  total) como el `numero` (`AAAA-NNN`) llegan ya calculados desde el
  navegador (`calculo-contract.md`); el backend no recalcula nada, solo los
  guarda (research.md §6).
  Restricción: `numero` es único (constraint `UNIQUE`) — es la única
  comprobación que hace el backend sobre este dato, como red de seguridad
  ante el caso, muy improbable con una sola freelancer usando la app, de que
  dos emisiones casi simultáneas calculasen el mismo número; si ocurriera,
  la segunda escritura fallaría y el navegador tendría que recalcular y
  reintentar.
- `lineas_presupuesto` — una fila por línea, con `presupuesto_id` y, si
  procede, `servicio_id` como claves foráneas.
- `contador_anual` — una fila por año natural (`anio`,
  `ultimo_numero_asignado`). El navegador la lee para calcular el siguiente
  número (igual que antes, en `calculo-contract.md`) y, al emitir, le pide
  al backend que actualice esa fila con el nuevo valor — el backend solo
  guarda el dato, no decide el número.
