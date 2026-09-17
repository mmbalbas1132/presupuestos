# Quickstart: comprobar el cierre de sesión de PresupuestosPro

**Feature**: 005-cerrar-sesion

Esta guía permite comprobar cada criterio de aceptación de `spec.md`
usando la aplicación tal como lo haría una freelancer real, sin leer
código ni logs (constitution — Principio IV).

## 0. Antes de empezar

1. Configura `backend/.env` a partir de `backend/.env.example`, con una
   `ACCESS_KEY` de prueba.
2. Arranca el backend (`cd backend && npm run dev`) y el frontend
   (`cd frontend && npm run dev`).
3. Inicia sesión en la aplicación con la clave de acceso.

## 1. El control "Cerrar sesión" está visible en todas las pantallas (FR-001, FR-008)

1. Con sesión iniciada, visita cada pantalla de la navegación: Inicio,
   Presupuestos, Clientes, Catálogo y Perfil.
2. En todas ellas debe verse un control "Cerrar sesión" en la barra de
   navegación, sin necesidad de abrir ningún menú oculto.
3. Comprueba también que puedes llegar al control y activarlo solo con el
   teclado (tabulando hasta él y pulsando Intro/Espacio). *(FR-006)*

## 2. Flujo feliz: cerrar sesión (US1, FR-002, FR-003)

1. Desde cualquiera de esas pantallas, pulsa "Cerrar sesión".
2. Deberías llegar a la pantalla de acceso (login) inmediatamente.
3. Pulsa el botón "atrás" del navegador. No deberías volver a ver la
   pantalla anterior con sus datos: deberías permanecer en, o volver a, la
   pantalla de acceso. *(FR-005, SC-002)*
4. Vuelve a introducir la clave de acceso: deberías poder entrar con
   normalidad, como si fuera un inicio de sesión nuevo.

## 3. Fallo al cerrar sesión: el backend no responde (US2, FR-004)

1. Con sesión iniciada, detén el proceso del backend (`Ctrl+C` en su
   terminal) sin cerrar la pestaña del navegador.
2. Pulsa "Cerrar sesión".
3. Deberías llegar igualmente a la pantalla de acceso, con un aviso visible
   pero no bloqueante (no es una ventana emergente que haya que cerrar; se
   puede seguir usando la pantalla de acceso con normalidad). *(SC-003)*
4. Vuelve a arrancar el backend (`cd backend && npm run dev`) y comprueba
   que puedes iniciar sesión de nuevo con normalidad.

## 4. El control no aparece en la pantalla de acceso (FR-008)

1. Sin haber iniciado sesión (o justo después de cerrarla), comprueba que
   la pantalla de acceso no muestra el control "Cerrar sesión".

## 5. No se disparan cierres de sesión duplicados (edge case, FR-007)

1. Con sesión iniciada, pulsa "Cerrar sesión" varias veces seguidas muy
   rápido (doble clic).
2. Deberías terminar en la pantalla de acceso una sola vez, sin errores
   visibles ni comportamiento inconsistente (por ejemplo, sin quedarte a
   medio camino entre pantallas).
