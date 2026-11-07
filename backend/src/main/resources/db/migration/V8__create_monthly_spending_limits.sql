-- =============================================================================
-- V8__create_monthly_spending_limits.sql: Teto de Gastos Global Mensal por Usuário
-- Compatibilidade: PostgreSQL 16+
-- =============================================================================

CREATE TABLE monthly_spending_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_reference DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_month_spending_limit UNIQUE (user_id, month_reference)
);

CREATE INDEX idx_monthly_spending_limits_user ON monthly_spending_limits(user_id);
