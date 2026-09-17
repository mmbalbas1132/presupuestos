# Quickstart: comprobar PresupuestosPro v0 como una freelancer

**Feature**: PresupuestosPro v0

Esta guía permite comprobar que la aplicación funciona simplemente usándola,
sin abrir código, logs ni consola (constitution — Principio IV). Sigue los
pasos en orden; cada paso indica qué deberías ver.

## 0. Antes de configurar nada

1. Abre la aplicación por primera vez, sin haber configurado datos, logo ni
   catálogo.
2. Deberías poder empezar igualmente un presupuesto nuevo, introduciendo un
   cliente y una línea a mano. *(Edge Case, FR-004/FR-006)*

## 1. Configura tu marca

1. Ve a la configuración del freelancer e introduce nombre, NIF, contacto y
   (opcionalmente) un logo.
2. Crea un presupuesto cualquiera.
3. Deberías ver tu nombre, NIF, contacto y logo ya rellenados en el
   presupuesto, sin haberlos vuelto a escribir. *(US2, CA1)*

## 2. Da de alta dos servicios en tu catálogo

1. Añade "Diseño de logotipo" a 450,00 € y "Manual de marca" a 320,00 €.
2. Cierra la aplicación y vuelve a abrirla.
3. Ambos servicios deberían seguir ahí. *(US3, RF2)*

## 3. Crea el presupuesto de ejemplo (cliente empresa)

1. Crea un presupuesto nuevo y da de alta el cliente "Empresa XYZ" (NIF de
   prueba, tipo **empresa**).
2. Añade las líneas:
   - Diseño de logotipo (desde el catálogo): cantidad 1.
   - Manual de marca (desde el catálogo): cantidad 1.
   - "Tarjetas de visita" escrita a mano: cantidad 2, precio 85,00 €.
3. Comprueba en pantalla:
   - Base imponible: **940,00 €**
   - IVA: **197,40 €**
   - Retención: **141,00 €**
   - Total: **996,40 €** *(CA2)*
4. Comprueba que "Tarjetas de visita" no aparece en tu catálogo de servicios
   (solo se usó en este presupuesto). *(CL2)*
5. Reordena las líneas (por ejemplo, sube "Tarjetas de visita" al principio).
   El orden en pantalla debería cambiar y mantenerse al volver a abrir el
   borrador. *(FR-008)*
6. Da de alta un segundo cliente también llamado "Empresa XYZ" pero con un
   NIF distinto. Deberías poder guardarlo como un cliente independiente,
   sin que se confunda ni se fusione con el primero. *(Edge Case)*

## 4. Prueba la retención reducida y la de particular

1. Sobre el mismo presupuesto en borrador, marca al cliente como "autónomo
   nuevo" (cambia su tipo si hace falta).
2. El total debería pasar a **1.071,60 €**. *(CA3)*
3. Cambia el cliente a tipo **particular**.
4. La retención debería mostrar **0,00 €** y el total **1.137,40 €**, incluso
   si intentas forzar una retención manualmente. *(CA4, CL3)*

## 5. Prueba los avisos de datos inválidos

1. Intenta añadir una línea con cantidad -1 o precio -10 €.
2. La aplicación debería impedir guardarla y avisarte. *(CA7/CL4)*
3. Quita todas las líneas del presupuesto e intenta descargar el PDF.
4. La aplicación debería impedirlo y avisarte de que falta al menos una
   línea. *(CL1)*

## 6. Genera el PDF y comprueba la numeración

1. Vuelve a poner una línea válida y descarga el PDF del presupuesto de la
   sección 3 (cliente empresa).
2. El PDF debería incluir: tus datos y logo, los datos del cliente, las
   líneas, base imponible, IVA, retención, total, número y validez de 30
   días. *(CA8)*
3. Si es el primer presupuesto que emites en el año en curso, el número
   debería terminar en `-001`; genera un segundo presupuesto y comprueba que
   el número sube a `-002`. *(CA5)*
4. Intenta editar o borrar el presupuesto ya emitido: la aplicación no
   debería permitirlo; para cambiar algo tendrías que crear uno nuevo.
   *(FR-020)*

## 7. Comprueba que no se pierde el trabajo a medio hacer

1. Empieza un presupuesto nuevo, añade un cliente y una línea, pero **no**
   generes el PDF.
2. Cierra la aplicación (o recarga la página) y vuélvela a abrir.
3. Deberías encontrar el borrador tal como lo dejaste, sin haber perdido
   nada. *(FR-025)*

## 8. Comprueba el historial

1. Ve al listado de presupuestos.
2. Deberías ver todos los presupuestos emitidos hasta ahora y poder volver a
   descargar su PDF. *(FR-021)*

## 9. Comprueba que funciona bien en el móvil

1. Abre la aplicación desde el navegador de un teléfono móvil.
2. Repite el paso 3 (crear un presupuesto con líneas) y comprueba que se ve
   bien y es cómodo de usar con el dedo, sin necesidad de hacer zoom ni
   desplazarte en horizontal.
