package com.finance.ai.application.financial.goal;

import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeleteSavingsGoalUseCase {

    private final SavingsGoalRepository savingsGoalRepository;

    public DeleteSavingsGoalUseCase(SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    @Transactional
    public void execute(UUID authenticatedUserId, UUID goalId) {
        var existing = savingsGoalRepository.findByIdAndUserId(goalId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Meta de economia não encontrada ou não pertence ao usuário."));

        savingsGoalRepository.deleteByIdAndUserId(existing.getId(), authenticatedUserId);
    }
}
