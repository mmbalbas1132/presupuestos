# Research: PresupuestosPro v0

**Feature**: PresupuestosPro v0 | **Fecha**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

Este documento resuelve las decisiones técnicas necesarias para diseñar la v1,
aplicando el Principio I de la constitution (Simplicidad ante todo) y las
instrucciones del usuario: publicable online cuanto antes, buen funcionamiento
en móvil, sin cuentas de usuario, con backend Node.js y base de datos local
(no en la nube), y JavaScript en front-end y back-end.

> **Nota de revisión (2026-09-15)**: la decisión de arquitectura del punto 1
> se revisó a petición del usuario, que pidió explícitamente backend Node.js
> y base de datos local en lugar de una app "solo cliente". Las decisiones se
> tomaron después de una ronda de preguntas de clarificación (ver historial
> de la conversación) para resolver dónde se ejecuta ese backend y cómo se
> accede desde el móvil.

## 1. Arquitectura general: ¿aplicación cliente-servidor o solo cliente?

**Decisión**: Arquitectura cliente-servidor con un backend Node.js sencillo,
desplegado **una sola vez en un único servidor online**, pensado para que lo
use **una sola freelancer** (sin cuentas, sin multi-tenencia). El navegador
(móvil o de escritorio) habla con ese backend por una API HTTP mínima para
guardar y leer datos; el backend es quien lee y escribe en la base de datos
local del servidor.

**Por qué (lenguaje de negocio)**: al publicar el backend en un servidor
online, la freelancer puede entrar desde el ordenador o desde el móvil
simplemente abriendo una dirección web, sin tener que dejar su propio
ordenador encendido ni instalar nada — cumple el requisito de "funcionar
bien en móvil" que no se conseguía bien con un backend instalado solo en su
ordenador. Como la spec no contempla varias freelancers compartiendo la
misma instalación (no hay cuentas), este servidor está pensado para un solo
uso: no hace falta construir un sistema de login ni de separación de datos
entre distintas personas.

**Alternativas consideradas**:
- *Solo cliente, sin backend (decisión anterior de este mismo documento)*:
  descartada porque el usuario ha pedido explícitamente un backend Node.js y
  una base de datos local; se sustituye por esta decisión.
- *Backend instalado en el propio ordenador de la freelancer*: descartada
  porque, para usarlo desde el móvil, exigiría tener el ordenador encendido
  y accesible desde la red — complica justo lo que se quiere simplificar.
- *Servidor online compartido por varias freelancers*: descartada porque
  exigiría inventar algún mecanismo de separación de datos entre personas
  (aunque fuera simple), y la spec actual no contempla más de una
  freelancer por instalación; añadirlo ahora sería alcance fantasma
  (Principio III).

**Riesgo aceptado y documentado**: al no haber sistema de cuentas ni
contraseña (fuera de alcance según la spec), cualquier persona que conozca
la dirección web del servidor podría ver o modificar los datos. Se acepta
este riesgo en v0 porque el servidor es de un solo uso, pensado para la
propia freelancer, y no se anuncia ni enlaza públicamente. Si en el futuro
se necesitara publicar la URL de forma más abierta, habría que revisar esta
decisión (posible tarea futura, no de esta v0).

## 2. Persistencia de los datos: base de datos local en el servidor

**Decisión**: Base de datos **SQLite** (un único fichero en el servidor,
gestionado por el backend), con una tabla por entidad: perfil del
freelancer, clientes, catálogo de servicios, presupuestos, líneas de
presupuesto y el contador anual de numeración.

**Por qué (lenguaje de negocio)**: SQLite guarda toda la base de datos en un
solo fichero, sin necesidad de instalar ni administrar un servidor de base
de datos aparte (a diferencia de PostgreSQL o MySQL). Es la opción más
simple que cumple lo que se ha pedido — "base de datos local, no en la
nube" — y es más que suficiente para los volúmenes de datos reales de una
sola freelancer (decenas o cientos de clientes/presupuestos al año, nunca
millones).

**Alternativas consideradas**:
- `localStorage` del navegador (decisión anterior de este documento):
  descartada porque el usuario pidió explícitamente una base de datos, no
  solo almacenamiento en el navegador.
- *PostgreSQL o MySQL instalados en el servidor*: descartados por añadir un
  servicio de base de datos aparte que hay que instalar, configurar y
  mantener, sin que el volumen de datos de esta v0 lo justifique (Principio
  I).
- *Ficheros JSON como "base de datos" (tipo lowdb)*: descartados por no
  ofrecer transacciones ni garantías de integridad; un fallo a mitad de
  guardar podría corromper un presupuesto ya emitido, algo especialmente
  delicado dado que los presupuestos emitidos deben ser inmutables (FR-020).
- *Driver `better-sqlite3` (elegido) frente al módulo experimental
  `node:sqlite` incluido en versiones recientes de Node*: se prefiere
  `better-sqlite3` por ser una librería madura y estable, con una API
  síncrona muy sencilla de usar para el volumen de peticiones de esta app
  (una sola freelancer a la vez); el módulo nativo de Node todavía es
  experimental y se descarta para no arriesgar la fiabilidad de una v1 que
  se quiere publicar ya.

## 3. Generación del PDF

**Decisión** (sin cambios respecto a la primera versión de este documento):
generación del PDF en el propio navegador (cliente), con una librería
JavaScript especializada en crear PDFs (jsPDF), sin pasar por el backend.

**Por qué (lenguaje de negocio)**: aunque ahora sí existe un backend, se
mantiene el PDF en el navegador porque así se genera al instante, sin
depender de que el backend esté disponible ni de esperar una respuesta del
servidor; el backend se dedica solo a guardar y recuperar datos (ver
decisión de alcance del backend, punto 6).

**Alternativas consideradas**:
- *Generación del PDF en el backend*: descartada explícitamente — ver punto
  6 ("Alcance del backend") para el razonamiento completo.

## 4. Aspecto visual y compatibilidad móvil

**Decisión** (sin cambios): maquetación propia con CSS moderno
(Flexbox/Grid) "mobile first", apoyada en una hoja de estilos mínima de base
("classless CSS") para partir de una apariencia profesional prácticamente
sin código adicional. Con backend, esta decisión cobra más sentido todavía:
al servirse la app desde una URL real, cualquier dispositivo con navegador
(incluido el móvil) accede al mismo diseño responsive sin instalar nada.

**Alternativas consideradas**: igual que en la primera versión de este
documento — se descarta un framework visual completo (Bootstrap/Material)
por aportar más código y convenciones de las que esta app necesita.

## 5. Comprobación automática

**Decisión**: pruebas automáticas con **Vitest**, en dos bloques:
- Reglas de cálculo y numeración (igual que antes: base imponible, IVA,
  retención, total, `AAAA-NNN`), que siguen viviendo en el navegador.
- Pruebas de la API del backend (guardar/leer perfil, clientes, catálogo,
  presupuestos; emitir un presupuesto y comprobar que ya no se puede
  modificar), ejecutadas contra una base de datos SQLite temporal de
  pruebas, no contra la base de datos real.

**Por qué (lenguaje de negocio)**: además de que los cálculos salgan bien,
ahora también hay que comprobar que los datos se guardan y se recuperan
correctamente a través del backend, y que un presupuesto ya emitido queda
realmente protegido contra cambios (FR-020) aunque alguien intente
modificarlo llamando directamente a la API. Se usa la misma herramienta de
pruebas (Vitest) en los dos bloques para no añadir una segunda herramienta
de testing al proyecto (Principio I).

**Alternativas consideradas**: pruebas de extremo a extremo simulando clics
en la pantalla — se dejan fuera de v0 por el mismo motivo que antes: la
constitution ya exige que cada criterio de aceptación sea comprobable a mano
por una persona no técnica ([quickstart.md](./quickstart.md)), y añadir esa
infraestructura ahora sería complejidad anticipada.

## 6. Alcance del backend: ¿solo datos, o también cálculos y PDF?

**Decisión**: el backend **solo** guarda y lee datos (una API mínima tipo
CRUD para perfil, catálogo, clientes y presupuestos). Los cálculos de IVA,
retención, total y numeración, así como la generación del PDF, se quedan en
el navegador, igual que en la decisión original.

**Por qué (lenguaje de negocio)**: mantener el cálculo y el PDF en el
navegador significa que la freelancer ve el resultado al instante mientras
edita un presupuesto, sin esperar a ir y volver al servidor en cada cambio
de una línea; el backend solo entra en juego para guardar el resultado final
y para recuperar el historial. Esto también reduce lo que hay que programar
y mantener en el servidor a lo mínimo imprescindible.

**Alternativas consideradas**:
- *Backend con toda la lógica de negocio y generación de PDF*: descartada
  porque obligaría a llamar al servidor en cada cambio de una línea del
  presupuesto (más lento, y depende de que el backend esté siempre
  disponible), y duplicaría en el servidor una lógica que ya está resuelta,
  probada y documentada para el navegador (`contracts/calculo-contract.md`).

## 7. Lenguaje de programación: JavaScript en front-end y back-end

**Decisión**: JavaScript (ES2022+) tanto en el front-end como en el backend
Node.js, sin TypeScript.

**Por qué (lenguaje de negocio)**: el usuario ha pedido explícitamente
JavaScript en ambos lados; usar el mismo lenguaje en frontend y backend
evita tener que aprender o mantener dos "dialectos" distintos (JavaScript y
TypeScript) en un proyecto tan pequeño, en línea con el Principio I.

**Alternativas consideradas**:
- *TypeScript* (decisión de la primera versión de este documento):
  descartada porque el usuario ha pedido explícitamente JavaScript.

## 8. Publicación ("ir a producción")

**Decisión**: el backend Node.js (con su base de datos SQLite en disco) se
despliega en un único servicio de hosting que permita ejecutar procesos
Node.js de forma sencilla (por ejemplo, un servicio con despliegue directo
desde el repositorio de código); el propio backend sirve también los
ficheros del front-end, de modo que solo hay **un** sitio que publicar y
mantener, no dos.

**Por qué (lenguaje de negocio)**: mantener un único servicio (en vez de un
hosting de páginas estáticas para el front-end y otro distinto para el
backend) simplifica la publicación: subir una nueva versión es un único
despliegue, no dos coordinados entre sí. Sigue cumpliendo "publicarse online
enseguida", ahora con backend incluido.

**Riesgo aceptado y documentado**: los servicios de hosting online más
sencillos suelen borrar el disco del servidor (y por tanto el fichero
SQLite) en cada despliegue o reinicio, salvo que se contrate expresamente
almacenamiento persistente ("disco persistente"/"volumen"). Antes de
publicar de verdad, habrá que confirmar que el hosting elegido ofrece ese
disco persistente para no perder los datos en cada actualización — se deja
anotado aquí para no olvidarlo al desplegar, sin bloquear el resto del
diseño de esta v0.
