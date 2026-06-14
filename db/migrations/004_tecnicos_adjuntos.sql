-- ============================================
-- Migration 004: Técnicos + Adjuntos
-- Tabla de técnicos del catálogo y asignación a trabajos.
-- Tabla de adjuntos (fotos, PDFs, audios, documentos) por trabajo.
-- ============================================

CREATE TABLE IF NOT EXISTS tecnicos (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4() UNIQUE,
    codigo_tecnico  VARCHAR(20) UNIQUE,

    nombre          VARCHAR(255) NOT NULL,
    apellidos       VARCHAR(255),
    especialidad    VARCHAR(100),
    telefono        VARCHAR(20),
    email           VARCHAR(255),
    nif_cif         VARCHAR(20),
    notas           TEXT,

    activo          BOOLEAN DEFAULT TRUE,
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW(),
    fecha_modificacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tecnicos_nombre ON tecnicos(nombre);
CREATE INDEX IF NOT EXISTS idx_tecnicos_activo ON tecnicos(activo);

-- Asignación N:M de técnicos a trabajos con horas dedicadas
CREATE TABLE IF NOT EXISTS trabajo_tecnicos (
    id              SERIAL PRIMARY KEY,
    trabajo_id      INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
    tecnico_id      INT NOT NULL REFERENCES tecnicos(id) ON DELETE RESTRICT,
    horas           NUMERIC(6,2) DEFAULT 0,
    rol             VARCHAR(50),
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trabajo_id, tecnico_id)
);

CREATE INDEX IF NOT EXISTS idx_trabajo_tecnicos_trabajo ON trabajo_tecnicos(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_trabajo_tecnicos_tecnico ON trabajo_tecnicos(tecnico_id);

-- Adjuntos por trabajo (fotos, PDFs, audios, documentos)
CREATE TABLE IF NOT EXISTS adjuntos (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4() UNIQUE,
    trabajo_id      INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,

    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('foto','pdf','audio','documento')),
    nombre_archivo  VARCHAR(255) NOT NULL,
    ruta_archivo    VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100),
    tamano_bytes    BIGINT,
    descripcion     TEXT,
    subido_por      VARCHAR(100),

    fecha_subida    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adjuntos_trabajo ON adjuntos(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_adjuntos_tipo ON adjuntos(tipo);
