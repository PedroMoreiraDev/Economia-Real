package com.finance.ai.domain.financial.goal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SavingsGoalTest {

    @Test
    @DisplayName("Deve criar meta de economia com saldo inicial zero e valores em BigDecimal normalizados")
    void shouldCreateSavingsGoalSuccessfully() {
        var userId = UUID.randomUUID();
        var goal = SavingsGoal.create(
                userId,
                "Reserva de Emergência",
                new BigDecimal("10000.00"),
                LocalDate.of(2026, 12, 31)
        );

        assertThat(goal.getId()).isNotNull();
        assertThat(goal.getTitle()).isEqualTo("Reserva de Emergência");
        assertThat(goal.getTargetAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(goal.getCurrentAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(goal.getRemainingAmount()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(goal.calculateProgressPercentage()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(goal.isReached()).isFalse();
    }

    @Test
    @DisplayName("Deve realizar aporte e calcular progresso percentual corretamente")
    void shouldDepositAndCalculateProgress() {
        var goal = SavingsGoal.create(
                UUID.randomUUID(),
                "Viagem Japão",
                new BigDecimal("20000.00"),
                LocalDate.of(2027, 6, 30)
        );

        goal.deposit(new BigDecimal("5000.00"));

        assertThat(goal.getCurrentAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(goal.getRemainingAmount()).isEqualByComparingTo(new BigDecimal("15000.00"));
        assertThat(goal.calculateProgressPercentage()).isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat(goal.isReached()).isFalse();

        goal.deposit(new BigDecimal("15000.00"));
        assertThat(goal.getCurrentAmount()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(goal.getRemainingAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(goal.calculateProgressPercentage()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(goal.isReached()).isTrue();
    }

    @Test
    @DisplayName("Deve realizar resgate e rejeitar resgate com valor maior que o saldo atual")
    void shouldWithdrawAndRejectOverdrawnAmount() {
        var goal = SavingsGoal.create(
                UUID.randomUUID(),
                "Carro Novo",
                new BigDecimal("50000.00"),
                null
        );

        goal.deposit(new BigDecimal("10000.00"));
        goal.withdraw(new BigDecimal("3000.00"));

        assertThat(goal.getCurrentAmount()).isEqualByComparingTo(new BigDecimal("7000.00"));

        assertThatThrownBy(() -> goal.withdraw(new BigDecimal("8000.00")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Saldo insuficiente na meta");
    }

    @Test
    @DisplayName("Deve rejeitar criação com título em branco ou valor alvo inválido")
    void shouldRejectInvalidArguments() {
        var userId = UUID.randomUUID();

        assertThatThrownBy(() -> SavingsGoal.create(userId, "", new BigDecimal("100.00"), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Título da meta é obrigatório");

        assertThatThrownBy(() -> SavingsGoal.create(userId, "Meta", new BigDecimal("-50.00"), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("deve ser estritamente positivo");
    }
}
