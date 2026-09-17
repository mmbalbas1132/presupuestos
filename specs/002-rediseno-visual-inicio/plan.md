# Implementation Plan: Página de inicio y rediseño visual profesional

**Branch**: `002-rediseno-visual-inicio` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-rediseno-visual-inicio/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Esta funcionalidad es puramente de presentación sobre la aplicación ya
implementada en la spec 001: añade una página de inicio como punto de
entrada (con resumen de actividad y accesos a las cuatro secciones),
convierte "Clientes" en una pantalla propia dentro de la navegación común
ya existente, y rediseña visualmente toda la aplicación y la plantilla del
PDF con una identidad consistente (tipografía, colores, espaciado,
jerarquía y estados de presupuesto). No se toca el backend, la API, el
esquema de datos ni los cálculos (`plan.md`/`data-model.md` de la spec 001
se mantienen sin cambios); todo el trabajo ocurre dentro de `frontend/src/`,
sin añadir dependencias nuevas.

## Technical Context

**Language/Version**: JavaScript (ES2022+), sin TypeScript — igual que en
la spec 001 (`specs/001-presupuestos-pro-v0/plan.md`), sin cambios.
**Primary Dependencies**: Ninguna dependencia nueva. Se reutilizan las ya
existentes en `frontend/package.json`: `jsPDF` (ya usado en
`frontend/src/pdf/generarPdf.js`) y Vite como servidor de desarrollo/build.
El sistema visual se implementa con CSS puro (custom properties), sin
frameworks CSS ni librerías de componentes.
**Storage**: N/A para esta funcionalidad — no se modifica la base de datos
SQLite ni el backend (`backend/` queda intacto; ver Clarifications de
spec.md sobre por qué el enum `estado` no se amplía).
**Testing**: Vitest (ya configurado en `frontend/`). Esta funcionalidad no
añade lógica de cálculo nueva, por lo que la verificación principal es
manual guiada por `quickstart.md` (Principio IV de la constitution); se
añade una prueba unitaria ligera para la única función pura nueva
(mapeo de `estado` interno a su representación visual), reutilizando la
configuración de Vitest ya existente en `frontend/tests/unit/`.
**Target Platform**: Igual que la spec 001 — navegador web moderno, de
escritorio y móvil (mobile-first), sirviendo el mismo front-end estático
desde el backend Node.js existente.
**Project Type**: Web (frontend + backend) — sin cambios en el backend;
todos los cambios de esta funcionalidad viven dentro de `frontend/src/`.
**Performance Goals**: Sin cambios respecto a la spec 001 (percepción
instantánea, <1 s). El rediseño no debe añadir peso perceptible: sin
fuentes web externas (se mantienen fuentes de sistema ya usadas en
`base.css`), sin imágenes pesadas nuevas, sin llamadas de red adicionales
más allá de las que ya hace cada pantalla.
**Constraints**:
- Cero cambios en backend, API, esquema de datos o cálculos (FR-013).
- Cero dependencias nuevas (instrucción explícita del usuario).
- Todos los cambios limitados a `frontend/src/` (estructura real del
  proyecto — no existen `public/` ni `src/services/plantillas/` en este
  repositorio; ver nota de resolución más abajo).
- Mobile-first ya existente y español de España se mantienen (Principio II
  de la constitution).
**Scale/Scope**: Pasa de 4 a 6 pantallas navegables dentro de la misma SPA
front-end: Inicio (nueva), Presupuestos (`historial`, ya existente),
Clientes (nueva, antes embebida en el flujo de presupuesto), Catálogo (ya
existente), Perfil (`configuración`, ya existente) y la pantalla de
creación/edición de presupuesto (`presupuesto`, ya existente, ahora
accesible desde "Presupuestos" en vez de ser la ruta por defecto). Más 1
plantilla de PDF rediseñada. Sin cambios en las 15 rutas de API existentes
ni en el volumen de datos.

**Nota de resolución de rutas**: el comando original de planificación
mencionaba `public/`, `public/css/estilos.css` y
`src/services/plantillas/presupuesto.html`. Esas rutas no existen en este
repositorio (confirmado leyendo `specs/001-presupuestos-pro-v0/plan.md` y
el código real): el front-end es una SPA servida por Vite desde
`frontend/`, los estilos viven en `frontend/src/styles/base.css`, y el PDF
se genera en el navegador con `jsPDF` en `frontend/src/pdf/generarPdf.js`
(no hay plantilla HTML server-side). El usuario confirmó usar la
estructura real (`/speckit-clarify`-style confirmation obtenida durante
`/speckit-plan`); este plan y sus artefactos usan exclusivamente las rutas
reales del proyecto.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Cómo lo cumple este plan |
|---|---|---|
| I. Simplicidad ante todo | ⚠️ PASS CON EXCEPCIÓN JUSTIFICADA | Cero dependencias nuevas; se amplía el sistema de variables CSS que ya existe en `base.css` en vez de introducir un framework o preprocesador; la navegación común ya existe estructuralmente en `main.js` (un único `#app-nav` persistente) — solo se añaden dos entradas (Inicio, Clientes) en vez de reconstruirla; la pantalla "Clientes" reutiliza `api/clientes.js` ya existente sin nueva lógica de negocio. Única excepción: los 3 estados visuales no alcanzables hoy (Aceptado, Rechazado, Caducado) son complejidad anticipada para uso futuro; ver Complexity Tracking. |
| II. Idioma y mercado | ✅ PASS | Todos los textos nuevos (Inicio, Clientes, etiquetas de estado) van en español de España; sin cambios de moneda ni formato numérico. |
| III. Cero alcance fantasma | ✅ PASS | No se amplía el enum de `estado` ni se añade ninguna operación de negocio nueva sobre clientes (ver Clarifications de spec.md); el rediseño no introduce pantallas, campos ni flujos no descritos en spec.md. |
| IV. Verificable por una persona no técnica | ✅ PASS | `quickstart.md` permite comprobar cada criterio (llegar a la página de inicio, navegar sin botón atrás, distinguir estados por color, comparar PDF y app) usando la aplicación tal cual, sin código. |
| V. Datos del usuario con respeto | ✅ PASS | El resumen de actividad se calcula a partir de datos ya existentes vía API ya existente (`listarPresupuestos`, `listarClientes`); no se piden ni almacenan datos nuevos. |

**Resultado**: sin violaciones; no aplica Complexity Tracking.

**Re-comprobación tras el diseño (Fase 1)**: revisados `data-model.md` y
los contratos de `contracts/` — no se introduce ninguna entidad persistente
nueva ni ninguna operación de API nueva; el Constitution Check se mantiene
en PASS sin cambios.

## Project Structure

### Documentation (this feature)

```text
specs/002-rediseno-visual-inicio/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── sistema-visual-contract.md   # Tokens de diseño (colores, tipografía, espaciado, estados)
│   └── navegacion-contract.md       # Tabla de rutas/navegación común
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Estructura real ya existente (spec 001) — SIN CAMBIOS en backend/
backend/            # Sin cambios: DB, rutas Express y servidor intactos.

frontend/
├── src/
│   ├── domain/                 # Sin cambios (lógica de cálculo pura).
│   ├── api/                    # Sin cambios (clientes.js, presupuestos.js,
│   │                          # servicios.js, perfil.js ya existentes y
│   │                          # suficientes; se reutilizan tal cual).
│   ├── pdf/
│   │   ├── generarPdf.js       # MODIFICADO: rediseño visual (tipografía,
│   │   │                      # color, jerarquía); mismos datos y campos.
│   │   └── estilosPdf.js        # NUEVO: constantes JS (colores hex,
│   │                          # tipografía) sincronizadas manualmente con
│   │                          # base.css :root (sistema-visual-contract.md).
│   ├── shared/
│   │   ├── formatMoney.js      # Sin cambios.
│   │   └── estadoPresupuesto.js # NUEVO: función pura que traduce el
│   │                          # `estado` interno ('borrador'|'emitido') a
│   │                          # su representación visual (etiqueta, clase
│   │                          # CSS), incluyendo las etiquetas de los 3
│   │                          # estados no alcanzables hoy, para que
│   │                          # historial y cualquier vista futura usen
│   │                          # una única fuente (Clarifications).
│   ├── ui/
│   │   ├── inicio/              # NUEVO: página de inicio (resumen de
│   │   │   └── index.js         # actividad + accesos a las 4 secciones).
│   │   ├── clientes/            # NUEVO: pantalla propia de clientes
│   │   │   └── index.js         # (listado + alta), reutiliza api/clientes.js.
│   │   ├── historial/           # MODIFICADO: solo estilos y uso de
│   │   │   └── index.js         # estadoPresupuesto.js en vez del ternario
│   │   │                       # inline; misma lógica de datos.
│   │   ├── catalogo/            # MODIFICADO: solo estilos.
│   │   ├── configuracion/       # MODIFICADO: solo estilos (sección "Perfil").
│   │   └── presupuesto/         # MODIFICADO: solo estilos.
│   ├── styles/
│   │   └── base.css             # MODIFICADO Y AMPLIADO: única fuente de
│   │                          # variables CSS (tipografía, paleta,
│   │                          # espaciado, tokens de estado) para toda la
│   │                          # aplicación (FR-009).
│   └── main.js                   # MODIFICADO: añade rutas '/inicio'
│                                # (por defecto) y '/clientes'; añade sus
│                                # entradas a la navegación común ya
│                                # existente.
└── tests/
    └── unit/
        └── shared/
            └── estadoPresupuesto.test.js  # NUEVO: prueba unitaria de la
                                           # función de mapeo de estados.
```

**Structure Decision**: se mantiene íntegramente la estructura de dos
carpetas (`backend/`, `frontend/`) de la spec 001; esta funcionalidad solo
añade archivos dentro de `frontend/src/` (dos pantallas nuevas, un módulo
compartido nuevo y ampliaciones de estilo) y modifica archivos existentes
únicamente en su capa de presentación. No se crean carpetas nuevas a nivel
de repositorio ni se toca `backend/`.

## Complexity Tracking

| Violación | Por qué es necesaria | Alternativa más simple rechazada y por qué |
|---|---|---|
| Definir CSS/etiquetas para 3 estados de presupuesto (Aceptado, Rechazado, Caducado) no alcanzables por ninguna acción de la aplicación en esta funcionalidad (FR-011) | Decisión explícita de la persona usuaria, recogida en Clarifications de spec.md (sesión 2026-09-16, pregunta 1, opción A) y en el `Input` original de spec.md: el lenguaje visual de los 5 estados del ciclo de vida debe quedar completo desde ahora, aunque el esquema de datos solo permita 2 hoy. | No definir estilos para los 3 estados no alcanzables y añadirlos solo cuando el esquema los soporte. Se rechaza porque el usuario pidió explícitamente el lenguaje visual completo y lo confirmó en Clarifications; el coste de construirlo ahora es mínimo (solo reglas CSS, sin lógica ni datos nuevos) frente al de una segunda ronda de diseño visual futura. |
