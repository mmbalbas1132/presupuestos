# PresupuestosPro

App web para que una freelancer cree presupuestos con cálculo automático de IVA/IRPF y los exporte en PDF, con historial, catálogo y clientes.

## Stack y decisiones vigentes
- JavaScript ES2022+ en front y back, **sin TypeScript** (decisión explícita).
- Frontend: SPA en `frontend/src/` sin framework, servida con **Vite**; PDF con **jsPDF** (`frontend/src/pdf/`); estilos CSS puro con custom properties en `frontend/src/styles/base.css` (sin frameworks CSS).
- Backend: **Express** + **better-sqlite3** (`backend/src/`), API HTTP mínima, solo persistencia (cálculos y PDF viven en el navegador).
- Cero dependencias nuevas salvo necesidad real y justificada.
- Estado actual: specs 001 (app base), 002 (rediseño visual + página de inicio) y 004 (seguridad y hardening) implementadas.

## Arrancar y probar en local
```bash
# Backend (API + sirve el front en producción)
cd backend
cp .env.example .env   # rellena ACCESS_KEY (mínimo 16 caracteres) antes de arrancar
npm install && npm run dev                    # arranca en el puerto de config.port
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
- Un único servidor para una sola freelancer, sin multi-tenencia ni modelo de roles: toda la API exige una clave de acceso única (`ACCESS_KEY`), pero no hay cuentas de usuario ni permisos diferenciados (spec 004).
- Verificación manual guiada por `quickstart.md` de cada spec, complementada con tests unitarios en lo más delicado (cálculos, API).

## Decisiones de diseño transversales (una línea por decisión, con referencia a la spec)

- [004] La sesión de acceso (cookie firmada) se firma con la propia `ACCESS_KEY`, sin una variable `SESSION_SECRET` aparte: así, rotar la clave e reiniciar el backend invalida automáticamente todas las sesiones activas.
- [004] El registro de auditoría (`security.log`) vive en un fichero de líneas JSON en el servidor (`backend/src/auditoria.js`), sin tabla nueva en SQLite ni pantalla propia en la app; se purga solo a los 90 días.
- [004] El límite de intentos fallidos de acceso vive en memoria del proceso backend (`backend/src/rateLimit.js`), sin Redis ni almacén compartido: es coherente con el despliegue de un único servidor.
- [004] Ningún middleware de seguridad (auth, CORS, HTTPS, límite de intentos) usa una dependencia npm nueva; todos se apoyan en `node:crypto`/`node:fs` y en las capacidades ya nativas de Express (`res.cookie`), leyendo las cookies de petición manualmente para no depender de `cookie-parser`.


## Spec-kit

* Antes de ejecutar el flujo de `/speckit.specify`, SIEMPRE ejecuta primero el hook `before_specify` (skill `speckit-git-feature`) para crear la rama de la feature, y espera su resultado antes de crear la spec.
* Tras completar `/speckit.specify`, verifica con `git branch --show-current` que estamos en la rama `NNN-nombre-feature` y no en `master`. Si no es así, avísame antes de continuar.

Incluye en `plan.md`, como último paso de la fase final, un paso de mantenimiento:
“Actualizar `CLAUDE.md` con las decisiones de diseño y convenciones nuevas de esta feature, una línea por decisión, con referencia a la spec (p. ej. ‘[003] ...’). No incluyas entradas por incluir, asegúrate siempre de que es información transversal y relevante para el proyecto que puedan aprovechar futuras features.”

Las reglas de producto viven en `.specify/memory/constitution.md` y el estado del producto en `specs/README.md`.

<!-- SPECKIT START -->
## Feature en curso (Spec Kit)

Plan activo: [specs/004-seguridad-hardening/plan.md](specs/004-seguridad-hardening/plan.md)
<!-- SPECKIT END -->
