# Especificación: PresupuestosPro v0

## 1. Objetivo y contexto de negocio

PresupuestosPro resuelve el problema de la freelancer que pierde tardes enteras haciendo presupuestos con un Excel viejo, copiando conceptos, calculando el IVA con el móvil y con un resultado poco profesional. La herramienta importa porque permite emitir presupuestos correctos, con imagen de marca y sin errores de cálculo, en muy poco tiempo. En la vida real, la freelancer recibe la petición de precio de un cliente, abre la aplicación, elige el cliente, añade líneas desde su catálogo o a mano, revisa los cálculos automáticos y descarga un PDF listo para enviar por email. Escena concreta: una clienta le escribe por WhatsApp pidiendo presupuesto para un logotipo y unas tarjetas; la freelancer lo tiene terminado y enviado en menos de 10 minutos. Medida de éxito: emitir un presupuesto correcto en menos de 10 minutos, idealmente en 5.

## 2. Usuarios

- **Freelancer / diseñadora:** usa la aplicación para configurar sus datos, su logo, su catálogo de servicios y para crear presupuestos. Sabe usar herramientas ofimáticas básicas, pero no quiere complicaciones técnicas ni fiscales. Necesita rapidez y que los cálculos salgan bien.
- **Cliente destinatario:** recibe el PDF por email y no usa la aplicación nunca. Puede ser particular, empresa o autónomo. De su tipo depende una regla de negocio completa: si es empresa o autónomo se le aplica retención de IRPF; si es particular, no se le retiene nunca. No necesita saber nada del funcionamiento interno de la app.

## 3. Escenarios de usuario (historias)

- HU1 — Como freelancer, quiero configurar mi nombre, NIF, contacto y logo, para que mis presupuestos salgan con mi marca sin tener que ponerla cada vez.
- HU2 — Como freelancer, quiero tener una lista de mis servicios con su precio habitual, para añadir líneas rápido sin reescribir precios.
- HU3 — Como freelancer, quiero elegir o escribir el cliente y su tipo (particular, empresa o autónomo), para que la aplicación aplique o no la retención de IRPF.
- HU4 — Como freelancer, quiero añadir líneas al presupuesto con cantidad y precio, eligiendo de mi catálogo o escribiéndolas a mano, para adaptar cada presupuesto sin empezar de cero.
- HU5 — Como freelancer, quiero que la aplicación calcule sola la base imponible, el IVA, la retención y el total, para no equivocarme con cálculos manuales.
- HU6 — Como freelancer, quiero descargar el presupuesto en PDF con mi marca, numeración automática y validez, para enviarlo yo por email y que se vea profesional.

## 4. Requisitos funcionales

- RF1. El freelancer debe poder configurar y guardar sus datos identificativos: nombre, NIF, contacto y logo; esos datos deben aparecer en los presupuestos que genere.
- RF2. El freelancer debe poder gestionar un catálogo de servicios con nombre y precio habitual; los servicios deben seguir disponibles al volver a abrir la aplicación.
- RF3. Al crear un presupuesto, el freelancer debe poder seleccionar un cliente existente o introducir uno nuevo, indicando si es particular, empresa o autónomo.
- RF4. El freelancer debe poder añadir líneas al presupuesto eligiendo servicios del catálogo o escribiéndolos manualmente, indicando cantidad y precio unitario.
- RF5. El freelancer debe poder editar, eliminar o reordenar líneas antes de generar el PDF.
- RF6. La aplicación debe calcular automáticamente la base imponible como suma de cantidad × precio unitario de todas las líneas.
- RF7. La aplicación debe calcular automáticamente el IVA al 21 % sobre la base imponible.
- RF8. La aplicación debe calcular automáticamente la retención de IRPF cuando el cliente sea empresa o autónomo: 15 % general o 7 % para nuevo autónomo; si el cliente es particular, no debe aplicar retención. El freelancer debe poder indicar si el autónomo es nuevo.
- RF9. La aplicación debe mostrar el total del presupuesto como base imponible + IVA − retención.
- RF10. La aplicación debe asignar automáticamente un número de presupuesto con formato AAAA-NNN, reiniciando la secuencia cada año natural.
- RF11. La aplicación debe mostrar una validez de 30 días en cada presupuesto.
- RF12. El freelancer debe poder descargar el presupuesto en PDF con sus datos, logo, datos del cliente, líneas, base imponible, IVA, retención cuando aplique, total, número y validez.

## 5. Reglas de negocio (con ejemplos)

- RN1. El IVA de los servicios es siempre el 21 % sobre la base imponible.
- RN2. La retención de IRPF es del 15 % general para empresas o autónomos, o del 7 % para nuevos autónomos. A un cliente particular no se le retiene nunca.
- RN3. El total se calcula como: base imponible + IVA − retención.
- RN4. La numeración de presupuestos sigue el formato AAAA-NNN y se reinicia cada año: 2026-001, 2026-002… y en 2027 vuelve a 2027-001.
- RN5. Cada presupuesto indica una validez de 30 días.
- RN6. Todos los importes se expresan en euros.

**Ejemplo completo de presupuesto:**

Presupuesto n.º 2026-001  
Cliente: Empresa XYZ (empresa) → retención del 15 %

Líneas:
1. Diseño de logotipo: 1 × 450,00 € = 450,00 €
2. Manual de marca: 1 × 320,00 € = 320,00 €
3. Tarjetas de visita: 2 × 85,00 € = 170,00 €

Cálculos:
- Base imponible = 450,00 + 320,00 + 170,00 = **940,00 €**
- IVA 21 % = 940,00 × 0,21 = **197,40 €**
- Retención IRPF 15 % = 940,00 × 0,15 = **141,00 €**
- Total = 940,00 + 197,40 − 141,00 = **996,40 €**

El mismo presupuesto:
- (a) Con retención del 7 %: retención = 940,00 × 0,07 = 65,80 €; total = 940,00 + 197,40 − 65,80 = **1.071,60 €**
- (b) Para un cliente particular: retención = 0,00 €; total = 940,00 + 197,40 − 0,00 = **1.137,40 €**

Comprobación rápida: con base 1.000,00 €, IVA 21 % y retención 15 %, el total es 1.060,00 €.

## 6. Criterios de aceptación (verificables sin código)

- CA1. Al configurar nombre, NIF, contacto y logo, el siguiente presupuesto generado muestra esos datos y el logo.
- CA2. Con el presupuesto de ejemplo de la sección 5 y retención del 15 %, la aplicación muestra base 940,00 €, IVA 197,40 €, retención 141,00 € y total 996,40 €.
- CA3. Con el mismo ejemplo y retención del 7 %, la aplicación muestra total 1.071,60 €.
- CA4. Con el mismo ejemplo y cliente particular, la aplicación muestra retención 0,00 € y total 1.137,40 €.
- CA5. El primer presupuesto de 2026 se numera 2026-001; el siguiente 2026-002; el primer presupuesto de 2027 se numera 2027-001.
- CA6. Todo presupuesto muestra una validez de 30 días.
- CA7. Al añadir una línea con cantidad 2 y precio 85,00 €, la base imponible aumenta en 170,00 €.
- CA8. El PDF descargado incluye datos del freelancer, logo, datos del cliente, líneas, base imponible, IVA, retención si aplica, total, número y validez.

## 7. Casos límite

- CL1. ¿Qué pasa si el presupuesto no tiene ninguna línea? Respuesta: la aplicación impide generar el PDF y avisa de que debe añadirse al menos una línea.
- CL2. ¿Qué pasa si el freelancer escribe un servicio que no está en el catálogo? Respuesta: se añade solo a ese presupuesto; no se guarda automáticamente en el catálogo salvo que el freelancer lo indique.
- CL3. ¿Qué pasa si a un cliente particular se le marca retención por error? Respuesta: la aplicación ignora la retención y muestra 0,00 €; a un particular no se le puede aplicar retención.
- CL4. ¿Qué pasa si se introduce una cantidad o un precio negativo? Respuesta: la aplicación no permite guardar la línea y muestra un aviso.

## 8. Fuera de alcance

Esta versión v0 NO incluye:

- Facturación electrónica ni generación de facturas.
- Cuentas de usuario, contraseñas, inicio de sesión.
- Guardado en la nube, sincronización remota o almacenamiento fuera del ordenador de la freelancer.
- Envío automático de presupuestos por email; el email lo manda la freelancer.
- Multi-divisa; solo se trabaja en euros.
- Gestión de cobros, pagos, contabilidad o seguimiento de facturas.
- Firma digital avanzada del PDF.
- Recordatorios automáticos al cliente (idea que suena bien, pero queda fuera de la v0).
- Plantillas múltiples de diseño para el PDF; en v0 hay un formato base con la marca de la freelancer.

## 9. Preguntas abiertas

- PA1. ¿El IVA es siempre fijo del 21 % o debe poder editarse para algún servicio o cliente concreto?
- PA2. ¿Qué debe aparecer en el PDF si no hay logo configurado: un espacio en blanco, el nombre de la freelancer o un aviso?
- PA3. ¿La numeración automática se puede corregir manualmente si hay un error, o debe ser siempre automática e intocable?
- PA4. ¿Cómo se redondean exactamente los importes? ¿A dos decimales por línea, por base, por IVA? ¿Redondeo al alza, a la baja o estándar?
- PA5. ¿La validez de 30 días se cuenta desde la fecha de emisión o desde el envío? ¿Debe mostrarse fecha de emisión y fecha de vencimiento?
- PA6. ¿Qué se ve la primera vez que se abre la aplicación si aún no hay datos configurados, ni logo, ni servicios en el catálogo?