# PresupuestosPro

App web para que una freelancer cree presupuestos con cálculo automático de IVA/IRPF y los exporte en PDF, con historial, catálogo y clientes.

## Stack y decisiones vigentes
- JavaScript ES2022+ en front y back, **sin TypeScript** (decisión explícita).
- Frontend: SPA en `frontend/src/` sin framework, servida con **Vite**; PDF con **jsPDF** (`frontend/src/pdf/`); estilos CSS puro con custom properties en `frontend/src/styles/base.css` (sin frameworks CSS).
- Backend: **Express** + **better-sqlite3** (`backend/src/`), API HTTP mínima, solo persistencia (cálculos y PDF viven en el navegador).
- Cero dependencias nuevas salvo necesidad real y justificada.
- Estado actual: specs 001 (app base) y 002 (rediseño visual + página de inicio) implementadas.

## Arrancar y probar en local
```bash
# Backend (API + sirve el front en producción)
cd backend && npm install && npm run dev      # arranca en el puerto de config.port
npm test                                      # vitest (API contra SQLite de test)

# Frontend (dev server con hot reload)
cd frontend && npm install && npm run dev     # Vite
npm test                                      # vitest (dominio/cálculos)
npm run build                                 # build de producción
```

## Convenciones
- Español de España en toda la UI, mensajes y PDF; importes en euros, formato `1.234,56 €`.
- Mobile-first; sin scroll horizontal ni necesidad de zoom.
- Lógica de negocio pura en `domain/`, llamadas a API en `api/`, pantallas en `ui/<pantalla>/index.js`.
- Sin login ni multi-tenencia (un solo servidor para una sola freelancer).
- Verificación manual guiada por `quickstart.md` de cada spec, complementada con tests unitarios en lo más delicado (cálculos, API).

Las reglas de producto viven en `.specify/memory/constitution.md` y el estado del producto en `specs/README.md`.
