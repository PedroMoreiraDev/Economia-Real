package com.finance.ai.infrastructure.persistence.financial.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SpringDataSavingsGoalRepository extends JpaRepository<SavingsGoalJpaEntity, UUID> {

    Optional<SavingsGoalJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    List<SavingsGoalJpaEntity> findByUserIdOrderByCreatedAtAsc(UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
