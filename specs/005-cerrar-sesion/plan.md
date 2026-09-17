# Implementation Plan: Cerrar sesión desde la interfaz

**Branch**: `005-cerrar-sesion` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-cerrar-sesion/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Se añade un control "Cerrar sesión" a la barra de navegación principal ya
existente (`frontend/src/main.js`, visible en todas las pantallas
autenticadas y oculta solo en `/acceso`), que invoca la función
`cerrarSesion()` ya existente en `frontend/src/api/auth.js` sin modificar su
implementación. La orquestación (llamar a `cerrarSesion()`, limpiar el
estado local de navegación y decidir la redirección) se extrae a una
función pura con dependencias inyectables para poder probarla con Vitest
sin añadir `jsdom` como dependencia nueva — coherente con "cero
dependencias nuevas salvo necesidad real" (`CLAUDE.md`). Tanto si
`cerrarSesion()` tiene éxito como si falla, el resultado final es el mismo:
estado local limpio y recarga completa hacia `/acceso` (mismo patrón que ya
usa `httpClient.js` al recibir un 401), añadiendo un aviso no bloqueante
solo en el caso de fallo. No se toca el backend: la ruta
`POST /api/auth/logout` ya existe y ya borra la cookie de sesión firmada
(`backend/src/routes/auth.js`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Cómo lo cumple este plan |
|---|---|---|
| I. Simplicidad ante todo | ✅ PASS | No se añade ninguna dependencia nueva (ni `jsdom` para probar la UI, ni ninguna librería de estado); se reutiliza el patrón de recarga completa + `sessionStorage` que ya existe en `httpClient.js` y `ui/acceso/index.js` en lugar de crear un mecanismo de notificaciones nuevo (research.md §2-3). |
| II. Idioma y mercado | ✅ PASS | El texto del control ("Cerrar sesión") y el aviso no bloqueante de fallo están en español de España, igual que el resto de la interfaz. |
| III. Cero alcance fantasma | ✅ PASS | Solo se construye lo descrito en `spec.md`: un control de cierre de sesión en la navegación existente. No se añade menú de usuario (no existe hoy, spec.md — Assumptions), ni diálogo de confirmación, ni cambios en `cerrarSesion()` o en la ruta `POST /api/auth/logout`. |
| IV. Verificable por una persona no técnica | ✅ PASS | `quickstart.md` permite comprobar el flujo (botón visible, cierre de sesión, vuelta al login, "atrás" del navegador, backend caído) usando la aplicación en el navegador, sin herramientas técnicas. |
| V. Datos del usuario con respeto | ✅ PASS | No se introduce ningún dato ni almacenamiento nuevo: se reutiliza la única clave de `sessionStorage` ya existente (`rutaTrasAcceso`) y se añade como mucho una clave transitoria equivalente para el aviso de fallo (data-model.md), sin persistir nada más allá de la sesión del navegador. |

**Resultado**: sin violaciones que requieran la tabla de Complexity
Tracking.

**Re-comprobación tras el diseño (Fase 1)**: revisado `data-model.md` frente
a los cinco principios — la única "entidad" nueva es una función de
orquestación interna y una clave de `sessionStorage` transitoria, ambas ya
justificadas en `spec.md`. El Constitution Check se mantiene en PASS sin
cambios.

## Technical Context

**Language/Version**: JavaScript ES2022+, sin TypeScript (decisión ya
vigente, `CLAUDE.md`). Solo frontend: esta feature no toca el backend.
**Primary Dependencies**: ninguna dependencia nueva. Se reutiliza Vitest ya
presente en `frontend/` (entorno de test por defecto, sin `jsdom`) y las
funciones ya existentes `cerrarSesion()` (`frontend/src/api/auth.js`) y el
patrón de redirección a `/acceso` de `frontend/src/api/httpClient.js`.
**Storage**: sin cambios en SQLite ni en el backend. En el navegador se
reutiliza `sessionStorage` (ya usado para `rutaTrasAcceso`) y se añade, como
mucho, una clave transitoria más para el aviso de fallo (data-model.md).
**Testing**: Vitest en el entorno Node por defecto del proyecto (igual que
`tests/unit/domain` y `tests/unit/shared`), sin añadir `jsdom`: la lógica de
orquestación del cierre de sesión se extrae a una función pura con
dependencias inyectables (`cerrarSesion`, limpieza de estado, navegación)
para poder cubrir el flujo feliz y el de fallo con pruebas unitarias sin
un DOM real (research.md §1). El cableado con el botón real en el DOM se
verifica manualmente con `quickstart.md` (Principio IV), igual que ya
ocurre hoy con el resto de pantallas (`ui/acceso`, `ui/inicio`, etc., que
tampoco tienen pruebas de DOM).
**Target Platform**: navegador web moderno (sin cambios respecto a 001/002/004).
**Project Type**: Web — frontend + backend ya existente (Opción 2, igual
que 004); esta feature es puramente frontend, no añade rutas ni middlewares
nuevos en `backend/`.
**Performance Goals**: sin impacto medible; una llamada de red adicional
(`POST /api/auth/logout`) ya soportada hoy por el backend, y una recarga de
página igual a la que ya ocurre al iniciar sesión o al recibir un 401.
**Constraints**: sin dependencias nuevas (constitution, Principio I); no se
modifica la firma ni el comportamiento interno de `cerrarSesion()` ni de
`POST /api/auth/logout` (spec.md — Fuera de alcance).
**Scale/Scope**: una única freelancer (igual que siempre); esta feature
añade 1 control de UI en la navegación existente, 1 función de
orquestación nueva en el frontend y 0 rutas/middlewares nuevos en el
backend.

## Project Structure

### Documentation (this feature)

```text
specs/005-cerrar-sesion/
├── plan.md               # This file (/speckit-plan command output)
├── research.md            # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── checklists/
│   └── requirements.md
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No se genera carpeta `contracts/`: esta feature no expone ni consume
ninguna interfaz externa nueva (reutiliza `POST /api/auth/logout`, ya
documentada en `specs/004-seguridad-hardening/contracts/auth-contract.md`).
El único "contrato" nuevo es interno al frontend y se documenta en
`data-model.md`.

### Source Code (repository root)

```text
# Opción 2: Web application (frontend + backend) — misma estructura que 001/002/004
frontend/
├── src/
│   ├── api/
│   │   └── auth.js                   # Sin cambios: cerrarSesion() ya existe, se reutiliza tal cual
│   ├── shared/
│   │   └── cerrarSesionFlujo.js       # NUEVO: orquestación pura (llamar cerrarSesion, limpiar estado, decidir redirección) — data-model.md
│   ├── main.js                        # Añade el botón "Cerrar sesión" a crearNavegacion() y lo conecta a cerrarSesionFlujo()
│   ├── styles/
│   │   └── base.css                   # Ajuste menor: el botón de la nav se comporta como los enlaces .nav en el layout de móvil
│   └── ui/
│       └── acceso/
│           └── index.js               # Lee y muestra el aviso no bloqueante transitorio (si existe) al renderizar
└── tests/
    └── unit/
        └── shared/
            └── cerrarSesionFlujo.test.js   # NUEVO: cubre el flujo feliz y el de fallo (spec.md — criterios de aceptación)

backend/                                # Sin cambios: POST /api/auth/logout ya existe (004) y no se modifica
```

**Structure Decision**: se mantiene la estructura de dos carpetas
(`backend/` y `frontend/`) ya usada en 001/002/004; esta feature no añade
ninguna carpeta de alto nivel ni pantalla nueva, solo un módulo pequeño en
`frontend/src/shared/` (siguiendo la convención ya existente de lógica pura
reutilizable ahí, como `escapeHtml.js` o `estadoPresupuesto.js`) y cambios
puntuales en `main.js`, `ui/acceso/index.js` y `base.css`.

## Complexity Tracking

> No aplica: el Constitution Check no registra ninguna violación. La única
> pieza nueva (`cerrarSesionFlujo.js`) responde directamente al requisito
> de testabilidad de `spec.md` (criterios de aceptación) y se implementa
> con el mecanismo más simple disponible sin añadir dependencias
> (research.md §1).
