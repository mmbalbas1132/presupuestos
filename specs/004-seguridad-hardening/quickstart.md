# Quickstart: comprobar la seguridad de PresupuestosPro

**Feature**: 004-seguridad-hardening

Esta guía permite comprobar cada criterio de aceptación de `spec.md` usando
la aplicación y herramientas básicas (navegador y una consola con `curl`),
sin leer código ni logs de desarrollo (constitution — Principio IV). El
registro de auditoría (paso 6) sí se consulta como fichero, tal como decide
la clarificación Q2 de `spec.md`.

## 0. Antes de empezar

1. Configura `backend/.env` a partir de `backend/.env.example`, con una
   `ACCESS_KEY` de prueba (por ejemplo, `clave-de-prueba-123`).
2. Arranca el backend (`cd backend && npm run dev`) y el frontend
   (`cd frontend && npm run dev`).

## 1. La API rechaza el acceso sin la clave correcta (US1)

1. Sin haber iniciado sesión en el navegador, intenta abrir la aplicación o
   llamar a la API directamente (`curl http://localhost:3000/api/clientes`).
2. Deberías recibir un rechazo (`401`) y ningún dato de clientes. *(AC-02,
   SC-001)*
3. Introduce una clave incorrecta en la pantalla de acceso. Debería
   rechazarse igual que sin clave. *(FR-002)*
4. Introduce la clave correcta. Deberías entrar con normalidad y, al
   navegar por la app durante los minutos siguientes, no se te debería
   volver a pedir la clave. *(FR-014)*
5. Sigue usando la aplicación con normalidad (al menos una acción cada
   pocos días). Aunque pasen más de 7 días desde que iniciaste sesión por
   primera vez, no debería pedirte la clave de nuevo mientras la sigas
   usando (sesión deslizante). *(FR-014)*
6. Cambia `ACCESS_KEY` en la configuración y reinicia el backend. Sin
   cerrar sesión explícitamente, intenta seguir usando la app en la pestaña
   donde ya habías iniciado sesión. Debería pedirte la clave de nuevo (la
   nueva), como si nunca hubieras entrado. *(FR-017, SC-011)*

## 2. Bloqueo tras intentos fallidos repetidos (US1, edge case)

1. Introduce una clave incorrecta 5 veces seguidas en menos de 15 minutos.
2. En el 5º intento (o los siguientes durante 15 minutos), la aplicación
   debería rechazar el intento inmediatamente, sin comprobar siquiera si la
   clave es correcta. *(FR-015, SC-009)*
3. Espera 15 minutos (o reinicia el backend, que reinicia el contador) y
   comprueba que puedes volver a intentarlo con normalidad.

## 3. HTTPS y orígenes autorizados (US2)

1. Con `FORCE_HTTPS=true` en la configuración, intenta acceder a la
   aplicación por `http://` en vez de `https://`. Debería redirigirte
   automáticamente a la versión cifrada. *(AC-06, SC-007)*
2. Desde una página HTML distinta (por ejemplo, un fichero local abierto en
   el navegador con un pequeño `fetch` de prueba), intenta llamar a la API.
   Debería rechazarse. *(FR-012, SC-008)*

## 4. Los secretos no están en el repositorio (US3)

1. Revisa el repositorio (`git status`, y el propio código) y confirma que
   no aparece ningún valor real de `ACCESS_KEY`. *(AC-01, SC-002)*
2. Confirma que existe `backend/.env.example` con los nombres de las
   variables, sin valores reales.
3. Configura una `ACCESS_KEY` de menos de 16 caracteres y arranca el
   backend. Debería negarse a arrancar, explicando el motivo. *(FR-003)*

## 5. Validación y saneado de entradas (US4)

1. Intenta crear un cliente dejando el NIF vacío. Debería rechazarse con un
   mensaje claro. *(AC-04, SC-003)*
2. Intenta crear un cliente con un NIF con formato claramente inválido
   (por ejemplo, `"???"`). Debería rechazarse igualmente.
3. Crea un cliente cuyo nombre incluya código, por ejemplo
   `<script>alert(1)</script>`. Al verlo en la lista de clientes o en un
   presupuesto, debería aparecer como texto literal (el propio código
   escrito, no ejecutarse ninguna alerta). *(SC-004)*
4. Crea un cliente cuyo nombre o NIF incluya algo como
   `"'; DROP TABLE clientes; --"`. Debería guardarse tal cual (como texto
   literal) o rechazarse por formato, pero en ningún caso debería romper la
   aplicación ni hacer desaparecer el resto de tus clientes: comprueba
   después que `GET /api/clientes` sigue devolviendo la lista completa.
   *(FR-007)*

## 6. Manejo seguro de errores y registro de auditoría (US5, US6)

1. Provoca un error interno (por ejemplo, deteniendo la base de datos o
   forzando un dato inesperado) y comprueba que la aplicación muestra un
   mensaje genérico, nunca una traza técnica. *(AC-05, SC-005)*
2. Abre el fichero de log (`security.log`, junto a la base de datos) y
   comprueba que ese error aparece con fecha, hora y detalle técnico
   completo. *(SC-006)*
3. Repite los pasos 1 y 2 de esta guía (accesos rechazados) y confirma que
   también aparecen en el fichero de log con fecha y hora. *(AC-07, FR-010)*
4. Crea, modifica o borra un cliente, un presupuesto o tu perfil, y
   confirma que también queda una línea en el log describiendo el cambio.
