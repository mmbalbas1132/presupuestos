# Research: Cerrar sesión desde la interfaz

## 1. Cómo probar el flujo de cierre de sesión sin añadir `jsdom`

**Decisión**: extraer la orquestación del cierre de sesión (llamar a
`cerrarSesion()`, limpiar el estado local y decidir la redirección) a una
función pura en `frontend/src/shared/cerrarSesionFlujo.js`, con sus efectos
de red/navegación/almacenamiento recibidos como dependencias inyectables
con valores por defecto reales. El cableado con el DOM (el propio
`<button>` en `main.js`) queda como una capa fina que solo llama a esta
función y la deshabilita mientras está en curso.

**Rationale**: `frontend/` usa Vitest en su entorno por defecto (Node, sin
DOM) para todas las pruebas existentes (`tests/unit/domain`,
`tests/unit/shared`); no hay `jsdom` instalado ni pantallas con pruebas de
DOM hoy (`ui/acceso`, `ui/inicio`, etc. se verifican manualmente vía
`quickstart.md`, Principio IV de la constitution). La spec exige "al menos
un test que cubra el flujo feliz" y "un test que cubra el fallo de
`cerrarSesion()`" (criterios de aceptación); una función pura con
dependencias inyectables permite cubrir exactamente esos dos casos con
Vitest tal cual está configurado, sin tocar `vite.config.js` ni añadir
dependencias nuevas (Principio I, `CLAUDE.md`: "cero dependencias nuevas
salvo necesidad real y justificada").

**Alternatives considered**:
- Añadir `jsdom` + `@testing-library/dom` para probar el botón real y su
  `click`: rechazado por ser una dependencia nueva no justificada — el
  mismo nivel de confianza se logra probando la función de orquestación,
  y ningún otro test del proyecto usa DOM real.
- Probar solo manualmente (sin test automático): rechazado porque la spec
  pide explícitamente un test automatizado para el flujo feliz y para el
  de fallo.
- Escribir el test llamando directamente a `cerrarSesion()` real contra un
  backend de pruebas: rechazado por ser innecesariamente pesado para una
  pieza de UI; el contrato de `POST /api/auth/logout` ya tiene su propia
  cobertura en `backend/tests/api/auth.test.js` (004).

## 2. Cómo mostrar un aviso no bloqueante tras una recarga completa de página

**Decisión**: guardar una clave transitoria en `sessionStorage` (p. ej.
`avisoAcceso`) justo antes de la recarga cuando `cerrarSesion()` falla, y
leerla (y borrarla) al renderizar `ui/acceso/index.js`, reutilizando la
clase CSS `.aviso-error` ya existente para mostrar el mensaje.

**Rationale**: la aplicación ya usa exactamente este patrón —
`sessionStorage` + recarga completa— para recordar la ruta a la que volver
tras un acceso involuntario (`rutaTrasAcceso` en `httpClient.js` y
`ui/acceso/index.js`). Reutilizar el mismo mecanismo para el aviso de fallo
evita introducir un sistema de notificaciones/toasts nuevo (Principio I) y
mantiene el aviso "no bloqueante" (no es un `alert()`, no impide seguir
usando la pantalla de acceso — spec.md, Assumptions).

**Alternatives considered**:
- `alert()`/`confirm()` nativos: rechazados por ser bloqueantes, en
  contra del requisito explícito de la spec ("aviso no bloqueante").
- Un componente de notificación/toast reutilizable nuevo: rechazado por
  ser una abstracción nueva para un único caso de uso (Principio I,
  "cero alcance fantasma").
- Pasar el aviso por un parámetro en el hash de la URL (`#/acceso?error=1`):
  rechazado porque el proyecto ya tiene un mecanismo equivalente
  (`sessionStorage`) y añadir parsing de query params en el router sería
  una complejidad nueva no justificada.

## 3. Dónde limpiar el estado local y qué significa "limpiar" aquí

**Decisión**: "limpiar el estado local" se traduce en (a) invocar la misma
recarga completa de página que ya usa `redirigirAAcceso()` en
`httpClient.js` — que por sí sola descarta cualquier estado en memoria de
la sesión anterior — y (b) borrar explícitamente la clave `rutaTrasAcceso`
de `sessionStorage` si existiera, para no arrastrar una ruta protegida de
la sesión que se está cerrando hacia el siguiente inicio de sesión.

**Rationale**: la aplicación no guarda ningún token de autenticación en el
cliente (la sesión es una cookie firmada gestionada por el servidor,
`backend/src/auth.js`, decisión [004] de `CLAUDE.md`); no hay, por tanto,
ningún "token" que borrar en el navegador. Todas las pantallas protegidas
(`inicio`, `historial`, `catalogo`, `clientes`, `configuracion`) cargan sus
datos mediante una llamada a la API nada más renderizarse, y el
interceptor de 401 ya existente en `httpClient.js` redirige a `/acceso` si
la cookie ya no es válida — por lo que, tras la recarga completa, un
intento de volver atrás con el navegador ya cae en ese mecanismo sin
necesidad de un "guard" de rutas nuevo.

**Alternatives considered**:
- Añadir un guard de rutas que compruebe el estado de sesión antes de
  renderizar cada pantalla: rechazado por redundante — el interceptor de
  401 ya garantiza el mismo resultado observable (spec.md, FR-005) sin
  añadir una capa nueva (Principio I).
- Mantener un flag de "autenticado" en memoria (variable JS global):
  rechazado porque no sobrevive a la recarga completa que ya se usa (y se
  sigue usando) para ir a `/acceso`, y no aporta nada que el patrón actual
  no cubra ya.

## 4. Evitar peticiones de cierre de sesión duplicadas

**Decisión**: deshabilitar el control "Cerrar sesión" nada más activarse,
antes de invocar `cerrarSesionFlujo()`, siguiendo el mismo patrón que ya
usa `ui/acceso/index.js` con el botón "Entrar" (`boton.disabled = true`
mientras la petición está en curso).

**Rationale**: es el mismo patrón ya establecido en el proyecto para
evitar doble envío en un formulario; no requiere ninguna librería ni
mecanismo de "debounce" adicional, y como el resultado final de
`cerrarSesionFlujo()` es siempre una recarga completa de página, no hace
falta volver a habilitar el botón en ningún caso de éxito ni de fallo.
