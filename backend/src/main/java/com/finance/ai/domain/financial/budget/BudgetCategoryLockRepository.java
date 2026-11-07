package com.finance.ai.domain.financial.budget;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BudgetCategoryLockRepository {
    List<BudgetCategoryLock> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    void replaceLocks(UUID userId, LocalDate monthReference, List<BudgetCategoryLock> locks);
}
