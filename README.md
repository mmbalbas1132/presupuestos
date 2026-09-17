# PresupuestosPro

App web para que una freelancer cree presupuestos profesionales con cálculo automático de base imponible, IVA y retención de IRPF, numeración automática y exportación a PDF, además de historial, catálogo de servicios y gestión de clientes.

## Funcionalidades

- **Página de inicio** con resumen de actividad y accesos a las cuatro secciones (Presupuestos, Clientes, Catálogo, Perfil).
- **Presupuestos**: creación y edición con cálculo automático de IVA (21 %) e IRPF (15 %/7 %/0 % según el cliente), numeración automática (`AAAA-NNN`) y validez de 30 días.
- **Exportación a PDF** con la marca del freelancer, generada en el navegador.
- **Catálogo de servicios**, **clientes** y **perfil de marca** reutilizables al crear presupuestos.
- Interfaz en español de España, mobile-first, sin necesidad de login (pensada para una sola freelancer).

## Stack

- **Frontend**: SPA en JavaScript (sin TypeScript), servida con [Vite](https://vitejs.dev/); PDF con [jsPDF](https://github.com/parallax/jsPDF); CSS puro con custom properties.
- **Backend**: [Express](https://expressjs.com/) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), API HTTP mínima solo de persistencia (los cálculos y el PDF viven en el navegador).
- **Tests**: [Vitest](https://vitest.dev/) en frontend y backend.

## Cómo arrancar en local

```bash
# Backend (API; en producción también sirve el build del frontend)
cd backend
npm install
npm run dev

# Frontend (servidor de desarrollo con hot reload), en otra terminal
cd frontend
npm install
npm run dev
```

## Cómo probar

```bash
cd backend && npm test    # pruebas de la API contra SQLite de test
cd frontend && npm test   # pruebas de dominio/cálculos
```

## Estructura y documentación del proyecto

Este proyecto se desarrolla siguiendo [Spec Kit](https://github.com/github/spec-kit): cada funcionalidad tiene su especificación, plan técnico y tareas en `specs/`.

- [`specs/README.md`](./specs/README.md) — estado actual del producto y listado de funcionalidades.
- [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) — principios y reglas de producto.
- [`CLAUDE.md`](./CLAUDE.md) — memoria técnica del proyecto para asistentes de IA.

## Licencia

[GPL-3.0](./LICENSE)
