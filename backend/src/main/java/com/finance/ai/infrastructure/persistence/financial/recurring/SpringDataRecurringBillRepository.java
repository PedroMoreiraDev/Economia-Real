package com.finance.ai.infrastructure.persistence.financial.recurring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataRecurringBillRepository extends JpaRepository<RecurringBillJpaEntity, UUID> {

    Optional<RecurringBillJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    List<RecurringBillJpaEntity> findByUserIdOrderByDayOfMonthAsc(UUID userId);

    List<RecurringBillJpaEntity> findByUserIdAndActiveOrderByDayOfMonthAsc(UUID userId, boolean active);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
