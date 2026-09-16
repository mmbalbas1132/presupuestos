# Contrato: Sistema visual (tokens de diseño)

**Feature**: 002-rediseno-visual-inicio | **Fecha**: 2026-09-16

Este contrato define la única fuente de verdad del sistema visual de
PresupuestosPro (FR-009). Cualquier pantalla nueva o existente, y la
plantilla de PDF, DEBEN consumir estos tokens en vez de declarar colores,
fuentes o espaciados propios.

## Fuente de verdad

- **App (navegador)**: `frontend/src/styles/base.css`, bloque `:root`.
  Toda regla CSS de cualquier pantalla DEBE referenciar estas variables
  (`var(--nombre)`), nunca un valor hex o `px` suelto.
- **PDF**: `frontend/src/pdf/estilosPdf.js` (nuevo). Declara constantes JS
  con los mismos valores literales que `:root`, porque `jsPDF` no puede
  leer CSS (ver `research.md` §1). Comentario obligatorio en la cabecera
  del fichero: *"Mantener sincronizado manualmente con `base.css` :root"*.

## Tokens obligatorios (ampliación de los ya existentes en `base.css`)

| Variable CSS | Uso |
|---|---|
| `--color-fondo`, `--color-superficie`, `--color-texto`, `--color-texto-suave`, `--color-borde` | Ya existentes — se mantienen. |
| `--color-primario`, `--color-primario-oscuro` | Ya existentes — se mantienen (acciones principales, marca). |
| `--color-error`, `--color-error-fondo` | Ya existentes — se mantienen (avisos y errores). |
| `--fuente-base` | NUEVO — familia tipográfica única de la app (system-ui ya usado en `body`, formalizado como variable). |
| `--tam-texto`, `--tam-texto-pequeno`, `--tam-titulo-1`, `--tam-titulo-2`, `--tam-titulo-3` | NUEVO — escala tipográfica para establecer la jerarquía entre títulos, texto de tabla/formulario y totales (FR-010). |
| `--espacio-xs`, `--espacio-sm`, `--espacio` (ya existente), `--espacio-lg` | NUEVO/ampliado — escala de espaciado uniforme (FR-010), sustituyendo valores sueltos como `0.6rem`/`0.4rem` repartidos hoy por `base.css`. |
| `--radio` | Ya existente — se mantiene. |
| `--color-estado-borrador`, `--color-estado-borrador-fondo` | NUEVO — token del estado "Borrador". |
| `--color-estado-enviado`, `--color-estado-enviado-fondo` | NUEVO — token del estado "Enviado" (antes "Emitido"). |
| `--color-estado-aceptado`, `--color-estado-aceptado-fondo` | NUEVO — definido para consistencia; no alcanzable con los datos actuales. |
| `--color-estado-rechazado`, `--color-estado-rechazado-fondo` | NUEVO — ídem. |
| `--color-estado-caducado`, `--color-estado-caducado-fondo` | NUEVO — ídem. |

## Clases de estado (consumidas por `estadoPresupuesto.js`)

Cada estado visual definido en `frontend/src/shared/estadoPresupuesto.js`
DEBE tener una clase CSS correspondiente en `base.css` (p. ej.
`.estado.estado--borrador`, `.estado.estado--enviado`, etc.) que solo use
los tokens `--color-estado-*` de la tabla anterior — nunca un color
hardcodeado.

## Reglas del contrato

1. Ninguna regla CSS nueva puede introducir un valor de color, tamaño de
   fuente o espaciado que no provenga de una variable de esta tabla.
2. `frontend/src/pdf/estilosPdf.js` DEBE usar los mismos valores hex que
   `--color-primario`, `--color-texto`, `--color-texto-suave` y
   `--color-borde` de `base.css` (no hace falta replicar los tokens de
   estado, porque el PDF no muestra el estado del presupuesto — ver
   `generarPdf.js` actual).
3. No se añade ningún framework CSS, preprocesador ni build step nuevo
   para generar estos tokens: se editan a mano ambos ficheros y se
   verifican visualmente (`quickstart.md`).
