package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.goal.dto.SavingsGoalResponse;
import com.finance.ai.application.financial.goal.dto.WithdrawGoalCommand;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class WithdrawFromSavingsGoalUseCase {

    private final SavingsGoalRepository savingsGoalRepository;
    private final CreateTransactionUseCase createTransactionUseCase;

    public WithdrawFromSavingsGoalUseCase(SavingsGoalRepository savingsGoalRepository,
                                         CreateTransactionUseCase createTransactionUseCase) {
        this.savingsGoalRepository = savingsGoalRepository;
        this.createTransactionUseCase = createTransactionUseCase;
    }

    @Transactional
    public SavingsGoalResponse execute(UUID authenticatedUserId, UUID goalId, WithdrawGoalCommand cmd) {
        var goal = savingsGoalRepository.findByIdAndUserId(goalId, authenticatedUserId)
                .orElseThrow(() -> new IllegalArgumentException("Meta de economia não encontrada ou não pertence ao usuário."));

        goal.withdraw(cmd.amount());

        if (cmd.destinationAccountId() != null) {
            LocalDate today = LocalDate.now();
            createTransactionUseCase.execute(
                    authenticatedUserId,
                    TransactionType.INCOME,
                    cmd.amount(),
                    today,
                    today,
                    "Resgate da Meta: " + goal.getTitle(),
                    cmd.destinationAccountId(),
                    null,
                    null,
                    "SAVINGS_GOAL_WITHDRAW:" + goal.getId()
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
