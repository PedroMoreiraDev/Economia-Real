package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.application.financial.goal.dto.UpdateSavingsGoalCommand;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UpdateSavingsGoalUseCase {

    private final SavingsGoalRepository savingsGoalRepository;

    public UpdateSavingsGoalUseCase(SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    @Transactional
    public SavingsGoalResponse execute(UUID authenticatedUserId, UUID goalId, UpdateSavingsGoalCommand cmd) {
        var existing = savingsGoalRepository.findByIdAndUserId(goalId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Meta de economia não encontrada ou não pertence ao usuário."));

        var updated = existing.update(
                cmd.title(),
                cmd.targetAmount(),
                cmd.targetDate()
        );

        var saved = savingsGoalRepository.save(updated);

        return new SavingsGoalResponse(
                saved.getId(),
                saved.getUserId(),
                saved.getTitle(),
                saved.getTargetAmount(),
                saved.getCurrentAmount(),
                saved.getRemainingAmount(),
                saved.calculateProgressPercentage(),
                saved.isReached(),
                saved.getTargetDate(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }
}
