package com.finance.ai.application.financial.goal;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.goal.dto.DepositGoalCommand;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.goal.SavingsGoal;
import com.finance.ai.domain.financial.goal.SavingsGoalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DepositToSavingsGoalUseCaseTest {

    private SavingsGoalRepository savingsGoalRepository;
    private CreateTransactionUseCase createTransactionUseCase;
    private DepositToSavingsGoalUseCase useCase;

    @BeforeEach
    void setUp() {
        savingsGoalRepository = mock(SavingsGoalRepository.class);
        createTransactionUseCase = mock(CreateTransactionUseCase.class);
        useCase = new DepositToSavingsGoalUseCase(savingsGoalRepository, createTransactionUseCase);
    }

    @Test
    @DisplayName("Deve realizar aporte e criar transação de despesa na conta de origem selecionada")
    void shouldDepositAndCreateDebitTransaction() {
        var userId = UUID.randomUUID();
        var goalId = UUID.randomUUID();
        var accountId = UUID.randomUUID();

        var goal = SavingsGoal.create(userId, "Casamento", new BigDecimal("30000.00"), null);

        when(savingsGoalRepository.findByIdAndUserId(goalId, userId)).thenReturn(Optional.of(goal));
        when(savingsGoalRepository.save(any(SavingsGoal.class))).thenAnswer(inv -> inv.getArgument(0));

        var cmd = new DepositGoalCommand(new BigDecimal("1500.00"), accountId);
        var response = useCase.execute(userId, goalId, cmd);

        assertThat(response.currentAmount()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(response.remainingAmount()).isEqualByComparingTo(new BigDecimal("28500.00"));
        assertThat(response.progressPercentage()).isEqualByComparingTo(new BigDecimal("5.00"));

        verify(createTransactionUseCase).execute(
                eq(userId),
                eq(TransactionType.EXPENSE),
                eq(new BigDecimal("1500.00")),
                eq(LocalDate.now()),
                eq(LocalDate.now()),
                eq("Aporte na Meta: Casamento"),
                eq(accountId),
                isNull(),
                isNull(),
                contains("SAVINGS_GOAL_DEPOSIT:")
        );
    }
}
