package com.finance.ai.domain.financial.recurring;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RecurringBillTest {

    @Test
    @DisplayName("Deve criar despesa recorrente com dados válidos e escala normalizada de BigDecimal")
    void shouldCreateRecurringBillSuccessfully() {
        var userId = UUID.randomUUID();
        var bill = RecurringBill.create(
                userId,
                null,
                null,
                null,
                "Netflix Premium",
                new BigDecimal("55.9"),
                RecurringFrequency.MONTHLY,
                15
        );

        assertThat(bill.getId()).isNotNull();
        assertThat(bill.getDescription()).isEqualTo("Netflix Premium");
        assertThat(bill.getAmount()).isEqualByComparingTo(new BigDecimal("55.90"));
        assertThat(bill.getDayOfMonth()).isEqualTo(15);
        assertThat(bill.isActive()).isTrue();
    }

    @Test
    @DisplayName("Deve rejeitar valor nulo ou negativo")
    void shouldRejectInvalidAmount() {
        var userId = UUID.randomUUID();

        assertThatThrownBy(() -> RecurringBill.create(userId, null, null, null, "Academia", null, RecurringFrequency.MONTHLY, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Valor da despesa recorrente é obrigatório");

        assertThatThrownBy(() -> RecurringBill.create(userId, null, null, null, "Academia", new BigDecimal("-10.00"), RecurringFrequency.MONTHLY, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("deve ser estritamente positivo");
    }

    @Test
    @DisplayName("Deve rejeitar dia do mês fora do intervalo [1, 31]")
    void shouldRejectInvalidDayOfMonth() {
        var userId = UUID.randomUUID();

        assertThatThrownBy(() -> RecurringBill.create(userId, null, null, null, "Aluguel", new BigDecimal("1500.00"), RecurringFrequency.MONTHLY, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Dia do vencimento deve estar entre 1 e 31");

        assertThatThrownBy(() -> RecurringBill.create(userId, null, null, null, "Aluguel", new BigDecimal("1500.00"), RecurringFrequency.MONTHLY, 32))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Dia do vencimento deve estar entre 1 e 31");
    }

    @Test
    @DisplayName("Deve calcular data de vencimento ajustando para o último dia em meses com menos dias")
    void shouldCalculateDueDateAdjustingForShorterMonths() {
        var bill = RecurringBill.create(
                UUID.randomUUID(),
                null,
                null,
                null,
                "Internet Fibra",
                new BigDecimal("120.00"),
                RecurringFrequency.MONTHLY,
                31
        );

        // Fevereiro de 2026 tem 28 dias
        LocalDate february = LocalDate.of(2026, 2, 10);
        LocalDate dueDate = bill.calculateDueDate(february);

        assertThat(dueDate).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    @DisplayName("Deve identificar corretamente se está a vencer nos próximos 7 dias")
    void shouldDetectDueWithinDaysCorrectly() {
        var bill = RecurringBill.create(
                UUID.randomUUID(),
                null,
                null,
                null,
                "Seguro Auto",
                new BigDecimal("250.00"),
                RecurringFrequency.MONTHLY,
                15
        );

        LocalDate today10th = LocalDate.of(2026, 10, 10);
        LocalDate today5th = LocalDate.of(2026, 10, 5);
        LocalDate today20th = LocalDate.of(2026, 10, 20);

        assertThat(bill.isDueWithinDays(today10th, 7)).isTrue(); // 5 dias até o dia 15
        assertThat(bill.isDueWithinDays(today5th, 7)).isFalse(); // 10 dias de distância
        assertThat(bill.isDueWithinDays(today20th, 7)).isFalse(); // Já passou do dia 15
    }
}
