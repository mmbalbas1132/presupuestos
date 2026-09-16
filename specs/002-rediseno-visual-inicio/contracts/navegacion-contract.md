# Contrato: Navegación común

**Feature**: 002-rediseno-visual-inicio | **Fecha**: 2026-09-16

Define la tabla única de rutas y navegación común que consumen
`frontend/src/main.js` (registro de rutas) y la barra de navegación
(FR-006, FR-007).

## Tabla de rutas

| Ruta (hash) | Etiqueta en nav | Módulo `render(contenedor)` | Nota |
|---|---|---|---|
| `/inicio` | "Inicio" | `frontend/src/ui/inicio/index.js` (NUEVO) | Ruta por defecto (sustituye a `/presupuesto`). |
| `/historial` | "Presupuestos" | `frontend/src/ui/historial/index.js` (existente) | Etiqueta cambia de "Historial" a "Presupuestos" (spec.md Assumptions). |
| `/clientes` | "Clientes" | `frontend/src/ui/clientes/index.js` (NUEVO) | Reutiliza `api/clientes.js`. |
| `/catalogo` | "Catálogo" | `frontend/src/ui/catalogo/index.js` (existente) | Sin cambios de ruta ni etiqueta. |
| `/configuracion` | "Perfil" | `frontend/src/ui/configuracion/index.js` (existente) | Etiqueta cambia de "Configuración" a "Perfil" (spec.md Assumptions). |
| `/presupuesto` | *(sin entrada en nav)* | `frontend/src/ui/presupuesto/index.js` (existente) | Se sigue accediendo desde botones dentro de "Presupuestos" (p. ej. "Nuevo presupuesto", "Continuar editando"), igual que hoy. Al estar en esta ruta (incluido acceso directo por URL), la navegación común resalta "Presupuestos" como sección activa, ya que forma parte de esa sección. |

## Reglas del contrato

1. `establecerRutaPorDefecto('/inicio')` sustituye a `'/presupuesto'` en
   `main.js` (FR-001).
2. `crearNavegacion()` en `main.js` genera sus enlaces a partir de esta
   misma tabla (las 5 filas con etiqueta en nav), en el orden mostrado
   arriba, para que añadir o renombrar una sección solo requiera tocar un
   lugar.
3. La navegación común es la misma instancia de `<nav id="app-nav">` ya
   creada una vez en `iniciarApp()` (no se crea una nav por pantalla); se
   sigue marcando la sección activa con la clase `.activo` ya existente
   (FR-007). La ruta `/presupuesto` no tiene entrada propia, pero cuenta
   como parte de "Presupuestos" a efectos de resaltado (ver tabla de rutas).
4. Ninguna pantalla puede navegar usando `window.history.back()` ni
   depender del botón "atrás" del navegador para moverse entre secciones;
   todo enlace entre secciones usa `window.location.hash` o un `<a href="#/...">`
   de esta tabla (FR-006, SC-003).
5. Esta tabla no añade ni quita ninguna ruta de la API del backend — es
   exclusivamente el mapa de pantallas del front-end.
