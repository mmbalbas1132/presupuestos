# Feature Specification: Seguridad y hardening de PresupuestosPro

**Feature Branch**: `004-seguridad-hardening`
**Created**: 2026-09-17
**Status**: Draft
**Input**: User description: "Seguridad y hardening para PresupuestosPro: la aplicación gestiona información sensible de clientes, presupuestos y del perfil del freelancer, y no dispone actualmente de protección adecuada para un uso seguro en producción (autenticación, autorización, gestión de secretos, validación de entradas, despliegue seguro, manejo de errores y auditoría)."

## Clarifications

### Session 2026-09-17

- Q: ¿La app la usa solo la freelancer o varios usuarios con permisos distintos? → A: Un único usuario. Se mantiene la decisión vigente de la constitución del proyecto ("sin login ni multi-tenencia"): no habrá modelo de roles ni permisos por usuario. "Autorización" en esta spec significa exclusivamente "acceso completo tras identificarse correctamente", no un sistema de permisos granular.
- Q: ¿Dónde se despliega la aplicación en producción? → A: Internet público. Por tanto, HTTPS y una política de CORS restringida se tratan como requisitos críticos, no opcionales.
- Q: Con un único usuario, ¿qué mecanismo de acceso protege la API? → A: Una clave/token único compartido (guardado como variable de entorno), en vez de login con usuario/contraseña o JWT. Es el mecanismo más simple que cumple el objetivo y es coherente con el principio de simplicidad de la constitución.
- Q: ¿Cómo se reenvía la clave de acceso en cada petición tras la primera vez? → A: Mediante una sesión de navegador (cookie) creada tras validar la clave correctamente una vez; el navegador la reenvía automáticamente en cada petición posterior, sin que la freelancer tenga que reintroducirla ni el frontend tenga que gestionarla manualmente.
- Q: ¿Cómo se consulta el registro de auditoría? → A: Mediante un archivo de log en el servidor, consultado directamente por quien administre el despliegue; esta spec no requiere construir una pantalla nueva dentro de la app para verlo.
- Q: ¿Debe la aplicación limitar los intentos repetidos de acceso con clave incorrecta? → A: Sí, mediante un límite de intentos fallidos por origen en una ventana de tiempo, bloqueando temporalmente los intentos posteriores desde ese origen al superarlo (rate limiting), sin necesitar intervención manual para liberar el bloqueo.
- Q: ¿Durante cuánto tiempo deben conservarse los eventos del registro de auditoría? → A: 90 días. Pasado ese plazo los eventos se descartan automáticamente, en línea con el principio de minimización de datos de la constitución del proyecto.
- Q: ¿Cuánto debe durar la sesión de navegador antes de expirar? → A: 7 días desde que se valida la clave, equilibrio entre comodidad para la freelancer y riesgo si un dispositivo se pierde o se comparte.
- Q: ¿Qué umbral y duración de bloqueo debe aplicarse ante intentos fallidos repetidos? → A: 5 intentos fallidos en 15 minutos desde el mismo origen activan un bloqueo de 15 minutos para ese origen.
- Q: Si la clave de acceso se ve comprometida, ¿cómo debe poder invalidarse? → A: Cambiando la variable de entorno con la nueva clave y reiniciando la aplicación; no se añade ninguna pantalla ni endpoint específico en la app para cambiarla, reutilizando el mismo mecanismo de configuración de FR-003.
- Q: Al rotar la clave de acceso comprometida, ¿deben invalidarse también las sesiones de navegador ya abiertas? → A: Sí. Reiniciar la aplicación tras rotar la clave invalida automáticamente todas las sesiones activas, forzando a volver a introducir la clave nueva; así la rotación cierra el acceso también a quien ya tuviera una sesión abierta sin conocer la clave (por ejemplo, tras robar una cookie).
- Q: ¿"Quien administre el despliegue" (Historia 6, Edge Cases) es siempre la propia freelancer, o puede ser un tercero técnico distinto? → A: Puede ser un tercero técnico (por ejemplo, quien ayuda con el hosting). Su acceso es al servidor/infraestructura de despliegue (variables de entorno, fichero de log), no un rol dentro de la aplicación: dentro de la app, sigue existiendo un único nivel de acceso (FR-013); esto no es una excepción a "sin roles", es una distinción entre acceso a la aplicación y acceso a la infraestructura donde corre.
- Q: ¿Qué debe usarse como "origen" a efectos de contar intentos fallidos (FR-015) y de registrar eventos de auditoría? → A: La dirección IP de la petición (la real, resuelta correctamente aunque haya un proxy inverso de por medio), sin combinarla con huella de navegador/dispositivo.
- Q: ¿La sesión de navegador se renueva mientras hay actividad, o expira siempre a los 7 días exactos desde que se creó? → A: Sesión deslizante: cada petición autenticada renueva el plazo de 7 días; la sesión solo expira tras 7 días consecutivos sin actividad.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La API rechaza cualquier acceso sin la clave correcta (Priority: P1)

Como freelancer, quiero que nadie pueda leer ni modificar mis clientes, presupuestos o datos de perfil sin conocer la clave de acceso de mi aplicación, para que si la URL de mi aplicación se hace pública o se filtra por error, mis datos sigan a salvo.

**Why this priority**: Es el requisito que evita el riesgo más grave (exposición total de datos personales y fiscales de clientes). Sin esto, cualquier otra medida de seguridad es secundaria: la app estaría abierta a cualquiera que conozca la URL.

**Independent Test**: Se puede probar de forma aislada intentando llamar a cualquier endpoint de la API sin clave, con una clave incorrecta y con la clave correcta, y comprobando que solo el tercer caso devuelve datos o realiza cambios.

**Acceptance Scenarios**:

1. **Given** la aplicación desplegada, **When** se solicita cualquier dato de clientes, presupuestos o perfil sin incluir la clave de acceso, **Then** la aplicación rechaza la petición y no devuelve ningún dato.
2. **Given** la aplicación desplegada, **When** se solicita un dato incluyendo una clave de acceso incorrecta, **Then** la aplicación rechaza la petición igual que si no se hubiera enviado clave.
3. **Given** la freelancer ha configurado su clave de acceso, **When** la introduce una vez en el navegador y la aplicación la valida, **Then** se abre una sesión de navegador que le permite consultar y modificar sus clientes, presupuestos y perfil en peticiones posteriores sin volver a introducir la clave.
4. **Given** un intento de acceso sin clave o con clave incorrecta, **When** ocurre, **Then** queda registrado como evento de seguridad (ver Historia 6).
5. **Given** una sesión de navegador abierta tras validar la clave, **When** pasan 7 días consecutivos sin actividad o la sesión se cierra, **Then** la aplicación vuelve a exigir la clave de acceso antes de permitir cualquier consulta o cambio.
6. **Given** una sesión de navegador abierta, **When** la freelancer sigue usando la aplicación con normalidad (al menos una petición autenticada) antes de que se cumplan los 7 días de inactividad, **Then** la sesión se renueva y no se le vuelve a pedir la clave.
7. **Given** 5 intentos fallidos de acceso con clave incorrecta desde la misma dirección IP en 15 minutos, **When** se produce el quinto intento, **Then** la aplicación bloquea temporalmente los intentos posteriores desde esa dirección IP durante 15 minutos, liberando el bloqueo automáticamente al finalizar ese periodo.

---

### User Story 2 - La aplicación solo se sirve de forma cifrada y desde orígenes autorizados (Priority: P1)

Como freelancer, quiero que mi aplicación, al estar expuesta en internet, solo se pueda usar mediante una conexión cifrada y que ninguna otra web pueda hacer peticiones a mi API en mi nombre, para que mis datos y mi clave de acceso no viajen expuestos ni puedan ser usados desde sitios no autorizados.

**Why this priority**: Al desplegarse en internet público, una conexión sin cifrar expondría la clave de acceso y los datos de clientes a cualquiera que intercepte el tráfico; es tan crítico como la propia autenticación.

**Independent Test**: Se puede probar intentando acceder a la aplicación por una conexión no cifrada y comprobando que se bloquea o redirige, y haciendo una petición a la API simulando un origen web distinto al autorizado, comprobando que se rechaza.

**Acceptance Scenarios**:

1. **Given** la aplicación desplegada en producción, **When** se intenta acceder por una conexión no cifrada, **Then** la aplicación bloquea el acceso o lo redirige automáticamente a la conexión cifrada.
2. **Given** la aplicación desplegada en producción, **When** una página web de un origen no autorizado intenta hacer una petición a la API, **Then** la petición es rechazada.
3. **Given** la freelancer accede desde el dominio autorizado de su aplicación, **When** usa la app con conexión cifrada, **Then** todo funciona con normalidad.
4. **Given** una petición a la API que no incluye ninguna cabecera de origen web identificable (por ejemplo, una herramienta técnica en vez de un navegador), **When** se envía junto con una clave de acceso válida, **Then** la restricción de origen no la bloquea (solo se aplica cuando esa cabecera está presente) y la petición se procesa con normalidad.

---

### User Story 3 - Los secretos de configuración nunca viajan en el código (Priority: P2)

Como desarrollador del proyecto, quiero que la clave de acceso y cualquier otro dato sensible de configuración se definan fuera del código fuente, para que nunca queden expuestos en el repositorio ni se filtren al compartir o publicar el código.

**Why this priority**: Sin esto, cualquier persona con acceso al repositorio (incluido un repositorio público futuro) podría obtener la clave de acceso y saltarse por completo la protección de la Historia 1.

**Independent Test**: Se puede comprobar revisando el repositorio y confirmando que no contiene ningún secreto real, que existe un archivo de ejemplo de configuración sin valores reales, y que la aplicación arranca correctamente leyendo los valores reales desde el entorno de despliegue.

**Acceptance Scenarios**:

1. **Given** el repositorio del proyecto, **When** se revisa su contenido, **Then** no aparece ninguna clave, contraseña ni secreto con valor real.
2. **Given** una persona nueva que clona el repositorio, **When** busca cómo configurar la aplicación, **Then** encuentra un archivo de ejemplo con los nombres de las variables de configuración necesarias, sin valores reales.
3. **Given** la aplicación desplegada, **When** arranca, **Then** toma la clave de acceso y demás configuración sensible del entorno de despliegue, no de un archivo incluido en el código.

---

### User Story 4 - Las entradas del usuario se validan y se sanean antes de guardarse o mostrarse (Priority: P2)

Como freelancer, quiero que la aplicación rechace datos incompletos o con formato incorrecto al crear un cliente, un presupuesto o mi perfil, y que cualquier texto que yo introduzca se muestre siempre como texto y nunca se ejecute como código, para evitar errores en mis presupuestos y proteger la aplicación frente a manipulaciones.

**Why this priority**: Los datos mal formados generan presupuestos incorrectos (impacto directo en el negocio de la freelancer) y las entradas sin sanear son la vía más común de ataque (XSS, inyección) en una aplicación web.

**Independent Test**: Se puede probar enviando formularios con campos obligatorios vacíos, con formatos inválidos (por ejemplo, un NIF con formato incorrecto) y con contenido que incluya código (por ejemplo, etiquetas de script en el nombre de un cliente), comprobando en cada caso que la aplicación rechaza el dato inválido o lo muestra como texto plano inofensivo.

**Acceptance Scenarios**:

1. **Given** el formulario de alta de cliente, presupuesto o perfil, **When** se envía dejando vacío un campo obligatorio, **Then** la aplicación rechaza el envío y explica qué campo falta.
2. **Given** el mismo formulario, **When** se envía un NIF que no cumple el formato NIF/NIE/CIF español (ver `data-model.md` → regla de `nif`), **Then** la aplicación rechaza el envío y explica el problema.
3. **Given** un cliente o presupuesto guardado con un texto que incluye código o marcado (por ejemplo, `<script>`), **When** ese texto se muestra en pantalla o en el PDF, **Then** aparece como texto literal y no se ejecuta ni altera la página.
4. **Given** cualquier dato de entrada, **When** se guarda en la base de datos, **Then** se hace de forma que el propio contenido del dato no puede alterar la operación de guardado prevista.

---

### User Story 5 - Los errores internos no revelan información técnica (Priority: P3)

Como freelancer, quiero que si algo falla internamente en la aplicación, vea un mensaje claro y comprensible en vez de un mensaje técnico, para no confundirme ni exponer sin querer detalles internos si comparto una captura de pantalla del error.

**Why this priority**: Un mensaje técnico filtrado (ruta de archivos, consulta a base de datos, versión de librería) facilita a un atacante encontrar otras debilidades, y además genera mala experiencia para una usuaria no técnica.

**Independent Test**: Se puede provocar deliberadamente un error interno (por ejemplo, un dato inesperado que rompa un cálculo) y comprobar que la respuesta que ve la usuaria es un mensaje genérico, mientras que el detalle técnico queda disponible solo en un registro interno.

**Acceptance Scenarios**:

1. **Given** se produce un error interno inesperado, **When** la freelancer ve el resultado en pantalla, **Then** ve un mensaje genérico y comprensible, sin trazas técnicas ni nombres de archivos o funciones internas.
2. **Given** el mismo error, **When** se revisa el registro interno del sistema, **Then** el detalle técnico completo queda disponible ahí para quien mantenga la aplicación.

---

### User Story 6 - Los eventos de seguridad quedan registrados (Priority: P3)

Como freelancer (o quien administre técnicamente la aplicación en su nombre), quiero poder consultar, en un archivo de log del servidor, un registro de los accesos rechazados y de los cambios realizados sobre clientes, presupuestos y perfil, para poder detectar un uso indebido de la aplicación si llegara a ocurrir.

**Why this priority**: Sin registro, un acceso indebido o un abuso de la API pasaría completamente desapercibido; con las Historias 1 y 2 ya activas, este registro es el complemento necesario para poder reaccionar si algo falla.

**Independent Test**: Se puede probar provocando un acceso rechazado y una modificación de un cliente o presupuesto, y comprobando después que ambos eventos aparecen en el archivo de log del servidor con fecha, hora y detalle suficiente para entender qué ocurrió. No requiere ninguna pantalla nueva dentro de la aplicación.

**Acceptance Scenarios**:

1. **Given** un intento de acceso a la API sin clave o con clave incorrecta, **When** ocurre, **Then** queda registrado con fecha, hora y el recurso al que se intentó acceder.
2. **Given** una creación, modificación o borrado de un cliente, presupuesto o del perfil, **When** ocurre, **Then** queda registrado con fecha, hora y qué se cambió.
3. **Given** un error interno crítico, **When** ocurre, **Then** queda registrado con fecha, hora y contexto suficiente para diagnosticarlo.

---

### Edge Cases

- ¿Qué ocurre si la freelancer olvida o pierde su clave de acceso? La aplicación debe permitir a quien administre el despliegue (la propia freelancer o quien la ayude técnicamente) definir una nueva clave desde la configuración del entorno, sin necesidad de modificar código.
- ¿Qué ocurre si la clave de acceso se ve comprometida (por ejemplo, se filtra o se pierde un dispositivo)? Quien administre el despliegue cambia la clave en la configuración del entorno y reinicia la aplicación; no existe una pantalla o funcionalidad dentro de la app dedicada a este cambio. Ese reinicio invalida también cualquier sesión de navegador que estuviera abierta con la clave anterior, incluida la de un posible atacante que hubiera robado una sesión sin conocer la clave.
- ¿Qué ocurre si se accede a la aplicación temporalmente desde una red local antes de exponerla en internet? Las mismas reglas de autenticación y validación aplican siempre, independientemente del entorno de red desde el que se acceda.
- ¿Qué ocurre si una entrada supera un tamaño razonable (por ejemplo, un texto extremadamente largo pegado en un campo)? La aplicación debe rechazarla igual que cualquier otro formato inválido, en vez de aceptarla sin límite.
- ¿Qué ocurre si el propio sistema de registro de eventos falla (por ejemplo, no se puede escribir el log)? La operación original (guardar un cliente, rechazar un acceso) debe completarse igualmente; el fallo de registro no debe bloquear el uso normal de la aplicación, pero sí debe imprimirse en la salida de error estándar del proceso (consola/logs del propio proceso backend), como mínimo, para que quien mantenga el sistema pueda detectarlo.
- ¿Qué ocurre con peticiones a la API que no incluyen una cabecera de origen web identificable (por ejemplo, herramientas técnicas de prueba en vez de un navegador)? Deben seguir exigiendo la clave de acceso válida; la restricción de origen web (CORS) es una protección adicional para navegadores, no un sustituto de la autenticación. Esto es independiente de la dirección IP, que siempre puede determinarse a nivel de red y se usa para el límite de intentos fallidos.
- ¿Qué ocurre si se superan los 5 intentos fallidos de acceso en 15 minutos desde una misma dirección IP? La aplicación bloquea temporalmente los intentos posteriores desde esa dirección IP durante 15 minutos, liberando el bloqueo automáticamente al pasar ese tiempo, sin necesitar intervención manual. Si la propia freelancer se bloquea a sí misma por error, no existe otra vía de desbloqueo inmediato: debe esperar los 15 minutos (reiniciar la aplicación también libera el bloqueo, al ser un contador temporal).
- ¿Qué ocurre si el propio sistema de registro de purga del registro de auditoría (a los 90 días, FR-016) falla o no llega a ejecutarse durante un tiempo? Los eventos antiguos permanecen almacenados hasta la siguiente vez que la purga se ejecute con éxito (al reiniciar la aplicación o en su siguiente ejecución diaria); esto no afecta al funcionamiento normal de la aplicación, solo retrasa la limpieza.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE exigir una clave de acceso válida —enviada directamente o representada por una sesión de navegador creada tras validarla— en toda petición a la API antes de devolver o modificar cualquier dato de clientes, presupuestos o perfil.
- **FR-002**: El sistema DEBE rechazar cualquier petición a la API que no incluya una clave de acceso, o que la incluya incorrecta, sin distinguir entre endpoints.
- **FR-003**: El sistema DEBE permitir configurar la clave de acceso exclusivamente mediante la configuración del entorno de despliegue, nunca mediante un valor incluido en el código fuente. La clave configurada DEBE tener una longitud mínima de 16 caracteres; el sistema DEBE impedir el arranque en producción si la clave configurada es más corta, avisando del motivo.
- **FR-004**: El repositorio del proyecto DEBE incluir un archivo de ejemplo de configuración con los nombres de las variables necesarias y sin valores reales, y DEBE excluir de forma permanente cualquier archivo que contenga secretos reales.
- **FR-005**: El sistema DEBE validar que los campos obligatorios de clientes, presupuestos y perfil del freelancer estén presentes y tengan un formato correcto antes de guardarlos, rechazando la operación con un mensaje claro en caso contrario (las reglas concretas de formato y longitud por campo se detallan en `data-model.md` → "Cambios en entidades existentes").
- **FR-006**: El sistema DEBE tratar como texto plano, nunca como código ejecutable, cualquier contenido textual introducido por la usuaria que se muestre posteriormente en pantalla o se incluya en el PDF generado. El contenido no textual (por ejemplo, el logo del perfil) se rige por su propia regla de formato en vez de esta (ver `data-model.md` → regla de `logo`).
- **FR-007**: El sistema DEBE construir sus operaciones de acceso a la base de datos de forma que el contenido de los datos de entrada no pueda alterar la operación prevista (sin concatenación insegura de sentencias con datos de entrada).
- **FR-008**: Cuando ocurra un error interno inesperado, el sistema DEBE mostrar a la usuaria un mensaje genérico y comprensible, sin detalles técnicos, trazas ni referencias a la implementación interna.
- **FR-009**: El sistema DEBE registrar en un registro interno, no visible para la usuaria final, cada error interno con fecha, hora y contexto suficiente para diagnosticarlo.
- **FR-010**: El sistema DEBE registrar en un registro interno cada intento de acceso rechazado por autenticación inválida o ausente, y cada creación, modificación o borrado de un cliente, presupuesto o del perfil, en todos los casos con fecha y hora.
- **FR-011**: En el entorno de producción, el sistema DEBE ser accesible únicamente mediante conexiones cifradas, bloqueando o redirigiendo cualquier intento de acceso sin cifrar.
- **FR-012**: En el entorno de producción, el sistema DEBE restringir las peticiones entre orígenes distintos al dominio o dominios autorizados por la freelancer, rechazando las que provengan de cualquier otro origen.
- **FR-013**: El sistema NO DEBE implementar un modelo de roles o permisos por usuario; toda petición autenticada con la clave de acceso válida tiene el mismo nivel de acceso completo, coherente con el uso por una única freelancer. Esto aplica exclusivamente al acceso dentro de la aplicación: no contradice que exista, fuera de la aplicación, alguien con acceso a la infraestructura de despliegue (servidor, variables de entorno, fichero de log) distinto de la propia freelancer.
- **FR-014**: El sistema DEBE abrir una sesión de navegador tras validar correctamente la clave de acceso, de forma que las peticiones posteriores dentro de esa sesión no requieran reenviar la clave manualmente. La sesión DEBE renovarse (sesión deslizante) con cada petición autenticada, y el sistema DEBE volver a exigir la clave cuando la sesión acumule 7 días consecutivos sin actividad, o se cierre.
- **FR-015**: El sistema DEBE bloquear temporalmente, durante 15 minutos, los intentos de acceso posteriores desde una misma dirección IP tras registrar 5 intentos fallidos consecutivos de esa dirección IP en una ventana de 15 minutos, liberando el bloqueo automáticamente al finalizar ese periodo sin intervención manual.
- **FR-016**: El sistema DEBE descartar automáticamente los eventos del registro de auditoría con más de 90 días de antigüedad, sin requerir una acción manual de limpieza.
- **FR-017**: El sistema DEBE permitir invalidar una clave de acceso comprometida cambiando su valor en la configuración del entorno y reiniciando la aplicación, sin requerir cambios de código ni una funcionalidad dedicada dentro de la aplicación para ello. Ese reinicio DEBE invalidar también todas las sesiones de navegador abiertas previamente, de forma que solo se pueda volver a acceder introduciendo la clave nueva.

### Key Entities *(include if feature involves data)*

- **Clave de acceso**: credencial única y compartida que protege el conjunto de la API; se configura fuera del código y se valida en cada petición.
- **Sesión de acceso**: prueba de que la clave ya se validó una vez, mantenida por el navegador; se renueva mientras hay actividad y expira tras 7 días consecutivos sin uso, o al rotar la clave de acceso (FR-014, FR-017).
- **Límite de intentos fallidos**: contador temporal de intentos de acceso incorrectos por origen, usado para bloquear temporalmente nuevos intentos tras superar el umbral (FR-015); no persiste más allá de lo necesario para aplicar ese bloqueo.
- **Evento de registro de seguridad/auditoría**: hecho registrado internamente con fecha, hora, tipo (acceso rechazado, cambio de dato, error interno) y contexto suficiente para entender qué ocurrió; no visible desde la interfaz normal de la usuaria final.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las peticiones a la API sin clave de acceso válida (ni de forma directa ni mediante una sesión ya validada) son rechazadas sin devolver ningún dato de clientes, presupuestos o perfil.
- **SC-002**: Una revisión del repositorio (incluyendo su historial de commits) no encuentra ningún valor asignado a `ACCESS_KEY` u otra variable de configuración sensible que no sea un marcador de ejemplo (p. ej. vacío o `cambia-esto`); existe un archivo de ejemplo de configuración documentado.
- **SC-003**: El 100% de los envíos de formularios con campos obligatorios vacíos o con formato inválido son rechazados antes de guardarse, con un mensaje que identifica el problema.
- **SC-004**: Ningún contenido introducido por la usuaria se ejecuta como código al mostrarse en pantalla o en el PDF, verificado probando con contenido que incluya marcado o código.
- **SC-005**: Ante un fallo interno provocado deliberadamente, la usuaria ve siempre un mensaje genérico, nunca un mensaje técnico o una traza de error.
- **SC-006**: Todo intento de acceso no autenticado y todo cambio sobre clientes, presupuestos o perfil queda disponible en el registro interno en menos de 1 minuto desde que ocurre.
- **SC-007**: La aplicación desplegada en producción no es accesible mediante una conexión sin cifrar: todo intento se bloquea o se redirige a la versión cifrada.
- **SC-008**: Una petición a la API realizada desde un origen web no autorizado es rechazada en el 100% de los casos.
- **SC-009**: Tras el quinto intento fallido de acceso en 15 minutos desde una misma dirección IP, el 100% de los intentos adicionales desde esa dirección IP se rechazan automáticamente durante los siguientes 15 minutos, sin acción manual.
- **SC-010**: Ningún evento del registro de auditoría con más de 90 días de antigüedad permanece almacenado, verificado revisando el contenido del registro.
- **SC-011**: Tras rotar la clave de acceso y reiniciar la aplicación, el 100% de las sesiones de navegador abiertas con la clave anterior dejan de dar acceso, exigiendo de nuevo la clave (la nueva) antes de permitir cualquier consulta o cambio.

## Assumptions

- La aplicación la usa una única freelancer, sin multi-tenencia ni roles diferenciados, en línea con la decisión ya vigente en la constitución del proyecto; por eso esta spec no incluye un sistema de permisos granular, solo protección de acceso.
- La aplicación se desplegará expuesta en internet público, por lo que el cifrado de la conexión y la restricción de orígenes (CORS) se tratan como requisitos críticos de esta spec, no como mejoras opcionales de despliegue.
- El mecanismo de acceso es una única clave/token compartido, guardado como variable de entorno; no se implementa un formulario de login con usuario y contraseña ni un sistema de tokens JWT con expiración/refresco, por ser complejidad no justificada para un único usuario.
- SQLite se mantiene como motor de base de datos en producción; esta spec no plantea una migración de base de datos, se centra en proteger el acceso y el uso correcto de los datos que ya existen.
- El registro de eventos de seguridad y auditoría se guarda de forma local, en un archivo de log en el propio servidor, consultado directamente por quien administre el despliegue; no se requiere integrar un sistema de logging centralizado externo ni construir una pantalla nueva dentro de la app para verlo.
- Proveer el certificado y la terminación TLS puede resolverse desde la infraestructura de despliegue (por ejemplo, la plataforma de hosting o un proxy inverso) en lugar de código propio de la aplicación, siempre que el resultado observable sea que la aplicación solo es accesible por HTTPS. Esa misma infraestructura debe entregar de forma fiable la dirección IP real de quien hace la petición (por ejemplo, mediante la cabecera estándar que use el proxy), ya que el límite de intentos fallidos (FR-015) depende de esa IP.
- Los cambios sobre el catálogo de servicios y el contador anual no se consideran datos sensibles a efectos del registro de auditoría (FR-010); solo se registran los cambios sobre clientes, presupuestos y perfil, que son los datos personales y fiscales que motivan esta spec.
- Se asume un único dominio autorizado por despliegue (configurado como el origen permitido de FR-012); soportar varios orígenes autorizados simultáneamente queda fuera de alcance de esta spec.
- El "entorno de producción" al que se refieren FR-011 y FR-012 es aquel en el que se configura explícitamente el despliegue expuesto a internet (activando el cifrado obligatorio y el origen autorizado); un entorno de desarrollo local, al no activar esa configuración, no está sujeto a esas dos reglas.
- Quedan fuera de alcance de esta spec: el cumplimiento de normativa de protección de datos (RGPD/LOPD u otra), la gestión de múltiples usuarios o cuentas, y cualquier funcionalidad dentro de la propia aplicación para cambiar la clave de acceso (se cambia siempre desde la configuración del entorno, FR-003/FR-017). Esta spec se limita a las medidas técnicas de seguridad de acceso, validación y registro descritas aquí.
- La freelancer puede tener varias sesiones de navegador abiertas a la vez (por ejemplo, en el ordenador y en el móvil); no hay límite al número de sesiones simultáneas, ya que cada una se valida de forma independiente con la misma clave de acceso.
- Se asume que el reloj del servidor está correctamente sincronizado (por ejemplo, mediante NTP), como es habitual en cualquier entorno de despliegue; un desajuste manual del reloj del servidor que afecte a la expiración de sesiones o a la ventana de bloqueo de intentos queda fuera de alcance de esta spec.
- Como la sesión de acceso es autocontenida (no depende de un estado guardado en el servidor), un reinicio del backend que no cambie la clave de acceso no invalida las sesiones ya abiertas; solo las invalida rotar la clave (FR-017).
