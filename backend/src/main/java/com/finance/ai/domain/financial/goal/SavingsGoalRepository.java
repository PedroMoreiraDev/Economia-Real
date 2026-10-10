package com.finance.ai.domain.financial.goal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Porta de persistência de domínio para metas de economia.
 */
public interface SavingsGoalRepository {

    SavingsGoal save(SavingsGoal goal);

    Optional<SavingsGoal> findByIdAndUserId(UUID id, UUID userId);

    List<SavingsGoal> findByUserId(UUID userId);

    void deleteByIdAndUserId(UUID id, UUID userId);
}
