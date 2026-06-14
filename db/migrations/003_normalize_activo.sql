-- ============================================
-- Migration 003: Normalize clientes.active → clientes.activo
-- Rest of the schema uses `activo`, clientes was inconsistent.
-- ============================================

ALTER TABLE clientes RENAME COLUMN active TO activo;
