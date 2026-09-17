---

description: "Task list template for feature implementation"
---

# Tasks: Página de inicio y rediseño visual profesional

**Input**: Design documents from `/specs/002-rediseno-visual-inicio/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No se pidieron pruebas TDD para esta funcionalidad de presentación (constitution Principio IV: se valida a mano vía `quickstart.md`). Se incluye una única prueba unitaria ligera para la función pura nueva (`estadoPresupuesto.js`), tal como indica `plan.md` §Technical Context.

**Organization**: Las tareas están agrupadas por historia de usuario de `spec.md`. US1 y US2 comparten prioridad P1 (MVP) y están intencionadamente acopladas (la página de Inicio enlaza a "Clientes", que US2 crea); esto se documenta explícitamente en cada checkpoint en vez de forzar una independencia artificial.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Proyecto web existente (`backend/` + `frontend/`, spec 001). Esta funcionalidad **no toca `backend/`**; todas las rutas de fichero están bajo `frontend/`, tal como fija `plan.md` §Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta ninguna inicialización de proyecto ni dependencia nueva antes de empezar.

- [X] T001 Revisar `frontend/package.json` y confirmar que `jsPDF` y Vite (ya presentes) cubren todo lo necesario; no instalar ninguna dependencia nueva (research.md §1, restricción explícita del usuario).

**Checkpoint**: Sin cambios de dependencias pendientes; se puede empezar a tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura visual y de datos compartida por las tres historias de usuario. Ninguna historia puede darse por completa sin esto.

**⚠️ CRITICAL**: No se debe empezar el trabajo de una historia de usuario hasta terminar esta fase.

- [X] T002 Ampliar el bloque `:root` de `frontend/src/styles/base.css` con las variables de tipografía (`--fuente-base`, `--tam-texto`, `--tam-texto-pequeno`, `--tam-titulo-1/2/3`), la escala de espaciado (`--espacio-xs`, `--espacio-sm`, `--espacio-lg`, reutilizando `--espacio` ya existente) y los tokens de color por estado (`--color-estado-borrador(-fondo)`, `--color-estado-enviado(-fondo)`, `--color-estado-aceptado(-fondo)`, `--color-estado-rechazado(-fondo)`, `--color-estado-caducado(-fondo)`), según `contracts/sistema-visual-contract.md`.
- [X] T003 [P] Crear `frontend/src/shared/estadoPresupuesto.js` exportando la constante con los 5 estados visuales (clave, etiqueta en español, clase CSS) y la función pura `estadoVisual(estadoInterno)` que traduce `'borrador'`→"Borrador" y `'emitido'`→"Enviado" (ver `data-model.md` §Estado visual del presupuesto y Clarifications de spec.md).
- [X] T004 Añadir en `frontend/src/styles/base.css` las clases `.estado`, `.estado--borrador`, `.estado--enviado`, `.estado--aceptado`, `.estado--rechazado`, `.estado--caducado`, usando únicamente los tokens `--color-estado-*` creados en T002 (depende de T002).

**Checkpoint**: Sistema de tokens visuales y mapeo de estados listos para que cualquier pantalla los use.

---

## Phase 3: User Story 1 - Llegar a una página de inicio orientadora (Priority: P1) 🎯 MVP

**Goal**: Al entrar en la raíz de la aplicación, la freelancer ve una página de Inicio con un resumen de actividad y accesos a las cuatro secciones, en vez de caer directamente en el formulario de presupuesto.

**Independent Test**: Entrar en la aplicación sin ningún hash en la URL y comprobar que aparece Inicio (no `/presupuesto`) con el resumen de actividad y los 4 accesos; repetir con una instalación sin datos y comprobar que el resumen se muestra en cero sin errores.

- [X] T005 [US1] Crear `frontend/src/ui/inicio/index.js` con `renderInicio(contenedor)`: pide en paralelo `listarPresupuestos()`, `listarClientes()` y `listarServicios()` (ya existentes en `frontend/src/api/`), agrupa los presupuestos por estado usando `estadoVisual()` de `estadoPresupuesto.js` (T003), muestra los contadores (incluido el caso 0), muestra un aviso claro y no bloqueante si alguna llamada falla (FR-005), y renderiza 4 accesos (`<a href="#/historial">`, `<a href="#/clientes">`, `<a href="#/catalogo">`, `<a href="#/configuracion">`).
- [X] T006 [US1] En `frontend/src/main.js`: registrar la ruta `'/inicio'` apuntando a `renderInicio` (T005), cambiar `establecerRutaPorDefecto('/presupuesto')` a `establecerRutaPorDefecto('/inicio')`, y añadir la entrada `<a href="#/inicio">Inicio</a>` al principio de `crearNavegacion()` (depende de T005).
- [X] T007 [US1] Añadir en `frontend/src/styles/base.css` los estilos de las tarjetas de resumen y de los accesos de Inicio, reutilizando `.tarjeta` y los tokens de T002 (sin colores ni tamaños nuevos fuera de esos tokens) (depende de T002, T005).

**Checkpoint**: Entrar en la raíz de la app lleva a Inicio con resumen y accesos funcionales a Presupuestos, Catálogo y Perfil (ya existían como rutas); el acceso a Clientes queda enlazado y se completa en la Fase 4 (US2 tiene la misma prioridad P1 y se entrega junto a esta).

---

## Phase 4: User Story 2 - Moverse entre secciones sin usar "atrás" (Priority: P1)

**Goal**: Todas las pantallas comparten la misma navegación común, con "Clientes" como sección propia, y ninguna pantalla depende del botón "atrás" del navegador.

**Independent Test**: Visitar las 5 pantallas (Inicio + 4 secciones) y comprobar que todas muestran la misma barra de navegación con la sección activa resaltada, y que se puede ir de cualquiera a cualquiera sin usar "atrás".

- [X] T008 [US2] Crear `frontend/src/ui/clientes/index.js` con `renderClientes(contenedor)`: lista los clientes con `listarClientes()` (nombre, NIF, tipo) y permite dar de alta uno nuevo con `crearCliente()` (ambas ya existentes en `frontend/src/api/clientes.js`); sin edición ni borrado (no existen esas operaciones en la API — ver research.md §4).
- [X] T009 [US2] En `frontend/src/main.js`: registrar la ruta `'/clientes'` apuntando a `renderClientes` (T008); en `crearNavegacion()`, añadir la entrada `<a href="#/clientes">Clientes</a>` y renombrar las etiquetas existentes de `<a href="#/historial">` de "Historial" a "Presupuestos" y de `<a href="#/configuracion">` de "Configuración" a "Perfil", dejando el orden Inicio, Presupuestos, Clientes, Catálogo, Perfil (`contracts/navegacion-contract.md`) (depende de T006, T008).
- [X] T010 [US2] Ajustar en `frontend/src/styles/base.css` el layout responsive de `.nav`/`#app-nav` (comportamiento en móvil vs. escritorio) y confirmar que `.nav a.activo` sigue resaltando la sección actual con los tokens de T002 (depende de T002).
- [X] T011 [US2] Revisar `frontend/src/ui/historial/index.js`, `frontend/src/ui/catalogo/index.js`, `frontend/src/ui/configuracion/index.js` y `frontend/src/ui/presupuesto/index.js`: confirmar que ninguna navegación entre secciones usa `window.history.back()` ni depende del botón "atrás" (todas deben usar `window.location.hash` o enlaces `#/...`), corrigiendo si aparece algún caso.

**Checkpoint**: Las 5 pantallas (Inicio, Presupuestos, Clientes, Catálogo, Perfil) son alcanzables desde una única navegación común, sin depender nunca del botón "atrás" (SC-002, SC-003).

---

## Phase 5: User Story 3 - Una apariencia visual profesional y coherente en toda la aplicación (Priority: P2)

**Goal**: La aplicación y el PDF comparten tipografía, paleta de colores, espaciado y jerarquía visual, y los estados de presupuesto se distinguen visualmente.

**Independent Test**: Recorrer las pantallas de listado/formulario/detalle y comprobar visualmente la coherencia; descargar un PDF de ejemplo y comprobar que sigue el mismo lenguaje visual con los mismos datos.

- [X] T012 [P] [US3] Aplicar los tokens de tipografía/espaciado de `base.css` (sin introducir valores nuevos) a los formularios y bloque de totales de `frontend/src/ui/presupuesto/index.js`, sin tocar su lógica de cálculo ni de eventos.
- [X] T013 [P] [US3] Aplicar los mismos tokens a `frontend/src/ui/catalogo/index.js` (tabla y formulario de alta), sin tocar su lógica.
- [X] T014 [P] [US3] Aplicar los mismos tokens a `frontend/src/ui/configuracion/index.js` (formulario de perfil), sin tocar su lógica.
- [X] T015 [US3] Modificar `frontend/src/ui/historial/index.js` para sustituir el ternario inline `presupuesto.estado === 'emitido' ? 'Emitido' : 'Borrador'` por `estadoVisual(presupuesto.estado)` de `estadoPresupuesto.js`, aplicando la clase `.estado--*` correspondiente (T004) a la celda de estado de la tabla (depende de T003, T004).
- [X] T016 [P] [US3] Crear `frontend/src/pdf/estilosPdf.js` con constantes JS (colores hex, familia y tamaños tipográficos) idénticas a los valores de `--color-primario`, `--color-texto`, `--color-texto-suave` y `--color-borde` de `base.css` `:root`, con un comentario indicando que deben mantenerse sincronizadas manualmente (`contracts/sistema-visual-contract.md` regla 2).
- [X] T017 [US3] Rediseñar `frontend/src/pdf/generarPdf.js` para usar las constantes de `estilosPdf.js` en cabecera, datos de freelancer/cliente, tabla de líneas y bloque de totales (jerarquía tipográfica y color), manteniendo exactamente los mismos campos, datos y cálculos que genera hoy (FR-016); conservar (o revisar si cambia el ancho de columna) el `maxWidth` de la celda de descripción para que una descripción de línea muy larga siga sin solaparse con el resto de columnas (Edge Case de spec.md) (depende de T016).
- [X] T018 [P] [US3] Añadir `frontend/tests/unit/shared/estadoPresupuesto.test.js` cubriendo `estadoVisual('borrador')` → "Borrador" y `estadoVisual('emitido')` → "Enviado" (depende de T003).

**Checkpoint**: App y PDF comparten un único lenguaje visual; los estados de presupuesto son distinguibles por color y texto (SC-005, SC-006).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final transversal a las tres historias.

- [X] T019 [P] Revisar en `frontend/src/styles/base.css` el contraste de los tokens `--color-estado-*` y que los elementos interactivos de `.nav` y de los formularios muestren un foco visible al navegar por teclado.
- [X] T020 Ejecutar manualmente `specs/002-rediseno-visual-inicio/quickstart.md` (pasos 0 a 7) y anotar cualquier desviación.
- [X] T021 Ejecutar manualmente `specs/001-presupuestos-pro-v0/quickstart.md` para confirmar que ningún cálculo, dato ni comportamiento de negocio ha cambiado (FR-013, SC-007).
- [X] T022 [P] Ejecutar `npm test` en `frontend/` (Vitest) y confirmar que las pruebas existentes y `estadoPresupuesto.test.js` (T018) pasan.
- [X] T023 [P] Revisar que todos los textos nuevos o modificados (Inicio, Clientes, etiquetas de nav "Presupuestos"/"Perfil", etiquetas de estado "Enviado"/"Borrador"/"Aceptado"/"Rechazado"/"Caducado") están en español de España, sin anglicismos ni términos de otras variantes del español (FR-015).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup — bloquea todas las historias.
- **US1 (Phase 3)**: depende de Foundational (T003 para las etiquetas del resumen).
- **US2 (Phase 4)**: depende de Foundational; T009 depende además de T006 (US1), porque ambas tocan `crearNavegacion()` en el mismo fichero `main.js` — US1 y US2 comparten prioridad P1 y se entregan juntas.
- **US3 (Phase 5)**: depende de Foundational (T003, T004); independiente de US1/US2 en cuanto a ficheros, salvo T015 que también usa T003/T004.
- **Polish (Phase 6)**: depende de que las historias que se vayan a entregar estén completas.

### Parallel Opportunities

- T002 y T003 (Foundational, ficheros distintos).
- T012, T013, T014, T016, T018 (US3, ficheros distintos entre sí).
- T019, T022 y T023 (Polish, ficheros/comandos distintos).

---

## Parallel Example: Foundational

```bash
Task: "Ampliar tokens en frontend/src/styles/base.css (T002)"
Task: "Crear frontend/src/shared/estadoPresupuesto.js (T003)"
```

## Parallel Example: User Story 3

```bash
Task: "Aplicar tokens a frontend/src/ui/presupuesto/index.js (T012)"
Task: "Aplicar tokens a frontend/src/ui/catalogo/index.js (T013)"
Task: "Aplicar tokens a frontend/src/ui/configuracion/index.js (T014)"
Task: "Crear frontend/src/pdf/estilosPdf.js (T016)"
Task: "Prueba unitaria estadoPresupuesto.test.js (T018)"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1 (Setup) y Fase 2 (Foundational).
2. Completar Fase 3 (US1: página de Inicio).
3. Completar Fase 4 (US2: navegación común + Clientes) — junto con US1 forman el MVP de esta funcionalidad, ya que ambas son P1 y están acopladas por diseño (Inicio enlaza a Clientes).
4. **STOP y VALIDAR**: recorrer `quickstart.md` pasos 0-3.
5. Desplegar/demostrar si está listo.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 + US2 → Inicio y navegación común completos → demo del MVP de presentación.
3. US3 → rediseño visual completo (app + PDF) → demo final.
4. Polish → verificación cruzada y de regresión de negocio (FR-013).

---

## Notes

- [P] tasks = ficheros distintos, sin dependencias entre sí.
- [Story] mapea cada tarea a su historia de usuario para trazabilidad.
- US1 y US2 comparten prioridad P1 por diseño de la spec; su acoplamiento (T009 depende de T006) está documentado, no es un descuido.
- No se modifica `backend/` en ninguna tarea de esta lista.
- Verificar manualmente con `quickstart.md` en vez de tests automáticos de UI (constitution Principio IV).

## Hallazgos durante la implementación (2026-09-16)

- **Regresión corregida (no estaba en el plan original)**: al quitar la entrada de navegación directa a `/presupuesto` (T009, contracts/navegacion-contract.md), se perdió la única forma de iniciar un presupuesto nuevo desde la interfaz cuando no hay ya un borrador activo (`historial/index.js` no tenía botón de creación). Se añadió un botón "Nuevo presupuesto" en `frontend/src/ui/historial/index.js` que navega a `#/presupuesto`, restaurando la funcionalidad (FR-014).
- **Bug de maquetación corregido en el PDF (T017)**: la fila de una línea con descripción larga no aumentaba de alto al envolver texto, solapándose con la fila siguiente — justo el Edge Case que spec.md pedía evitar. Corregido en `generarPdf.js` calculando el nº de líneas envueltas (`doc.splitTextToSize`) y creciendo la fila en consecuencia. Verificado generando un PDF de prueba (script Node ad-hoc, descartado) y de nuevo end-to-end descargando un PDF real desde el navegador.
- **T020/T021 ejecutados por el asistente** (2026-09-16) usando una base de datos SQLite temporal y aislada (vía `DB_PATH`) para no tocar los datos reales del usuario: verificado el estado sin datos (§1), navegación completa por las 5 pantallas y resaltado correcto incluyendo acceso directo a `/presupuesto` (§2), alta de cliente (§3), estados visuales "Enviado"/"Borrador" (§4), generación y descarga real de un PDF con cálculos correctos y sin solapamientos (§5), y regresión de negocio nula (cálculos de IVA/retención idénticos a los de la spec 001, `npm test` 26/26). No se pudo verificar visualmente el viewport móvil (§6): la herramienta de redimensionado de ventana del navegador no tuvo efecto en esta sesión; la media query mobile-first (`base.css`, 480px) sigue el mismo patrón ya usado en la spec 001 y no se modificó su lógica de breakpoint.
