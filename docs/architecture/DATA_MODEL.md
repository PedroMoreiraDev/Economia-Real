# Modelo de Dados Conceitual e Relacional (DATA_MODEL.md)

Este documento descreve o modelo conceitual de domínio e o esquema relacional inicial planejado para o PostgreSQL 16+, detalhando entidades, relacionamentos, tipos de dados, restrições e regras de integridade.

---

## 1. Princípios Gerais de Modelagem

1. **Identificadores Únicos Imutáveis:** Todas as tabelas utilizam chaves primárias do tipo `UUID` (geradas de forma segura e não sequencial) para evitar enumeração de recursos e facilitar integrações e sincronizações offline.
2. **Precisão Monetária Obrigatória:** Campos de valores financeiros utilizam estritamente `NUMERIC(15, 2)`. Proibido o uso de `FLOAT` ou `DOUBLE PRECISION`.
3. **Temporalidade e Fuso Horário:** Datas sem horário de corte (como competência financeira) utilizam `DATE`. Momentos específicos de auditoria e criação utilizam `TIMESTAMPTZ` (UTC).
4. **Isolamento de Tenant (Usuário):** Toda tabela de dados do usuário possui uma chave estrangeira obrigatória `user_id` não-nula com índice associado e restrição de `ON DELETE CASCADE`.
5. **Auditoria Padrão:** Todas as entidades possuem colunas `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` e `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

---

## 2. Diagrama Entidade-Relacionamento Conceitual

```
 [users] 1 ────────── * [accounts]
    │ 1 ───────────── * [credit_cards] 1 ─────── * [credit_card_invoices]
    │ 1 ───────────── * [categories]
    │ 1 ───────────── * [transactions] ──* [categories]
    │                         ├── [accounts] (opcional se cartão)
    │                         └── [credit_card_invoices] (se cartão)
    │ 1 ───────────── * [recurring_bills]
    │ 1 ───────────── * [budgets] ────── 1 [categories]
    │ 1 ───────────── * [savings_goals]
    └ 1 ───────────── * [import_batches]
```

---

## 3. Especificação das Tabelas Relacionais

### 3.1. Tabela `users`
Armazena a identidade do usuário para autenticação e isolamento.
- `id`: `UUID PRIMARY KEY`
- `email`: `VARCHAR(255) NOT NULL UNIQUE`
- `password_hash`: `VARCHAR(255) NOT NULL`
- `full_name`: `VARCHAR(150) NOT NULL`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`

### 3.2. Tabela `accounts`
Contas correntes, carteiras, contas poupança ou investimentos.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `name`: `VARCHAR(100) NOT NULL` (ex.: "Nubank Conta Corrente", "Carteira Dinheiro")
- `type`: `VARCHAR(30) NOT NULL` (`CHECK (type IN ('CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH'))`)
- `initial_balance`: `NUMERIC(15, 2) NOT NULL DEFAULT 0.00`
- `currency`: `VARCHAR(3) NOT NULL DEFAULT 'BRL'`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`
- **Índice:** `CREATE INDEX idx_accounts_user_id ON accounts(user_id);`

### 3.3. Tabela `credit_cards`
Cartões de crédito com suas regras de fechamento e vencimento de fatura.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `name`: `VARCHAR(100) NOT NULL` (ex.: "XP Visa Infinite")
- `credit_limit`: `NUMERIC(15, 2) NOT NULL`
- `closing_day`: `INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31)`
- `due_day`: `INT NOT NULL CHECK (due_day BETWEEN 1 AND 31)`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`

### 3.4. Tabela `credit_card_invoices`
Agrupamento mensal das faturas de cartão.
- `id`: `UUID PRIMARY KEY`
- `credit_card_id`: `UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE`
- `reference_month`: `DATE NOT NULL` (primeiro dia do mês de referência, ex.: 2026-10-01)
- `closing_date`: `DATE NOT NULL`
- `due_date`: `DATE NOT NULL`
- `status`: `VARCHAR(20) NOT NULL DEFAULT 'OPEN'` (`CHECK (status IN ('OPEN', 'CLOSED', 'PAID', 'OVERDUE'))`)
- `paid_amount`: `NUMERIC(15, 2) NOT NULL DEFAULT 0.00`
- `paid_at`: `TIMESTAMPTZ NULL`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`
- **Restrição de Unicidade:** `UNIQUE (credit_card_id, reference_month)`

### 3.5. Tabela `categories`
Categorização das transações com suporte a hierarquia (categoria-pai).
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `parent_id`: `UUID NULL REFERENCES categories(id) ON DELETE SET NULL`
- `name`: `VARCHAR(100) NOT NULL`
- `icon`: `VARCHAR(50) NULL`
- `color_hex`: `VARCHAR(7) NULL`
- `is_system_default`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`
- **Índice:** `CREATE INDEX idx_categories_user ON categories(user_id);`

### 3.6. Tabela `transactions`
Tabela central de lançamentos de receitas, despesas, transferências e parcelas.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `type`: `VARCHAR(20) NOT NULL` (`CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'INVOICE_PAYMENT'))`)
- `amount`: `NUMERIC(15, 2) NOT NULL CHECK (amount > 0)`
- `accrual_date`: `DATE NOT NULL` (Data de competência do fato gerador)
- `settlement_date`: `DATE NULL` (Data efetiva de pagamento/liquidação)
- `description`: `VARCHAR(255) NOT NULL`
- `account_id`: `UUID NULL REFERENCES accounts(id) ON DELETE RESTRICT`
- `destination_account_id`: `UUID NULL REFERENCES accounts(id) ON DELETE RESTRICT` (utilizado se `type = 'TRANSFER'`)
- `invoice_id`: `UUID NULL REFERENCES credit_card_invoices(id) ON DELETE SET NULL`
- `category_id`: `UUID NULL REFERENCES categories(id) ON DELETE SET NULL`
- `status`: `VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'` (`CHECK (status IN ('PENDING', 'COMPLETED', 'REFUNDED'))`)
- `origin`: `VARCHAR(20) NOT NULL DEFAULT 'MANUAL'` (`CHECK (origin IN ('MANUAL', 'CSV_IMPORT', 'OFX_IMPORT', 'AI_TEXT', 'AI_AUDIO'))`)
- `import_batch_id`: `UUID NULL REFERENCES import_batches(id) ON DELETE SET NULL`
- `external_id`: `VARCHAR(255) NULL` (Identificador único vindo do arquivo OFX/banco para deduplicação)
- `installment_number`: `INT NULL` (ex.: 1)
- `total_installments`: `INT NULL` (ex.: 10)
- `parent_transaction_id`: `UUID NULL REFERENCES transactions(id) ON DELETE CASCADE` (agrupador da compra parcelada total)
- `notes`: `TEXT NULL`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`
- **Índices Críticos:**
  - `CREATE INDEX idx_trans_user_date ON transactions(user_id, accrual_date DESC);`
  - `CREATE INDEX idx_trans_account ON transactions(account_id);`
  - `CREATE INDEX idx_trans_invoice ON transactions(invoice_id);`
  - `CREATE INDEX idx_trans_category ON transactions(category_id);`
  - `CREATE UNIQUE INDEX idx_trans_dedup ON transactions(user_id, account_id, external_id) WHERE external_id IS NOT NULL;`

### 3.7. Tabela `recurring_bills`
Despesas recorrentes e fixas (aluguel, assinaturas).
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `category_id`: `UUID NULL REFERENCES categories(id) ON DELETE SET NULL`
- `account_id`: `UUID NULL REFERENCES accounts(id) ON DELETE SET NULL`
- `credit_card_id`: `UUID NULL REFERENCES credit_cards(id) ON DELETE SET NULL`
- `description`: `VARCHAR(255) NOT NULL`
- `amount`: `NUMERIC(15, 2) NOT NULL`
- `frequency`: `VARCHAR(20) NOT NULL DEFAULT 'MONTHLY'` (`CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'YEARLY'))`)
- `day_of_month`: `INT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31)`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`

### 3.8. Tabela `budgets`
Orçamento mensal e limites por categoria.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `category_id`: `UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE`
- `month_reference`: `DATE NOT NULL` (ex.: 2026-10-01)
- `monthly_limit`: `NUMERIC(15, 2) NOT NULL CHECK (monthly_limit > 0)`
- `alert_threshold_percentage`: `INT NOT NULL DEFAULT 80`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`
- **Restrição de Unicidade:** `UNIQUE (user_id, category_id, month_reference)`

### 3.9. Tabela `savings_goals`
Metas de economia e patrimônio.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `title`: `VARCHAR(150) NOT NULL`
- `target_amount`: `NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0)`
- `current_amount`: `NUMERIC(15, 2) NOT NULL DEFAULT 0.00`
- `target_date`: `DATE NULL`
- `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL`

### 3.10. Tabela `import_batches`
Rastreabilidade e auditoria de extratos bancários importados.
- `id`: `UUID PRIMARY KEY`
- `user_id`: `UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
- `account_id`: `UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE`
- `file_name`: `VARCHAR(255) NOT NULL`
- `file_type`: `VARCHAR(10) NOT NULL` (`CHECK (file_type IN ('CSV', 'OFX'))`)
- `imported_count`: `INT NOT NULL DEFAULT 0`
- `skipped_count`: `INT NOT NULL DEFAULT 0` (duplicidades ignoradas)
- `status`: `VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'`
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 4. Estratégias de Integridade e Deduplicação

1. **Deduplicação de Extratos OFX:** A maioria dos arquivos OFX contém a tag `<FITID>`, um identificador persistente fornecido pela instituição bancária. Ao importar, salvamos esse valor em `external_id`. O índice único condicional `(user_id, account_id, external_id)` impede duplicidade física.
2. **Deduplicação Heurística de Extratos CSV:** Para arquivos CSV sem `external_id`, calculamos um hash determinístico `SHA-256(user_id + account_id + date + amount + description)`. Na pré-visualização, transações com esse hash já existente são sinalizadas como "Possível Duplicidade", exigindo confirmação explícita do usuário.
3. **Imutabilidade de Parcelamentos:** Ao editar o valor total de uma compra parcelada, o backend atualiza as parcelas futuras não liquidadas, preservando o histórico de parcelas já fechadas e pagas.
