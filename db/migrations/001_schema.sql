-- ============================================
-- AI-First Autónomos - Schema PostgreSQL
-- Migration 001: Initial schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_cliente      VARCHAR(20) UNIQUE,

    tipo_cliente        VARCHAR(20) DEFAULT 'persona_fisica',
    nombre              VARCHAR(255) NOT NULL,
    apellidos           VARCHAR(255),
    nif_cif             VARCHAR(20),
    documento_identidad VARCHAR(50),

    telefono_principal  VARCHAR(20),
    telefono_secundario VARCHAR(20),
    email               VARCHAR(255),
    whatsapp            BOOLEAN DEFAULT FALSE,
    contacto_preferido  VARCHAR(20) DEFAULT 'telefono',
    horario_contacto    VARCHAR(100),

    direccion_calle         VARCHAR(255),
    direccion_numero        VARCHAR(20),
    direccion_piso_puerta   VARCHAR(50),
    direccion_codigo_postal VARCHAR(10),
    direccion_municipio     VARCHAR(100),
    direccion_provincia     VARCHAR(100),
    direccion_comunidad     VARCHAR(100),
    direccion_pais         VARCHAR(100) DEFAULT 'España',

    regimen_iva         VARCHAR(30) DEFAULT 'general',
    tipo_iva_aplicable  NUMERIC(5,2) DEFAULT 21.00,
    retencion_irpf      NUMERIC(5,2) DEFAULT 15.00,
    forma_pago_preferida VARCHAR(30) DEFAULT 'transferencia',
    datos_bancarios_iban VARCHAR(34),
    datos_bancarios_titular VARCHAR(255),
    condiciones_pago_plazo_dias   INT DEFAULT 30,
    condiciones_pago_descuento_pp NUMERIC(5,2) DEFAULT 0,

    notas_internas              TEXT,
    etiquetas                   TEXT[],
    origen_cliente              VARCHAR(30) DEFAULT 'desconocido',
    cliente_referido_por        VARCHAR(20),

    total_facturado         NUMERIC(12,2) DEFAULT 0,
    total_pendiente_cobro   NUMERIC(12,2) DEFAULT 0,
    ultima_factura_fecha    DATE,
    ultimo_trabajo_fecha    DATE,
    frecuencia_contratacion VARCHAR(50),

    estado              VARCHAR(30) DEFAULT 'activo',
    visibilidad         VARCHAR(20) DEFAULT 'privado',
    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion  TIMESTAMPTZ DEFAULT NOW(),
    score_cliente       INT DEFAULT 0,
    riesgo_impago       VARCHAR(10) DEFAULT 'bajo',

    active              BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 2. MATERIALES (Catálogo)
-- ============================================
CREATE TABLE IF NOT EXISTS materiales (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_material     VARCHAR(20) UNIQUE,

    nombre              VARCHAR(255) NOT NULL,
    descripcion         TEXT,
    categoria           VARCHAR(50),
    subcategoria        VARCHAR(50),
    tags                TEXT[],

    proveedor_nombre            VARCHAR(255),
    proveedor_referencia_cliente VARCHAR(100),

    precio_unitario     NUMERIC(12,2) DEFAULT 0,
    iva_porcentaje      NUMERIC(5,2) DEFAULT 21.00,
    precio_con_iva      NUMERIC(12,2) DEFAULT 0,
    moneda              VARCHAR(3) DEFAULT 'EUR',

    unidad_medida       VARCHAR(20) DEFAULT 'ud',
    stock_actual        NUMERIC(10,2) DEFAULT 0,
    stock_minimo        NUMERIC(10,2) DEFAULT 0,
    stock_maximo        NUMERIC(10,2) DEFAULT 0,
    ubicacion_almacen   VARCHAR(100),

    referencia_fabricante VARCHAR(100),
    codigo_barras        VARCHAR(50),
    fabricante           VARCHAR(255),

    activo              BOOLEAN DEFAULT TRUE,
    notas               TEXT,
    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. OPORTUNIDADES
-- ============================================
CREATE TABLE IF NOT EXISTS oportunidades (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_oportunidad  VARCHAR(20) UNIQUE,

    titulo              VARCHAR(255) NOT NULL,
    descripcion         TEXT,

    cliente_id          INT REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre      VARCHAR(255),

    estado              VARCHAR(20) DEFAULT 'nueva',
    origen              VARCHAR(20) DEFAULT 'directo',
    probabilidad_cierre INT DEFAULT 0,

    presupuesto_estimado NUMERIC(12,2) DEFAULT 0,
    importe_final        NUMERIC(12,2) DEFAULT 0,

    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_contacto      DATE,
    fecha_cierre_estimada DATE,
    fecha_cierre_real   DATE,

    ultimo_contacto     DATE,
    proximo_contacto    DATE,
    notas_seguimiento   TEXT,

    presupuesto_id      INT,

    activo              BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 4. PRESUPUESTOS
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_presupuesto  VARCHAR(20) UNIQUE,

    titulo              VARCHAR(255) NOT NULL,
    descripcion         TEXT,

    cliente_id          INT REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre      VARCHAR(255),
    oportunidad_id      INT REFERENCES oportunidades(id) ON DELETE SET NULL,
    trabajo_id          INT,

    fecha_emision       DATE DEFAULT CURRENT_DATE,
    fecha_validez       DATE,
    estado              VARCHAR(20) DEFAULT 'borrador',
    validez_dias        INT DEFAULT 30,

    base_imponible      NUMERIC(12,2) DEFAULT 0,
    iva                 NUMERIC(12,2) DEFAULT 0,
    tipo_iva            NUMERIC(5,2) DEFAULT 21.00,
    retencion_irpf      NUMERIC(12,2) DEFAULT 0,
    total               NUMERIC(12,2) DEFAULT 0,

    condiciones_pago    TEXT,
    plazo_entrega       VARCHAR(100),
    notas               TEXT,
    validez_oferta      INT DEFAULT 30,

    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion  TIMESTAMPTZ DEFAULT NOW(),
    fecha_aceptacion    DATE,
    fecha_rechazo       DATE,
    motivo_rechazo      TEXT,

    activo              BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 5. TRABAJOS
-- ============================================
CREATE TABLE IF NOT EXISTS trabajos (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_trabajo      VARCHAR(20) UNIQUE,

    titulo              VARCHAR(255) NOT NULL,
    descripcion         TEXT,

    cliente_id          INT REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre      VARCHAR(255),
    oportunidad_id      INT REFERENCES oportunidades(id) ON DELETE SET NULL,
    presupuesto_id      INT REFERENCES presupuestos(id) ON DELETE SET NULL,
    factura_id          INT,

    obra_calle              VARCHAR(255),
    obra_numero             VARCHAR(20),
    obra_piso_puerta        VARCHAR(50),
    obra_codigo_postal      VARCHAR(10),
    obra_municipio          VARCHAR(100),
    obra_provincia          VARCHAR(100),
    obra_notas_acceso       TEXT,

    fecha_inicio        DATE,
    fecha_fin_estimada  DATE,
    fecha_fin_real      DATE,

    estado              VARCHAR(20) DEFAULT 'pendiente',
    prioridad           VARCHAR(10) DEFAULT 'media',

    total_horas         NUMERIC(10,2) DEFAULT 0,
    coste_materiales    NUMERIC(12,2) DEFAULT 0,
    coste_mano_obra     NUMERIC(12,2) DEFAULT 0,
    coste_total         NUMERIC(12,2) DEFAULT 0,

    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion  TIMESTAMPTZ DEFAULT NOW(),
    activo              BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 6. FACTURAS
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
    numero_factura      VARCHAR(30) UNIQUE,
    tipo                VARCHAR(20) DEFAULT 'normal',

    cliente_id          INT REFERENCES clientes(id) ON DELETE RESTRICT,
    cliente_nombre      VARCHAR(255),
    nif_cif_cliente     VARCHAR(20),
    trabajo_id          INT REFERENCES trabajos(id) ON DELETE SET NULL,
    presupuesto_id      INT REFERENCES presupuestos(id) ON DELETE SET NULL,

    factura_direccion_calle         VARCHAR(255),
    factura_direccion_numero        VARCHAR(20),
    factura_direccion_codigo_postal VARCHAR(10),
    factura_direccion_municipio     VARCHAR(100),
    factura_direccion_provincia     VARCHAR(100),

    fecha_emision       DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento   DATE,
    fecha_pago          DATE,

    emisor_nombre       VARCHAR(255),
    emisor_nif          VARCHAR(20),
    emisor_direccion    VARCHAR(255),
    regimen_iva         VARCHAR(30) DEFAULT 'general',

    base_imponible      NUMERIC(12,2) DEFAULT 0,
    iva                 NUMERIC(12,2) DEFAULT 0,
    tipo_iva            NUMERIC(5,2) DEFAULT 21.00,
    retencion_irpf      NUMERIC(12,2) DEFAULT 0,
    total               NUMERIC(12,2) DEFAULT 0,

    estado_pago         VARCHAR(20) DEFAULT 'pendiente',
    forma_pago          VARCHAR(30) DEFAULT 'transferencia',
    datos_bancarios_iban VARCHAR(34),
    datos_bancarios_titular VARCHAR(255),

    fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion  TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio         DATE,
    fecha_recordatorio  DATE,

    activo              BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLAS AUXILIARES
-- ============================================

CREATE TABLE IF NOT EXISTS trabajo_checklist (
    id                  SERIAL PRIMARY KEY,
    trabajo_id          INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    uuid                UUID DEFAULT uuid_generate_v4(),

    descripcion         TEXT NOT NULL,
    completada          BOOLEAN DEFAULT FALSE,
    fecha_programada    DATE,
    hora_programada     TIME,
    fecha_completada    TIMESTAMPTZ,
    notas               TEXT
);

CREATE TABLE IF NOT EXISTS trabajo_tiempos (
    id                  SERIAL PRIMARY KEY,
    trabajo_id          INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    uuid                UUID DEFAULT uuid_generate_v4(),

    fecha               DATE NOT NULL,
    hora_inicio         TIME,
    hora_fin            TIME,
    horas               NUMERIC(5,2) NOT NULL,
    descripcion         TEXT
);

CREATE TABLE IF NOT EXISTS trabajo_materiales (
    id                  SERIAL PRIMARY KEY,
    trabajo_id          INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    material_id         INT REFERENCES materiales(id) ON DELETE RESTRICT,

    material_nombre     VARCHAR(255),
    cantidad_usada      NUMERIC(10,2) NOT NULL,
    unidad              VARCHAR(20),
    precio_unitario     NUMERIC(12,2) DEFAULT 0,
    subtotal            NUMERIC(12,2) DEFAULT 0,
    notas               TEXT
);

CREATE TABLE IF NOT EXISTS presupuesto_lineas (
    id                  SERIAL PRIMARY KEY,
    presupuesto_id      INT NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,

    descripcion         TEXT NOT NULL,
    cantidad            NUMERIC(10,2) DEFAULT 1,
    unidad              VARCHAR(20),
    precio_unitario     NUMERIC(12,2) DEFAULT 0,
    importe             NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS factura_lineas (
    id                  SERIAL PRIMARY KEY,
    factura_id          INT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,

    descripcion         TEXT NOT NULL,
    cantidad            NUMERIC(10,2) DEFAULT 1,
    unidad              VARCHAR(20),
    precio_unitario     NUMERIC(12,2) DEFAULT 0,
    importe             NUMERIC(12,2) DEFAULT 0
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trabajos_cliente ON trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado);
CREATE INDEX IF NOT EXISTS idx_trabajos_fecha_inicio ON trabajos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_checklist_fecha ON trabajo_checklist(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_checklist_trabajo ON trabajo_checklist(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_tiempos_trabajo ON trabajo_tiempos(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_materiales_trabajo ON trabajo_materiales(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente ON oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente ON presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_lineas ON presupuesto_lineas(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_factura_lineas ON factura_lineas(factura_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono_principal);
CREATE INDEX IF NOT EXISTS idx_clientes_nif ON clientes(nif_cif);
CREATE INDEX IF NOT EXISTS idx_materiales_categoria ON materiales(categoria);
