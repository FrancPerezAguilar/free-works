CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    telefono VARCHAR(20) NOT NULL,
    nombre VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    contacted BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'landing'
);

CREATE INDEX IF NOT EXISTS idx_waitlist_telefono ON waitlist(telefono);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at);
