# Data Model: Cerrar sesión desde la interfaz

Esta feature no añade entidades de dominio ni cambia el esquema de SQLite.
Lo único "modelable" son (1) el concepto de sesión de acceso ya existente,
(2) el contrato interno de la nueva función de orquestación del frontend,
y (3) la clave transitoria de `sessionStorage` usada para el aviso no
bloqueante (research.md §2).

## Sesión de acceso (conceptual, sin cambios)

Ya definida en `specs/004-seguridad-hardening/data-model.md` /
`contracts/auth-contract.md`: una cookie firmada gestionada por el
backend, sin representación en el cliente más allá de "existe" o "no
existe". Esta feature no añade atributos nuevos; solo consume la ruta ya
existente `POST /api/auth/logout` para terminarla.

## Interfaz interna: `cerrarSesionFlujo()`

**Ubicación**: `frontend/src/shared/cerrarSesionFlujo.js`

**Propósito**: orquestar el cierre de sesión de forma que el resultado
observable sea siempre el mismo (estado local limpio + pantalla de
acceso), tanto si `cerrarSesion()` tiene éxito como si falla, y que sea
comprobable con un test unitario sin DOM (research.md §1).

**Firma**:

```js
async function cerrarSesionFlujo({
  cerrarSesion,       // () => Promise<void> — por defecto, la función real de api/auth.js
  limpiarEstadoLocal,  // () => void — por defecto, borra 'rutaTrasAcceso' de sessionStorage
  navegarAAcceso,      // ({ huboError: boolean }) => void — por defecto, guarda el aviso si huboError y recarga a #/acceso
} = {}) => void
```

**Comportamiento**:

1. Intenta `await cerrarSesion()`.
2. Si la llamada lanza (red caída, backend caído, error 4xx/5xx), se
   captura y se marca `huboError = true`; no se propaga la excepción.
3. Se ejecuta siempre `limpiarEstadoLocal()`.
4. Se ejecuta siempre `navegarAAcceso({ huboError })`.

**Por qué esta forma**: al recibir las tres dependencias con valores por
defecto, el uso real (`main.js`) no cambia respecto a lo que haría código
normal, pero un test puede inyectar dobles de prueba (una `cerrarSesion`
que resuelve o que rechaza, y espías para `limpiarEstadoLocal` /
`navegarAAcceso`) sin necesitar `window`, `document` ni `jsdom`
(research.md §1). Cubre exactamente los dos criterios de aceptación de la
spec: flujo feliz (`huboError: false`) y fallo de `cerrarSesion()`
(`huboError: true`).

**Casos de prueba mínimos** (`tests/unit/shared/cerrarSesionFlujo.test.js`):

- Flujo feliz: `cerrarSesion` resuelve → se llama a `limpiarEstadoLocal()`
  y a `navegarAAcceso({ huboError: false })`.
- Flujo de fallo: `cerrarSesion` rechaza → se llama igualmente a
  `limpiarEstadoLocal()` y a `navegarAAcceso({ huboError: true })`, sin que
  la función propague el error (no debe quedar una promesa rechazada sin
  capturar).

## `sessionStorage`: clave `avisoAcceso` (nueva, transitoria)

| Campo | Valor |
|---|---|
| Clave | `avisoAcceso` |
| Valor | Texto fijo del aviso no bloqueante (p. ej. `"No se ha podido cerrar sesión en el servidor, pero se ha cerrado en este dispositivo."`) |
| Quién la escribe | `navegarAAcceso` por defecto, solo cuando `huboError` es `true`, justo antes de la recarga |
| Quién la lee | `ui/acceso/index.js`, al renderizar: si existe, la muestra con la clase `.aviso-error` ya existente. La lectura es **no destructiva** (a diferencia de `rutaTrasAcceso`): el cambio de hash antes de la recarga completa dispara una re-renderización transitoria de `/acceso` en el documento saliente (vía el listener `hashchange` de `main.js`), que si borrase la clave al leerla dejaría vacía la recarga real posterior — se comprobó de forma reproducible en pruebas manuales. Por eso se lee sin borrar. |
| Quién la borra | `ui/acceso/index.js`, dentro de `intentarAcceso()`, al iniciar un nuevo intento de acceso (mismo momento en que se limpia el mensaje de error anterior) |
| Ciclo de vida | Transitoria: persiste en `sessionStorage` hasta el siguiente intento de acceso; nunca persiste entre sesiones del navegador ni se envía al servidor |

No se introduce ninguna clave, tabla ni campo adicional más allá de esta.
