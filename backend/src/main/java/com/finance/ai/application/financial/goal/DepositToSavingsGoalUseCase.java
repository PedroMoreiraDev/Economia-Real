package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.goal.dto.DepositGoalCommand;
import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class DepositToSavingsGoalUseCase {

    private final SavingsGoalRepository savingsGoalRepository;
    private final CreateTransactionUseCase createTransactionUseCase;

    public DepositToSavingsGoalUseCase(SavingsGoalRepository savingsGoalRepository,
                                      CreateTransactionUseCase createTransactionUseCase) {
        this.savingsGoalRepository = savingsGoalRepository;
        this.createTransactionUseCase = createTransactionUseCase;
    }

    @Transactional
    public SavingsGoalResponse execute(UUID authenticatedUserId, UUID goalId, DepositGoalCommand cmd) {
        var goal = savingsGoalRepository.findByIdAndUserId(goalId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Meta de economia não encontrada ou não pertence ao usuário."));

        goal.deposit(cmd.amount());

        if (cmd.sourceAccountId() != null) {
            LocalDate today = LocalDate.now();
            createTransactionUseCase.execute(
                    authenticatedUserId,
                    TransactionType.EXPENSE,
                    cmd.amount(),
                    today,
                    today,
                    "Aporte na Meta: " + goal.getTitle(),
                    cmd.sourceAccountId(),
                    null,
                    null,
                    "SAVINGS_GOAL_DEPOSIT:" + goal.getId()
            );
        }

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
