# Research: Página de inicio y rediseño visual profesional

**Feature**: 002-rediseno-visual-inicio | **Fecha**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

No quedaban `NEEDS CLARIFICATION` en el Technical Context del plan (todas
las decisiones técnicas se derivan directamente de la spec 001, ya
implementada). Este documento recoge las decisiones de diseño técnico
propias de esta funcionalidad de presentación.

## 1. Dónde vive el sistema de variables visuales (CSS vs. PDF)

**Decisión**: `frontend/src/styles/base.css` sigue siendo la única fuente
de verdad para el sistema visual de la aplicación web, ampliando el bloque
`:root` ya existente con variables de tipografía (familia, escala de
tamaños), la paleta completa y los tokens de color por estado de
presupuesto. Para la plantilla de PDF (`frontend/src/pdf/generarPdf.js`),
que usa `jsPDF` y por tanto **no** tiene acceso a CSS ni al DOM, se crea un
módulo JS pequeño y sin dependencias, `frontend/src/pdf/estilosPdf.js`, que
declara como constantes JS los mismos valores literales (mismos colores
hex, misma escala tipográfica) que `base.css`.

**Rationale**: El usuario pidió explícitamente centralizar el sistema
visual en variables CSS en un único lugar. Eso se cumple al 100% para todo
lo que se renderiza en el navegador. `jsPDF` genera el PDF con
instrucciones de dibujo (texto, líneas, rectángulos) directamente en JS,
sin motor de renderizado HTML/CSS, así que no puede leer `:root` ni
ninguna hoja de estilos — esto no es una elección de diseño sino una
limitación técnica de la librería ya usada en la spec 001 (que esta
funcionalidad no puede cambiar sin añadir una dependencia nueva, algo
explícitamente prohibido). `estilosPdf.js` queda documentado con un
comentario explícito ("mantener sincronizado con `base.css` `:root`") como
la única extensión necesaria de la fuente de verdad visual hacia el mundo
no-CSS del PDF.

**Alternativas consideradas**:
- Generar el PDF a partir de HTML/CSS renderizado (p. ej.
  `html2canvas` + `jsPDF`, o una librería de plantillas HTML→PDF):
  rechazado por añadir una dependencia nueva (prohibido explícitamente) y
  por cambiar el motor de generación de PDF ya validado en la spec 001,
  con riesgo de romper el contenido/formato del documento fuera del
  alcance de "solo presentación".
- Mantener los colores del PDF completamente hardcodeados sin ninguna
  relación documentada con `base.css`: rechazado porque rompería el
  requisito de coherencia visual app↔PDF (FR-012, SC-006) sin dejar rastro
  de por qué ambos deben cambiar juntos.

## 2. Cómo representar los 5 estados visuales cuando el esquema solo soporta 2

**Decisión**: Se centraliza el mapeo estado→visual en una única función
pura, `frontend/src/shared/estadoPresupuesto.js`, que expone: (a) una
constante con los 5 estados conceptuales (clave, etiqueta en español,
clase CSS) — Borrador, Enviado, Aceptado, Rechazado, Caducado — y (b) una
función `estadoVisual(estadoInterno)` que traduce el valor real de la base
de datos (`'borrador'` | `'emitido'`) a su entrada correspondiente de esa
constante (`'emitido'` → entrada "Enviado"). Los 3 estados restantes
existen solo como definición visual (clases CSS con su color en
`base.css`) para consistencia y preparación futura, pero
`estadoVisual()` nunca los devuelve porque el dato real no puede tomarlos
(ver Clarifications de spec.md).

**Rationale**: Resuelve la Clarification de la sesión 2026-09-16 (opción
A) sin tocar el esquema de datos ni la API, y evita repetir el ternario
`estado === 'emitido' ? 'Emitido' : 'Borrador'` que hoy vive inline en
`frontend/src/ui/historial/index.js` — centralizarlo en un módulo permite
reutilizarlo en cualquier vista futura que muestre el estado.

**Alternativas consideradas**:
- Dejar el ternario inline y solo cambiarle el texto a "Enviado": rechazado
  porque no deja un único lugar para el lenguaje visual completo de los 5
  estados que pide la spec, y duplicaría lógica si otra pantalla necesita
  mostrar el estado en el futuro.

## 3. Cómo añadir la página de inicio y la sección Clientes sin nueva infraestructura de rutas

**Decisión**: Se reutiliza el enrutador hash-based ya existente en
`frontend/src/main.js` (`registrarRuta`, `establecerRutaPorDefecto`). Se
registran dos rutas nuevas, `/inicio` (nueva ruta por defecto,
sustituyendo a `/presupuesto`) y `/clientes`, siguiendo exactamente el
mismo patrón `render(contenedor)` que ya usan `historial`, `catalogo`,
`configuracion` y `presupuesto`. La navegación común (`crearNavegacion()`)
se amplía con las dos entradas nuevas.

**Rationale**: El enrutador y la navegación común **ya existen
estructuralmente** (un único `<nav id="app-nav">` se crea una vez en
`iniciarApp()` y persiste mientras solo se re-renderiza `#app-contenido`
en cada cambio de ruta) — la funcionalidad no necesita construir ningún
mecanismo de routing o de navegación persistente nuevo, solo registrar dos
pantallas más siguiendo el patrón existente. Esto es lo más simple posible
(Principio I) y es coherente con cómo ya funciona el resto de la app.

**Alternativas consideradas**:
- Introducir una librería de routing (p. ej. un router SPA de terceros):
  rechazado, añadiría una dependencia nueva para resolver algo que el
  código ya resuelve con ~80 líneas propias.

## 4. Alcance de la pantalla "Clientes"

**Decisión**: La pantalla `frontend/src/ui/clientes/index.js` muestra un
listado de clientes (reutilizando `listarClientes()` de
`frontend/src/api/clientes.js`, ya existente) con nombre, NIF y tipo, y
permite dar de alta un cliente reutilizando `crearCliente()` (también ya
existente y ya usado hoy dentro del flujo de presupuesto). No se añade
edición ni borrado de clientes porque esas operaciones no existen hoy en
la API (`contracts/almacenamiento-contract.md` de la spec 001) y añadirlas
sería alcance fantasma (Principio III), fuera del propósito puramente
visual/navegacional de esta funcionalidad.

**Rationale**: Resuelve la Clarification de la sesión 2026-09-16 sobre
"Clientes" (pantalla propia reutilizando lo existente) con el mínimo de
código nuevo: es una vista de solo-listado-y-alta que llama a funciones
que ya existían y ya se usaban en producción.

**Alternativas consideradas**: ver FR-002a y Clarifications de spec.md
(opciones descartadas: enlace directo al flujo de presupuesto, o solo dato
informativo sin navegación propia).
