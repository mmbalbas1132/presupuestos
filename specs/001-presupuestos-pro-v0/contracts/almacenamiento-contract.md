# Contrato: API del backend (almacenamiento)

**Feature**: PresupuestosPro v0

El backend Node.js expone una API HTTP mínima cuya única responsabilidad es
guardar y leer datos en la base de datos SQLite (research.md §1-2 y §6). No
calcula IVA, retención, total ni el número de presupuesto: esos valores los
calcula el navegador (`calculo-contract.md`) y se los envía ya calculados. El
backend sí aplica las comprobaciones de integridad de datos que le
corresponden como guardián de la base de datos (campos obligatorios,
unicidad del número de presupuesto, inmutabilidad de lo ya emitido).

Formato: JSON sobre HTTP. Todas las rutas devuelven `4xx` con un mensaje de
error legible si falta un campo obligatorio o se viola una regla de
integridad (equivalente en el backend a los avisos que ya exige la spec en
pantalla, p. ej. CL4).

## Perfil del freelancer

- `GET /api/perfil` → devuelve el perfil guardado, o `null` si aún no se ha
  configurado (FR-001).
- `PUT /api/perfil` → crea o sustituye el único registro de perfil
  (singleton). Rechaza la petición si falta `nombre`, `nif` o `contacto`.

## Catálogo de servicios

- `GET /api/servicios` → lista completa (FR-003).
- `POST /api/servicios` → crea un servicio. Rechaza si falta `nombre` o si
  `precioHabitual < 0`.
- `PUT /api/servicios/:id` → actualiza un servicio existente.
- `DELETE /api/servicios/:id` → elimina un servicio del catálogo.

## Clientes

- `GET /api/clientes` → lista completa, para el selector "cliente
  existente" (FR-004).
- `POST /api/clientes` → crea un cliente. Rechaza si falta `nombre`, `nif` o
  `tipo` (FR-024). Se invoca automáticamente desde el navegador al usar un
  cliente nuevo en un presupuesto (FR-005).
- `GET /api/clientes/:id` → un cliente concreto.

## Presupuestos

- `GET /api/presupuestos` → historial completo, incluye borradores y
  emitidos (FR-021).
- `GET /api/presupuestos/borrador-activo` → el borrador en curso, si existe,
  para retomarlo al reabrir la app (FR-025).
- `PUT /api/presupuestos/:id/borrador` → crea o actualiza el borrador
  (cliente, líneas, `autonomoNuevo`, e importes ya calculados por el
  navegador). El backend rechaza la petición si el presupuesto indicado ya
  tiene `estado = emitido` (protege FR-020 también a nivel de API, no solo
  en la pantalla).
- `POST /api/presupuestos/:id/emitir` → recibe del navegador el `numero`
  (`AAAA-NNN`) y la `fechaEmision` ya calculados
  (`calculo-contract.md#siguienteNumero`), y los persiste junto con el
  cambio de `estado` a `emitido`. Rechaza la petición si:
  - el presupuesto no tiene ninguna línea (FR-015);
  - el `numero` ya existe en la base de datos (red de seguridad de
    `data-model.md` ante números duplicados);
  - el presupuesto ya estaba `emitido` (no se puede volver a emitir).
  A partir de esta llamada, cualquier intento posterior de modificar ese
  presupuesto (incluida la ruta de borrador) se rechaza.
- `GET /api/presupuestos/:id` → recupera un presupuesto del historial (para
  volver a generar su PDF en el navegador, Edge Cases) y `contador-anual`:
- `GET /api/contador-anual/:anio` → devuelve `ultimoNumeroAsignado` para ese
  año (o 0 si no existe todavía), para que el navegador calcule el
  siguiente número antes de emitir.

## Regla transversal

- Ninguna ruta de escritura puede modificar un presupuesto con
  `estado = emitido`, salvo la propia transición que hace
  `POST /api/presupuestos/:id/emitir` en el instante de emitirlo (FR-020).
  Esto se comprueba en el backend, no solo en la interfaz, para que la
  inmutabilidad se cumpla aunque alguien llame a la API directamente.
