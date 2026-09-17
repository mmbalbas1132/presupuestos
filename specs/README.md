# Estado del producto

Índice de las funcionalidades especificadas con Spec Kit y su estado actual.

| Spec | Descripción | Estado |
|---|---|---|
| [001-presupuestos-pro-v0](./001-presupuestos-pro-v0/spec.md) | App base: perfil de marca, catálogo de servicios, clientes, creación de presupuestos con cálculo automático de IVA/IRPF y numeración, exportación a PDF, historial. Backend Express + SQLite, frontend SPA con Vite. | ✅ Implementada (51/51 tareas) |
| [002-rediseno-visual-inicio](./002-rediseno-visual-inicio/spec.md) | Página de inicio con resumen de actividad, pantalla propia de "Clientes" en la navegación común, y rediseño visual profesional de toda la app y de la plantilla del PDF. Sin cambios en backend, API ni datos. | ✅ Implementada (23/23 tareas) |
| [004-seguridad-hardening](./004-seguridad-hardening/spec.md) | Acceso protegido por clave única con sesión deslizante, límite de intentos fallidos, HTTPS/CORS en producción, validación y saneado de entradas, manejo seguro de errores y registro de auditoría con purga a 90 días. Sin login multiusuario ni roles. | ✅ Implementada (46/46 tareas) |

Cada carpeta de spec sigue la estructura de Spec Kit: `spec.md` (requisitos y criterios de aceptación), `plan.md` (decisiones técnicas), `research.md`, `data-model.md`, `contracts/`, `quickstart.md` (verificación manual) y `tasks.md`.

Las reglas de producto que aplican a todas las specs viven en [`.specify/memory/constitution.md`](../.specify/memory/constitution.md).
