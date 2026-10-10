package com.finance.ai.domain.financial;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes de Domínio: Entidade Transaction")
class TransactionDomainTest {

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("Deve instanciar transação com precisão de duas casas decimais")
    void shouldCreateTransactionWithTwoDecimalPlaces() {
        var t = Transaction.create(
                userId,
                TransactionType.INCOME,
                BigDecimal.valueOf(150.5),
                LocalDate.now(),
                null,
                "Salário",
                UUID.randomUUID(),
                null,
                null,
                "Bônus"
        );

        assertThat(t.getAmount()).isEqualByComparingTo(new BigDecimal("150.50"));
        assertThat(t.getAmount().scale()).isEqualTo(2);
        assertThat(t.getType()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    @DisplayName("Deve rejeitar valor zero ou negativo")
    void shouldRejectZeroOrNegativeAmount() {
        assertThatThrownBy(() -> Transaction.create(
                userId,
                TransactionType.EXPENSE,
                BigDecimal.ZERO,
                LocalDate.now(),
                null,
                "Despesa inválida",
                null, null, null, null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("maior que zero");

        assertThatThrownBy(() -> Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("-10.00"),
                LocalDate.now(),
                null,
                "Despesa negativa",
                null, null, null, null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("maior que zero");
    }

    @Test
    @DisplayName("Deve exigir conta de origem e destino distintas para transferências")
    void shouldValidateTransferAccounts() {
        UUID accountA = UUID.randomUUID();

        // Origem e destino iguais
        assertThatThrownBy(() -> Transaction.create(
                userId,
                TransactionType.TRANSFER,
                new BigDecimal("50.00"),
                LocalDate.now(),
                null,
                "Transferência inválida",
                accountA,
                accountA,
                null,
                null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("não podem ser iguais");

        // Destino nulo
        assertThatThrownBy(() -> Transaction.create(
                userId,
                TransactionType.TRANSFER,
                new BigDecimal("50.00"),
                LocalDate.now(),
                null,
                "Transferência sem destino",
                accountA,
                null,
                null,
                null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("exigem conta de origem e conta de destino");
    }
}
