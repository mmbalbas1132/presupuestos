# Feature Specification: Cerrar sesión desde la interfaz

**Feature Branch**: `005-cerrar-sesion`
**Created**: 2026-09-17
**Status**: Draft
**Input**: User description: "Añadir la funcionalidad de 'Cerrar sesión' a la interfaz de usuario. La función `cerrarSesion()` ya existe en `frontend/src/api/auth.js` pero es código muerto: no se invoca desde ningún componente. Hay que exponerla mediante un control visible y accesible (texto 'Cerrar sesión' o icono con tooltip equivalente) en todas las vistas que requieren sesión autenticada, reutilizando `cerrarSesion()` sin duplicar ni reescribir su lógica. Al pulsarlo debe redirigir al login y limpiar por completo el estado de autenticación en cliente, de forma que volver atrás en el navegador no dé acceso a vistas protegidas. Si `cerrarSesion()` falla, la sesión local debe limpiarse igualmente, redirigiendo al login con un aviso no bloqueante. Ubicación esperada: cabecera/navegación principal, o un menú de usuario si ya existiera uno. Fuera de alcance: rediseñar la autenticación, 'recordarme', OAuth, refresh tokens, o cambiar la firma/comportamiento interno de `cerrarSesion()`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cerrar sesión desde cualquier pantalla (Priority: P1)

Como freelancer que usa la aplicación en un ordenador compartido o al terminar su jornada, quiero un control visible de "Cerrar sesión" accesible desde cualquier pantalla autenticada, para terminar mi sesión de forma explícita sin tener que cerrar el navegador.

**Why this priority**: Es el hueco funcional y de seguridad que motiva la spec: hoy no existe ninguna forma de cerrar sesión desde la interfaz, a pesar de que la lógica de backend ya existe. Sin esto, la funcionalidad no tiene ningún valor para el usuario.

**Independent Test**: Con sesión iniciada, pulsar "Cerrar sesión" desde cualquier pantalla y comprobar que se llega a la pantalla de acceso y que las pantallas protegidas dejan de ser accesibles.

**Acceptance Scenarios**:

1. **Given** la freelancer tiene sesión iniciada y está en cualquier pantalla de la aplicación (Inicio, Presupuestos, Clientes, Catálogo o Perfil), **When** pulsa el control "Cerrar sesión", **Then** la aplicación invoca `cerrarSesion()` y, al completarse correctamente, la lleva a la pantalla de acceso.
2. **Given** la freelancer acaba de cerrar sesión correctamente, **When** intenta volver a una pantalla protegida usando el botón "atrás" del navegador, **Then** la aplicación la redirige a la pantalla de acceso en lugar de mostrar contenido protegido.
3. **Given** la freelancer tiene sesión iniciada, **When** observa cualquier pantalla autenticada, **Then** el control "Cerrar sesión" está visible y accesible sin necesidad de navegar a un submenú oculto.

---

### User Story 2 - Cerrar sesión cuando el backend no responde (Priority: P2)

Como freelancer, quiero que al pulsar "Cerrar sesión" mi sesión termine en mi dispositivo aunque el servidor no responda en ese momento, para no quedar con la sensación de que la aplicación sigue "conectada" cuando en realidad no puedo usarla.

**Why this priority**: Es un caso de error explícitamente pedido y con implicaciones de seguridad (una sesión que "parece" seguir abierta localmente es un riesgo), pero depende de que el flujo feliz (US1) ya exista.

**Independent Test**: Provocar un fallo en la petición de `cerrarSesion()` (por ejemplo, backend caído) y comprobar que, aun así, la freelancer termina en la pantalla de acceso con un aviso no bloqueante, y que las vistas protegidas dejan de ser accesibles.

**Acceptance Scenarios**:

1. **Given** la freelancer tiene sesión iniciada y el backend no responde a la petición de cierre de sesión, **When** pulsa "Cerrar sesión", **Then** la aplicación limpia igualmente el estado local de sesión y la redirige a la pantalla de acceso.
2. **Given** el escenario anterior, **When** la redirección se completa, **Then** se muestra un aviso no bloqueante indicando que hubo un problema al cerrar sesión en el servidor, sin impedir que la freelancer siga usando la pantalla de acceso.

---

### Edge Cases

- Si la freelancer pulsa "Cerrar sesión" varias veces seguidas (doble clic o repetido mientras la petición está en curso), no deben dispararse varias peticiones de cierre de sesión en paralelo ni producirse comportamiento inconsistente.
- Si la freelancer no tiene conexión de red al pulsar "Cerrar sesión", el resultado debe ser el mismo que el fallo del backend: limpieza local, redirección al login y aviso no bloqueante.
- La pantalla de acceso (`/acceso`) no debe mostrar el control "Cerrar sesión", puesto que no aplica a un usuario que todavía no ha iniciado sesión.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar un control visible con el texto "Cerrar sesión" (o un icono con tooltip/etiqueta accesible equivalente) en la navegación principal, presente en todas las pantallas que requieren sesión autenticada.
- **FR-002**: Al activar el control, el sistema DEBE invocar la función `cerrarSesion()` ya existente en `frontend/src/api/auth.js`, sin duplicar ni reescribir su lógica interna.
- **FR-003**: Cuando `cerrarSesion()` se complete correctamente, el sistema DEBE limpiar cualquier estado local relacionado con la sesión y llevar a la freelancer a la pantalla de acceso.
- **FR-004**: Cuando `cerrarSesion()` falle (error de red o de servidor), el sistema DEBE limpiar igualmente el estado local relacionado con la sesión, llevar a la freelancer a la pantalla de acceso y mostrar un aviso no bloqueante informando del fallo.
- **FR-005**: Tras un cierre de sesión (correcto o con fallo), intentar acceder a una pantalla protegida visitada previamente —incluyendo mediante el botón "atrás" del navegador— DEBE resultar en una redirección a la pantalla de acceso, nunca en mostrar contenido protegido.
- **FR-006**: El control "Cerrar sesión" DEBE ser operable con teclado y tener un nombre accesible "Cerrar sesión" (como texto visible o como etiqueta accesible equivalente si es solo un icono).
- **FR-007**: Mientras la acción de cierre de sesión esté en curso, el sistema DEBE evitar que se disparen varias peticiones de cierre de sesión simultáneas por activaciones repetidas del control.
- **FR-008**: El control "Cerrar sesión" NO DEBE mostrarse en la pantalla de acceso.

### Key Entities

- **Sesión de acceso**: Representa que la freelancer está autenticada frente a la aplicación. No tiene atributos gestionados por el cliente más allá de existir o no; su fin (mediante `cerrarSesion()`) determina si las pantallas protegidas son accesibles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier pantalla autenticada, la freelancer puede cerrar sesión y llegar a la pantalla de acceso con una única acción (un clic o toque).
- **SC-002**: El 100% de los intentos de acceder a una pantalla protegida después de cerrar sesión —incluyendo mediante navegación "atrás" del navegador— terminan mostrando la pantalla de acceso, nunca contenido protegido.
- **SC-003**: El 100% de los cierres de sesión en los que el servidor no responde terminan igualmente en la pantalla de acceso, mostrando el aviso con el mismo estilo visual (color, contraste y tamaño) que ya usa la aplicación para el resto de mensajes de error, sin que la freelancer quede bloqueada o sin saber qué ha pasado.
- **SC-004**: El control "Cerrar sesión" es visible sin necesidad de hacer scroll ni de abrir ningún menú adicional, en el 100% de las pantallas autenticadas.

## Assumptions

- La barra de navegación principal —ya presente en todas las pantallas autenticadas y oculta solo en `/acceso`— es la ubicación adecuada para el control, ya que actualmente no existe ningún menú de usuario desplegable en la interfaz.
- La aplicación no guarda un token de autenticación en almacenamiento del navegador: la sesión se representa mediante una cookie firmada gestionada por el servidor. "Limpiar el estado local" se interpreta, por tanto, como reiniciar cualquier dato de navegación/sesión que sí gestiona el cliente (p. ej. la ruta guardada para volver tras el acceso) y forzar a la aplicación a su estado de no autenticada, no como borrar un token inexistente.
- Redirigir a la pantalla de acceso tras cerrar sesión puede apoyarse en el mismo patrón de recarga completa que ya usa la aplicación para llegar a `/acceso` (por ejemplo, tras un 401), ya que ese patrón garantiza que no queda estado en memoria de la sesión anterior.
- No se requiere un diálogo de confirmación ("¿Seguro que quieres cerrar sesión?") antes de cerrar sesión; el cierre ocurre en una sola acción, en línea con SC-001. Aunque la aplicación pueda usarse en un ordenador compartido, cerrar sesión es una acción de bajo riesgo y reversible (basta con volver a iniciar sesión con la clave de acceso), por lo que se prioriza la rapidez sobre la fricción de una confirmación adicional.
- "Aviso no bloqueante" significa un mensaje transitorio o descartable que no impide continuar usando la pantalla de acceso, no una alerta o modal que exija una acción para poder seguir.
- El cierre de sesión voluntario no se registra en el fichero de auditoría (`security.log`, decisión [004]): ese registro se reserva para accesos rechazados y cambios de datos, no para acciones explícitas de la propia usuaria ya autenticada.
- El aviso no bloqueante que se muestra cuando `cerrarSesion()` falla usa siempre un texto genérico fijo, sin incluir el mensaje de error técnico devuelto por el servidor o por la red (mismo criterio de no filtrar detalles técnicos ya aplicado en la spec 004).
- Esta feature no sincroniza el cierre de sesión entre varias pestañas abiertas a la vez: cada pestaña actúa sobre su propia cookie de sesión, igual que ya ocurre hoy con el resto de la aplicación.
- Si la cookie de sesión ya era inválida o había caducado en el momento de pulsar "Cerrar sesión", el resultado es el mismo que el flujo feliz (FR-003): `POST /api/auth/logout` no exige que la sesión sea válida para completarse, así que no hace falta ningún manejo especial para este caso.
- La redirección a la pantalla de acceso siempre implica una recarga completa de la página (igual que en el resto de la aplicación), por lo que ningún dato de una pantalla protegida (por ejemplo, líneas de un presupuesto en edición) permanece visible tras cerrar sesión.
- Si la petición de `cerrarSesion()` se queda colgada sin resolver ni fallar (por ejemplo, una conexión que ni responde ni se corta), esta feature no añade un temporizador propio: se confía en los límites de tiempo por defecto del navegador para las peticiones de red, sin construir un mecanismo de timeout adicional.
