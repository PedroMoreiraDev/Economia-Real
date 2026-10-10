package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListSavingsGoalsUseCase {

    private final SavingsGoalRepository savingsGoalRepository;

    public ListSavingsGoalsUseCase(SavingsGoalRepository savingsGoalRepository) {
        this.savingsGoalRepository = savingsGoalRepository;
    }

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> execute(UUID authenticatedUserId) {
        var goals = savingsGoalRepository.findByUserId(authenticatedUserId);

        return goals.stream().map(g -> new SavingsGoalResponse(
                g.getId(),
                g.getUserId(),
                g.getTitle(),
                g.getTargetAmount(),
                g.getCurrentAmount(),
                g.getRemainingAmount(),
                g.calculateProgressPercentage(),
                g.isReached(),
                g.getTargetDate(),
                g.getCreatedAt(),
                g.getUpdatedAt()
        )).toList();
    }
}
