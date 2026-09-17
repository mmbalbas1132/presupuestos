# Implementation Plan: Seguridad y hardening de PresupuestosPro

**Branch**: `004-seguridad-hardening` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-seguridad-hardening/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

PresupuestosPro pasa de estar completamente abierta (cualquiera con la URL
puede leer o modificar clientes, presupuestos y perfil) a exigir una clave
de acceso única antes de servir cualquier dato, con una sesión de navegador
deslizante (se renueva con el uso, caduca solo tras 7 días consecutivos sin
actividad) para no pedirla en cada petición. Si la clave se rota por estar
comprometida, el siguiente reinicio invalida automáticamente todas las
sesiones existentes. Además: la API deja de aceptar
peticiones de orígenes no autorizados, se sirve solo por HTTPS en
producción, valida y sanea todas las entradas (incluida la prevención de
XSS ya parcialmente presente en el frontend), no filtra detalles técnicos en
sus respuestas de error, y registra en un fichero de log local los accesos
rechazados, los cambios de datos y los errores internos, purgando lo que
supere 90 días. Todo esto se implementa dentro del backend Express y el
frontend Vite ya existentes, sin añadir ninguna dependencia nueva
(`node:crypto` y `node:fs`, ya disponibles en el runtime, cubren firma de
sesión, límite de intentos y logging — ver `research.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Cómo lo cumple este plan |
|---|---|---|
| I. Simplicidad ante todo | ✅ PASS | Cada mecanismo de seguridad (sesión firmada, límite de intentos, CORS, logging) se resuelve con el runtime de Node.js ya usado (`node:crypto`, `node:fs`), sin añadir ninguna dependencia nueva; se descartaron explícitamente alternativas más pesadas (`express-session`, `jsonwebtoken`, `express-rate-limit`, `cors`, `dotenv`, `winston`) por no ser necesarias para un único usuario y un único servidor (research.md §1-9). |
| II. Idioma y mercado | ✅ PASS | Todos los mensajes nuevos (rechazo de acceso, errores de validación, mensajes de error genéricos) están en español de España, igual que el resto de la app. No se toca moneda ni formato numérico. |
| III. Cero alcance fantasma | ✅ PASS | Solo se implementa lo descrito en `spec.md`: no se construye un sistema de roles/permisos (FR-013, descartado explícitamente), no se construye una pantalla de administración del log (clarificación Q2), no se añade cambio de clave desde la app (clarificación de rotación, Q7) ni gestión de usuarios. |
| IV. Verificable por una persona no técnica | ✅ PASS | `quickstart.md` permite comprobar cada criterio (bloqueo sin clave, bloqueo por intentos fallidos, HTTPS, CORS, validación, mensajes de error genéricos) usando la app y `curl`, y consultando el fichero de log como texto plano, sin depender de herramientas de desarrollo. |
| V. Datos del usuario con respeto | ✅ PASS | La clave de acceso vive solo en una variable de entorno (`backend/.env.example` sin valores reales) y hace también de secreto de firma de sesión, sin variables adicionales; el registro de auditoría solo guarda lo estrictamente necesario para investigar un uso indebido (fecha, tipo, detalle, origen) y se purga a los 90 días (FR-016), reforzando la minimización de datos ya exigida por la constitution. |

**Resultado**: sin violaciones que requieran la tabla de Complexity
Tracking. Toda la complejidad añadida (middlewares de autenticación, límite
de intentos, CORS, HTTPS y auditoría) responde directamente a requisitos
explícitos de `spec.md`, y en cada caso se ha elegido la implementación más
simple que los cumple (research.md).

**Re-comprobación tras el diseño (Fase 1)**: revisados `data-model.md` y
`contracts/auth-contract.md` contra los cinco principios — no se introduce
ninguna tabla, entidad de dominio ni pantalla que no esté ya prevista en
`spec.md`; el Constitution Check se mantiene en PASS sin cambios.

## Technical Context

**Language/Version**: JavaScript ES2022+, sin TypeScript, en front-end y
backend (decisión ya vigente del proyecto, `CLAUDE.md`).
**Primary Dependencies**: ninguna dependencia nueva. Se reutilizan
`express` y `better-sqlite3` (backend) y `jsPDF` (frontend), y se usan
únicamente módulos nativos de Node.js (`node:crypto` para firmar la sesión,
`node:fs` para el registro de auditoría y la carga de `.env`) — ver
research.md §1-9 para las alternativas descartadas.
**Storage**: la base de datos SQLite existente no cambia de esquema
(`data-model.md`). La sesión de acceso vive en una cookie firmada
(sin estado en el servidor); el límite de intentos fallidos vive en memoria
del proceso backend; el registro de auditoría vive en un fichero de log
local (`security.log`).
**Testing**: Vitest + Supertest contra `createApp(db)` con SQLite en
memoria, igual que en 001/002 (`backend/tests/api/*.test.js`), añadiendo
casos de autenticación, límite de intentos, CORS y manejo de errores;
Vitest para la función `escapeHtml` consolidada en el frontend.
**Target Platform**: navegador web moderno (igual que 001/002), backend
Node.js en un único servidor desplegado en internet público (clarificación
de `spec.md`), detrás de un proxy inverso o plataforma de hosting que
termina TLS.
**Project Type**: Web — frontend + backend ya existente (Opción 2, igual
que 001/002); esta feature añade una capa transversal de seguridad, no una
nueva pantalla funcional aparte de la propia pantalla de acceso.
**Performance Goals**: los middlewares de seguridad añaden una comprobación
en memoria (sesión, límite de intentos, origen) por petición, sin acceso a
red ni a disco adicional en el camino normal; no se espera impacto
perceptible sobre los tiempos de respuesta ya existentes (001: <1 s).
**Constraints**: sin dependencias nuevas (constitution, Principio I); el
certificado HTTPS lo provee la infraestructura de despliegue, no la propia
aplicación (spec.md, Assumptions); un único proceso Node.js, sin estado
compartido entre instancias (spec.md, Assumptions — SQLite se mantiene).
**Scale/Scope**: igual que 001 (una única freelancer, volumen trivial);
esta feature añade 2 rutas nuevas (`POST /api/auth/login`,
`POST /api/auth/logout`), 5 middlewares (autenticación, límite de intentos,
CORS, HTTPS, auditoría de errores) delante de las rutas ya existentes, y 1
pantalla nueva en el frontend (acceso con la clave).

## Project Structure

### Documentation (this feature)

```text
specs/004-seguridad-hardening/
├── plan.md               # This file (/speckit-plan command output)
├── research.md           # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
│   └── auth-contract.md   # Autenticación, límite de intentos, CORS, HTTPS, auditoría
├── checklists/
│   └── requirements.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Opción 2: Web application (frontend + backend) — misma estructura que 001/002
backend/
├── src/
│   ├── auth.js                 # Middleware de autenticación + firma/verificación de sesión (contracts/auth-contract.md)
│   ├── rateLimit.js             # Middleware de límite de intentos fallidos (auth-contract.md)
│   ├── cors.js                  # Middleware de restricción de origen (auth-contract.md)
│   ├── https.js                 # Middleware de redirección a HTTPS (auth-contract.md)
│   ├── auditoria.js             # Registro de eventos de seguridad y purga a 90 días (data-model.md)
│   ├── validacion.js            # Funciones de validación de formato reutilizadas por las rutas (data-model.md)
│   ├── routes/
│   │   ├── auth.js              # POST /api/auth/login, POST /api/auth/logout
│   │   └── ...                  # Rutas existentes (clientes, presupuestos, perfil, servicios), con validación ampliada
│   ├── db/                      # Sin cambios de esquema
│   └── server.js                # Registra los middlewares nuevos antes de las rutas existentes
└── tests/
    └── api/
        └── auth.test.js         # Pruebas de autenticación, límite de intentos, CORS, errores

frontend/
├── src/
│   ├── api/
│   │   └── auth.js               # Llamadas a /api/auth/login y /api/auth/logout
│   ├── shared/
│   │   └── escapeHtml.js         # Función consolidada (research.md §6), sustituye las 4 copias existentes
│   ├── ui/
│   │   └── acceso/                # Pantalla nueva: formulario con la clave de acceso
│   └── main.js                    # Redirige a "acceso" si la API responde 401
└── tests/
    └── unit/
        └── shared/
            └── escapeHtml.test.js
```

**Structure Decision**: se mantiene la estructura de dos carpetas
(`backend/` y `frontend/`) de 001/002; esta feature no introduce una nueva
carpeta de alto nivel, solo módulos transversales nuevos en `backend/src/`
(seguridad y auditoría) y una pantalla adicional (`acceso/`) en
`frontend/src/ui/`, siguiendo la misma convención `ui/<pantalla>/index.js`
ya establecida en `CLAUDE.md`.

## Complexity Tracking

> No aplica: el Constitution Check no registra ninguna violación. Cada
> mecanismo añadido está justificado por un requisito explícito de
> `spec.md` y se ha implementado con la opción más simple disponible
> (research.md).
