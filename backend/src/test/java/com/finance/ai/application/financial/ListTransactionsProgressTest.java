package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: Cálculo Determinístico de Parcelas Restantes no Extrato")
class ListTransactionsProgressTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private ListTransactionsUseCase listTransactionsUseCase;

    @Test
    @DisplayName("Deve calcular corretamente quando a transação tem 'Parcela 5/6' na descrição")
    void shouldCalculateRemainingWhenDescriptionContainsParcela() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var tx5 = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("120.00"),
                LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 15),
                "Magazine Luiza Parcela 5/6", accountId, null, null,
                TransactionOrigin.MANUAL, "Importado via CSV"
        );

        var map = listTransactionsUseCase.getRecurringProgressMap(userId, List.of(tx5));

        assertThat(map).containsKey(tx5.getId());
        var progress = map.get(tx5.getId());
        assertThat(progress.current()).isEqualTo(5);
        assertThat(progress.total()).isEqualTo(6);
        assertThat(progress.remaining()).isEqualTo(1); // Falta 1 para pagar por completo
    }

    @Test
    @DisplayName("Deve calcular corretamente na última parcela 6/6 (faltam 0 / última)")
    void shouldCalculateRemainingOnLastInstallment() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var tx6 = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("120.00"),
                LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 15),
                "Magazine Luiza Parcela 6/6", accountId, null, null,
                TransactionOrigin.MANUAL, "Importado via CSV"
        );

        var map = listTransactionsUseCase.getRecurringProgressMap(userId, List.of(tx6));

        assertThat(map).containsKey(tx6.getId());
        var progress = map.get(tx6.getId());
        assertThat(progress.current()).isEqualTo(6);
        assertThat(progress.total()).isEqualTo(6);
        assertThat(progress.remaining()).isEqualTo(0); // Última parcela
    }

    @Test
    @DisplayName("Deve calcular via notas quando contiver fração (3/10)")
    void shouldCalculateRemainingWhenNotesContainFraction() {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var tx = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("80.00"),
                LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 15),
                "Curso Online", accountId, null, null,
                TransactionOrigin.MANUAL, "RECURRING_EXPENSE:" + UUID.randomUUID() + " (3/10) | Mensalidade"
        );

        var map = listTransactionsUseCase.getRecurringProgressMap(userId, List.of(tx));

        assertThat(map).containsKey(tx.getId());
        var progress = map.get(tx.getId());
        assertThat(progress.current()).isEqualTo(3);
        assertThat(progress.total()).isEqualTo(10);
        assertThat(progress.remaining()).isEqualTo(7); // Faltam 7 para pagar por completo
    }
}
