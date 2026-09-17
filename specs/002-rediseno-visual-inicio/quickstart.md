# Quickstart: comprobar la página de inicio y el rediseño visual

**Feature**: 002-rediseno-visual-inicio

Esta guía permite comprobar la funcionalidad simplemente usando la
aplicación, sin abrir código, logs ni consola (constitution — Principio
IV). Sigue los pasos en orden; cada paso indica qué deberías ver.

## 0. Punto de entrada

1. Abre la aplicación por la raíz (sin ningún hash en la URL), en un
   navegador de escritorio.
2. Deberías llegar a una página de **Inicio**, no directamente al
   formulario de crear presupuesto. *(FR-001, US1-AS1)*
3. En esa página deberías ver un resumen con el número de presupuestos por
   estado (por ejemplo, "2 en Borrador, 1 Enviado"), y cuatro accesos
   claramente identificables: Presupuestos, Clientes, Catálogo y Perfil.
   *(FR-002, FR-003, US1-AS1)*
4. Con un cronómetro, comprueba que identificar los cuatro accesos (sin
   leer instrucciones ni pedir ayuda) te lleva menos de 5 segundos.
   *(SC-001)*

## 1. Primera vez, sin datos

1. Con una instalación sin presupuestos, clientes ni catálogo, entra a
   Inicio.
2. El resumen debería mostrarse en cero (o un mensaje equivalente), sin
   errores en pantalla, y los cuatro accesos deberían seguir funcionando.
   *(FR-004, US1-AS3)*

## 2. Navegación común sin botón "atrás"

1. Desde Inicio, entra en cada una de las cuatro secciones (Presupuestos,
   Clientes, Catálogo, Perfil) usando la barra de navegación superior.
2. En cada pantalla deberías ver la misma barra, con la sección actual
   resaltada. *(FR-006, FR-007, US2-AS1, US2-AS2)*
3. Desde cualquier sección, vuelve a Inicio o salta a otra sección
   usando la barra — no uses el botón "atrás" del navegador en ningún
   momento. Deberías poder recorrer las 6 pantallas (Inicio, Presupuestos,
   Clientes, Catálogo, Perfil, y el formulario de presupuesto abierto
   desde Presupuestos) sin usarlo nunca. *(FR-006, SC-003)*
4. Escribe directamente en la barra de direcciones la URL de una sección
   (por ejemplo, la de Catálogo) y ábrela. La navegación común debe seguir
   apareciendo y marcar Catálogo como sección activa. *(Edge Case)*

## 3. Sección Clientes

1. Entra en "Clientes" desde la navegación común.
2. Deberías ver el listado de clientes ya existentes (los que se hayan
   creado antes al hacer presupuestos), con nombre, NIF y tipo. *(FR-002a)*
3. Da de alta un cliente nuevo desde esta pantalla. Debería aparecer en el
   listado y, más tarde, poder seleccionarse al crear un presupuesto,
   exactamente igual que los clientes creados desde el flujo de
   presupuesto. *(FR-002a — misma API/datos, sin funcionalidad nueva)*

## 4. Estados visuales de los presupuestos

1. Con al menos un presupuesto en borrador y otro ya emitido, ve a
   "Presupuestos".
2. El presupuesto emitido debería mostrar la etiqueta **"Enviado"** (no
   "Emitido") con un color distintivo; el borrador debería mostrar
   **"Borrador"** con un color distinto. Debe poder distinguirse el estado
   solo por color y etiqueta, sin leer nada más. *(FR-011, SC-005)*
3. Confirma que solo existen esos dos estados posibles en los datos reales
   (no hay forma en la aplicación de marcar un presupuesto como Aceptado,
   Rechazado o Caducado) — esto es esperado: esos tres estados solo forman
   parte del lenguaje visual, no de los datos, en el alcance de esta
   funcionalidad. *(Clarifications, Edge Case)*
4. Nota sobre SC-005: el "100% de los casos observados" se comprueba con
   datos reales solo para Borrador y Enviado (los únicos alcanzables). Para
   Aceptado, Rechazado y Caducado, comprueba en su lugar que la definición
   de color/etiqueta existe en `frontend/src/styles/base.css`
   (`.estado--aceptado`, `.estado--rechazado`, `.estado--caducado`) tal
   como fija `contracts/sistema-visual-contract.md`, ya que no se pueden
   generar con datos reales en el alcance de esta funcionalidad.

## 5. Apariencia general y PDF

1. Recorre Presupuestos, Clientes, Catálogo y Perfil y compara: misma
   tipografía, misma paleta de colores, mismo espaciado entre elementos, y
   una jerarquía clara entre títulos, tablas, formularios y totales.
   *(FR-009, FR-010, US3-AS1)*
1. Enseña una captura de la aplicación anterior y otra de la nueva a 3-5
   personas que no hayan participado en el desarrollo y pregúntales cuál
   de las dos parece más profesional o sobria. Si al menos 4 de cada 5
   (80%) elige la nueva, se considera cumplido. *(SC-004)*
2. Emite (o abre) un presupuesto y descarga su PDF.
3. Abre el PDF: debería usar la misma paleta de colores y tipografía que
   la aplicación, con la misma jerarquía visual en cabecera, datos del
   cliente/freelancer, tabla de líneas y totales — y exactamente los
   mismos datos y cálculos que mostraba la pantalla. *(FR-012, FR-016,
   US3-AS3, SC-006, SC-007)*
4. Prueba con una línea de descripción muy larga: el PDF no debería
   solapar texto ni romper la maquetación. *(Edge Case)*

## 6. Mobile-first

1. Repite los pasos 0 a 2 en una pantalla de móvil (o con el navegador
   redimensionado a un ancho de móvil).
2. Todo debería seguir siendo legible y usable, sin scroll horizontal ni
   necesidad de hacer zoom. *(US3-AS4, constraint mobile-first)*

## 7. Nada de negocio ha cambiado

1. Repite cualquiera de los escenarios de `specs/001-presupuestos-pro-v0/quickstart.md`
   (cálculo de IVA, retención, numeración, inmutabilidad al emitir).
2. Los resultados numéricos y el comportamiento deberían ser
   **idénticos** a los de antes de este rediseño. *(FR-013, SC-007)*
