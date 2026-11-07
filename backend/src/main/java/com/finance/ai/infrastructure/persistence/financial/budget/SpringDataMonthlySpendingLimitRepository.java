package com.finance.ai.infrastructure.persistence.financial.budget;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataMonthlySpendingLimitRepository extends JpaRepository<MonthlySpendingLimitJpaEntity, UUID> {
    Optional<MonthlySpendingLimitJpaEntity> findByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
    List<MonthlySpendingLimitJpaEntity> findAllByUserId(UUID userId);
    void deleteByUserIdAndMonthReference(UUID userId, LocalDate monthReference);
}

