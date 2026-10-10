package com.finance.ai.domain.financial.budget;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository {
    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);
    Optional<Budget> findByUserIdAndCategoryIdAndMonthReference(UUID userId, UUID categoryId, LocalDate monthReference);
    List<Budget> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    List<Budget> findAllByUserId(UUID userId);
    Budget save(Budget budget);
    void deleteByIdAndUserId(UUID id, UUID userId);
}
