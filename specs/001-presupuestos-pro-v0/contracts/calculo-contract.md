# Contrato: Módulo de cálculo (reglas de negocio)

**Feature**: PresupuestosPro v0

Este módulo es el corazón de la app (constitution: verificabilidad,
simplicidad) y vive **en el navegador** (research.md §6): el backend no
calcula nada, solo guarda lo que el navegador ya ha calculado
(`almacenamiento-contract.md`). Son funciones puras, sin efectos
secundarios ni acceso a almacenamiento — reciben datos y devuelven importes.
Esto permite probarlas con tests unitarios simples y reutilizarlas igual en
pantalla que al generar el PDF.

## `calcularBaseImponible(lineas: LineaPresupuesto[]): number`

- **Entrada**: lista de líneas del presupuesto (cada una con `cantidad` y
  `precioUnitario`).
- **Salida**: suma de `cantidad × precioUnitario` de todas las líneas,
  redondeada a 2 decimales.
- **Regla**: FR-009. Si `lineas` está vacía, devuelve 0.

**Casos de prueba obligatorios** (derivados de la spec):
- 3 líneas (1×450,00; 1×320,00; 2×85,00) → 940,00 (CA2/ejemplo completo).
- 1 línea (2×85,00) → 170,00 (CA7).

## `calcularIVA(baseImponible: number): number`

- **Salida**: `baseImponible × 0,21`, redondeado a 2 decimales.
- **Regla**: FR-010, RN1.
- **Caso de prueba**: base 940,00 → 197,40 (CA2).

## `calcularRetencion(tipoCliente: 'particular'|'empresa'|'autonomo', autonomoNuevo: boolean, baseImponible: number): { porcentaje: 0|7|15, importe: number }`

- **Regla**: FR-011, FR-012, FR-013, RN2.
  - `particular` → `{ porcentaje: 0, importe: 0 }` siempre, sin excepción.
  - `empresa` → `{ porcentaje: 15, importe: baseImponible × 0,15 }`.
  - `autonomo` con `autonomoNuevo = false` → igual que empresa (15 %).
  - `autonomo` con `autonomoNuevo = true` → `{ porcentaje: 7, importe: baseImponible × 0,07 }`.
- **Caso de prueba (CL3)**: si `tipoCliente = 'particular'`, el resultado es
  siempre `{ 0, 0.00 }` aunque el llamador pase `autonomoNuevo = true` por
  error — el módulo ignora ese dato para particulares.
- **Casos de prueba** (base 940,00): empresa → 141,00 (CA2); autónomo nuevo →
  65,80 (CA3); particular → 0,00 (CA4).

## `calcularTotal(baseImponible: number, iva: number, retencionImporte: number): number`

- **Salida**: `baseImponible + iva − retencionImporte`, redondeado a 2
  decimales.
- **Regla**: FR-014, RN3.
- **Casos de prueba**: (940,00; 197,40; 141,00) → 996,40 (CA2); (940,00;
  197,40; 65,80) → 1.071,60 (CA3); (940,00; 197,40; 0,00) → 1.137,40 (CA4);
  comprobación rápida de la spec: (1.000,00; 210,00; 150,00) → 1.060,00.

## `siguienteNumero(anio: number, contadorAnual: ContadorAnual): string`

- **Entrada**: año natural de la fecha de emisión y el contador guardado
  para ese año, obtenido con `GET /api/contador-anual/:anio`
  (`almacenamiento-contract.md`; ver también data-model.md → ContadorAnual).
- **Salida**: número de presupuesto en formato `AAAA-NNN`, incrementando en 1
  el último número usado ese año (o empezando en `001` si el año no tiene
  contador todavía).
- **Regla**: FR-017, RN4.
- **Casos de prueba**: primer presupuesto de 2026 → `2026-001`; el siguiente
  ese mismo año → `2026-002`; primer presupuesto de 2027 → `2027-001` (CA5).

## `validarLinea(cantidad: number, precioUnitario: number): { valido: boolean, error?: string }`

- **Regla**: FR-016, CL4. Devuelve `valido: false` si `cantidad <= 0` o
  `precioUnitario < 0`, con un mensaje de aviso; en cualquier otro caso,
  `valido: true`.

## `validarCliente(nombre: string, nif: string, tipo: string): { valido: boolean, error?: string }`

- **Regla**: FR-024. Devuelve `valido: false` si falta `nombre`, `nif` o
  `tipo`.
