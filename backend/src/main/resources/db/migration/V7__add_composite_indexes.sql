-- Migração V7: Adição de índices compostos para otimização de alta performance em consultas de extrato e relatórios
-- Otimiza consultas frequentes: WHERE user_id = :userId AND accrual_date BETWEEN :start AND :end
CREATE INDEX IF NOT EXISTS idx_transactions_user_accrual_date 
ON transactions(user_id, accrual_date DESC);

-- Otimiza agrupamentos por categoria e teto orçamentário: WHERE user_id = :userId AND category_id = :categoryId
CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
ON transactions(user_id, category_id);

-- Otimiza conciliação de faturas de cartão de crédito: WHERE credit_card_id = :cardId AND accrual_date BETWEEN :start AND :end
CREATE INDEX IF NOT EXISTS idx_transactions_card_accrual 
ON transactions(credit_card_id, accrual_date DESC);

-- Otimiza busca de metas por usuário e período de referência
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_ref 
ON budgets(user_id, month_reference);
