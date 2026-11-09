package com.finance.ai.infrastructure.persistence.financial.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SpringDataBudgetCategoryLockRepository extends JpaRepository<BudgetCategoryLockJpaEntity, UUID> {
    List<BudgetCategoryLockJpaEntity> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    void deleteAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
}

