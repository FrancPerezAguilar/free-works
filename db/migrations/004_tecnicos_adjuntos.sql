-- ============================================
-- Migration 004: Técnicos + Adjuntos
--
-- IMPORTANTE: En la base de datos en producción estas tablas YA EXISTEN
-- con un esquema evolucionado (polimórfico para adjuntos, más campos en
-- técnicos). Esta migración queda como referencia para bases de datos
-- limpias.
--
-- Si tu base de datos ya tiene las tablas, esta migración es un no-op
-- y se debe saltar (el código de la API está adaptado al esquema real).
-- ============================================

-- Las tablas ya existen en la BD de producción con este esquema:
--
-- tecnicos (id, uuid, codigo_tecnico, nombre, apellidos, nif, telefono,
--          email, especialidad, nivel, coste_hora, dias_laborables,
--          hora_entrada, hora_salida, fecha_alta, fecha_baja, activo,
--          notas, fecha_creacion, fecha_modificacion)
--
-- trabajo_tecnicos (id, trabajo_id, tecnico_id, rol, fecha_asignacion,
--                   fecha_desasignacion, horas_estimadas, activo)
--   UNIQUE (trabajo_id, tecnico_id, activo)
--
-- adjuntos (id, uuid, entity_type, entity_id, nombre_original, tipo_mime,
--           tamano_bytes, ruta_archivo, descripcion, subido_por,
--           fecha_subida, activo)
--   entity_type discrimina: 'trabajo', 'cliente', 'presupuesto', 'factura', etc.

DO $$
BEGIN
    -- Si las tablas no existen (instalación limpia), las creamos.
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tecnicos') THEN
        CREATE TABLE tecnicos (
            id                  SERIAL PRIMARY KEY,
            uuid                UUID DEFAULT uuid_generate_v4() UNIQUE,
            codigo_tecnico      VARCHAR(20) UNIQUE,
            nombre              VARCHAR(255) NOT NULL,
            apellidos           VARCHAR(255),
            nif                 VARCHAR(20),
            telefono            VARCHAR(20),
            email               VARCHAR(255),
            especialidad        VARCHAR(100),
            nivel               VARCHAR(20),
            coste_hora          NUMERIC(10,2) DEFAULT 0,
            dias_laborables     TEXT[] DEFAULT ARRAY['L','M','X','J','V'],
            hora_entrada        TIME DEFAULT '08:00:00',
            hora_salida         TIME DEFAULT '17:00:00',
            fecha_alta          DATE DEFAULT CURRENT_DATE,
            fecha_baja          DATE,
            activo              BOOLEAN DEFAULT TRUE,
            notas               TEXT,
            fecha_creacion      TIMESTAMPTZ DEFAULT NOW(),
            fecha_modificacion  TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_tecnicos_nombre ON tecnicos(nombre);
        CREATE INDEX idx_tecnicos_activo ON tecnicos(activo);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trabajo_tecnicos') THEN
        CREATE TABLE trabajo_tecnicos (
            id                   SERIAL PRIMARY KEY,
            trabajo_id           INT NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
            tecnico_id           INT NOT NULL REFERENCES tecnicos(id) ON DELETE RESTRICT,
            rol                  VARCHAR(50),
            fecha_asignacion     DATE DEFAULT CURRENT_DATE,
            fecha_desasignacion  DATE,
            horas_estimadas      NUMERIC(6,2),
            activo               BOOLEAN DEFAULT TRUE,
            UNIQUE(trabajo_id, tecnico_id, activo)
        );
        CREATE INDEX idx_trabajo_tecnicos_trabajo ON trabajo_tecnicos(trabajo_id);
        CREATE INDEX idx_trabajo_tecnicos_tecnico ON trabajo_tecnicos(tecnico_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adjuntos') THEN
        CREATE TABLE adjuntos (
            id               SERIAL PRIMARY KEY,
            uuid             UUID DEFAULT uuid_generate_v4() UNIQUE,
            entity_type      VARCHAR(50) NOT NULL,
            entity_id        INT NOT NULL,
            nombre_original  VARCHAR(255) NOT NULL,
            tipo_mime        VARCHAR(100),
            tamano_bytes     INTEGER,
            ruta_archivo     TEXT,
            descripcion      TEXT,
            subido_por       VARCHAR(255),
            fecha_subida     TIMESTAMPTZ DEFAULT NOW(),
            activo           BOOLEAN DEFAULT TRUE
        );
        CREATE INDEX idx_adjuntos_entidad ON adjuntos(entity_type, entity_id);
    END IF;
END
$$;
