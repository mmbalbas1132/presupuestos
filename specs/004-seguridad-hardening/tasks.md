---

description: "Task list template for feature implementation"
---

# Tasks: Seguridad y hardening de PresupuestosPro

**Input**: Design documents from `/specs/004-seguridad-hardening/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-contract.md, quickstart.md

**Tests**: Incluidos. Esta feature protege la API y los datos sensibles de la aplicación (lo más delicado, según `CLAUDE.md`), así que cada historia añade pruebas automáticas junto con la implementación, siguiendo el mismo patrón ya usado en `backend/tests/api/*.test.js` (Vitest + Supertest contra `createApp(db)` con SQLite en memoria).

**Organization**: Las tareas están agrupadas por historia de usuario de `spec.md`. US1 y US2 comparten prioridad P1; US1 es el MVP real (sin ella, nada más importa) y US2 es igual de crítica pero técnicamente independiente (HTTPS/CORS), así que se implementa justo después.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Include exact file paths in descriptions

## Path Conventions

Proyecto web existente (`backend/` + `frontend/`, spec 001). Esta feature añade módulos nuevos en `backend/src/` y `frontend/src/` (ver `plan.md` → Project Structure) y amplía rutas ya existentes; no cambia el esquema de `backend/src/db/connection.js` (`data-model.md`).

---

## Phase 1: Setup

**Purpose**: Confirmar que no hace falta ninguna dependencia nueva antes de empezar.

- [x] T001 Revisar `backend/package.json` y confirmar que no se necesita ninguna dependencia nueva (`express-session`, `jsonwebtoken`, `express-rate-limit`, `cors`, `dotenv`): todo se implementa con `node:crypto` y `node:fs`, ya disponibles en el runtime (research.md §1-9, constitution Principio I).

**Checkpoint**: Sin cambios de dependencias pendientes; se puede empezar a tocar código.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida por al menos tres historias de usuario (carga de configuración, registro de auditoría, resolución de IP real). Ninguna historia puede darse por completa sin esto.

**⚠️ CRITICAL**: No se debe empezar el trabajo de una historia de usuario hasta terminar esta fase.

- [x] T002 Ampliar `backend/src/config.js` para cargar `.env` con `process.loadEnvFile()` (envuelto en `try/catch` para no fallar si el fichero no existe) y exponer `config.accessKey`, `config.allowedOrigin`, `config.forceHttps` y `config.logPath` leídos de `process.env`; si `config.accessKey` tiene menos de 16 caracteres, lanzar un error al arrancar explicando el motivo (research.md §1-2, FR-003).
- [x] T003 [P] Crear `backend/src/auditoria.js` exportando `registrarEvento(tipo, detalle, origen)` (añade una línea JSON `{ fecha, tipo, detalle, origen }` a `config.logPath`) y `purgarEventosAntiguos()` (reescribe el fichero descartando líneas con `fecha` de hace más de 90 días); invocar `purgarEventosAntiguos()` una vez al arrancar el backend en `backend/src/server.js` (data-model.md → "Evento de auditoría", FR-009, FR-010, FR-016).
- [x] T004 Añadir `app.set('trust proxy', 1)` en `backend/src/server.js` para que `req.ip` y `req.secure` reflejen el cliente real cuando la app corre detrás de un proxy inverso (research.md §3 y §5) (depende de T002).

**Checkpoint**: Configuración por entorno, registro de auditoría e IP real listos para que cualquier historia los use.

---

## Phase 3: User Story 1 - La API rechaza cualquier acceso sin la clave correcta (Priority: P1) 🎯 MVP

**Goal**: Ninguna petición a `/api/clientes`, `/api/presupuestos` o `/api/perfil` devuelve ni modifica datos sin una clave de acceso válida (directa o vía sesión); la sesión de navegador es deslizante (7 días sin actividad) y se invalida al rotar la clave; 5 intentos fallidos en 15 minutos desde la misma IP bloquean 15 minutos.

**Independent Test**: Llamar a la API sin clave (401, sin datos), con clave incorrecta (401), con clave correcta (200, sesión abierta); repetir clave incorrecta 5 veces seguidas y comprobar el bloqueo (429) en el sexto intento.

### Tests for User Story 1 ⚠️

> Escribir estos tests primero y comprobar que fallan antes de implementar.

- [x] T005 [P] [US1] Test en `backend/tests/api/auth.test.js`: `GET /api/clientes` sin cookie de sesión devuelve `401` y ningún dato (FR-001, FR-002, SC-001).
- [x] T006 [P] [US1] Test en `backend/tests/api/auth.test.js`: `POST /api/auth/login` con clave incorrecta devuelve `401` sin fijar cookie; con clave correcta devuelve `204`, fija cookie, y una petición posterior con esa cookie a `GET /api/clientes` devuelve `200` (FR-001, FR-014).
- [x] T007 [P] [US1] Test en `backend/tests/api/auth.test.js`: 5 `POST /api/auth/login` fallidos seguidos desde la misma IP dentro de la ventana de prueba hacen que el 6º intento devuelva `429` incluso enviando la clave correcta (FR-015, SC-009).
- [x] T008 [P] [US1] Test en `backend/tests/api/auth.test.js`: una cookie de sesión firmada con un `ACCESS_KEY` antiguo (simulando una rotación) es rechazada como `401` (FR-017, SC-011).

### Implementation for User Story 1

- [x] T009 [P] [US1] Implementar en `backend/src/auth.js` las funciones `crearTokenSesion()` y `verificarTokenSesion(token)`: HMAC-SHA256 (`crypto.createHmac`) firmado con `config.accessKey`, con fecha de expiración a 7 días vista embebida, comparado con `crypto.timingSafeEqual` (research.md §1, data-model.md → "Sesión de acceso") (depende de T002).
- [x] T010 [US1] Crear `backend/src/routes/auth.js`: `POST /login` valida `req.body.clave` contra `config.accessKey` con `timingSafeEqual`; si coincide, fija cookie `httpOnly`/`secure` (en producción)/`sameSite=strict` con `crearTokenSesion()` y responde `204`; si no coincide, responde `401` y cuenta como intento fallido; `POST /logout` borra la cookie y responde `204` (contracts/auth-contract.md → "Acceso") (depende de T009).
- [x] T011 [P] [US1] Implementar `backend/src/rateLimit.js`: middleware para `POST /api/auth/login` con un `Map` en memoria `direcciónIP → { intentos, inicioVentana, bloqueadoHasta }`; al 5º intento fallido en 15 minutos, bloquea esa IP 15 minutos (`429`) y registra `bloqueo_origen` vía `auditoria.registrarEvento` (research.md §3, FR-015) (depende de T003).
- [x] T012 [US1] Implementar en `backend/src/auth.js` el middleware de autenticación para todas las rutas `/api/*` salvo `POST /api/auth/login`: sin cookie válida responde `401` genérico y registra `acceso_rechazado`; con cookie válida, deja pasar la petición y **reemite la cookie** con la expiración recalculada a 7 días vista (sesión deslizante, FR-014) (depende de T003, T009).
- [x] T013 [US1] En `backend/src/server.js`: montar `routes/auth.js` en `/api/auth`, y aplicar `rateLimit.js` (T011) y el middleware de autenticación (T012) antes de las rutas de datos ya existentes (contracts/auth-contract.md) (depende de T010, T011, T012).
- [x] T014 [P] [US1] Crear `frontend/src/api/auth.js` con `iniciarSesion(clave)` (`POST /api/auth/login`, `credentials: 'include'`) y `cerrarSesion()` (`POST /api/auth/logout`).
- [x] T015 [P] [US1] Crear `frontend/src/ui/acceso/index.js` con `renderAcceso(contenedor)`: un único campo para la clave de acceso, botón de envío, mensaje de error genérico si `iniciarSesion()` falla (US1, Acceptance Scenario 3) (depende de T014).
- [x] T016 [US1] En `frontend/src/main.js`: si cualquier llamada a la API devuelve `401`, redirigir a `ui/acceso` (T015) en vez de la pantalla pedida; tras un login correcto, volver a la pantalla que se quería ver (depende de T015).
- [x] T017 [US1] En `frontend/src/api/httpClient.js`: añadir `credentials: 'include'` a toda petición, para que el navegador reenvíe la cookie de sesión automáticamente.

**Checkpoint**: Nadie puede leer ni modificar clientes/presupuestos/perfil sin la clave; la sesión aguanta el uso diario sin pedir la clave de nuevo; los intentos de fuerza bruta se bloquean solos.

---

## Phase 4: User Story 2 - La aplicación solo se sirve de forma cifrada y desde orígenes autorizados (Priority: P1)

**Goal**: En producción, toda petición sin cifrar se redirige a HTTPS, y ninguna petición desde un origen web no autorizado llega a ejecutarse.

**Independent Test**: Con `FORCE_HTTPS=true`, una petición sin TLS se redirige (301); una petición con cabecera `Origin` distinta de `ALLOWED_ORIGIN` se rechaza (403) antes de comprobar la clave.

### Tests for User Story 2 ⚠️

- [x] T018 [P] [US2] Test en `backend/tests/api/auth.test.js`: con `config.forceHttps = true`, una petición simulando `req.secure = false` (o `X-Forwarded-Proto: http`) devuelve `301` hacia la misma URL en `https://` (FR-011, SC-007).
- [x] T019 [P] [US2] Test en `backend/tests/api/auth.test.js`: una petición con cabecera `Origin` distinta de `config.allowedOrigin` devuelve `403`, incluso sin enviar clave de acceso (FR-012, SC-008).

### Implementation for User Story 2

- [x] T020 [P] [US2] Implementar `backend/src/https.js`: middleware activo solo si `config.forceHttps` es `true`; si `req.secure` es `false`, responde `301` a la misma URL en `https://` (research.md §5, FR-011) (depende de T002, T004).
- [x] T021 [P] [US2] Implementar `backend/src/cors.js`: middleware que compara la cabecera `Origin` con `config.allowedOrigin`; si no coincide responde `403`; si coincide añade `Access-Control-Allow-Origin` y `Access-Control-Allow-Credentials: true`; responde a `OPTIONS` sin pasar por autenticación (research.md §4, FR-012) (depende de T002).
- [x] T022 [US2] En `backend/src/server.js`: montar `https.js` (T020) y `cors.js` (T021) antes del middleware de autenticación de US1 (contracts/auth-contract.md) (depende de T013, T020, T021).

**Checkpoint**: La aplicación en producción solo responde por HTTPS y solo a peticiones del origen autorizado, además de exigir la clave de acceso.

---

## Phase 5: User Story 3 - Los secretos de configuración nunca viajan en el código (Priority: P2)

**Goal**: `ACCESS_KEY` y el resto de configuración sensible se definen solo por variables de entorno; el repositorio documenta cómo configurarlas sin exponer valores reales.

**Independent Test**: Revisar el repositorio (sin secretos reales); confirmar que existe `backend/.env.example`; arrancar el backend leyendo `ACCESS_KEY` del entorno real.

### Tests for User Story 3 ⚠️

- [x] T023 [P] [US3] Test en `backend/tests/api/auth.test.js` (o un test de configuración dedicado): `config.js` lee `ACCESS_KEY` de `process.env` correctamente aunque no exista un fichero `.env` físico (soporta FR-003).
- [x] T024 [P] [US3] Test en el mismo fichero de configuración: arrancar con `ACCESS_KEY` de menos de 16 caracteres lanza un error explicativo en vez de arrancar (FR-003).

### Implementation for User Story 3

- [x] T025 [P] [US3] Crear `backend/.env.example` con `ACCESS_KEY`, `ALLOWED_ORIGIN`, `FORCE_HTTPS`, `LOG_PATH`, `PORT`, `DB_PATH`, cada una con un comentario explicando su propósito y sin ningún valor real (FR-004).
- [x] T026 [US3] Actualizar la sección "Arrancar y probar en local" de `CLAUDE.md`: instruir a copiar `backend/.env.example` a `backend/.env` y rellenar `ACCESS_KEY` (mínimo 16 caracteres) antes de `npm run dev` (US3, Acceptance Scenario 2).

**Checkpoint**: Cualquiera que clone el repositorio sabe qué variables configurar y no encuentra ningún secreto real.

---

## Phase 6: User Story 4 - Las entradas del usuario se validan y se sanean antes de guardarse o mostrarse (Priority: P2)

**Goal**: Los formularios de clientes, presupuestos y perfil rechazan datos incompletos o con formato inválido; ningún contenido introducido por la usuaria se ejecuta como código en pantalla o en el PDF.

**Independent Test**: Enviar un cliente con NIF vacío o con formato inválido (rechazado); guardar un cliente con `<script>` en el nombre y comprobar que se muestra como texto literal.

### Tests for User Story 4 ⚠️

- [x] T027 [P] [US4] Test en `backend/tests/api/clientes.test.js`: crear un cliente con NIF de formato claramente inválido (p. ej. `"???"`) devuelve `400` (FR-005).
- [x] T028 [P] [US4] Test en `backend/tests/api/perfil.test.js`: guardar el perfil con `contacto` vacío o con formato irreconocible como email/teléfono devuelve `400` (FR-005).
- [x] T029 [P] [US4] Test en `frontend/tests/unit/shared/escapeHtml.test.js`: `escapeHtml('<script>alert(1)</script>')` devuelve el texto escapado, nunca una etiqueta interpretable (FR-006, SC-004).
- [x] T030 [P] [US4] Test de regresión en `backend/tests/api/clientes.test.js`: crear un cliente con `nombre` o `nif` igual a `"'; DROP TABLE clientes; --"` (u otro payload de inyección SQL) devuelve `201`/`400` según validación de formato, pero en ningún caso rompe la consulta ni afecta a otros registros — comprobar después que `GET /api/clientes` sigue devolviendo la lista completa intacta (FR-007; confirma la ausencia de concatenación insegura ya auditada en `research.md` §7).

### Implementation for User Story 4

- [x] T031 [P] [US4] Crear `backend/src/validacion.js` con `validarNif(valor)` (formato NIF/NIE/CIF español), `validarLongitudMaxima(valor, maximo)` y `validarContacto(valor)` (parece email o teléfono) (data-model.md → "Cambios en entidades existentes").
- [x] T032 [US4] Aplicar `validacion.js` en `backend/src/routes/clientes.js`: validar formato y longitud de `nombre` y `nif` antes de insertar, respondiendo `400` con mensaje claro si falla (depende de T031).
- [x] T033 [P] [US4] Aplicar `validacion.js` en `backend/src/routes/perfil.js`: validar `nombre`, `contacto` y `nif`, y comprobar que `logo` (si está presente) es un `data:` URL cuyo tipo MIME empieza por `image/` (depende de T031).
- [x] T034 [P] [US4] Aplicar `validacion.js` en `backend/src/routes/presupuestos.js`: validar longitud máxima de `descripcion` en cada línea (depende de T031).
- [x] T035 [P] [US4] Crear `frontend/src/shared/escapeHtml.js` consolidando la función ya duplicada en 4 pantallas (research.md §6).
- [x] T036 [US4] Sustituir las definiciones locales de `escapeHtml` en `frontend/src/ui/catalogo/index.js`, `frontend/src/ui/clientes/index.js`, `frontend/src/ui/historial/index.js` y `frontend/src/ui/presupuesto/index.js` por un `import` desde `frontend/src/shared/escapeHtml.js` (depende de T035).
- [x] T037 [US4] En `frontend/src/ui/configuracion/index.js`: validar que `logoDataUrl` empieza por `data:image/` antes de insertarlo en `innerHTML` en `actualizarPrevisualizacion()`, rechazando cualquier otro tipo (data-model.md → regla de `logo`).

**Checkpoint**: Los tres formularios rechazan datos inválidos con mensajes claros, y ningún contenido de usuaria se ejecuta como código en ninguna pantalla.

---

## Phase 7: User Story 5 - Los errores internos no revelan información técnica (Priority: P3)

**Goal**: Un fallo interno muestra siempre un mensaje genérico a la usuaria; el detalle técnico completo queda en el registro de auditoría.

**Independent Test**: Forzar un error interno y comprobar que la respuesta es genérica mientras el detalle completo aparece en `security.log`.

### Tests for User Story 5 ⚠️

- [x] T038 [P] [US5] Test en `backend/tests/api/auth.test.js` (o un nuevo `backend/tests/api/errores.test.js`): forzar un error interno no controlado y comprobar que la respuesta es `{ error: <mensaje genérico> }` sin traza técnica, y que `auditoria.registrarEvento` se invocó con tipo `error_interno` (FR-008, FR-009, SC-005).

### Implementation for User Story 5

- [x] T039 [US5] Extender el middleware de errores de `backend/src/server.js`: antes de responder (comportamiento ya existente, sin cambios en la respuesta), llamar a `auditoria.registrarEvento('error_interno', <mensaje + stack>)` (FR-009) (depende de T003).

**Checkpoint**: Ningún error interno filtra detalles técnicos a la usuaria, y todos quedan registrados para quien mantenga la aplicación.

---

## Phase 8: User Story 6 - Los eventos de seguridad quedan registrados (Priority: P3)

**Goal**: Los accesos rechazados (ya cubiertos por US1) y los cambios sobre clientes, presupuestos y perfil quedan en el registro de auditoría, purgado automáticamente a los 90 días.

**Independent Test**: Provocar un acceso rechazado y modificar un cliente; comprobar que ambos eventos aparecen en `security.log` con fecha, hora y detalle.

### Tests for User Story 6 ⚠️

- [x] T040 [P] [US6] Test en `backend/tests/api/clientes.test.js`: crear/modificar/borrar un cliente escribe un evento `cambio_dato` en el registro de auditoría (FR-010).
- [x] T041 [P] [US6] Test unitario para `backend/src/auditoria.js`: `purgarEventosAntiguos()` elimina entradas con más de 90 días y conserva las más recientes (FR-016, SC-010).

### Implementation for User Story 6

- [x] T042 [P] [US6] Añadir llamadas a `auditoria.registrarEvento('cambio_dato', ...)` en las rutas de escritura (`POST`/`PUT`/`DELETE`) de `backend/src/routes/clientes.js`, `presupuestos.js` y `perfil.js` (FR-010) (depende de T003).
- [x] T043 [US6] En `backend/src/server.js`: programar `auditoria.purgarEventosAntiguos()` para ejecutarse una vez al día mientras el proceso está en marcha, además de al arrancar (T003) (FR-016) (depende de T003).

**Checkpoint**: Todo acceso rechazado, cambio de dato y error interno queda en el registro, y nada permanece más de 90 días.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final y actualización de la documentación transversal del proyecto.

- [x] T044 [P] Ejecutar `quickstart.md` de principio a fin manualmente y corregir cualquier discrepancia encontrada.
- [x] T045 Actualizar en `CLAUDE.md` la línea "Sin login ni multi-tenencia (un solo servidor para una sola freelancer)" para reflejar que ahora existe una clave de acceso única (sigue sin multi-tenencia ni roles — FR-013), evitando que quede desactualizada.
- [x] T046 Añadir en `CLAUDE.md`, siguiendo la convención de "Spec-kit" ya acordada, una línea por decisión de diseño transversal de esta feature (p. ej. "[004] `ACCESS_KEY` firma también la sesión, sin `SESSION_SECRET` aparte", "[004] auditoría en fichero de log local, sin pantalla ni tabla nueva", "[004] límite de intentos e IP en memoria del proceso, sin Redis", "[004] `ACCESS_KEY` con longitud mínima de 16 caracteres, validada al arrancar").

**Checkpoint**: Documentación del proyecto (`CLAUDE.md`) al día con las decisiones de esta feature; `quickstart.md` verificado a mano.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias de usuario.
- **User Stories (Phase 3-8)**: Todas dependen de Foundational. US1 y US2 comparten prioridad P1; US2 depende además de que el middleware de autenticación de US1 (T013) ya esté montado en `server.js`, para insertarse antes de él. US3, US4, US5 y US6 son independientes entre sí y de US2 (solo dependen de Foundational).
- **Polish (Phase 9)**: Depende de que las historias que se quieran entregar ya estén completas.

### User Story Dependencies

- **US1 (P1)**: Depende solo de Foundational. Es el MVP.
- **US2 (P1)**: Depende de Foundational y de que exista el middleware de autenticación de US1 (T013), para decidir dónde insertarse en `server.js` — pero es funcionalmente independiente (se puede probar sin haber iniciado sesión).
- **US3 (P2)**: Depende solo de Foundational (T002 ya lee `config.accessKey` del entorno).
- **US4 (P2)**: Depende solo de Foundational.
- **US5 (P3)**: Depende solo de Foundational (T003, el módulo de auditoría).
- **US6 (P3)**: Depende solo de Foundational (T003); su prueba de "acceso rechazado" (Independent Test) asume que US1 ya existe, pero la implementación en sí (registrar `cambio_dato`) no depende de código de US1.

### Within Each User Story

- Tests antes que la implementación (y deben fallar antes de implementar).
- Módulos de infraestructura (auth.js, rateLimit.js, etc.) antes de montarlos en `server.js`.
- Backend antes que frontend cuando el frontend depende de un endpoint nuevo (US1).

### Parallel Opportunities

- Todos los tests marcados `[P]` dentro de una misma historia pueden lanzarse juntos.
- T009 (helpers de sesión) y T011 (límite de intentos) son paralelos entre sí (ficheros distintos).
- T020 (https.js) y T021 (cors.js) son paralelos entre sí.
- US3, US4, US5 y US6 pueden trabajarse en paralelo entre sí una vez completada la fase Foundational, por equipos distintos.

---

## Parallel Example: User Story 1

```bash
# Lanzar juntos todos los tests de la User Story 1:
Task: "Test en backend/tests/api/auth.test.js: GET /api/clientes sin cookie devuelve 401"
Task: "Test en backend/tests/api/auth.test.js: login incorrecto/correcto"
Task: "Test en backend/tests/api/auth.test.js: bloqueo tras 5 intentos fallidos"
Task: "Test en backend/tests/api/auth.test.js: cookie firmada con clave antigua es rechazada"

# Lanzar en paralelo los módulos de infraestructura que no comparten fichero:
Task: "Implementar backend/src/auth.js (helpers de sesión)"
Task: "Implementar backend/src/rateLimit.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 solo)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (crítico — bloquea todas las historias).
3. Completar Phase 3: User Story 1.
4. **DETENERSE Y VALIDAR**: probar User Story 1 de forma independiente (quickstart.md, pasos 0-2).
5. Desplegar/mostrar si está listo.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → probar de forma independiente → MVP.
3. US2 → probar de forma independiente (HTTPS/CORS).
4. US3, US4, US5, US6 → cada una añade valor sin romper las anteriores; pueden entregarse en cualquier orden entre sí una vez hecha Foundational, aunque se recomienda respetar el orden de prioridad de `spec.md` (P2 antes que P3).

### Parallel Team Strategy

Con varias personas:

1. El equipo completa Setup + Foundational junto.
2. Una vez lista Foundational:
   - Persona A: US1 (y después US2, que depende de dónde se monte el middleware de US1).
   - Persona B: US3 y US4 en paralelo.
   - Persona C: US5 y US6 en paralelo.
3. Las historias se integran en `server.js` sin romperse entre sí (cada middleware es un fichero propio).

---

## Notes

- `[P]` = ficheros distintos, sin dependencias entre sí.
- La etiqueta `[Story]` mapea cada tarea a su historia de usuario para trazabilidad.
- Cada historia de usuario debe poder completarse y probarse de forma independiente.
- Comprobar que los tests fallan antes de implementar.
- Hacer commit tras cada tarea o grupo lógico de tareas.
- Detenerse en cualquier checkpoint para validar la historia de forma independiente.
- Evitar: tareas vagas, conflictos por tocar el mismo fichero en tareas paralelas, dependencias entre historias que rompan su independencia.
