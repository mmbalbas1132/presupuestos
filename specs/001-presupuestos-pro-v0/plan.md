# Implementation Plan: PresupuestosPro v0

**Branch**: `001-presupuestos-pro-v0` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-presupuestos-pro-v0/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

PresupuestosPro v0 es una aplicación web para que una freelancer configure
su marca y su catálogo de servicios, cree presupuestos con cálculo
automático de base imponible, IVA (21 %) y retención de IRPF (15 %/7 %/0 %
según el cliente), y los descargue en PDF con numeración automática
(`AAAA-NNN`) y validez de 30 días. La aplicación tiene un front-end en
JavaScript y un backend Node.js sencillo (también en JavaScript) con una
base de datos local SQLite; ambos se despliegan juntos, una sola vez, en un
único servidor online pensado para una sola freelancer (sin cuentas, sin
nube gestionada), de forma que funcione igual desde el ordenador que desde
el móvil.

## Decisiones importantes (explicadas para negocio)

- **Backend + base de datos local, en un único servidor online**: la
  freelancer entra desde el ordenador o el móvil abriendo una dirección web,
  sin depender de tener su propio ordenador encendido. Como no hay cuentas
  de usuario (la spec lo excluye a propósito), este servidor está pensado
  para el uso de una sola freelancer, no para varias personas a la vez — así
  no hace falta construir un sistema de login. Ver
  [research.md](./research.md) §1.
- **Base de datos SQLite, no un servicio de base de datos en la nube**: los
  datos (perfil, catálogo, clientes, presupuestos) se guardan en un único
  fichero de base de datos, administrado por el propio backend. Es "base de
  datos local" en el sentido de que vive en el mismo servidor de la app, sin
  contratar un servicio de base de datos gestionado aparte — la opción más
  simple que cumple con tener de verdad una base de datos (con las garantías
  de integridad que un simple fichero de texto no da). Ver
  [research.md](./research.md) §2.
- **El backend solo guarda y lee datos; los cálculos y el PDF se quedan en
  el navegador**: para que la freelancer vea los cálculos al instante
  mientras edita un presupuesto, sin esperar respuesta del servidor en cada
  cambio de una línea. El servidor entra en juego solo para guardar el
  resultado final y para consultar el historial. Ver
  [research.md](./research.md) §3 y §6.
- **JavaScript en front-end y backend, sin TypeScript**: un único lenguaje
  en todo el proyecto, más simple de mantener en una app de este tamaño. Ver
  [research.md](./research.md) §7.
- **Diseño visual mínimo pero cuidado**: se parte de una base visual ligera
  pensada para verse bien en pantallas pequeñas, en vez de un sistema de
  diseño propio o un framework visual pesado que esta v1 no necesita. Ver
  [research.md](./research.md) §4.
- **Pruebas automáticas centradas en lo más delicado**: los cálculos (que el
  IVA y la retención salgan bien) y la API del backend (que los datos se
  guarden bien y que un presupuesto ya emitido no se pueda tocar); el resto
  de la aplicación se valida a mano siguiendo
  [quickstart.md](./quickstart.md), tal como exige la constitution. Ver
  [research.md](./research.md) §5.
- **Riesgo aceptado y anotado para el despliegue**: al no haber login,
  cualquiera con la URL del servidor podría ver/editar los datos; se acepta
  porque el servidor es de un solo uso y no se publica su enlace
  abiertamente. Además, hay que confirmar que el hosting elegido ofrezca
  disco persistente, o el fichero SQLite se perdería en cada despliegue. Ver
  [research.md](./research.md) §1 y §8.

## Technical Context

**Language/Version**: JavaScript (ES2022+) en front-end y backend, sin
TypeScript (petición explícita del usuario). Front-end servido con Vite;
backend en Node.js.
**Primary Dependencies**:
- Front-end: `jsPDF` (generación de PDF en el navegador); hoja de estilos
  "classless" mínima para una base visual profesional y responsive.
- Backend: `express` (API HTTP mínima) y `better-sqlite3` (acceso síncrono y
  simple a la base de datos SQLite).
**Storage**: Base de datos SQLite (un fichero) gestionada por el backend
(ver research.md §2); el navegador nunca accede a ella directamente, solo a
través de la API (`contracts/almacenamiento-contract.md`).
**Testing**: Vitest, en dos bloques: reglas de cálculo/numeración en el
navegador (`contracts/calculo-contract.md`) y pruebas de la API del backend
contra una base de datos SQLite de pruebas (`contracts/almacenamiento-contract.md`).
**Target Platform**: Navegador web moderno, de escritorio y móvil (diseño
"mobile first"), hablando por HTTP con un backend Node.js desplegado en un
único servidor online; sin apps nativas.
**Project Type**: Web — front-end + backend (aplicación cliente-servidor de
un solo despliegue, sin multi-tenencia).
**Performance Goals**: Cálculos y generación de PDF percibidos como
instantáneos (<1 s) en un móvil de gama media (se hacen en el navegador, sin
red); las llamadas a la API del backend (guardar/leer datos) deben
responder en menos de 1 s en condiciones normales, dado el volumen de datos
de una sola freelancer.
**Constraints**: Debe funcionar correctamente en pantallas de móvil sin
scroll horizontal ni necesidad de zoom (instrucción del usuario); el
hosting de despliegue debe ofrecer disco persistente para no perder la base
de datos SQLite entre despliegues (research.md §8); sin sistema de login
(fuera de alcance de la spec — riesgo aceptado y documentado en research.md
§1).
**Scale/Scope**: Un único servidor, una única freelancer (sin
multi-tenencia); decenas o cientos de clientes/servicios/presupuestos al
año — volumen trivial para SQLite. 4 pantallas navegables (configuración,
catálogo, presupuesto, historial; la selección/alta de cliente es un
componente embebido en la pantalla de presupuesto, no una pantalla propia —
la spec no requiere gestión independiente de clientes) + una API con 15
rutas (`contracts/almacenamiento-contract.md`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Cómo lo cumple este plan |
|---|---|---|
| I. Simplicidad ante todo | ✅ PASS | Backend y base de datos son los mínimos necesarios para cumplir el requisito explícito del usuario (publicar online + funcionar bien en móvil); dentro de esa necesidad real, se elige siempre la opción más simple: SQLite en vez de un motor de base de datos aparte, un backend "solo datos" en vez de mover también cálculos y PDF al servidor, un solo servicio desplegado en vez de dos coordinados (research.md). |
| II. Idioma y mercado | ✅ PASS | Interfaz, mensajes y PDF en español de España; importes en euros con formato numérico español (1.234,56 €); sin soporte multi-idioma ni multi-divisa. |
| III. Cero alcance fantasma | ✅ PASS | La API (`almacenamiento-contract.md`) y las tablas (`data-model.md`) cubren únicamente las entidades y operaciones descritas en spec.md; no se añade login, multi-tenencia ni funcionalidades no pedidas, aunque ahora exista un backend. |
| IV. Verificable por una persona no técnica | ✅ PASS | quickstart.md permite comprobar cada criterio de aceptación usando la app tal cual (incluyendo que los datos sobrevivan a cerrar y reabrir la app, ahora gracias al backend), sin código ni consola. |
| V. Datos del usuario con respeto | ✅ PASS | Solo se piden los campos imprescindibles (data-model.md); no se maneja ninguna clave ni secreto en el código (SQLite no requiere credenciales); el único dato de configuración del backend (p. ej. el puerto) se gestiona por variable de entorno, nunca en el repositorio. |

**Resultado**: sin violaciones que requieran la tabla de Complexity
Tracking. La incorporación de backend + base de datos responde a una
petición explícita y justificada del usuario (publicación online + acceso
móvil fiable), no a complejidad anticipada; dentro de esa necesidad, cada
elección técnica es la más simple disponible (ver tabla de alternativas
descartadas en research.md).

**Re-comprobación tras el diseño (Fase 1)**: revisados data-model.md y los
contratos de `contracts/` contra los cinco principios — la API expone
únicamente las operaciones de datos que la spec necesita, sin login ni
funcionalidades añadidas; el Constitution Check se mantiene en PASS sin
cambios.

## Project Structure

### Documentation (this feature)

```text
specs/001-presupuestos-pro-v0/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
│   ├── calculo-contract.md          # Reglas de negocio (navegador)
│   └── almacenamiento-contract.md   # API HTTP del backend
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Opción 2: Web application (frontend + backend)
backend/
├── src/
│   ├── db/                    # Conexión SQLite (better-sqlite3) y creación de tablas
│   │                          # (perfil_freelancer, clientes, servicios, presupuestos,
│   │                          #  lineas_presupuesto, contador_anual — ver data-model.md).
│   ├── routes/                 # Rutas Express, una por recurso: perfil, servicios,
│   │                          # clientes, presupuestos (almacenamiento-contract.md).
│   └── server.js               # Arranque del servidor Express; sirve también los
│                              # ficheros estáticos del front-end compilado.
└── tests/
    └── api/                    # Pruebas de la API contra una BBDD SQLite de pruebas.

frontend/
├── src/
│   ├── domain/                 # Lógica de negocio pura (calculo-contract.md): IVA,
│   │                          # retención, base imponible, total, numeración AAAA-NNN,
│   │                          # validaciones.
│   ├── api/                    # Funciones que llaman a la API del backend (fetch).
│   ├── pdf/                     # Generación del PDF (jsPDF) a partir de un Presupuesto.
│   ├── ui/                       # Pantallas: configuración de marca, catálogo,
│   │   ├── configuracion/        # presupuesto (incluye selección/alta de cliente
│   │   ├── catalogo/             # embebida — la spec no requiere una pantalla propia
│   │   ├── presupuesto/          # de gestión de clientes) e historial.
│   │   └── historial/
│   ├── styles/                   # Hoja de estilos base "classless" + ajustes mínimos.
│   └── main.js                   # Punto de entrada; enrutado simple entre pantallas.
└── tests/
    └── unit/
        └── domain/                # Casos de prueba de calculo-contract.md (CA2-CA7, CL3, CL4).

vite.config.js
```

**Decisión de estructura npm** (resuelta en `/speckit-tasks`, ver tasks.md
T001-T003): dos `package.json` independientes, uno en `backend/` y otro en
`frontend/`, sin herramientas de monorepo/workspaces — cada carpeta se
instala y se ejecuta por separado, y en producción el backend sirve el
build del front-end (research.md §8).

**Structure Decision**: proyecto web con dos carpetas, `backend/` y
`frontend/` (Opción 2), reflejando la separación cliente-servidor decidida
en research.md §1. El backend queda deliberadamente pequeño (solo `db/`,
`routes/` y el arranque del servidor) porque su única responsabilidad es la
persistencia (`almacenamiento-contract.md`); toda la lógica de negocio
(`domain/`) y la generación de PDF siguen viviendo en el front-end, igual
que en la decisión original, para no duplicar reglas de negocio en dos
sitios.

## Complexity Tracking

> No aplica: el Constitution Check no registra ninguna violación. La
> complejidad añadida (backend + base de datos) está justificada por una
> petición explícita del usuario y documentada como tal en el Constitution
> Check y en research.md, no como una excepción a la constitution.
