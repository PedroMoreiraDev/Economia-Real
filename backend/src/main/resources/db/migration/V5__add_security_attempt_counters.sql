-- =============================================================================
-- V5__add_security_attempt_counters.sql: Proteção Anti-Força Bruta para Códigos de 6 Dígitos
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_attempts INT NOT NULL DEFAULT 0;
