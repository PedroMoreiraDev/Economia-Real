package com.finance.ai.domain.financial.budget;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MonthlySpendingLimitRepository {
    Optional<MonthlySpendingLimit> findByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    List<MonthlySpendingLimit> findAllByUserId(UUID userId);
    MonthlySpendingLimit save(MonthlySpendingLimit limit);
    void deleteByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
}
