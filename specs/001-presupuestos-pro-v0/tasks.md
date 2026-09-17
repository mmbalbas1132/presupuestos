---

description: "Task list template for feature implementation"
---

# Tasks: PresupuestosPro v0

**Input**: Design documents from `/specs/001-presupuestos-pro-v0/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos. `contracts/calculo-contract.md` y `contracts/almacenamiento-contract.md` definen casos de prueba obligatorios (derivados directamente de los criterios de aceptación CA2-CA7, CL3, CL4 y FR-024/FR-015/FR-020 de la spec), así que las tareas de test se generan junto con la implementación.

**Organization**: Las tareas están agrupadas por historia de usuario (US1, US2, US3) para poder implementar y probar cada una de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3)
- Cada tarea incluye la ruta de fichero exacta

## Path Conventions

Aplicación web con dos carpetas (Opción 2 de plan.md → Project Structure):
`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto — dos paquetes npm independientes, `backend/` y `frontend/`, sin herramientas de monorepo/workspaces (Principio I: la opción más simple que separa igualmente cliente y servidor).

- [X] T001 Create backend/ and frontend/ project directories per plan.md → Project Structure (`backend/src/{db,routes}`, `backend/tests/api`, `frontend/src/{domain,api,pdf,ui,styles,shared}`, `frontend/tests/unit/domain`)
- [X] T002 Initialize backend Node.js project in backend/package.json (`"type": "module"`; dependencies: `express`, `better-sqlite3`; devDependencies: `vitest`, `supertest`)
- [X] T003 [P] Initialize frontend project in frontend/package.json (devDependencies: `vite`, `vitest`) and frontend/vite.config.js
- [X] T004 [P] Create frontend/index.html entry page linking frontend/src/main.js and frontend/src/styles/base.css
- [X] T005 [P] Configure ESLint for plain JavaScript (no TypeScript) at the repo root in .eslintrc.json, applied to both backend/ and frontend/

**Checkpoint**: Ambos proyectos npm instalables (`npm install` en `backend/` y en `frontend/`) antes de continuar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que TODAS las historias de usuario necesitan antes de poder implementarse.

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta completar esta fase.

- [X] T006 Create backend Express app skeleton with JSON body parsing, centralized error-handling middleware, and static serving of frontend/dist in backend/src/server.js (research.md §8)
- [X] T007 [P] Create backend SQLite connection and migration runner in backend/src/db/connection.js (abre/crea el fichero SQLite desde una ruta configurable por variable de entorno; aplica una lista ordenada de sentencias `CREATE TABLE IF NOT EXISTS` que cada historia irá ampliando)
- [X] T008 [P] Create backend environment config loader in backend/src/config.js (`PORT` y `DB_PATH` desde variables de entorno, con valores por defecto para desarrollo local)
- [X] T009 [P] Create frontend hash-based navigation shell and screen router in frontend/src/main.js (registra las rutas vacías de configuración, catálogo, presupuesto e historial)
- [X] T010 [P] Create frontend API client helper in frontend/src/api/httpClient.js (envuelve `fetch`, parsea JSON, convierte errores del backend en avisos legibles para el usuario)
- [X] T011 [P] Create shared Spanish currency formatting utility in frontend/src/shared/formatMoney.js (formatea números como "1.234,56 €", constitution Principio II)
- [X] T012 [P] Create base "classless" stylesheet and mobile-first layout reset in frontend/src/styles/base.css

**Checkpoint**: Backend arranca (`node backend/src/server.js`) y sirve el esqueleto del front-end; las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Crear un presupuesto correcto y descargarlo en PDF (Priority: P1) 🎯 MVP

**Goal**: La freelancer elige o da de alta un cliente, añade líneas (de catálogo o manuales), ve los cálculos automáticos de base/IVA/retención/total, y descarga un PDF con numeración `AAAA-NNN` y validez de 30 días.

**Independent Test**: De extremo a extremo, sin marca ni catálogo configurados: dar de alta un cliente a mano, escribir líneas a mano, comprobar los cálculos en pantalla y el PDF descargado (spec.md → US1, Independent Test).

### Tests for User Story 1 ⚠️

> Escribir estos tests primero y comprobar que fallan antes de implementar.

- [X] T013 [P] [US1] Unit tests for `calcularBaseImponible`, `calcularIVA`, `calcularRetencion`, `calcularTotal` in frontend/tests/unit/domain/calculo.test.js (casos CA2, CA3, CA4, CA7 y la comprobación rápida de `contracts/calculo-contract.md`)
- [X] T014 [P] [US1] Unit tests for `siguienteNumero` in frontend/tests/unit/domain/numeracion.test.js (caso CA5: 2026-001, 2026-002, 2027-001)
- [X] T015 [P] [US1] Unit tests for `validarLinea` and `validarCliente` in frontend/tests/unit/domain/validaciones.test.js (casos CL4 y FR-024)
- [X] T016 [P] [US1] API tests for clientes routes in backend/tests/api/clientes.test.js (crea cliente, rechaza si falta nombre/NIF/tipo — FR-024)
- [X] T017 [P] [US1] API tests for presupuestos routes in backend/tests/api/presupuestos.test.js (guarda borrador, emite con `numero` único, rechaza editar un presupuesto ya emitido — FR-015, FR-020, restricción `UNIQUE` de `numero`)

### Implementation for User Story 1

- [X] T018 [US1] Add `clientes` table to the migrations list in backend/src/db/connection.js (data-model.md → Cliente)
- [X] T019 [US1] Add `presupuestos`, `lineas_presupuesto` and `contador_anual` tables (con `UNIQUE` en `numero`) to the migrations list in backend/src/db/connection.js (data-model.md → Presupuesto, LineaPresupuesto, ContadorAnual)
- [X] T020 [P] [US1] Implement clientes routes (`GET/POST /api/clientes`, `GET /api/clientes/:id`) in backend/src/routes/clientes.js (FR-024)
- [X] T021 [US1] Implement presupuestos routes (`GET /api/presupuestos`, `GET /api/presupuestos/borrador-activo`, `PUT /api/presupuestos/:id/borrador`, `POST /api/presupuestos/:id/emitir`, `GET /api/presupuestos/:id`) in backend/src/routes/presupuestos.js (FR-025, FR-015, FR-020, FR-021)
- [X] T022 [P] [US1] Implement contador-anual route (`GET /api/contador-anual/:anio`) in backend/src/routes/contadorAnual.js
- [X] T023 [US1] Mount clientes, presupuestos and contador-anual routers in backend/src/server.js (depende de T020-T022)
- [X] T024 [P] [US1] Implement domain calculation module in frontend/src/domain/calculo.js (`calcularBaseImponible`, `calcularIVA`, `calcularRetencion`, `calcularTotal` — FR-009 a FR-014)
- [X] T025 [P] [US1] Implement numbering module in frontend/src/domain/numeracion.js (`siguienteNumero` — FR-017)
- [X] T026 [P] [US1] Implement validation module in frontend/src/domain/validaciones.js (`validarLinea`, `validarCliente` — FR-016, FR-024)
- [X] T027 [P] [US1] Implement clientes API client functions in frontend/src/api/clientes.js
- [X] T028 [US1] Implement presupuestos API client functions in frontend/src/api/presupuestos.js (incluye la llamada a contador-anual antes de emitir)
- [X] T029 [US1] Implement PDF generation module in frontend/src/pdf/generarPdf.js using jsPDF (datos del cliente, líneas, base/IVA/retención/total, número, validez — FR-019)
- [X] T030 [US1] Implement presupuesto screen in frontend/src/ui/presupuesto/ (selector/alta inline de cliente, líneas manuales, **reordenar líneas (subir/bajar) — FR-008**, recálculo en vivo — FR-023, autoguardado de borrador — FR-025, bloqueo de edición si ya emitido — FR-020, botón "Generar PDF")
- [X] T031 [US1] Implement historial screen in frontend/src/ui/historial/ (lista de presupuestos, reabrir el borrador activo, redescargar el PDF de un presupuesto emitido — FR-021)
- [X] T032 [US1] Wire presupuesto and historial screens into the navigation shell in frontend/src/main.js

**Checkpoint**: User Story 1 completamente funcional y probable de forma independiente (MVP).

---

## Phase 4: User Story 2 - Configurar la marca del freelancer (Priority: P2)

**Goal**: La freelancer configura una vez su nombre, NIF, contacto y logo, y aparecen automáticamente en todos los presupuestos y PDFs.

**Independent Test**: Configurar los datos y el logo, generar cualquier presupuesto, y comprobar que aparecen en pantalla y en el PDF sin volver a escribirlos (spec.md → US2, Independent Test).

### Tests for User Story 2 ⚠️

- [X] T033 [P] [US2] API tests for perfil route in backend/tests/api/perfil.test.js (guarda y recupera el perfil, rechaza si falta nombre/NIF/contacto — FR-001)

### Implementation for User Story 2

- [X] T034 [US2] Add `perfil_freelancer` table to the migrations list in backend/src/db/connection.js (data-model.md → PerfilFreelancer)
- [X] T035 [US2] Implement perfil route (`GET/PUT /api/perfil`) in backend/src/routes/perfil.js (FR-001)
- [X] T036 [US2] Mount perfil router in backend/src/server.js (depende de T035)
- [X] T037 [P] [US2] Implement perfil API client function in frontend/src/api/perfil.js
- [X] T038 [US2] Implement configuración screen in frontend/src/ui/configuracion/ (formulario nombre/NIF/contacto/logo — FR-001)
- [X] T039 [US2] Show freelancer's profile and logo as a header in the presupuesto screen and in the generated PDF in frontend/src/ui/presupuesto/ and frontend/src/pdf/generarPdf.js (FR-002; sin logo se genera igual, ver Assumptions de spec.md)
- [X] T040 [US2] Wire configuración screen into the navigation shell in frontend/src/main.js

**Checkpoint**: User Story 1 y 2 funcionan juntas y de forma independiente.

---

## Phase 5: User Story 3 - Gestionar un catálogo de servicios reutilizable (Priority: P3)

**Goal**: La freelancer mantiene una lista de servicios habituales con su precio, para añadir líneas en segundos.

**Independent Test**: Dar de alta servicios, cerrar y reabrir la app para comprobar que persisten, y comprobar que al seleccionarlos en una línea rellenan nombre y precio (spec.md → US3, Independent Test).

### Tests for User Story 3 ⚠️

- [X] T041 [P] [US3] API tests for servicios routes in backend/tests/api/servicios.test.js (crea, edita, elimina; rechaza nombre vacío o precio negativo)

### Implementation for User Story 3

- [X] T042 [US3] Add `servicios` table to the migrations list in backend/src/db/connection.js (data-model.md → Servicio)
- [X] T043 [US3] Implement servicios routes (`GET/POST/PUT/DELETE /api/servicios`) in backend/src/routes/servicios.js
- [X] T044 [US3] Mount servicios router in backend/src/server.js (depende de T043)
- [X] T045 [P] [US3] Implement servicios API client functions in frontend/src/api/servicios.js
- [X] T046 [US3] Implement catálogo screen in frontend/src/ui/catalogo/ (listar, dar de alta, editar, eliminar servicios — FR-003)
- [X] T047 [US3] Add "elegir del catálogo" selector to the presupuesto screen's line editor in frontend/src/ui/presupuesto/ (rellena nombre y precio, editable — US3 acceptance scenario 2)
- [X] T048 [US3] Wire catálogo screen into the navigation shell in frontend/src/main.js

**Checkpoint**: Las tres historias de usuario funcionan de forma independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes que afectan a varias historias a la vez.

- [X] T049 [P] Wire frontend build output into backend static serving via an npm script in backend/package.json (`frontend` build a `frontend/dist`, servido por backend/src/server.js — research.md §8)
- [X] T050 [P] Review all screens for mobile-first responsiveness (sin scroll horizontal ni necesidad de zoom) per Constraints en plan.md
- [X] T051 Run quickstart.md end-to-end validation manually and fix any gaps found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias de usuario
- **User Stories (Phase 3-5)**: todas dependen de Foundational
  - Pueden implementarse en paralelo (si hay varias personas) o en orden de prioridad (P1 → P2 → P3)
- **Polish (Phase 6)**: depende de que las historias que se quieran entregar estén completas

### User Story Dependencies

- **User Story 1 (P1)**: puede empezar tras Foundational — sin dependencias de otras historias
- **User Story 2 (P2)**: puede empezar tras Foundational — añade perfil/logo a la pantalla de presupuesto (T039), pero US1 ya es funcional sin ella
- **User Story 3 (P3)**: puede empezar tras Foundational — añade el selector de catálogo a la pantalla de presupuesto (T047), pero US1 ya es funcional sin ella

### Within Each User Story

- Tests antes que la implementación (y deben fallar antes de implementar)
- Tablas de base de datos antes que las rutas que las usan
- Rutas del backend antes de montarlas en backend/src/server.js
- Módulos de dominio/API del front-end antes que las pantallas que los usan
- Historia completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden ejecutarse en paralelo
- Todas las tareas [P] de Foundational pueden ejecutarse en paralelo
- Una vez completado Foundational, US1, US2 y US3 pueden avanzar en paralelo (si hay capacidad de equipo), aunque T039 y T047 tocan el mismo fichero que T030 (presupuesto screen) y deben aplicarse después de esta
- Dentro de cada historia, los tests marcados [P] pueden ejecutarse en paralelo entre sí, igual que los módulos de dominio/rutas que no comparten fichero

---

## Parallel Example: User Story 1

```bash
# Lanzar juntos todos los tests de la User Story 1:
Task: "Unit tests for calcularBaseImponible, calcularIVA, calcularRetencion, calcularTotal in frontend/tests/unit/domain/calculo.test.js"
Task: "Unit tests for siguienteNumero in frontend/tests/unit/domain/numeracion.test.js"
Task: "Unit tests for validarLinea and validarCliente in frontend/tests/unit/domain/validaciones.test.js"
Task: "API tests for clientes routes in backend/tests/api/clientes.test.js"
Task: "API tests for presupuestos routes in backend/tests/api/presupuestos.test.js"

# Lanzar juntos los módulos de dominio del front-end (no comparten fichero):
Task: "Implement domain calculation module in frontend/src/domain/calculo.js"
Task: "Implement numbering module in frontend/src/domain/numeracion.js"
Task: "Implement validation module in frontend/src/domain/validaciones.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 solo)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloquea todas las historias)
3. Completar Phase 3: User Story 1
4. **PARAR Y VALIDAR**: probar User Story 1 de forma independiente (quickstart.md, pasos 0 y 3-7)
5. Desplegar/demostrar si está listo (ya es un presupuesto correcto y descargable, el objetivo central de la spec)

### Incremental Delivery

1. Setup + Foundational → base lista
2. Añadir User Story 1 → probar de forma independiente → desplegar/demo (MVP)
3. Añadir User Story 2 → probar de forma independiente → desplegar/demo
4. Añadir User Story 3 → probar de forma independiente → desplegar/demo
5. Cada historia añade valor sin romper las anteriores

---

## Notes

- [P] = ficheros distintos, sin dependencias pendientes
- La etiqueta [Story] traza cada tarea a su historia de usuario
- Cada historia de usuario debe poder completarse y probarse de forma independiente
- Comprobar que los tests fallan antes de implementar
- Hacer commit tras cada tarea o grupo lógico de tareas
- Parar en cualquier checkpoint para validar una historia de forma independiente
- El backend nunca calcula IVA, retención, total ni número de presupuesto: solo los guarda y valida su integridad (research.md §6, `almacenamiento-contract.md`)
