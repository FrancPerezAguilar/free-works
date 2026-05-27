
-- ============================================
-- Migration 002: Calendario
-- Tabla de eventos con fecha/hora, vinculable
-- a cualquier entidad (trabajo, tarea, reunión)
-- ============================================

CREATE TABLE IF NOT EXISTS calendario (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    titulo          VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    
    -- Fecha y hora del evento
    fecha_evento    DATE NOT NULL,
    hora_evento     TIME,
    hora_fin        TIME,
    duracion_min    INT DEFAULT 60,  -- Duración estimada en minutos
    
    -- Relación polimórfica con otras entidades
    entidad_tipo    VARCHAR(30),       -- 'trabajo', 'tarea', 'reunion', 'personal'
    entidad_id      INT,
    entidad_nombre  VARCHAR(255),      -- Denormalizado para consultas rápidas
    
    -- Cliente asociado (opcional)
    cliente_nombre  VARCHAR(255),
    cliente_id      INT,
    
    -- Ubicación
    ubicacion       VARCHAR(255),
    
    -- Estado
    estado          VARCHAR(20) DEFAULT 'pendiente',  -- pendiente | confirmado | completado | cancelado
    color           VARCHAR(7) DEFAULT '#3B82F6',     -- Color para UI (hex)
    
    -- Metadatos
    fecha_creacion  TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    notas           TEXT,
    
    activo          BOOLEAN DEFAULT TRUE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendario_fecha ON calendario(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_calendario_entidad ON calendario(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_calendario_estado ON calendario(estado);
CREATE INDEX IF NOT EXISTS idx_calendario_cliente ON calendario(cliente_id);
