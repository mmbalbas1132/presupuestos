# Contrato: Autenticación y protección de la API

**Feature**: 004-seguridad-hardening

Este contrato añade una capa de seguridad delante de la API HTTP ya
descrita en `contracts/almacenamiento-contract.md` de
[001-presupuestos-pro-v0](../001-presupuestos-pro-v0/contracts/almacenamiento-contract.md).
No cambia ninguna ruta existente de datos (`/api/clientes`,
`/api/presupuestos`, `/api/perfil`, `/api/servicios`,
`/api/contador-anual`): todas ellas pasan ahora primero por los middlewares
descritos aquí.

## Acceso

- `POST /api/auth/login` → recibe `{ clave }` en el cuerpo. Si `clave`
  coincide con `ACCESS_KEY` (FR-001, FR-003), responde `204` y fija una
  cookie de sesión `httpOnly`, `secure` (en producción) y `sameSite=strict`,
  firmada con la propia `ACCESS_KEY` y válida 7 días vista (FR-014, FR-017).
  Si no coincide, responde `401` sin dar pistas sobre cuál era la clave
  correcta, y cuenta como intento fallido a efectos del límite de intentos
  (ver más abajo).
- `POST /api/auth/logout` → borra la cookie de sesión. Responde `204`.

## Middleware de autenticación (todas las rutas `/api/*` salvo `POST /api/auth/login`)

- Sin cookie de sesión, o con una cookie cuya firma no es válida (incluida
  una firmada con una `ACCESS_KEY` anterior ya rotada) o cuya fecha de
  expiración ya pasó → `401` con un mensaje genérico (`"No autenticado."`),
  sin detalle técnico (FR-002, FR-008). No se llega a ejecutar la ruta ni se
  accede a la base de datos.
- Con una cookie de sesión válida → la petición continúa con normalidad, y
  el middleware reemite la cookie con la expiración recalculada a 7 días
  vista (sesión deslizante, FR-014); una freelancer que usa la app con
  regularidad nunca ve expirar la sesión por el mero paso del tiempo.
- Todo rechazo por este motivo se registra como evento `acceso_rechazado`
  (FR-010, `data-model.md`).

## Middleware de límite de intentos (solo `POST /api/auth/login`)

- Cuenta los intentos fallidos por origen (IP) en una ventana de 15 minutos
  (FR-015).
- Al quinto intento fallido consecutivo desde el mismo origen dentro de la
  ventana, las peticiones siguientes desde ese origen a
  `POST /api/auth/login` responden `429` durante los 15 minutos siguientes,
  sin comprobar siquiera la clave enviada.
- El bloqueo se libera automáticamente al expirar ese periodo, sin
  intervención manual.
- Cada bloqueo activado se registra como evento `bloqueo_origen` (FR-010).

## Middleware de origen (CORS)

- Aplica a todas las rutas `/api/*`.
- Si la petición incluye cabecera `Origin` y no coincide con
  `ALLOWED_ORIGIN` (configurado en el entorno de despliegue), responde `403`
  antes de comprobar autenticación (FR-012).
- Si no incluye cabecera `Origin` (peticiones que no vienen de un
  navegador), esta comprobación se omite y la petición sigue su curso
  normal — la autenticación (arriba) sigue siendo obligatoria en cualquier
  caso (Edge Case de `spec.md`).
- Responde a las peticiones `OPTIONS` de preflight sin pasar por
  autenticación.

## Middleware de HTTPS

- Activo solo si `FORCE_HTTPS=true` (pensado para producción).
- Si la petición no llega cifrada (`req.secure` es `false`, considerando
  `X-Forwarded-Proto` detrás de un proxy inverso), responde con una
  redirección `301` a la misma URL en `https://` (FR-011).

## Rotación de la clave comprometida

- No expone ninguna ruta ni pantalla propia (FR-017; decisión explícita en
  `spec.md` de no construir funcionalidad dedicada dentro de la app).
- Quien administre el despliegue cambia `ACCESS_KEY` en la configuración del
  entorno y reinicia la aplicación (Edge Case de `spec.md`).
- Como la cookie de sesión se firma con la propia `ACCESS_KEY`
  (research.md §1), ninguna cookie emitida con el valor anterior vuelve a
  validar tras el reinicio: todas las sesiones activas, incluida la de un
  posible atacante que hubiera robado una cookie sin conocer la clave,
  quedan invalidadas de inmediato (FR-017, SC-011).

## Manejo de errores (extiende el middleware ya existente en `server.js`)

- Cualquier error no controlado por una ruta sigue respondiendo con el
  formato ya existente: `{ error: mensaje }`, con `mensaje` genérico salvo
  que el propio error marque `expose: true` (FR-008; comportamiento ya
  implementado, sin cambios).
- Antes de responder, el error completo (incluyendo traza técnica) se
  registra como evento `error_interno` (FR-009).

## Cambios de datos y auditoría (rutas de escritura existentes)

- Toda petición `POST`, `PUT` o `DELETE` que complete correctamente sobre
  `/api/clientes`, `/api/presupuestos` o `/api/perfil` registra un evento
  `cambio_dato` con el recurso afectado (FR-010). No aplica a `/api/servicios`
  ni `/api/contador-anual` por no estar mencionados como datos sensibles en
  `spec.md` (clientes, presupuestos y perfil).
