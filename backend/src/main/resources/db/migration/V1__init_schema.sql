-- =============================================================================
-- V1__init_schema.sql: Esquema Relacional Inicial da Plataforma de Finanças
-- Compatibilidade: PostgreSQL 16+
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuários e Autenticação
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Contas Financeiras (Corrente, Poupança, Dinheiro, Investimentos)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH')),
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- 3. Cartões de Crédito
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    credit_limit NUMERIC(15, 2) NOT NULL CHECK (credit_limit >= 0),
    closing_day INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);

-- 4. Faturas Mensais de Cartão de Crédito
CREATE TABLE credit_card_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL,
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PAID', 'OVERDUE')),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_card_invoice_month UNIQUE (credit_card_id, reference_month)
);
CREATE INDEX idx_invoices_card_id ON credit_card_invoices(credit_card_id);

-- 5. Categorias de Gastos e Receitas
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NULL,
    color_hex VARCHAR(7) NULL,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- 6. Lotes de Importação de Extratos (Auditoria)
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('CSV', 'OFX')),
    imported_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_batches_user_id ON import_batches(user_id);

-- 7. Transações Centrais (Receitas, Despesas, Transferências e Parcelamentos)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'INVOICE_PAYMENT')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    accrual_date DATE NOT NULL,
    settlement_date DATE NULL,
    description VARCHAR(255) NOT NULL,
    account_id UUID NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    destination_account_id UUID NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    invoice_id UUID NULL REFERENCES credit_card_invoices(id) ON DELETE SET NULL,
    category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED')),
    origin VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (origin IN ('MANUAL', 'CSV_IMPORT', 'OFX_IMPORT', 'AI_TEXT', 'AI_AUDIO')),
    import_batch_id UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL,
    external_id VARCHAR(255) NULL,
    installment_number INT NULL,
    total_installments INT NULL,
    parent_transaction_id UUID NULL REFERENCES transactions(id) ON DELETE CASCADE,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_trans_user_date ON transactions(user_id, accrual_date DESC);
CREATE INDEX idx_trans_account ON transactions(account_id);
CREATE INDEX idx_trans_invoice ON transactions(invoice_id);
CREATE INDEX idx_trans_category ON transactions(category_id);
CREATE UNIQUE INDEX idx_trans_dedup ON transactions(user_id, account_id, external_id) WHERE external_id IS NOT NULL;

-- 8. Despesas Fixas e Recorrentes
CREATE TABLE recurring_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NULL REFERENCES categories(id) ON DELETE SET NULL,
    account_id UUID NULL REFERENCES accounts(id) ON DELETE SET NULL,
    credit_card_id UUID NULL REFERENCES credit_cards(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY')),
    day_of_month INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recurring_bills_user_id ON recurring_bills(user_id);

-- 9. Orçamentos Mensais por Categoria
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_reference DATE NOT NULL,
    monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit > 0),
    alert_threshold_percentage INT NOT NULL DEFAULT 80,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_category_month UNIQUE (user_id, category_id, month_reference)
);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);

-- 10. Metas de Economia
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
