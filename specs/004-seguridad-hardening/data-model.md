# Data Model: Seguridad y hardening de PresupuestosPro

**Feature**: 004-seguridad-hardening | **Fecha**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

Esta feature **no añade ninguna tabla nueva** a la base de datos SQLite
existente (`backend/src/db/connection.js`): ni la sesión de acceso, ni el
límite de intentos fallidos, ni el registro de auditoría necesitan
persistencia en SQLite (ver [research.md](./research.md) §1, §3 y §9). Se
documentan aquí como entidades conceptuales (en memoria o en fichero) y como
reglas de validación añadidas a las entidades ya existentes.

## Sesión de acceso (en memoria del navegador y del token, no en base de datos)

| Campo | Tipo | Dónde vive | Regla |
|---|---|---|---|
| firma | HMAC-SHA256 en base64 | Cookie `httpOnly` en el navegador | Calculada usando `ACCESS_KEY` como secreto de firma (sin variable de sesión aparte); FR-001, FR-014, FR-017 |
| expiraEn | fecha/hora ISO | Dentro del propio valor firmado de la cookie | 7 días vista desde la última petición autenticada (sesión deslizante); FR-014 |

**Reglas**:
- No existe una tabla ni un registro en el servidor por cada sesión: el
  propio token firmado, si la firma es válida y `expiraEn` no ha pasado, es
  la prueba de que la sesión sigue activa (research.md §1).
- Cada petición autenticada con éxito reemite la cookie con `expiraEn`
  recalculado a 7 días vista (FR-014): la sesión solo caduca tras 7 días
  consecutivos sin actividad, no a un plazo fijo desde su creación.
- Al expirar o borrarse la cookie, la siguiente petición se trata igual que
  una sin autenticar (FR-002).
- Al rotar `ACCESS_KEY` y reiniciar la aplicación, ninguna firma calculada
  con el valor anterior vuelve a validar: todas las sesiones existentes
  quedan invalidadas automáticamente (FR-017, SC-011).

## Límite de intentos fallidos (en memoria del proceso backend)

| Campo | Tipo | Dónde vive | Regla |
|---|---|---|---|
| origen | texto (IP) | Clave de un `Map` en memoria del proceso Node.js | FR-015 |
| intentos | número entero | Valor del `Map` | Se incrementa en cada intento fallido; FR-015 |
| inicioVentana | fecha/hora | Valor del `Map` | Se reinicia si han pasado más de 15 minutos; FR-015 |
| bloqueadoHasta | fecha/hora o vacío | Valor del `Map` | Se fija tras el 5º intento fallido; dura 15 minutos; FR-015 |

**Reglas**:
- No persiste entre reinicios del servidor (aceptable: un reinicio ya
  requiere acceso a la infraestructura de despliegue, fuera del modelo de
  amenaza de un atacante remoto).
- Se limpia perezosamente: cada petición nueva descarta entradas cuya
  ventana ya expiró, evitando crecimiento indefinido (research.md §3).

## Evento de auditoría (fichero de log local, no en SQLite)

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| fecha | fecha/hora ISO | Sí | FR-009, FR-010 |
| tipo | enum: `acceso_rechazado` \| `bloqueo_origen` \| `cambio_dato` \| `error_interno` | Sí | FR-009, FR-010 |
| detalle | texto | Sí | Recurso/entidad afectada, o mensaje de error interno completo (incluye traza en `error_interno`); FR-009, FR-010 |
| origen | texto (IP), si aplica | No | Presente en `acceso_rechazado` y `bloqueo_origen` |

**Reglas**:
- Se añade una línea JSON por evento a `security.log` (ruta configurable vía
  `LOG_PATH`); nunca se expone por la API ni se muestra en el frontend
  (FR-009 — "no visible para la usuaria final").
- Se descartan automáticamente las líneas con más de 90 días de antigüedad
  (FR-016); la purga ocurre al arrancar el servidor y una vez al día
  mientras esté en marcha (research.md §9).

## Cambios en entidades existentes (validación, sin cambios de esquema SQLite)

Las tablas `clientes`, `presupuestos`, `lineas_presupuesto` y
`perfil_freelancer` (ya definidas en `data-model.md` de
[001-presupuestos-pro-v0](../001-presupuestos-pro-v0/data-model.md)) no
cambian de esquema. Se añaden estas reglas de validación en el backend antes
de guardar (FR-005), sin alterar los campos ya existentes:

| Entidad | Campo | Regla nueva |
|---|---|---|
| Cliente | `nombre` | Longitud máxima razonable (p. ej. 200 caracteres); rechaza vacío tras recortar espacios |
| Cliente | `nif` | Debe cumplir el formato de NIF/NIE/CIF español (expresión regular); rechaza formatos claramente inválidos |
| Cliente | `tipo` | Ya validado por `CHECK` en SQLite (`particular`/`empresa`/`autonomo`); se valida también antes de llegar a la base de datos, para devolver un mensaje claro en vez de un error de base de datos |
| PerfilFreelancer | `nombre`, `contacto` | Longitud máxima razonable; `contacto` debe parecer un email o un teléfono |
| PerfilFreelancer | `nif` | Mismo formato que el NIF de Cliente |
| PerfilFreelancer | `logo` | Si está presente, debe ser un `data:` URL cuyo tipo MIME empiece por `image/`, antes de guardarlo y antes de insertarlo en el DOM (FR-006) |
| Presupuesto / Línea | Campos de texto libre (`descripcion`, etc.) | Longitud máxima razonable; se tratan siempre como texto plano al mostrarse (FR-006), nunca como HTML |
