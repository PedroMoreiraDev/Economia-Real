-- =============================================================================
-- V9__add_user_preferences_and_budget_locks.sql: Preferências de Usuário e Travas de IA
-- Compatibilidade: PostgreSQL 16+
-- =============================================================================

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_category_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_reference DATE NOT NULL,
    locked_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_cat_month_lock UNIQUE (user_id, category_id, month_reference)
);

CREATE INDEX idx_budget_locks_user_month ON budget_category_locks(user_id, month_reference);

