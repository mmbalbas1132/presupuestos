# Feature Specification: PresupuestosPro v0

**Feature Branch**: `001-presupuestos-pro-v0`
**Created**: 2026-09-15
**Status**: Draft
**Input**: User description: "PresupuestosPro v0 — aplicación local para freelancers/diseñadoras que genera presupuestos profesionales con cálculo automático de base imponible, IVA y retención de IRPF, numeración automática y validez, exportables a PDF con la marca del freelancer."

## Clarifications

### Session 2026-09-15

- Q: Si la freelancer cierra la aplicación a mitad de crear un presupuesto (antes de generar el PDF), ¿qué pasa con ese trabajo? → A: El borrador se guarda automáticamente en local; al reabrir la app, la freelancer lo retoma donde lo dejó.
- Q: ¿Qué datos del cliente se recogen y aparecen en el presupuesto/PDF, más allá del nombre y el tipo? → A: Nombre, tipo y NIF son obligatorios para todo cliente (identificación completa, como en una factura).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un presupuesto correcto y descargarlo en PDF (Priority: P1)

Como freelancer, quiero elegir o dar de alta un cliente indicando su tipo (particular, empresa o autónomo), añadir líneas con cantidad y precio, ver cómo la aplicación calcula sola la base imponible, el IVA y la retención de IRPF cuando corresponda, y descargar el resultado en PDF con numeración automática y validez, para poder enviar un presupuesto correcto y profesional en pocos minutos sin errores de cálculo.

**Why this priority**: Es el corazón del problema que resuelve la aplicación (evitar errores de cálculo manual y perder tardes enteras con un Excel). Sin esto no hay producto: es el único flujo que, por sí solo, ya permite a la freelancer emitir un presupuesto fiable y enviarlo a un cliente.

**Independent Test**: Se puede probar de extremo a extremo sin catálogo de servicios ni marca configurada: dando de alta un cliente a mano, escribiendo líneas a mano, y comprobando que los cálculos y el PDF descargado son correctos. Ya entrega valor real (sustituye al Excel con calculadora).

**Acceptance Scenarios**:

1. **Given** un cliente de tipo empresa y tres líneas (1×450,00 €, 1×320,00 €, 2×85,00 €), **When** el freelancer genera el presupuesto con retención general, **Then** la aplicación muestra base imponible 940,00 €, IVA 197,40 €, retención 141,00 € y total 996,40 €.
2. **Given** el mismo presupuesto pero marcando al cliente como autónomo nuevo, **When** se genera, **Then** la retención es 65,80 € y el total 1.071,60 €.
3. **Given** el mismo presupuesto pero con un cliente particular, **When** se genera, **Then** la retención es 0,00 € y el total 1.137,40 €, incluso si por error se hubiera intentado marcar retención.
4. **Given** un presupuesto sin ninguna línea añadida, **When** el freelancer intenta descargar el PDF, **Then** la aplicación impide la descarga y avisa de que debe añadirse al menos una línea.
5. **Given** una línea en edición, **When** el freelancer introduce una cantidad o un precio negativo, **Then** la aplicación no permite guardar la línea y muestra un aviso.
6. **Given** que es el primer presupuesto generado en el año 2026, **When** se descarga su PDF, **Then** se numera 2026-001; el siguiente generado ese mismo año es 2026-002; el primero generado en 2027 es 2027-001.
7. **Given** cualquier presupuesto generado, **When** se visualiza o descarga, **Then** muestra una validez de 30 días desde su fecha de emisión.
8. **Given** un servicio escrito a mano que no existe en el catálogo, **When** se añade como línea, **Then** se incluye solo en ese presupuesto y no se guarda automáticamente en el catálogo.
9. **Given** un presupuesto ya numerado (PDF generado), **When** el freelancer quiere cambiar algo, **Then** la aplicación no permite editarlo ni eliminarlo; debe crear un presupuesto nuevo.
10. **Given** un cliente nuevo introducido al crear un presupuesto, **When** se guarda el presupuesto, **Then** ese cliente queda disponible para seleccionarlo directamente en presupuestos futuros.

---

### User Story 2 - Configurar la marca del freelancer (Priority: P2)

Como freelancer, quiero configurar una vez mi nombre, NIF, contacto y logo, para que aparezcan automáticamente en todos los presupuestos que genere, sin tener que volver a introducirlos cada vez.

**Why this priority**: Aporta la imagen profesional que el freelancer necesita frente al cliente, pero el cálculo correcto (US1) ya funciona sin ella; por eso es un complemento de valor, no el núcleo.

**Independent Test**: Se puede probar configurando los datos y el logo, generando después cualquier presupuesto, y comprobando que esos datos aparecen en pantalla y en el PDF sin volver a escribirlos.

**Acceptance Scenarios**:

1. **Given** que el freelancer configura su nombre, NIF, contacto y logo, **When** genera un nuevo presupuesto, **Then** esos datos y el logo aparecen automáticamente en el presupuesto y en su PDF.
2. **Given** que el freelancer aún no ha configurado un logo, **When** genera un PDF, **Then** el documento se genera igualmente mostrando sus datos de texto, sin un hueco roto donde iría el logo.

---

### User Story 3 - Gestionar un catálogo de servicios reutilizable (Priority: P3)

Como freelancer, quiero mantener una lista de mis servicios habituales con su precio, para añadir líneas a un presupuesto en segundos en lugar de escribir cada concepto y precio desde cero.

**Why this priority**: Acelera todavía más el proceso (el objetivo de menos de 5 minutos), pero no es imprescindible para emitir un presupuesto correcto, que ya es posible escribiendo líneas a mano con US1.

**Independent Test**: Se puede probar dando de alta servicios con nombre y precio, cerrando y reabriendo la aplicación para comprobar que persisten, y comprobando que al seleccionarlos en una línea rellenan nombre y precio automáticamente.

**Acceptance Scenarios**:

1. **Given** que el freelancer añade un servicio con nombre y precio habitual al catálogo, **When** cierra y vuelve a abrir la aplicación, **Then** el servicio sigue disponible.
2. **Given** un servicio existente en el catálogo, **When** el freelancer lo selecciona para una línea, **Then** se rellenan su nombre y precio, quedando editables antes de confirmar la línea.
3. **Given** una línea creada desde el catálogo con cantidad 2 y precio 85,00 €, **When** se añade al presupuesto, **Then** la base imponible aumenta en 170,00 €.

---

### Edge Cases

- Si el freelancer cambia el tipo de cliente (o la condición de "autónomo nuevo") después de haber añadido líneas pero antes de generar el PDF, la aplicación recalcula automáticamente la retención y el total.
- Si el freelancer vuelve a descargar el PDF de un presupuesto ya emitido, la aplicación entrega de nuevo el mismo documento con el mismo número, sin consumir un número nuevo ni duplicar el presupuesto.
- Si se introduce un cliente con el mismo nombre que uno ya guardado pero con datos distintos (por ejemplo, otro NIF), la aplicación lo trata como un cliente distinto en lugar de fusionarlo automáticamente con el existente.
- Si el freelancer abre la aplicación por primera vez sin datos de marca, sin logo y sin catálogo configurados, la aplicación permite igualmente crear un presupuesto introduciendo cliente y líneas a mano.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir configurar y persistir localmente los datos identificativos del freelancer (nombre, NIF, contacto y logo).
- **FR-002**: El sistema MUST mostrar los datos del freelancer y su logo en todo presupuesto generado y en su PDF, sin necesidad de volver a introducirlos.
- **FR-003**: El sistema MUST permitir gestionar (dar de alta, editar, eliminar) un catálogo de servicios con nombre y precio habitual, persistente entre sesiones.
- **FR-004**: El sistema MUST permitir, al crear un presupuesto, seleccionar un cliente ya guardado o introducir uno nuevo, indicando su nombre, su NIF y si es particular, empresa o autónomo.
- **FR-024**: El sistema MUST exigir nombre, NIF y tipo de cliente como campos obligatorios; MUST impedir guardar un cliente nuevo si falta alguno de ellos, mostrando un aviso.
- **FR-005**: El sistema MUST guardar automáticamente todo cliente nuevo introducido al crear un presupuesto, dejándolo disponible para seleccionarlo en presupuestos futuros.
- **FR-006**: El sistema MUST permitir añadir líneas al presupuesto eligiendo un servicio del catálogo o escribiéndolo manualmente, indicando cantidad y precio unitario.
- **FR-007**: Un servicio escrito manualmente que no exista en el catálogo MUST aplicarse únicamente a ese presupuesto, sin añadirse automáticamente al catálogo salvo que el freelancer lo indique de forma expresa.
- **FR-008**: El sistema MUST permitir editar, eliminar y reordenar las líneas de un presupuesto mientras este no tenga PDF generado (no esté numerado).
- **FR-025**: El sistema MUST guardar automáticamente el borrador de un presupuesto en curso (cliente, líneas y datos aún no numerados) de forma local, de modo que si la freelancer cierra la aplicación antes de generar el PDF, pueda reabrirla y retomar el borrador donde lo dejó.
- **FR-009**: El sistema MUST calcular automáticamente la base imponible como la suma de cantidad × precio unitario de todas las líneas del presupuesto.
- **FR-010**: El sistema MUST calcular automáticamente el IVA como el 21 % de la base imponible.
- **FR-011**: El sistema MUST calcular automáticamente la retención de IRPF al 15 % sobre la base imponible cuando el cliente sea empresa o autónomo no marcado como nuevo.
- **FR-012**: El sistema MUST calcular automáticamente la retención de IRPF al 7 % sobre la base imponible cuando el freelancer indique que el cliente autónomo es nuevo.
- **FR-013**: El sistema MUST fijar la retención en 0,00 € para clientes particulares, ignorando cualquier intento de aplicar retención sobre ellos.
- **FR-014**: El sistema MUST calcular y mostrar el total del presupuesto como base imponible + IVA − retención.
- **FR-015**: El sistema MUST impedir la generación del PDF cuando el presupuesto no tenga ninguna línea, avisando al freelancer de que debe añadir al menos una.
- **FR-016**: El sistema MUST impedir guardar una línea con cantidad o precio unitario negativo, mostrando un aviso al freelancer.
- **FR-017**: El sistema MUST asignar automáticamente, en el momento de generar el PDF, un número de presupuesto único con formato AAAA-NNN, reiniciando la secuencia NNN a 001 en cada año natural.
- **FR-018**: El sistema MUST mostrar en cada presupuesto una validez de 30 días contados desde su fecha de emisión (fecha de generación del PDF).
- **FR-019**: El sistema MUST permitir descargar el presupuesto en PDF incluyendo los datos del freelancer, el logo, el nombre, NIF y tipo del cliente, las líneas, la base imponible, el IVA, la retención cuando aplique, el total, el número y la validez.
- **FR-020**: Un presupuesto con número ya asignado (PDF generado) MUST tratarse como inmutable: no puede editarse ni eliminarse; cualquier cambio exige crear un presupuesto nuevo.
- **FR-021**: El sistema MUST conservar un historial consultable de todos los presupuestos generados, permitiendo volver a visualizarlos y redescargar su PDF en cualquier momento.
- **FR-022**: El sistema MUST expresar todos los importes en euros.
- **FR-023**: El sistema MUST recalcular automáticamente la base imponible, el IVA, la retención y el total cada vez que cambien las líneas, el tipo de cliente o la condición de "autónomo nuevo", mientras el presupuesto no esté numerado.

### Key Entities *(include if feature involves data)*

- **Perfil del freelancer**: datos identificativos únicos de la instalación — nombre, NIF, contacto y logo — usados como cabecera de marca en todos los presupuestos.
- **Cliente**: nombre, NIF (ambos obligatorios) y tipo (particular, empresa o autónomo); se guarda automáticamente al usarse por primera vez y queda disponible para presupuestos futuros. No incluye la condición de "autónomo nuevo" (ver Presupuesto) porque ese estatus puede caducar con el tiempo y no es un dato fijo del cliente (Assumptions).
- **Servicio (catálogo)**: nombre y precio habitual; reutilizable como línea rápida en cualquier presupuesto y persistente entre sesiones.
- **Presupuesto**: cliente asociado, condición de "autónomo nuevo" (solo si el cliente es autónomo; editable en cada presupuesto), fecha de emisión, validez (30 días), número (AAAA-NNN, asignado al generarse el PDF), conjunto de líneas, base imponible, IVA, retención aplicada, total y estado (borrador editable, guardado automáticamente en local / emitido e inmutable).
- **Línea de presupuesto**: descripción (de catálogo o manual), cantidad, precio unitario e importe (cantidad × precio unitario), perteneciente a un único presupuesto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una freelancer puede completar y descargar un presupuesto correcto en menos de 10 minutos desde que recibe la petición del cliente, y en menos de 5 minutos cuando ya tiene su marca, su cliente y su catálogo configurados de antes.
- **SC-002**: El 100 % de los presupuestos generados muestran base imponible, IVA, retención y total que coinciden exactamente con el cálculo de referencia (base = suma de líneas; IVA = 21 % de la base; retención = 15 %, 7 % o 0 % según el tipo de cliente; total = base + IVA − retención).
- **SC-003**: El 100 % de los números de presupuesto emitidos en un mismo año natural siguen la secuencia AAAA-NNN sin huecos ni repeticiones, y la numeración se reinicia correctamente en 001 al comenzar cada año.
- **SC-004**: El 100 % de los PDF descargados incluyen, sin pasos manuales adicionales, todos los campos obligatorios: marca del freelancer, logo (si existe), datos del cliente, líneas, base imponible, IVA, retención (si aplica), total, número y validez.
- **SC-005**: Un freelancer con cliente y servicios ya guardados puede añadir una línea completa (nombre y precio) seleccionándola de una lista, sin volver a escribir el nombre ni el precio del servicio.
- **SC-006**: Ningún presupuesto llega a generar PDF con líneas de cantidad o precio negativo, ni sin al menos una línea.

## Out of Scope

- Facturación electrónica o generación de facturas.
- Cuentas de usuario, contraseñas o inicio de sesión.
- Guardado en la nube, sincronización remota o almacenamiento fuera del ordenador de la freelancer.
- Envío automático de presupuestos por email (el envío lo realiza la freelancer manualmente).
- Soporte multi-divisa; la aplicación trabaja únicamente en euros.
- Gestión de cobros, pagos, contabilidad o seguimiento de facturas.
- Firma digital avanzada del PDF.
- Recordatorios automáticos al cliente.
- Plantillas múltiples de diseño para el PDF; v0 ofrece un único formato base con la marca de la freelancer.

## Assumptions

- **Aplicación local de un único usuario**: no hay cuentas, contraseñas ni sincronización remota (según "Fuera de alcance"); todos los datos (perfil, catálogo, clientes, historial de presupuestos) se guardan en el ordenador de la freelancer.
- **Persistencia de clientes** (aclarado con el usuario): todo cliente introducido al crear un presupuesto se guarda automáticamente y queda disponible para reutilizarse después, igual que el catálogo de servicios.
- **Momento de numeración** (aclarado con el usuario): el número AAAA-NNN se asigna únicamente al generar el PDF; un borrador sin PDF generado no consume número ni dejar huecos en la secuencia.
- **Historial de presupuestos** (aclarado con el usuario): la aplicación conserva un listado consultable de todos los presupuestos ya generados, con posibilidad de volver a descargarlos.
- **Inmutabilidad tras la emisión** (aclarado con el usuario): un presupuesto con PDF ya generado no puede editarse ni eliminarse; cualquier corrección implica crear un presupuesto nuevo.
- **IVA fijo**: el tipo de IVA del 21 % es fijo en v0 y no es editable por línea, servicio o cliente (no hay servicios exentos ni tipos reducidos en esta versión).
- **Presupuesto sin logo**: si el freelancer no ha configurado logo, el PDF se genera igualmente mostrando solo los datos de texto de su marca, sin dejar un hueco vacío.
- **Numeración no editable manualmente**: la numeración AAAA-NNN es siempre automática; no se ofrece una opción para corregirla o reasignarla a mano en v0.
- **Redondeo de importes**: todos los importes (línea, base imponible, IVA, retención y total) se calculan y muestran con dos decimales, usando redondeo estándar (al valor más cercano).
- **Fecha de emisión y validez**: la validez de 30 días se cuenta desde la fecha de generación del PDF (fecha de emisión), y el presupuesto muestra tanto la fecha de emisión como la fecha de validez/vencimiento resultante.
- **Estado inicial vacío**: la primera vez que se abre la aplicación sin datos de marca, catálogo ni clientes configurados, sigue siendo posible crear un presupuesto introduciendo cliente y líneas a mano; la aplicación no bloquea el flujo por falta de configuración previa.
- **Condición de "autónomo nuevo"**: se indica en el momento de crear o revisar el presupuesto (no es un dato fijo e inmutable del cliente), ya que ese estatus puede caducar con el tiempo; el freelancer puede corregirlo en cada presupuesto antes de generarlo.
- **Idioma**: la interfaz y el PDF se generan en español, en línea con la terminología fiscal española (IVA, IRPF, NIF) usada en toda la especificación.
- **Moneda única**: todos los importes se expresan en euros (€), sin conversión ni soporte multi-divisa.
