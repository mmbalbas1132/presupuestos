# Research: Seguridad y hardening de PresupuestosPro

**Feature**: 004-seguridad-hardening
**Fecha**: 2026-09-17

Este documento resuelve las decisiones técnicas necesarias para implementar
`spec.md`, partiendo del código real ya existente en `backend/src/` y
`frontend/src/` (spec 001/002 ya implementadas). El criterio de decisión en
cada punto es la constitution del proyecto — sobre todo el Principio I
(simplicidad, cero dependencias nuevas salvo necesidad real y justificada).

## 1. Mecanismo de autenticación (clave compartida + sesión deslizante)

**Decision**: una única clave de acceso (`ACCESS_KEY`, variable de entorno)
protege toda la API. Al validarla correctamente (`POST /api/auth/login`), el
backend emite una cookie de sesión `httpOnly`, `secure` (en producción) y
`sameSite=strict`, cuyo valor es un token firmado con HMAC-SHA256
(`node:crypto`, `createHmac`), **usando la propia `ACCESS_KEY` como secreto
de firma** (sin una variable `SESSION_SECRET` separada), y que contiene una
fecha de expiración a 7 días vista (FR-014). Un middleware de Express valida
esa cookie en cada petición a `/api/*` (salvo `POST /api/auth/login`),
comparando la firma con `crypto.timingSafeEqual` para evitar ataques de
temporización. En cada petición autenticada con éxito, el middleware
**reemite la cookie** con una nueva fecha de expiración a 7 días vista
(sesión deslizante, FR-014): la sesión solo caduca tras 7 días consecutivos
sin ninguna petición autenticada.

**Rationale**: no hace falta guardar el estado de la sesión en la base de
datos ni en memoria — el propio token firmado (stateless) ya demuestra que
alguien conoció `ACCESS_KEY` en el momento de crearlo y hasta cuándo es
válido. Firmar con la propia `ACCESS_KEY` (en vez de un secreto de sesión
independiente) hace que **rotar la clave invalide automáticamente todas las
sesiones existentes** en cuanto se reinicia el proceso (FR-017, SC-011): al
cambiar `ACCESS_KEY`, ninguna cookie firmada con el valor anterior vuelve a
validar, sin necesidad de una lista de revocación ni de sincronizar dos
secretos distintos. Con un único usuario y una única clave, esto cubre
FR-001, FR-002, FR-014 y FR-017 sin añadir ninguna dependencia nueva:
`node:crypto` es parte del runtime de Node.js que el proyecto ya usa.

**Alternatives considered**:
- `express-session` + almacén de sesiones (SQLite, memoria o archivo):
  rechazado — añade una dependencia (y potencialmente dos, si se usa un
  store dedicado) para resolver un problema que un token firmado sin estado
  ya resuelve con una única clave y un único usuario.
- Librería JWT (`jsonwebtoken`): rechazado — un JWT completo (cabeceras,
  múltiples algoritmos, claims estándar) es más de lo que este caso necesita
  (un único claim: fecha de expiración); un HMAC simple con `node:crypto`
  cubre el mismo requisito con cero dependencias.
- Reenviar la clave en cada petición (cabecera manual): descartado en la
  clarificación de `spec.md` (Q1) por peor experiencia de uso.
- Secreto de firma de sesión independiente (`SESSION_SECRET`) además de
  `ACCESS_KEY`: descartado tras la clarificación sobre invalidación de
  sesiones — obligaría a rotar dos variables a la vez para que la rotación
  de la clave cierre de verdad el acceso; usar `ACCESS_KEY` como único
  secreto de firma consigue el mismo resultado con una variable menos.

## 2. Gestión de secretos (variables de entorno)

**Decision**: `backend/src/config.js` carga un fichero `.env` en desarrollo
con `process.loadEnvFile()` (nativo desde Node.js 20.6, disponible en el
runtime actual), envuelto en `try/catch` para no fallar si el fichero no
existe (caso de producción, donde el hosting inyecta las variables
directamente). Se añade `backend/.env.example` con los nombres de las
variables (`ACCESS_KEY`, `ALLOWED_ORIGIN`, `FORCE_HTTPS`, `LOG_PATH`,
`PORT`, `DB_PATH`) sin valores reales — no hace falta una variable de
secreto de sesión aparte, `ACCESS_KEY` cumple ambos papeles (research.md
§1). `.env` y `.env.*` ya están excluidos en `.gitignore` (verificado).
`config.js` valida además que `ACCESS_KEY` tenga al menos 16 caracteres,
impidiendo el arranque en caso contrario (FR-003).

**Rationale**: cumple FR-003/FR-004 sin añadir la dependencia `dotenv` — el
propio runtime de Node.js ya ofrece esta función desde hace varias
versiones, y el proyecto no soporta versiones de Node anteriores (usa ES
modules y `better-sqlite3`, que ya requieren Node reciente).

**Alternatives considered**: paquete `dotenv` — rechazado, funcionalidad
equivalente ya cubierta por el runtime sin dependencia adicional.

## 3. Límite de intentos fallidos (fuerza bruta)

**Decision**: middleware propio con un `Map` en memoria
(`direcciónIP → { intentos, inicioVentana, bloqueadoHasta }`), aplicado solo
a `POST /api/auth/login`. La clave del `Map` es la dirección IP de la
petición (`req.ip`, con `app.set('trust proxy', 1)` para resolver la IP real
detrás de un proxy inverso — clarificación de `spec.md`), nunca una huella
de navegador/dispositivo. Umbral y ventana fijados en `spec.md` FR-015: 5
intentos fallidos en 15 minutos por IP → bloqueo de 15 minutos. Una limpieza
perezosa (al recibir cada petición) elimina entradas cuya ventana ya
expiró, evitando crecimiento indefinido del `Map`.

**Rationale**: el despliegue es un único proceso Node.js (single-server,
sin balanceo horizontal — `constitution.md` Principio I y
`plan.md` de 001), por lo que un contador en memoria del propio proceso es
suficiente y correcto; no hace falta un almacén compartido (Redis) ni una
librería especializada para una ventana fija tan simple.

**Alternatives considered**: `express-rate-limit` — es una dependencia
pequeña y de un solo propósito, pero la lógica que necesitamos (ventana fija
de 15 min, bloqueo de 15 min, un único endpoint) es sencilla de implementar
correctamente en unas pocas líneas; se descarta por el Principio I
(dependencia no estrictamente necesaria).

## 4. CORS (restricción de origen)

**Decision**: middleware propio que compara la cabecera `Origin` de la
petición contra `ALLOWED_ORIGIN` (variable de entorno, por defecto vacío =
mismo origen). Si `Origin` está presente y no coincide, responde `403` antes
de llegar a las rutas; si `Origin` coincide, añade las cabeceras
`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials: true` (la
cookie de sesión viaja con `credentials: 'include'`) y responde a
`OPTIONS` (preflight) sin pasar por autenticación.

**Rationale**: en producción, el propio backend Express sirve también los
ficheros estáticos del frontend (`server.js` ya hace
`app.use(express.static(frontendDist))`), por lo que frontend y backend
comparten origen en el despliegue real — el CORS restrictivo es una barrera
adicional contra un sitio externo que intente usar la API desde el
navegador de la freelancer (FR-012), no un requisito para el funcionamiento
normal de la app.

**Alternatives considered**: paquete `cors` — descartado, la lógica
necesaria (una única cabecera `Origin` permitida) es más simple que
configurar y mantener una dependencia externa para ello.

## 5. HTTPS en producción

**Decision**: middleware que, cuando `FORCE_HTTPS=true` (activo en
producción), comprueba `req.secure` (con `app.set('trust proxy', 1)` para
leer `X-Forwarded-Proto` si hay un proxy inverso delante) y devuelve una
redirección `301` a la versión `https://` cuando la petición llega sin
cifrar. El certificado y la terminación TLS los provee la infraestructura de
despliegue (asunción ya documentada en `spec.md`), no la aplicación.

**Rationale**: cumple FR-011 sin acoplar la aplicación a un proveedor de
certificados concreto; en desarrollo local (`FORCE_HTTPS` sin definir o
`false`) no interfiere con `npm run dev`.

**Alternatives considered**: gestionar certificados TLS directamente en
Node (`https.createServer`) — rechazado, añade complejidad de
renovación/gestión de certificados que la mayoría de hostings ya resuelven
mejor con un proxy inverso o balanceador gestionado.

## 6. Validación y sanitización de entradas

**Decision**: extender la validación manual ya existente en
`backend/src/routes/*.js` (ya comprueban campos obligatorios) con
funciones de formato en un nuevo módulo `backend/src/validacion.js`
(longitud máxima de campos de texto, formato de NIF español mediante
expresión regular, formato básico de contacto). Se aplican en cada ruta
`POST`/`PUT` antes de tocar la base de datos. En el frontend, se consolida
la función `escapeHtml` — actualmente duplicada en cuatro pantallas
(`catalogo`, `clientes`, `historial`, `presupuesto`) — en
`frontend/src/shared/escapeHtml.js`, y se añade su uso en los puntos donde
falta (por ejemplo, `configuracion/index.js` al previsualizar el logo,
validando además que el `data:` URL corresponda a una imagen antes de
insertarlo en `innerHTML`).

**Rationale**: coherente con el patrón ya existente en el código (validación
manual sencilla, sin librería); no se añade una librería de validación
(`zod`, `joi`, etc.) porque las reglas necesarias (campos obligatorios,
formato de NIF, longitud máxima) son pocas y ya se resuelven con funciones
puras sencillas, igual que hace hoy cada ruta.

**Alternatives considered**: librería de validación de esquemas — rechazada
por el Principio I; el volumen de reglas no lo justifica.

## 7. Prevención de inyección SQL

**Decision**: ninguna. Se ha auditado `backend/src/routes/*.js` y
`backend/src/db/connection.js`: todas las consultas usan sentencias
preparadas de `better-sqlite3` con parámetros (`?`), sin concatenación de
cadenas con datos de entrada. FR-007 ya se cumple; el trabajo de esta
feature es añadir una prueba de regresión que lo confirme (ver
`quickstart.md` y `tasks.md`), no cambiar el patrón de acceso a datos.

**Rationale**: evita introducir un ORM u otra capa de acceso a datos que la
constitution no justificaría (Principio I) para un problema que no existe
en el código actual.

## 8. Manejo seguro de errores

**Decision**: extender el middleware de errores ya existente en
`backend/src/server.js` (que ya distingue `err.expose` para mostrar un
mensaje seguro o uno genérico) para que, antes de responder, escriba el
error completo (incluyendo `stack`) en el registro de auditoría (ver §9).
No se cambia el contrato de la respuesta al cliente, que ya es seguro.

**Rationale**: FR-008 ya está resuelto por el código existente; falta
FR-009 (registrar el detalle en un log interno), que es la única adición
real.

## 9. Registro y auditoría

**Decision**: módulo `backend/src/auditoria.js` que añade una línea JSON
(`{ fecha, tipo, detalle, origen }`) a un fichero de log local
(`security.log`, ruta configurable vía `LOG_PATH`, por defecto en la carpeta
de trabajo — ya cubierta por `*.log` en `.gitignore`). Se invoca desde: el
middleware de autenticación (acceso rechazado), el middleware de límite de
intentos (bloqueo activado), las rutas de escritura de clientes,
presupuestos y perfil (creación/modificación/borrado), y el middleware de
errores (error interno). Al arrancar el servidor y una vez al día mientras
esté en marcha, una función de purga reescribe el fichero descartando las
líneas con más de 90 días (FR-016), leyendo y filtrando línea a línea para
no cargar todo el fichero en memoria de golpe si llegara a crecer mucho.

**Rationale**: un fichero de líneas JSON es suficiente para "consultar
directamente" (clarificación Q2 de `spec.md`) sin construir una pantalla ni
una base de datos de eventos; no se añade una librería de logging
(`winston`, `pino`) porque el formato y el volumen (una sola freelancer) no
lo justifican — `node:fs` basta.

**Alternatives considered**: guardar los eventos en una tabla SQLite nueva —
rechazado, añadiría una entidad de datos gestionada por la app justo para
algo que la propia spec (clarificación Q2) resolvió como "archivo de log
consultado directamente", más simple y sin nueva superficie de API.

## 10. Pruebas

**Decision**: se mantiene el patrón ya existente (`vitest` + `supertest`
contra `createApp(db)` con una base SQLite en memoria, ver
`backend/tests/api/*.test.js`). Se añaden pruebas para: rechazo sin
sesión/clave válida, aceptación con clave correcta, bloqueo tras 5 intentos
fallidos en la ventana de 15 minutos, rechazo de origen no autorizado,
rechazo de payloads con campos inválidos, y que un error interno forzado no
filtra detalles técnicos en la respuesta. En el frontend, prueba unitaria de
`escapeHtml` (ya sigue el patrón de pruebas de `domain/` con Vitest).

**Rationale**: coherente con la constitution ("tests unitarios en lo más
delicado: cálculos, API") y con el enfoque ya usado en 001/002 — no se
introduce un framework de pruebas nuevo.
