package com.finance.ai.domain.financial.budget;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BudgetTest {

    @Test
    @DisplayName("Deve criar orçamento normalizando o mês de referência para o primeiro dia")
    void shouldCreateBudgetWithNormalizedMonth() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        LocalDate midMonth = LocalDate.of(2026, 10, 15);

        Budget budget = Budget.create(userId, catId, midMonth, new BigDecimal("1500.00"), 80);

        assertThat(budget.getMonthReference()).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(budget.getMonthlyLimit()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(budget.getAlertThresholdPercentage()).isEqualTo(80);
    }

    @Test
    @DisplayName("Deve rejeitar limite mensal negativo ou zerado")
    void shouldRejectInvalidLimit() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();

        assertThatThrownBy(() -> Budget.create(userId, catId, LocalDate.now(), BigDecimal.ZERO, 80))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("estritamente maior que zero");
    }

    @Test
    @DisplayName("Deve rejeitar percentual de alerta fora da faixa 1-100")
    void shouldRejectInvalidThreshold() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();

        assertThatThrownBy(() -> Budget.create(userId, catId, LocalDate.now(), new BigDecimal("500.00"), 150))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("entre 1% e 100%");
    }
}
