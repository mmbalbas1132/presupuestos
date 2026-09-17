---

description: "Task list template for feature implementation"
---

# Tasks: Cerrar sesión desde la interfaz

**Input**: Design documents from `/specs/005-cerrar-sesion/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: la spec exige explícitamente al menos un test que cubra el flujo
feliz y otro que cubra el fallo de `cerrarSesion()` (criterios de
aceptación) — por tanto las tareas de test **no** son opcionales en esta
feature.

**Organization**: las tareas se agrupan por historia de usuario (US1, US2
de `spec.md`) para poder implementarlas y probarlas de forma
independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin
  dependencias pendientes)
- **[Story]**: a qué historia de usuario pertenece la tarea (US1, US2)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto web (frontend + backend, `plan.md`); esta feature es
exclusivamente frontend (`frontend/src/`, `frontend/tests/`). No se toca
`backend/`.

---

## Phase 1: Setup

**Purpose**: preparación que no depende de la lógica del cierre de sesión

- [ ] T001 [P] Ajustar `frontend/src/styles/base.css` para que un
      `<button>` dentro de `.nav` se vea y se comporte como los enlaces
      `.nav a` (mismo padding/tamaño en el layout normal y en el `@media
      (max-width: 480px)` ya existente), reutilizando las clases ya
      existentes (`button`, `button.secundario`) sin crear ninguna nueva.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura compartida que bloquea a ambas historias de
usuario

**⚠️ CRITICAL**: ninguna historia de usuario puede empezar hasta terminar
esta fase

- [ ] T002 [P] Crear `frontend/src/shared/cerrarSesionFlujo.js`
      implementando `cerrarSesionFlujo({ cerrarSesion, limpiarEstadoLocal,
      navegarAAcceso })` según el contrato de `data-model.md`: intenta
      `await cerrarSesion()`; si lanza, lo captura y marca
      `huboError = true` sin propagar la excepción; llama siempre a
      `limpiarEstadoLocal()` y siempre a `navegarAAcceso({ huboError })`.
      Los tres parámetros tienen valores por defecto reales: `cerrarSesion`
      importado de `frontend/src/api/auth.js`; `limpiarEstadoLocal` que
      borra `rutaTrasAcceso` de `sessionStorage` con el mismo try/catch
      defensivo que ya usa `frontend/src/ui/acceso/index.js`;
      `navegarAAcceso` que, si `huboError` es `true`, guarda en
      `sessionStorage` la clave `avisoAcceso` con el texto del aviso
      (data-model.md), y en cualquier caso hace
      `window.location.hash = '#/acceso'` seguido de
      `window.location.reload()`.
- [ ] T003 [P] Añadir el control "Cerrar sesión" a `crearNavegacion()` en
      `frontend/src/main.js`: un `<button>` con el texto visible "Cerrar
      sesión" dentro de la `<nav class="nav" id="app-nav">` ya existente
      (que ya se oculta en `/acceso` mediante `nav.hidden = ruta ===
      '/acceso'`, por lo que el control no necesita lógica adicional para
      no aparecer ahí — FR-008). En esta tarea el botón solo se crea y se
      añade al DOM; su comportamiento al pulsarlo se conecta en T004.

**Checkpoint**: con T002 y T003 completas, ambas historias de usuario
pueden implementarse.

---

## Phase 3: User Story 1 - Cerrar sesión desde cualquier pantalla (Priority: P1) 🎯 MVP

**Goal**: cualquier freelancer con sesión iniciada puede pulsar "Cerrar
sesión" desde cualquier pantalla autenticada y termina en la pantalla de
acceso, sin poder volver a ver pantallas protegidas con el botón "atrás".

**Independent Test**: con el backend funcionando con normalidad, pulsar
"Cerrar sesión" desde cualquier pantalla autenticada y comprobar que se
llega a la pantalla de acceso y que el botón "atrás" del navegador no
vuelve a mostrar contenido protegido (quickstart.md, pasos 1-2).

### Tests for User Story 1 ⚠️

- [ ] T004 [P] [US1] Test unitario del flujo feliz en
      `frontend/tests/unit/shared/cerrarSesionFlujo.test.js`: con un
      `cerrarSesion` de prueba que resuelve, comprobar que
      `cerrarSesionFlujo()` llama a `limpiarEstadoLocal()` y a
      `navegarAAcceso({ huboError: false })`, y que no se invoca ninguna
      escritura del aviso de fallo.

### Implementation for User Story 1

- [ ] T005 [US1] Conectar el control "Cerrar sesión" (T003) a
      `cerrarSesionFlujo()` (T002) en `frontend/src/main.js`: al pulsarlo,
      deshabilitar el botón inmediatamente (evita activaciones repetidas —
      FR-007, edge case de doble clic) e invocar `cerrarSesionFlujo()` con
      sus dependencias por defecto.
- [ ] T006 [US1] Validar manualmente los pasos 1 y 2 de `quickstart.md`:
      el control es visible y operable con teclado en Inicio, Presupuestos,
      Clientes, Catálogo y Perfil; al pulsarlo con el backend en marcha se
      llega a la pantalla de acceso; el botón "atrás" del navegador no
      vuelve a mostrar la pantalla protegida anterior.

**Checkpoint**: User Story 1 funciona de forma independiente y es el MVP
de esta feature.

---

## Phase 4: User Story 2 - Cerrar sesión cuando el backend no responde (Priority: P2)

**Goal**: si `cerrarSesion()` falla (backend caído o sin red), la sesión
local se limpia igualmente, la freelancer llega a la pantalla de acceso, y
ve un aviso no bloqueante explicando que hubo un problema en el servidor.

**Independent Test**: con el backend detenido, pulsar "Cerrar sesión" y
comprobar que igualmente se llega a la pantalla de acceso, mostrando un
aviso no bloqueante (quickstart.md, paso 3).

### Tests for User Story 2 ⚠️

- [ ] T007 [P] [US2] Test unitario del flujo de fallo en
      `frontend/tests/unit/shared/cerrarSesionFlujo.test.js`: con un
      `cerrarSesion` de prueba que rechaza, comprobar que
      `cerrarSesionFlujo()` llama igualmente a `limpiarEstadoLocal()` y a
      `navegarAAcceso({ huboError: true })`, y que la función no propaga
      la excepción (no queda una promesa rechazada sin capturar).

### Implementation for User Story 2

- [ ] T008 [P] [US2] Leer y mostrar el aviso no bloqueante en
      `frontend/src/ui/acceso/index.js`: al renderizar la pantalla, si
      existe la clave `avisoAcceso` en `sessionStorage`, mostrar su
      contenido con la clase `.aviso-error` ya existente y borrar la clave
      inmediatamente (mismo patrón defensivo que ya usa `rutaTrasAcceso`
      en el mismo archivo), de forma que el aviso se vea una sola vez y no
      bloquee el uso del formulario de acceso.
- [ ] T009 [US2] Validar manualmente el paso 3 de `quickstart.md`: con el
      backend detenido, pulsar "Cerrar sesión" y comprobar que se llega a
      la pantalla de acceso con el aviso visible, que se puede seguir
      usando la pantalla de acceso con normalidad, y que al reiniciar el
      backend se puede volver a iniciar sesión sin problemas.

**Checkpoint**: User Story 1 y User Story 2 funcionan de forma
independiente.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: comprobaciones finales que afectan a ambas historias

- [ ] T010 [P] Validar manualmente los pasos 4 y 5 de `quickstart.md`: el
      control "Cerrar sesión" no aparece en la pantalla de acceso
      (FR-008); pulsarlo varias veces seguidas muy rápido no dispara
      cierres de sesión duplicados ni deja la aplicación en un estado
      inconsistente (FR-007).
- [ ] T011 Ejecutar `cd frontend && npm test` y confirmar que
      `cerrarSesionFlujo.test.js` (T004, T007) pasa junto con el resto de
      la suite existente (dominio y `shared/`), sin haber roto ningún test
      previo.
- [ ] T012 Revisar (`grep -rn "cerrarSesion" frontend/src`) que
      `cerrarSesion()` de `frontend/src/api/auth.js` solo se invoca desde
      `frontend/src/shared/cerrarSesionFlujo.js`, confirmando que ya no
      queda como código muerto y que no se ha duplicado su lógica en
      ningún otro archivo (spec.md, FR-002).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: sin dependencia de Setup (archivos
  distintos), pero debe completarse antes de cualquier historia de
  usuario.
- **User Story 1 (Phase 3)**: depende de Foundational (T002, T003).
- **User Story 2 (Phase 4)**: depende de Foundational (T002). Sus tareas
  de test e implementación (T007, T008) son independientes de User Story 1
  y podrían desarrollarse en paralelo con la Fase 3; solo la validación
  manual completa de extremo a extremo (T009) necesita que el botón ya
  esté conectado (T005, User Story 1).
- **Polish (Phase 5)**: depende de que ambas historias estén completas.

### Within Each User Story

- Los tests (T004, T007) se escriben contra `cerrarSesionFlujo()`, ya
  construida en Foundational (T002); fijan como criterio de aceptación el
  comportamiento de cada rama (éxito/fallo) descrito en `spec.md`.
- La implementación específica de cada historia (T005 conecta el botón;
  T008 muestra el aviso) es la que aporta el valor observable de esa
  historia.

### Parallel Opportunities

- T001 (Setup) es independiente de todo lo demás y puede ir en paralelo
  con la Fase 2.
- T002 y T003 (Foundational) tocan archivos distintos y no dependen entre
  sí: paralelizables.
- T004 (test de US1) y T007 (test de US2) tocan el mismo archivo de test
  pero casos distintos; si se implementan en la misma sesión, hacerlo
  secuencialmente para evitar conflictos de edición, aunque no dependen
  el uno del otro.
- T008 (US2) es independiente de T005 (US1): archivos distintos.

---

## Parallel Example: Foundational

```bash
Task: "Crear frontend/src/shared/cerrarSesionFlujo.js (T002)"
Task: "Añadir el control 'Cerrar sesión' a crearNavegacion() en frontend/src/main.js (T003)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup (T001)
2. Completar Fase 2: Foundational (T002, T003) — bloquea ambas historias
3. Completar Fase 3: User Story 1 (T004-T006)
4. **Parar y validar**: probar el flujo feliz de forma independiente
   (quickstart.md, pasos 1-2)
5. Esto ya es un incremento entregable: cierre de sesión funcional con el
   backend disponible

### Incremental Delivery

1. Setup + Foundational → base lista
2. Añadir User Story 1 → validar de forma independiente → MVP
3. Añadir User Story 2 → validar de forma independiente → cierre de sesión
   robusto también cuando el backend falla
4. Fase de Polish → confirma que no queda código muerto y que la
   suite de tests pasa completa

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes entre esas tareas
- [Story] = a qué historia de usuario pertenece la tarea, para
  trazabilidad con `spec.md`
- `cerrarSesionFlujo.js` se construye completo en Foundational (T002)
  porque sus dos ramas (éxito y fallo) forman una única función pequeña e
  indivisible (research.md §1); cada historia de usuario aporta después su
  propio test de aceptación y su propia pieza de UI observable (T005/T006
  para US1, T008/T009 para US2), no una reimplementación parcial de la
  función.
- Ninguna tarea toca `backend/`: `POST /api/auth/logout` ya existe y no se
  modifica (spec.md — Fuera de alcance).
- Confirmar que los tests fallan antes de implementar cuando aplique
  TDD estricto; en T004/T007 el módulo bajo prueba (T002) ya existe por
  ser Foundational, así que su valor es fijar el comportamiento como
  criterio de aceptación regresivo, no descubrir el diseño.
- Hacer commit tras cada tarea o grupo lógico de tareas.
