-- =============================================================================
-- V4__add_password_reset.sql: Recuperação de Senha por E-mail com Código de 6 Dígitos
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_password_reset ON users(email, password_reset_code);
