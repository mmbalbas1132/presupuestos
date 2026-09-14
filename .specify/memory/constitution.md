<!--
Sync Impact Report
==================
Version change: (plantilla sin versionar) → 1.0.0
Ratificación inicial de la constitution de PresupuestosPro.

Principios añadidos:
  I.   Simplicidad ante todo
  II.  Idioma y mercado
  III. Cero alcance fantasma
  IV.  Verificable por una persona no técnica
  V.   Datos del usuario con respeto

Secciones añadidas:
  - Core Principles (5 principios)
  - Governance

Secciones eliminadas respecto a la plantilla:
  - [SECTION_2_NAME] / [SECTION_2_CONTENT] (Restricciones Adicionales): omitida
    porque no aporta reglas nuevas más allá de los 5 principios; añadirla
    contradiría el Principio I (Simplicidad ante todo).
  - [SECTION_3_NAME] / [SECTION_3_CONTENT] (Flujo de Desarrollo): omitida por
    el mismo motivo; el flujo de trabajo ya queda cubierto por el Governance
    Check en /speckit-plan.

Plantillas revisadas:
  - .specify/templates/plan-template.md → ✅ compatible (el "Constitution
    Check" ya referencia dinámicamente este archivo; sin cambios necesarios)
  - .specify/templates/spec-template.md → ✅ compatible (Success Criteria ya
    exige métricas observables por el usuario, alineado con el Principio IV)
  - .specify/templates/tasks-template.md → ✅ compatible (agnóstico de
    tecnología e idioma; sin cambios necesarios)
  - .specify/templates/commands/*.md → ⚠ pendiente (no existe el directorio
    en este proyecto; nada que actualizar por ahora)
  - README.md / docs/quickstart.md → ⚠ pendiente (no existen todavía en este
    repositorio; crear alineados con estos principios cuando se añadan)

TODOs diferidos: ninguno.
-->

# PresupuestosPro Constitution

## Core Principles

### I. Simplicidad ante todo

Ante dos soluciones que cumplan el mismo requisito, se DEBE elegir siempre la
más simple. PresupuestosPro está en su versión 1 (MVP): no se DEBE añadir
complejidad anticipada — capas de abstracción, configuraciones genéricas,
frameworks o patrones — para necesidades hipotéticas futuras. Toda decisión
técnica se justifica por una necesidad real y actual, nunca por "por si
acaso".

**Motivo**: cada capa extra cuesta tiempo de desarrollo y mantenimiento; en
una v1, ese coste debe ir a entregar valor al freelancer, no a anticipar
escenarios que quizá nunca ocurran.

### II. Idioma y mercado

Todo el producto — interfaz, textos, mensajes de error, los PDF generados y
cualquier comunicación con el usuario — DEBE estar en español de España. La
moneda de la aplicación DEBE ser el euro (€), usando el formato numérico
español (por ejemplo, 1.234,56 €). No se DEBE construir soporte
multi-idioma ni multi-divisa en esta fase.

**Motivo**: el público objetivo son freelancers que trabajan en el mercado
español; internacionalizar antes de validar el producto añade complejidad
sin aportar valor (ver Principio I).

### III. Cero alcance fantasma

No se DEBE implementar ninguna funcionalidad, pantalla, campo o integración
que no esté descrita explícitamente en la especificación (`spec.md`)
vigente de la funcionalidad en curso. Si durante el desarrollo surge una
idea nueva o una mejora, se DEBE anotar como propuesta separada (por
ejemplo, en un backlog) en lugar de construirla directamente. Cualquier
funcionalidad nueva requiere primero actualizar la spec correspondiente
antes de escribir código para ella.

**Motivo**: el "por si sirve" es la forma más común de descontrolar el
alcance y retrasar la entrega; la spec es el único contrato válido de lo
que hay que construir.

### IV. Verificable por una persona no técnica

Cada criterio de éxito (criterio de aceptación) definido en la spec DEBE
poder comprobarse usando la aplicación tal como lo haría un freelancer
real — creando un presupuesto, generando un PDF, revisando un dato en
pantalla — sin necesidad de leer código, revisar logs ni ejecutar comandos
técnicos. Si un criterio no se puede comprobar así, se DEBE reescribir
hasta que sea observable en la interfaz o en el documento generado.

**Motivo**: el objetivo final es que un freelancer sin conocimientos
técnicos pueda usar la herramienta y confirmar que funciona; si solo un
desarrollador puede validar un criterio, ese criterio está mal escrito.

### V. Datos del usuario con respeto

La aplicación DEBE solicitar únicamente los datos imprescindibles para
generar el presupuesto (datos del freelancer emisor, datos del cliente y
líneas del presupuesto). No se DEBE pedir ni almacenar información
adicional sin que la spec justifique esa necesidad. Las claves,
contraseñas, tokens de API y cualquier otro secreto DEBEN mantenerse fuera
del código fuente — mediante variables de entorno o un gestor de
secretos — y nunca se DEBEN subir al repositorio.

**Motivo**: pedir menos datos reduce el riesgo para el usuario y la carga
de responsabilidad del proyecto; los secretos en el código son una fuga de
seguridad conocida y evitable desde el primer commit.

## Governance

Esta constitution prevalece sobre cualquier otra práctica, plantilla o
preferencia individual dentro del proyecto. Toda spec, plan o lista de
tareas DEBE poder justificarse frente a estos cinco principios; si una
tarea entra en conflicto con alguno de ellos, el conflicto se resuelve
antes de continuar, no después.

Modificar esta constitution (añadir, cambiar o eliminar un principio)
requiere: (1) documentar el cambio y su motivo, (2) actualizar el número de
versión siguiendo semver — MAJOR para eliminar o redefinir un principio de
forma incompatible, MINOR para añadir un principio o ampliar una guía de
forma relevante, PATCH para aclaraciones que no cambian el significado — y
(3) revisar que `plan-template.md`, `spec-template.md` y `tasks-template.md`
sigan alineados con el cambio.

El comando `/speckit-plan` DEBE incluir una comprobación ("Constitution
Check") frente a estos cinco principios antes de aprobar cualquier diseño,
y de nuevo tras el diseño de fase 1.

**Version**: 1.0.0 | **Ratified**: 2026-09-14 | **Last Amended**: 2026-09-14
