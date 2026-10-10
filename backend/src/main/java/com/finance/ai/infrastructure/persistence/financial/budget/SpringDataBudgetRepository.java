package com.finance.ai.infrastructure.persistence.financial.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataBudgetRepository extends JpaRepository<BudgetJpaEntity, UUID> {
    Optional<BudgetJpaEntity> findByIdAndUserId(UUID id, UUID userId);
    Optional<BudgetJpaEntity> findByUserIdAndCategoryIdAndMonthReference(UUID userId, UUID categoryId, LocalDate monthReference);
    List<BudgetJpaEntity> findAllByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    List<BudgetJpaEntity> findAllByUserId(UUID userId);
    void deleteByIdAndUserId(UUID id, UUID userId);
}
