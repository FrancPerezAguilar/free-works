# Prompt: Diseño de Entidad FACTURA — Plataforma AI-First para Autónomos

---

## Instrucción Principal

Eres un arquitecto de software especializado en normativa fiscal española y sistemas ERP. Tu tarea es diseñar la entidad **FACTURA** para una plataforma AI-first dirigida a autónomos en España (caso de uso: electricista autónomo).

La plataforma utiliza:
- **Formato de configuración:** YAML
- **Base de datos:** PostgreSQL
- **Enfoque:** AI-first (la IA gestiona, genera, valida y sugiere facturas)

Debes generar un diseño completo, detallado y listo para implementar que cumpla con la **normativa fiscal española vigente**, incluyendo el sistema **VeriFactu** (Real Decreto 1007/2023 y Orden HAC/1177/2024).

---

## Requisitos de la Entidad FACTURA

### 1. Identificación y Numeración

- `id`: UUID (clave primaria, generado automáticamente)
- `numero_factura`: String — Número correlativo único dentro de la serie (ej: `F2026-0001`)
- `serie`: String — Serie de facturación (ej: `F` para facturas ordinarias, `R` para rectificativas, `A` para abonos). Permitir múltiples series configurables.
- `ejercicio`: Integer — Año fiscal al que pertenece la factura
- `fecha_emision`: Date — Fecha de emisión (obligatoria)
- `fecha_operacion`: Date — Fecha en que se realizó la operación (si difiere de la emisión)
- `fecha_vencimiento`: Date — Fecha límite de pago

### 2. Datos del Emisor (Autónomo)

Referencia al perfil del autónomo (tabla `autonomos`):
- `emisor_nombre_razon_social`: String
- `emisor_nif`: String — NIF/CIF del emisor
- `emisor_direccion`: String completa (calle, número, CP, municipio, provincia)
- `emisor_email`: String
- `emisor_telefono`: String
- `emisor_regimen_iva`: Enum — `general`, `recargo_equivalencia`, `regimen_simplificado`, `regimen_especial_agricultura`, `extraterritorial`
- `emisor_codigo_censo`: String — Código del censo de empresarios (AEAT)
- `emisor_logo_url`: String (opcional, para impresión)

### 3. Datos del Receptor (Cliente)

Referencia a la tabla `clientes`:
- `receptor_id`: UUID (FK → `clientes`)
- `receptor_nombre_razon_social`: String
- `receptor_nif`: String — NIF/CIF/NIE del receptor
- `receptor_direccion`: String completa
- `receptor_email`: String (opcional)
- `receptor_telefono`: String (opcional)
- `receptor_pais`: String (default: `ES`) — Relevante para operaciones intracomunitarias
- `receptor_codigo_operacion_intracomunitaria`: String (opcional, VIES)

### 4. Conceptos / Líneas de Detalle

Array `lineas_factura[]` con cada línea conteniendo:
- `id_linea`: UUID
- `numero_linea`: Integer (orden)
- `concepto`: String — Descripción del servicio o producto (ej: "Instalación eléctrica vivienda - Mano de obra")
- `tipo_linea`: Enum — `servicio`, `material`, `mano_obra`, `desplazamiento`, `otro`
- `referencia_articulo`: String (opcional, FK → catálogo de materiales)
- `cantidad`: Decimal(10,2)
- `unidad`: String — `ud`, `m`, `m²`, `h`, `kg`, `l`, etc.
- `precio_unitario`: Decimal(10,2) — Sin IVA
- `descuento_porcentaje`: Decimal(5,2) — Descuento porcentual (default: 0)
- `descuento_importe`: Decimal(10,2) — Descuento fijo (default: 0)
- `base_imponible_linea`: Decimal(12,2) — Calculado: `cantidad × precio_unitario - descuento`
- `tipo_iva`: Decimal(4,2) — Porcentaje de IVA aplicable (21, 10, 4, 0, o exento)
- `cuota_iva_linea`: Decimal(12,2) — Calculado: `base_imponible_linea × tipo_iva / 100`
- `tipo_irpf`: Decimal(4,2) — Porcentaje de IRPF (default: 15 para autónomos en general, 7 para nuevos autónomos)
- `cuota_irpf_linea`: Decimal(12,2) — Calculado
- `tipo_recargo_equivalencia`: Decimal(4,2) — Si aplica (default: 0)
- `cuota_recargo_linea`: Decimal(12,2)
- `total_linea`: Decimal(12,2) — Calculado: `base_imponible_linea + cuota_iva_linea - cuota_irpf_linea + cuota_recargo_linea`

### 5. Totales de la Factura

- `base_imponible_total`: Decimal(12,2) — Suma de bases imponibles
- `descuento_total`: Decimal(12,2) — Suma de descuentos
- `base_imponible_neta`: Decimal(12,2) — `base_imponible_total - descuento_total`
- `desglose_iva[]`: Array de objetos:
  - `tipo_iva`: Decimal(4,2)
  - `base_imponible`: Decimal(12,2)
  - `cuota_iva`: Decimal(12,2)
- `total_iva`: Decimal(12,2) — Suma de cuotas de IVA
- `desglose_irpf[]`: Array de objetos:
  - `tipo_irpf`: Decimal(4,2)
  - `base_retencion`: Decimal(12,2)
  - `cuota_irpf`: Decimal(12,2)
- `total_irpf`: Decimal(12,2) — Suma de retenciones IRPF
- `total_recargo_equivalencia`: Decimal(12,2)
- `total_factura`: Decimal(12,2) — `base_imponible_neta + total_iva - total_irpf + total_recargo_equivalencia`
- `moneda`: String — ISO 4217 (default: `EUR`)
- `tipo_cambio`: Decimal(10,6) — Si moneda ≠ EUR (default: 1.0)

### 6. Forma de Pago y Datos Bancarios

- `forma_pago`: Enum — `transferencia`, `domiciliacion`, `tarjeta`, `efectivo`, `bizum`, `paypal`, `otro`
- `estado_pago`: Enum — `pendiente`, `pagada`, `parcial`, `vencida`, `impagada`, `anulada`
- `fecha_pago`: Date (nullable)
- `importe_pagado`: Decimal(12,2) — Para pagos parciales
- `iban`: String — IBAN de la cuenta del emisor (para transferencias/domiciliaciones)
- `swift_bic`: String (opcional, para transferencias internacionales)
- `titular_cuenta`: String
- `referencia_mandato`: String (opcional, para domiciliaciones SEPA)
- `condiciones_pago`: String — Texto libre (ej: "Pago a 30 días desde fecha de emisión")

### 7. Estado de la Factura (Ciclo de Vida)

- `estado`: Enum — `borrador`, `emitida`, `enviada`, `pagada`, `parcialmente_pagada`, `vencida`, `impagada`, `anulada`, `rectificada`
- `fecha_cambio_estado`: Timestamp
- `motivo_anulacion`: String (obligatorio si estado = `anulada`)
- `factura_rectificativa_id`: UUID (FK → misma tabla, si esta factura es rectificada por otra)
- `factura_original_id`: UUID (FK → misma tabla, si esta factura rectifica a otra)

### 8. Relaciones con Otras Entidades

- `presupuesto_id`: UUID (FK → `presupuestos`, nullable) — Presupuesto del que deriva
- `trabajo_id`: UUID (FK → `trabajos`, nullable) — Trabajo/orden de trabajo asociado
- `cliente_id`: UUID (FK → `clientes`)
- `autonomo_id`: UUID (FK → `autonomos`)
- `albaranes_ids`: Array de UUIDs (FK → `albaranes`, nullable) — Albaranes vinculados
- `factura_adjuntos[]`: Array — Documentos adjuntos (fotos del trabajo, PDFs, etc.)

### 9. VeriFactu — Cumplimiento Normativo (OBLIGATORIO)

#### 9.1. Campos VeriFactu

- `verifactu_generada`: Boolean — Indica si la factura fue generada bajo sistema VeriFactu
- `verifactu_hash`: String — Hash SHA-256 de la factura (huella digital según normativa)
- `verifactu_hash_anterior`: String — Hash de la factura anterior en la serie (encadenamiento)
- `verifactu_fecha_generacion_hash`: Timestamp
- `verifactu_firma_electronica`: String — Firma electrónica del sistema (certificado digital)
- `verifactu_identificador_factura`: String — ID único del sistema de facturación ante AEAT
- `verifactu_tipo_factura`: Enum — `F1` (factura completa), `F2` (factura simplificada/ticket), `F3` (factura rectificativa), `R1-R5` (tipos de rectificación)
- `verifactu_clave_regimen_iva`: String — Clave del régimen de IVA (01=general, 02=recargo, etc.)
- `verifactu_base_imponible_total`: Decimal(12,2) — Base imponible a efectos de VeriFactu
- `verifactu_cuota_total`: Decimal(12,2) — Cuota total de IVA
- `verifactu_total_total`: Decimal(12,2)
- `verifactu_registro_envio_sii`: JSON — Datos del envío al SII (Suministro Inmediato de Información)
  - `fecha_envio`: Timestamp
  - `estado_envio`: Enum — `pendiente`, `enviado`, `aceptado`, `rechazado`, `error`
  - `codigo_error`: String (nullable)
  - `mensaje_aeat`: String (nullable)
  - `numero_protocolo`: String (nullable)
- `verifactu_indicador_facturacion`: Enum — `emitida`, `recibida`

#### 9.2. Lógica de Negocio VeriFactu

Implementar las siguientes reglas:

1. **Encadenamiento de facturas:** Cada factura emitida debe incluir el hash de la factura anterior de la misma serie. El primer registro de cada serie tendrá `hash_anterior = NULL`.

2. **Generación del hash:** El hash se calcula sobre los campos obligatorios concatenados:
   ```
   SHA-256(
     numero_factura + serie + fecha_emision + nif_emisor + nif_receptor +
     base_imponible_total + total_iva + total_factura + hash_anterior
   )
   ```

3. **Firma electrónica:** La factura debe firmarse con certificado electrónico del autónomo (obtener desde tabla `autonomos.certificado_digital`).

4. **Envío SII:** Las facturas con importe > 400€ IVA incluido deben enviarse al SII. Facturas simplificadas (< 400€) pueden quedar en registro local pero deben estar disponibles.

5. **Plazo de envío:** Facturas emitidas deben enviarse al SII en plazo máximo de 4 días naturales (o 8 si voluntario).

6. **No eliminación:** Las facturas emitidas NUNCA se eliminan. Solo se pueden anular con factura rectificativa.

7. **Registro de facturas emitidas:** Mantener un registro maestro (`registro_facturas_emitidas`) con:
   - Hash de cada factura
   - Hash anterior (encadenamiento)
   - Primer registro de cada ejercicio
   - Último registro de cada ejercicio

#### 9.3. Tabla Complementaria: `registro_verifactu`

```yaml
registro_verifactu:
  id: UUID PK
  factura_id: UUID FK
  autonomo_id: UUID FK
  serie: String
  ejercicio: Integer
  numero_secuencial: Integer
  hash_factura: String NOT NULL
  hash_anterior: String (nullable)
  firma_electronica: String NOT NULL
  fecha_generacion: Timestamp NOT NULL
  estado_envio_sii: Enum [pendiente, enviado, aceptado, rechazado]
  fecha_envio_sii: Timestamp (nullable)
  intentos_envio: Integer DEFAULT 0
  ultimo_error: String (nullable)
  created_at: Timestamp
  updated_at: Timestamp
```

### 10. Campos de Auditoría y Metadata

- `created_at`: Timestamp — Creación del registro
- `updated_at`: Timestamp — Última modificación
- `created_by`: UUID — Usuario/sistema que creó la factura
- `updated_by`: UUID — Último usuario que modificó
- `version`: Integer — Control de versiones optimista
- `notas_internas`: Text — Notas visibles solo para el autónomo
- `notas_cliente`: Text — Notas visibles en la factura impresa/PDF
- `metadatos_ia`: JSONB — Datos generados por la IA:
  - `sugerencias_ia`: Array — Sugerencias de la IA (ej: "¿Quieres añadir desplazamiento?")
  - `precio_sugerido`: Decimal — Si la IA sugirió un precio
  - `confianza_sugerencia`: Decimal(3,2) — 0.00 a 1.00
  - `patron_detectado`: String — Si detectó un patrón de facturación recurrente

### 11. Campos Adicionales Recomendados

- `tipo_factura`: Enum — `ordinaria`, `simplificada`, `rectificativa`, `proforma`, `autofactura`
- `motivo_rectificacion`: String (obligatorio si es rectificativa)
- `tipo_rectificacion`: Enum — `S1` (número), `S2` (serie), `S3` (fecha), `S4` (subtotal), `S5` (otras)
- `factura_simplificada`: Boolean — Si es factura simplificada (< 400€ o régimen especial)
- `operacion_intracomunitaria`: Boolean
- `inversion_sujeto_pasivo`: Boolean — Si aplica ISP (art. 84 LIVA)
- `retencion_115`: Boolean — Retención IRPF profesional (15% general, 7% nuevos autónomos)
- `sellos_timbre`: Decimal(10,2) — Importe de timbres (si aplica)
- `texto_legal_pie`: Text — Texto legal en el pie de factura (configurable por autónomo)
- `codigo_qr_verifactu`: String — URL/data para QR VeriFactu

---

## Salida Esperada

Genera el diseño completo en los siguientes formatos:

### A. Esquema YAML de la entidad

Archivo YAML completo con todos los campos, tipos, restricciones, valores por defecto y comentarios explicativos. Listo para ser parseado por un generador de migraciones.

### B. Migración PostgreSQL (DDL)

SQL CREATE TABLE completo con:
- Tipos de dato PostgreSQL nativos
- Constraints (NOT NULL, UNIQUE, CHECK, FK)
- Índices (búsqueda por número, cliente, estado, fechas, hash)
- Comments en las tablas y columnas

### C. Validaciones de Negocio

Lista exhaustiva de validaciones que la aplicación debe aplicar:
- Antes de guardar (validación de campos)
- Al cambiar de estado (transiciones válidas)
- Antes de emitir (campos obligatorios VeriFactu)
- Al anular (reglas específicas)

### D. Triggers y Funciones PostgreSQL

- Trigger para calcular automáticamente `base_imponible_linea`, `cuota_iva_linea`, etc.
- Trigger para actualizar totales cuando cambian las líneas
- Trigger para registrar en `verifactu_hash` al emitir
- Función para generar el hash VeriFactu
- Función para validar encadenamiento de hashes

### E. Datos de Ejemplo

Al menos 3 ejemplos realistas de facturas:
1. Factura ordinaria por instalación eléctrica completa
2. Factura simplificada por reparación menor (< 400€)
3. Factura rectificativa por error en importe

---

## Restricciones y Consideraciones

1. **Idioma:** Todo el diseño, comentarios, enums y documentación en **español**.
2. **Moneda:** Todas las cantidades en EUR con precisión de 2 decimales.
3. **Normativa:** Cumplimiento estricto de:
   - Ley 37/1992 del IVA (LIVA)
   - Real Decreto 1619/2012 (Reglamento Facturación)
   - Real Decreto 1007/2023 (VeriFactu)
   - Orden HAC/1177/2024 (Requisitos técnicos VeriFactu)
   - Ley 58/2003 General Tributaria (conservación 4 años mínimo)
4. **Autónomo tipo:** Electricista autónomo en régimen general de IVA e IRPF (15% o 7% primer año).
5. **IA-first:** Los campos `metadatos_ia` deben estar preparados para que la IA pueda:
   - Sugerir facturas desde presupuestos aceptados
   - Auto-rellenar campos frecuentes
   - Detectar errores (IVA incorrecto, falta CIF, etc.)
   - Proponer facturas recurrentes
   - Alertar sobre vencimientos
6. **Auditoría:** Toda modificación de una factura emitida debe quedar registrada.
7. **Rendimiento:** Optimizar para consultas frecuentes: facturas por cliente, por periodo, por estado, pendientes de cobro.
