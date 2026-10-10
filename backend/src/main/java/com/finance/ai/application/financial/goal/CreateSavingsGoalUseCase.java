package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.goal.dto.CreateSavingsGoalCommand;
import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.domain.financial.goal.SavingsGoal;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class CreateSavingsGoalUseCase {

    private final SavingsGoalRepository savingsGoalRepository;

    public CreateSavingsGoalUseCase(SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    @Transactional
    public SavingsGoalResponse execute(UUID authenticatedUserId, CreateSavingsGoalCommand cmd) {
        var goal = SavingsGoal.create(
                authenticatedUserId,
                cmd.title(),
                cmd.targetAmount(),
                cmd.targetDate()
        );

        var saved = savingsGoalRepository.save(goal);

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
