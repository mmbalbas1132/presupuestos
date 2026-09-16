# Feature Specification: Página de inicio y rediseño visual profesional

**Feature Branch**: `002-rediseno-visual-inicio`
**Created**: 2026-09-16
**Status**: Draft
**Input**: User description: "Mejorar la presentación de PresupuestosPro (aplicación ya implementada en la spec 001) con dos cambios, sin alterar ninguna funcionalidad ni dato existente. Primero: añadir una página de inicio (index) que sea el punto de entrada de la aplicación al acceder a la raíz del servidor, con navegación clara hacia las cuatro secciones existentes (Presupuestos, Clientes, Catálogo y Perfil) y un pequeño resumen de actividad (por ejemplo, número de presupuestos por estado). Además, todas las páginas deben compartir una navegación común visible para moverse entre secciones sin usar el botón atrás. Segundo: rediseñar la apariencia visual de toda la aplicación para que resulte profesional y sobria: tipografía consistente, paleta de colores limitada definida en un único lugar, espaciado uniforme, jerarquía visual clara entre títulos, tablas, formularios y totales, y estados visuales distinguibles para los presupuestos (Borrador, Enviado, Aceptado, Rechazado, Caducado). El rediseño debe aplicarse también a la plantilla del PDF para que el documento que recibe el cliente transmita la misma imagen profesional. Debe mantenerse el enfoque mobile-first ya existente y todos los textos en español de España. La lógica de negocio, los cálculos, la API y el esquema de datos no deben cambiar en absoluto."

## Clarifications

### Session 2026-09-16

- Q: La spec pide distinguir 5 estados (Borrador, Enviado, Aceptado, Rechazado, Caducado) pero el esquema solo admite 'borrador'/'emitido'. ¿Cómo se resuelve? → A: No ampliar el esquema; solo renombrar la etiqueta de 'emitido' a "Enviado" y definir visualmente los 3 estados restantes sin que sean alcanzables hoy (opción A).
- Q: "Clientes" no existe hoy como pantalla propia (vive dentro del flujo de creación de presupuesto). ¿Debe convertirse en una pantalla/ruta propia en la navegación común? → A: Sí, crear una pantalla "Clientes" propia en la navegación común que reutiliza la API y lógica de clientes ya existentes, sin añadir capacidad de negocio nueva.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Llegar a una página de inicio orientadora (Priority: P1)

Como freelancer que abre PresupuestosPro, quiero llegar a una pantalla de inicio que me diga de un vistazo cómo va mi actividad y me deje elegir a dónde ir, en lugar de caer directamente en un formulario de creación de presupuesto sin contexto.

**Why this priority**: Es el cambio de mayor impacto en la primera impresión de la aplicación y la base sobre la que se apoya la navegación común del resto de páginas.

**Independent Test**: Se puede probar entrando en la raíz de la aplicación sin ningún estado previo y comprobando que aparece la página de inicio (no el formulario de presupuesto) con el resumen de actividad y los accesos a las cuatro secciones.

**Acceptance Scenarios**:

1. **Given** la freelancer accede a la raíz de la aplicación, **When** la página termina de cargar, **Then** ve una pantalla de inicio con un resumen de actividad y accesos claros a Presupuestos, Clientes, Catálogo y Perfil.
2. **Given** la freelancer ya tiene presupuestos creados con distintos estados, **When** visita la página de inicio, **Then** ve cuántos presupuestos tiene en cada estado soportado actualmente por la aplicación.
3. **Given** la freelancer es nueva y no tiene presupuestos, clientes ni catálogo todavía, **When** visita la página de inicio, **Then** ve el resumen de actividad en cero (o un mensaje equivalente) sin errores, junto con los accesos a las cuatro secciones.
4. **Given** la freelancer está en la página de inicio, **When** pulsa el acceso a una de las cuatro secciones, **Then** navega directamente a esa sección.

---

### User Story 2 - Moverse entre secciones sin usar "atrás" (Priority: P1)

Como freelancer que está trabajando en cualquier sección de la aplicación (Presupuestos, Clientes, Catálogo o Perfil), quiero ver siempre la misma barra de navegación para saltar a otra sección o volver al inicio, sin depender del botón "atrás" del navegador.

**Why this priority**: Sin esto la página de inicio queda aislada; la navegación común es lo que hace que el punto de entrada realmente sirva durante todo el uso de la aplicación.

**Independent Test**: Se puede probar visitando cada una de las cinco pantallas (inicio y las cuatro secciones) y comprobando que en todas aparece la misma barra de navegación, con la sección actual marcada, y que desde cualquiera de ellas se puede llegar a cualquier otra con un solo clic.

**Acceptance Scenarios**:

1. **Given** la freelancer está en cualquier sección de la aplicación, **When** mira la parte superior (o inferior, en móvil) de la pantalla, **Then** ve una navegación común con accesos a Inicio, Presupuestos, Clientes, Catálogo y Perfil.
2. **Given** la freelancer está en una sección, **When** la sección está activa, **Then** la navegación resalta visualmente esa sección para que sepa dónde está.
3. **Given** la freelancer navega de una sección a otra usando la barra común, **When** completa la navegación, **Then** no necesita usar el botón "atrás" del navegador para moverse por la aplicación.

---

### User Story 3 - Una apariencia visual profesional y coherente en toda la aplicación (Priority: P2)

Como freelancer que envía presupuestos a sus clientes, quiero que tanto la aplicación como el PDF que descargo tengan un aspecto sobrio y profesional y coherente entre sí, para transmitir una buena imagen de marca sin tener que maquetar nada a mano.

**Why this priority**: Mejora la percepción de calidad de la herramienta y del profesional que la usa, pero depende de que la navegación (US1/US2) ya esté en su sitio para tener sentido como conjunto.

**Independent Test**: Se puede probar recorriendo las pantallas de listado, formulario y detalle y comprobando visualmente que comparten tipografía, colores, espaciados y jerarquía, y descargando un PDF de ejemplo para comprobar que sigue el mismo lenguaje visual.

**Acceptance Scenarios**:

1. **Given** la freelancer navega por distintas pantallas de la aplicación (tablas, formularios, totales), **When** compara su apariencia, **Then** percibe una tipografía, una paleta de colores y unos espaciados consistentes entre pantallas.
2. **Given** la freelancer mira una tabla de presupuestos, **When** observa el estado de cada uno, **Then** puede distinguir de un vistazo (por color y texto) en qué estado está cada presupuesto.
3. **Given** la freelancer descarga el PDF de un presupuesto, **When** lo abre, **Then** el documento usa la misma paleta de colores, tipografía y jerarquía visual (títulos, tabla de líneas, totales) que ve en la aplicación.
4. **Given** la freelancer usa la aplicación desde un móvil, **When** recorre cualquier pantalla, **Then** el diseño se adapta correctamente a pantallas pequeñas manteniendo la legibilidad y el enfoque mobile-first ya existente.

### Edge Cases

- ¿Qué ve la freelancer en la página de inicio si alguna de las secciones no puede cargar sus datos (por ejemplo, fallo de red al pedir el resumen de actividad)? El resumen debe degradar con un aviso claro sin bloquear el acceso a las cuatro secciones.
- ¿Qué ocurre si la freelancer entra directamente a una URL de una sección concreta en vez de por la página de inicio? La navegación común debe aparecer igualmente y marcar esa sección como activa.
- ¿Qué sección se marca como activa si la freelancer entra directamente a la pantalla de creación/edición de un presupuesto (que no tiene entrada propia en la navegación común)? La navegación común debe resaltar "Presupuestos", ya que esa pantalla forma parte de esa sección (ver `contracts/navegacion-contract.md`).
- ¿Cómo se distingue visualmente un presupuesto en un estado que hoy la aplicación aún no puede asignar (Aceptado, Rechazado, Caducado) de los estados que sí existen actualmente (Borrador, Enviado)? El lenguaje visual debe estar definido para los cinco, aunque solo dos sean alcanzables con los datos actuales.
- En el PDF, cuando el texto de una descripción de línea es muy largo, el rediseño no debe romper la maquetación existente ni provocar solapamientos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar una página de inicio como punto de entrada al acceder a la raíz de la aplicación, en lugar de abrir directamente cualquiera de las cuatro secciones de trabajo.
- **FR-002**: La página de inicio DEBE ofrecer accesos claramente identificables hacia las cuatro secciones de la aplicación: Presupuestos, Clientes, Catálogo y Perfil (Clientes se expone como pantalla propia por primera vez con esta funcionalidad; ver FR-002a).
- **FR-002a**: El sistema DEBE exponer "Clientes" como una pantalla propia dentro de la navegación común (listado y gestión de clientes), reutilizando la API y la lógica de clientes ya existentes hoy en el flujo de creación de presupuesto, sin introducir ninguna capacidad de negocio nueva sobre clientes.
- **FR-003**: La página de inicio DEBE mostrar un resumen de actividad reciente: el número de presupuestos existentes agrupados por su estado actual, el número total de clientes y el número total de servicios del catálogo (ver data-model.md §Resumen de actividad).
- **FR-004**: El resumen de actividad DEBE mostrarse correctamente (incluyendo el caso de cero elementos) cuando todavía no existen presupuestos, clientes o catálogo.
- **FR-005**: Si el resumen de actividad no puede obtener los datos necesarios, el sistema DEBE mostrar un aviso claro en su lugar sin impedir el acceso a las cuatro secciones desde la página de inicio.
- **FR-006**: Todas las páginas de la aplicación (inicio y las cuatro secciones) DEBEN compartir una única navegación común, visible en todo momento, que permita moverse a cualquier otra sección sin depender del botón "atrás" del navegador.
- **FR-007**: La navegación común DEBE indicar visualmente en qué sección se encuentra la persona usuaria en cada momento.
- **FR-008**: La navegación común DEBE seguir un enfoque mobile-first y funcionar de forma usable tanto en pantallas de móvil como de escritorio.
- **FR-009**: El sistema DEBE aplicar una identidad visual única y consistente (tipografía, paleta de colores, espaciados) en todas las pantallas de la aplicación, definida en un único lugar del que se alimenten todas las pantallas. Única excepción admitida: el PDF se genera fuera del navegador y no tiene acceso a esa fuente, por lo que replica los mismos valores en una constante equivalente mantenida sincronizada manualmente (ver research.md §1).
- **FR-010**: El sistema DEBE establecer una jerarquía visual clara y consistente entre títulos, tablas, formularios e importes totales en todas las pantallas.
- **FR-011**: El sistema DEBE representar de forma visualmente distinguible (color y texto) los cinco estados de un presupuesto: Borrador, Enviado, Aceptado, Rechazado y Caducado. El estado interno `emitido` se etiqueta visualmente como "Enviado" (cambio de rótulo únicamente, sin tocar el dato); Aceptado, Rechazado y Caducado quedan definidos en el mismo lenguaje visual para consistencia y uso futuro, pero no son alcanzables por ninguna acción de la aplicación en el alcance de esta funcionalidad, ya que el esquema de datos no se amplía (ver Clarifications).
- **FR-012**: La plantilla del PDF de presupuesto DEBE rediseñarse para usar la misma paleta de colores, tipografía y jerarquía visual (cabecera, datos de cliente y de la freelancer, tabla de líneas, bloque de totales) que el resto de la aplicación.
- **FR-013**: El rediseño visual NO DEBE alterar ningún cálculo, regla de negocio, endpoint de la API ni el esquema de datos existentes.
- **FR-014**: El rediseño visual y la nueva página de inicio NO DEBEN eliminar ni degradar ninguna funcionalidad ya existente en Presupuestos, Catálogo o Perfil, ni ninguna operación sobre clientes (alta, listado) ya existente hoy en el flujo de creación de presupuesto y reutilizada por la nueva pantalla Clientes (FR-002a).
- **FR-015**: Todos los textos de la página de inicio, la navegación común y los elementos rediseñados DEBEN estar en español de España, coherentes con el resto de la aplicación.
- **FR-016**: El PDF generado DEBE seguir conteniendo exactamente los mismos datos y campos que genera hoy, únicamente con una presentación visual renovada.

### Key Entities

- **Resumen de actividad**: vista agregada y de solo lectura sobre los presupuestos existentes (conteo por estado); no introduce datos nuevos, se calcula a partir de los presupuestos ya existentes.
- **Estado visual del presupuesto**: representación visual (color, etiqueta) asociada a cada uno de los cinco estados del ciclo de vida de un presupuesto (Borrador, Enviado, Aceptado, Rechazado, Caducado); es una capa de presentación sobre el estado real del presupuesto, no un dato nuevo por sí mismo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona que abre la aplicación por primera vez identifica, en menos de 5 segundos y sin ayuda externa, cómo llegar a cada una de las cuatro secciones desde la página de inicio.
- **SC-002**: El 100% de las pantallas de la aplicación (inicio y las cuatro secciones) muestran la misma navegación común, verificable por inspección visual de cada pantalla.
- **SC-003**: Una persona usuaria puede moverse entre las cinco pantallas de la aplicación (inicio y cuatro secciones) sin usar nunca el botón "atrás" del navegador durante una sesión completa de trabajo.
- **SC-004**: En una comparación visual antes/después, observadores externos identifican la nueva apariencia como "más profesional" o "más sobria" que la anterior en al menos el 80% de los casos.
- **SC-005**: Dado un presupuesto en cualquiera de los cinco estados definidos, una persona identifica correctamente su estado con solo mirar su color y etiqueta, sin necesitar más contexto que esos dos elementos, en el 100% de los casos observados.
- **SC-006**: El PDF descargado y las pantallas de la aplicación comparten la misma paleta de colores y tipografía de forma reconocible como "el mismo producto" para quien los compara.
- **SC-007**: Tras el cambio, el 100% de los cálculos, datos y respuestas de la API existentes antes del cambio siguen siendo idénticos (mismas entradas producen las mismas salidas).

## Assumptions

- El servidor ya sirve una única aplicación de página (SPA) en la raíz; "punto de entrada al acceder a la raíz" se interpreta como la primera pantalla que ve la persona usuaria dentro de esa SPA, no como un servidor o dominio distinto.
- De las cuatro secciones mencionadas por la persona usuaria, "Presupuestos" corresponde al listado/historial de presupuestos ya existente, y "Perfil" corresponde a la sección de configuración de datos de la freelancer ya existente; ambas se mantienen funcionalmente igual, solo se accede a ellas de forma más clara.
- "Rediseñar la plantilla del PDF" se refiere únicamente a su presentación visual (tipografía, colores, maquetación); el contenido, los campos y los cálculos que aparecen en el PDF no cambian.
- El enfoque mobile-first ya existente y el idioma (español de España) son restricciones a mantener, no aspectos a rediseñar desde cero.
- No se requiere autenticación ni distinción de roles adicionales para acceder a la página de inicio; se asume el mismo modelo de acceso de un único usuario (la freelancer) que ya tiene el resto de la aplicación.
