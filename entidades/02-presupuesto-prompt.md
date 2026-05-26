# Prompt: Entidad PRESUPUESTO — Plataforma AI-first para Autónomos

## Instrucción principal

Eres un arquitecto de software especializado en plataformas AI-first para autónomos españoles. Tu tarea es diseñar la entidad **PRESUPUESTO** completa, incluyendo su esquema YAML, migración PostgreSQL, validaciones, lógica de negocio y relaciones con otras entidades.

El contexto es un autónomo español (electricista) que gestiona su negocio desde una plataforma conversacional donde la IA interpreta lenguaje natural y ejecuta acciones sobre datos estructurados.

---

## Requisitos de la entidad PRESUPUESTO

### 1. Identificación del presupuesto

- `id`: UUID v4, clave primaria, generado automáticamente.
- `numero`: String, código legible secuencial. Formato: `PRES-YYYY-NNNN` (ej: `PRES-2026-0042`). Único por autónomo. Generado automáticamente al crear.
- `fecha_creacion`: Timestamp con zona horaria (`Europe/Madrid`). Se asigna automáticamente al crear.
- `fecha_validez`: Date. Obligatoria. Define hasta cuándo el presupuesto es aceptable. Por defecto: 30 días naturales desde `fecha_creacion`.
- `estado`: Enum. Valores permitidos:
  - `borrador` — En edición, no visible para el cliente.
  - `enviado` — Enviado al cliente, pendiente de respuesta.
  - `aceptado` — Aceptado por el cliente.
  - `rechazado` — Rechazado por el cliente.
  - `cancelado` — Anulado por el autónomo.
  - `vencido` — Superada la fecha de validez sin respuesta.
  - `facturado` — Se ha generado factura derivada.
- `version`: Integer. Por defecto 1. Se incrementa si se modifica un presupuesto enviado.

### 2. Referencia al cliente

- `cliente_id`: UUID, clave foránea → entidad `CLIENTE`. Obligatorio.
- Se almacena además una **snapshot** de datos clave del cliente al momento de emisión:
  - `cliente_snapshot`: JSONB con `{nombre, nif, direccion, email, telefono}`. Esto preserva los datos históricos aunque el cliente se modifique después.

### 3. Desglose de conceptos (líneas de detalle)

- `lineas`: Array de objetos. Mínimo 1 línea. Cada línea contiene:
  - `id`: UUID, generado automáticamente.
  - `orden`: Integer. Posición de la línea (para ordenación en el documento).
  - `tipo`: Enum: `servicio` | `material` | `desplazamiento` | `otro`.
  - `concepto`: String, obligatorio. Descripción del trabajo o suministro. Ej: "Instalación cuadro eléctrico 12 módulos".
  - `detalle`: String, opcional. Información adicional o especificaciones técnicas.
  - `cantidad`: Decimal(10,2). Obligatorio. Unidades (metros, horas, piezas, etc.).
  - `unidad`: String. Unidad de medida. Valores comunes: `ud`, `m`, `m²`, `ml`, `h`, `kg`, `l`, `punto`. Default: `ud`.
  - `precio_unitario`: Decimal(10,2). Obligatorio. Precio por unidad **sin impuestos**.
  - `descuento_porcentaje`: Decimal(5,2). Default 0. Descuento aplicado a esta línea (0-100%).
  - `descuento_importe`: Decimal(10,2). Calculado: `cantidad × precio_unitario × (descuento_porcentaje / 100)`.
  - `subtotal`: Decimal(10,2). Calculado: `(cantidad × precio_unitario) - descuento_importe`.
  - `notas`: String, opcional. Nota interna de la línea (no se muestra al cliente).

### 4. Materiales (sublistas dentro de líneas)

- `materiales`: Array de objetos, opcional, asociado a una línea de tipo `material` o como detalle de una línea de tipo `servicio`. Cada material:
  - `id`: UUID.
  - `linea_padre_id`: UUID, FK → `lineas.id`. Línea a la que pertenece.
  - `referencia`: String. SKU o código de proveedor.
  - `descripcion`: String, obligatorio.
  - `cantidad`: Decimal(10,2).
  - `unidad`: String. Default `ud`.
  - `precio_unitario`: Decimal(10,2).
  - `importe`: Decimal(10,2). Calculado: `cantidad × precio_unitario`.
  - `proveedor`: String, opcional.
  - `incluido_en_precio`: Boolean. Default `true`. Si `true`, el coste del material ya está incluido en el precio de la línea padre. Si `false`, se desglosa aparte para el cliente.

### 5. Mano de obra

- `mano_de_obra`: Array de objetos, opcional, asociado a líneas de tipo `servicio`. Cada registro:
  - `id`: UUID.
  - `linea_padre_id`: UUID, FK → `lineas.id`.
  - `descripcion`: String. Ej: "Cableado y empalmes".
  - `horas`: Decimal(6,2). Horas estimadas o reales.
  - `tarifa_hora`: Decimal(10,2). Coste por hora (puede variar: normal, nocturna, festivo).
  - `tipo_tarifa`: Enum: `normal` | `nocturna` | `festivo` | `urgencia`. Default: `normal`.
  - `importe`: Decimal(10,2). Calculado: `horas × tarifa_hora`.
  - `tecnico_asignado`: String, opcional. Nombre del técnico si hay equipo.

### 6. Impuestos

- `iva_porcentaje`: Decimal(5,2). Default: `21.00`. Tipo de IVA general español. Puede reducirse (10%, 4%) según tipo de obra.
- `iva_importe`: Decimal(10,2). Calculado: `base_imponible × (iva_porcentaje / 100)`.
- `irpf_aplicable`: Boolean. Default: `false`. Se activa si el autónomo emite con retención IRPF (obligatorio para algunos profesionales).
- `irpf_porcentaje`: Decimal(5,2). Default: `15.00`. Retención estándar IRPF para profesionales.
- `irpf_importe`: Decimal(10,2). Calculado: `base_imponible × (irpf_porcentaje / 100)` (solo si `irpf_aplicable = true`).

### 7. Totales

- `base_imponible`: Decimal(12,2). Calculado: suma de `subtotal` de todas las líneas (incluyendo materiales desglosados si `incluido_en_precio = false`).
- `total_descuentos`: Decimal(12,2). Calculado: suma de todos los `descuento_importe`.
- `total_materiales`: Decimal(12,2). Calculado: suma de importes de materiales.
- `total_mano_de_obra`: Decimal(12,2). Calculado: suma de importes de mano de obra.
- `total_iva`: Decimal(12,2). Alias de `iva_importe`.
- `total_irpf`: Decimal(12,2). Alias de `irpf_importe`.
- `total`: Decimal(12,2). Calculado: `base_imponible + total_iva - total_irpf`.
- `moneda`: String(3). Default: `EUR`. ISO 4217.

### 8. Notas y condiciones

- `notas_internas`: Texto. Solo visible para el autónomo. No se imprime en el PDF ni se envía al cliente.
- `notas_cliente`: Texto. Visible en el documento enviado. Ej: "Incluye garantía de 2 años en materiales."
- `condiciones_pago`: Texto. Ej: "50% al aceptar, 50% al finalizar la obra."
- `forma_pago`: Enum: `transferencia` | `efectivo` | `tarjeta` | `domiciliacion` | `bizum` | `otro`.
- `plazo_ejecucion`: String. Estimación de duración. Ej: "3-5 días laborables".
- `validez_dias`: Integer. Default: 30. Días de validez del presupuesto.
- `garantia`: String. Condiciones de garantía. Ej: "24 meses en instalación, 12 meses en materiales."

### 9. Archivos adjuntos

- `adjuntos`: Array de objetos. Cada adjunto:
  - `id`: UUID.
  - `nombre_archivo`: String.
  - `url`: String. Ruta al archivo almacenado.
  - `tipo`: Enum: `foto` | `plano` | `documento` | `presupuesto_proveedor` | `otro`.
  - `descripcion`: String, opcional.
  - `fecha_subida`: Timestamp.

### 10. Relaciones con otras entidades

#### 10.1 → CLIENTE (muchos a uno)
- `cliente_id` → `CLIENTE.id`.
- Un presupuesto pertenece a un solo cliente.
- Un cliente puede tener múltiples presupuestos.
- Al crear el presupuesto, se captura snapshot del cliente.

#### 10.2 → TRABAJO (uno a uno, opcional)
- `trabajo_id`: UUID, FK → `TRABAJO.id`. Nullable.
- Cuando un presupuesto es aceptado, puede generar un trabajo (orden de trabajo).
- El trabajo hereda: cliente, líneas, materiales, dirección del cliente.
- Un presupuesto solo puede vincularse a un trabajo.

#### 10.3 → FACTURA (uno a uno, opcional)
- `factura_id`: UUID, FK → `FACTURA.id`. Nullable.
- Cuando el trabajo se completa, se genera una factura derivada del presupuesto.
- La factura hereda: desglose, impuestos, totales, condiciones de pago.
- Un presupuesto solo puede generar una factura.
- Transición de estado: `aceptado` → `facturado` al generar la factura.

#### 10.4 → PRESUPUESTO_VERSION (uno a muchos)
- Si se modifica un presupuesto enviado, se crea una nueva versión manteniendo historial.
- Cada versión almacena el snapshot completo del presupuesto en ese momento.

### 11. Lógica de negocio y validaciones

1. **Al crear**: Estado siempre `borrador`. `fecha_creacion` automática. `numero` generado.
2. **Al enviar**: Cambiar estado a `enviado`. Registrar `fecha_envio`. Bloquear campos de desglose (solo editable con nueva versión).
3. **Al aceptar**: Cambiar estado a `aceptado`. Registrar `fecha_aceptacion`. Ofrecer opción de crear TRABAJO.
4. **Al rechazar**: Cambiar estado a `rechazado`. Registrar `fecha_rechazo` y `motivo_rechazo`.
5. **Al cancelar**: Cambiar estado a `cancelado`. Solo si estado es `borrador` o `enviado`.
6. **Al vencimiento**: Job periódico cambia `enviado` → `vencido` si `fecha_creacion + validez_dias < hoy`.
7. **Al facturar**: Cambiar estado a `facturado`. Vincular `factura_id`.
8. **Recalculo automático**: Cualquier cambio en líneas, materiales o mano de obra recalcula todos los totales.
9. **Validación de líneas**: No se permite guardar sin al menos una línea con cantidad > 0 y precio > 0.
10. **Duplicado**: Se puede duplicar un presupuesto (crea copia en `borrador` con nuevo `numero`).

### 12. Esquema YAML de ejemplo

```yaml
presupuesto:
  id: "550e8400-e29b-41d4-a716-446655440000"
  numero: "PRES-2026-0042"
  version: 1
  fecha_creacion: "2026-05-26T10:30:00+02:00"
  fecha_validez: "2026-06-25"
  estado: "enviado"

  cliente:
    id: "c1a2b3d4-e5f6-7890-abcd-ef1234567890"
    snapshot:
      nombre: "María García López"
      nif: "12345678A"
      direccion: "Calle Mayor 15, 3ºB, 28001 Madrid"
      email: "maria.garcia@email.com"
      telefono: "+34 612 345 678"

  lineas:
    - id: "l001"
      orden: 1
      tipo: "servicio"
      concepto: "Instalación cuadro eléctrico general 12 módulos"
      detalle: "Incluye empalmes, etiquetado y verificación"
      cantidad: 1
      unidad: "ud"
      precio_unitario: 350.00
      descuento_porcentaje: 0
      descuento_importe: 0
      subtotal: 350.00
      notas: null

    - id: "l002"
      orden: 2
      tipo: "servicio"
      concepto: "Cableado punto de luz adicional"
      detalle: "Cable 2.5mm² hasta ubicación indicada por cliente"
      cantidad: 3
      unidad: "punto"
      precio_unitario: 45.00
      descuento_porcentaje: 10
      descuento_importe: 13.50
      subtotal: 121.50

    - id: "l003"
      orden: 3
      tipo: "material"
      concepto: "Cuadro eléctrico Hager 12 módulos con IGA"
      cantidad: 1
      unidad: "ud"
      precio_unitario: 85.00
      descuento_porcentaje: 0
      descuento_importe: 0
      subtotal: 85.00

  materiales:
    - id: "m001"
      linea_padre_id: "l001"
      referencia: "HAG-VK12T"
      descripcion: "Cuadro empotrado 12 módulos con interruptor general"
      cantidad: 1
      unidad: "ud"
      precio_unitario: 85.00
      importe: 85.00
      proveedor: "Suministros Eléctricos S.L."
      incluido_en_precio: true

    - id: "m002"
      linea_padre_id: "l002"
      referencia: "CAB-25-BLANCO"
      descripcion: "Cable unipolar 2.5mm² blanco (bobina 100m)"
      cantidad: 0.5
      unidad: "bobina"
      precio_unitario: 28.00
      importe: 14.00
      proveedor: "Cables del Norte"
      incluido_en_precio: true

    - id: "m003"
      linea_padre_id: "l002"
      referencia: "TUB-25-FLEX"
      descripcion: "Tubo flexible corrugado 25mm"
      cantidad: 15
      unidad: "ml"
      precio_unitario: 1.20
      importe: 18.00
      proveedor: "Suministros Eléctricos S.L."
      incluido_en_precio: true

  mano_de_obra:
    - id: "mo001"
      linea_padre_id: "l001"
      descripcion: "Montaje cuadro, empalmes y pruebas"
      horas: 4
      tarifa_hora: 42.00
      tipo_tarifa: "normal"
      importe: 168.00
      tecnico_asignado: "Carlos (yo mismo)"

    - id: "mo002"
      linea_padre_id: "l002"
      descripcion: "Cableado, tubo y conexión de puntos"
      horas: 3
      tarifa_hora: 42.00
      tipo_tarifa: "normal"
      importe: 126.00
      tecnico_asignado: "Carlos (yo mismo)"

  impuestos:
    iva_porcentaje: 21.00
    iva_importe: 116.87
    irpf_aplicable: false
    irpf_porcentaje: 15.00
    irpf_importe: 0

  totales:
    base_imponible: 556.50
    total_descuentos: 13.50
    total_materiales: 117.00
    total_mano_de_obra: 294.00
    total_iva: 116.87
    total_irpf: 0
    total: 673.37
    moneda: "EUR"

  notas:
    notas_internas: "Cliente referido por Juan (fontanero). Casa reforma completa, posible cliente recurrente."
    notas_cliente: "Incluye 2 años de garantía en materiales y mano de obra. Los materiales están incluidos en los precios de las líneas de servicio."
    condiciones_pago: "50% al aceptar el presupuesto (336,69 EUR). 50% restante al finalizar la instalación."
    forma_pago: "transferencia"
    plazo_ejecucion: "2-3 días laborables"
    validez_dias: 30
    garantia: "24 meses en instalación. 12 meses en materiales a partir de la fecha de finalización."

  adjuntos:
    - id: "a001"
      nombre_archivo: "foto_cuadro_actual.jpg"
      url: "/storage/presupuestos/550e8400/foto_cuadro_actual.jpg"
      tipo: "foto"
      descripcion: "Estado actual del cuadro eléctrico"
      fecha_subida: "2026-05-26T10:15:00+02:00"

  relaciones:
    trabajo_id: null
    factura_id: null
```

### 13. Migración PostgreSQL

Genera la migración con las siguientes tablas:

```sql
-- Tabla principal
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autonomo_id UUID NOT NULL REFERENCES autonomos(id),
    numero VARCHAR(20) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_validez DATE NOT NULL,
    fecha_envio TIMESTAMPTZ,
    fecha_aceptacion TIMESTAMPTZ,
    fecha_rechazo TIMESTAMPTZ,
    motivo_rechazo TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador','enviado','aceptado','rechazado','cancelado','vencido','facturado')),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    cliente_snapshot JSONB NOT NULL,
    iva_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    iva_importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    irpf_aplicable BOOLEAN NOT NULL DEFAULT false,
    irpf_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    irpf_importe DECIMAL(12,2) NOT NULL DEFAULT 0,
    base_imponible DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_descuentos DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_materiales DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_mano_de_obra DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    moneda VARCHAR(3) NOT NULL DEFAULT 'EUR',
    notas_internas TEXT,
    notas_cliente TEXT,
    condiciones_pago TEXT,
    forma_pago VARCHAR(20) DEFAULT 'transferencia'
        CHECK (forma_pago IN ('transferencia','efectivo','tarjeta','domiciliacion','bizum','otro')),
    plazo_ejecucion VARCHAR(100),
    validez_dias INTEGER NOT NULL DEFAULT 30,
    garantia TEXT,
    trabajo_id UUID REFERENCES trabajos(id),
    factura_id UUID REFERENCES facturas(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(autonomo_id, numero)
);

-- Líneas de detalle
CREATE TABLE presupuesto_lineas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicio','material','desplazamiento','otro')),
    concepto TEXT NOT NULL,
    detalle TEXT,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    unidad VARCHAR(10) NOT NULL DEFAULT 'ud',
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    descuento_importe DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    notas TEXT
);

-- Materiales
CREATE TABLE presupuesto_materiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linea_id UUID NOT NULL REFERENCES presupuesto_lineas(id) ON DELETE CASCADE,
    referencia VARCHAR(50),
    descripcion TEXT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL CHECK (cantidad > 0),
    unidad VARCHAR(10) NOT NULL DEFAULT 'ud',
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    importe DECIMAL(10,2) NOT NULL DEFAULT 0,
    proveedor VARCHAR(200),
    incluido_en_precio BOOLEAN NOT NULL DEFAULT true
);

-- Mano de obra
CREATE TABLE presupuesto_mano_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linea_id UUID NOT NULL REFERENCES presupuesto_lineas(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    horas DECIMAL(6,2) NOT NULL CHECK (horas > 0),
    tarifa_hora DECIMAL(10,2) NOT NULL CHECK (tarifa_hora >= 0),
    tipo_tarifa VARCHAR(15) NOT NULL DEFAULT 'normal'
        CHECK (tipo_tarifa IN ('normal','nocturna','festivo','urgencia')),
    importe DECIMAL(10,2) NOT NULL DEFAULT 0,
    tecnico_asignado VARCHAR(200)
);

-- Adjuntos
CREATE TABLE presupuesto_adjuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('foto','plano','documento','presupuesto_proveedor','otro')),
    descripcion TEXT,
    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de versiones
CREATE TABLE presupuesto_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presupuesto_id UUID NOT NULL REFERENCES presupuestos(id),
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    fecha_version TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo_cambio TEXT
);

-- Índices
CREATE INDEX idx_presupuestos_autonomo ON presupuestos(autonomo_id);
CREATE INDEX idx_presupuestos_cliente ON presupuestos(cliente_id);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_fecha ON presupuestos(fecha_creacion);
CREATE INDEX idx_presupuestos_numero ON presupuestos(autonomo_id, numero);
```

### 14. Comportamiento esperado de la IA

Cuando el autónomo interactúa con la plataforma por voz o texto, la IA debe:

1. **Crear presupuesto**: "Haz un presupuesto para María García con la instalación del cuadro eléctrico y 3 puntos de luz" → La IA completa todos los campos, calcula materiales y mano de obra estimada, genera el YAML y lo guarda.

2. **Consultar presupuestos**: "¿Cuántos presupuestos tengo pendientes?" → Consulta por estado `enviado`.

3. **Modificar**: "Baja el precio de los puntos de luz a 40 euros" → Actualiza `precio_unitario`, recalcula todo.

4. **Enviar**: "Envía el presupuesto a María" → Cambia estado a `enviado`, genera PDF, envía por email/WhatsApp.

5. **Seguimiento**: "¿Qué presupuestos están próximos a vencer?" → Filtra por `fecha_creacion + validez_dias` dentro de los próximos 7 días.

6. **Convertir**: "María ha aceptado el presupuesto, créame el trabajo" → Cambia estado a `aceptado`, crea TRABAJO heredando datos.

7. **Duplicar**: "Copia el último presupuesto para otro cliente" → Duplica en `borrador` con nuevo `numero` y `cliente_id`.

### 15. Consideraciones fiscales españolas

- IVA general: 21%. Reducido: 10% (rehabilitación viviendas). Superreducido: 4% (determinadas situaciones).
- IRPF: 15% profesional estándar. 7% para nuevos autónomos (primeros 2 años).
- Los presupuestos no son documentos fiscales (no tienen validez tributaria), pero deben informar correctamente de impuestos para que la factura derivada sea correcta.
- El `numero` de presupuesto es independiente de la numeración de facturas.

---

## Entrega esperada

Genera:
1. El esquema YAML completo de la entidad con todos los campos, tipos, defaults y validaciones.
2. La migración PostgreSQL completa con tablas, constraints, índices y triggers de cálculo automático.
3. Un ejemplo realista de un presupuesto de electricista (el de arriba como referencia, genera otro diferente).
4. La documentación de endpoints API REST para CRUD completo.
5. El flujo de estados con diagrama textual.
