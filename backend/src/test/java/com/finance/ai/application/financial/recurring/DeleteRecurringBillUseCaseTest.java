package com.finance.ai.application.financial.recurring;

import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import com.finance.ai.domain.financial.recurring.RecurringFrequency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class DeleteRecurringBillUseCaseTest {

    private RecurringBillRepository recurringBillRepository;
    private TransactionRepository transactionRepository;
    private DeleteRecurringBillUseCase useCase;

    @BeforeEach
    void setUp() {
        recurringBillRepository = mock(RecurringBillRepository.class);
        transactionRepository = mock(TransactionRepository.class);
        useCase = new DeleteRecurringBillUseCase(recurringBillRepository, transactionRepository);
    }

    @Test
    @DisplayName("Deve remover a despesa fixa e todas as movimentações geradas por ela no extrato")
    void shouldDeleteRecurringBillAndAllLinkedTransactions() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();

        var bill = new RecurringBill(
                billId,
                userId,
                null,
                null,
                null,
                "Assinatura Netflix",
                new BigDecimal("55.90"),
                RecurringFrequency.MONTHLY,
                15,
                true,
                java.time.Instant.now(),
                java.time.Instant.now()
        );

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(bill));

        useCase.execute(userId, billId);

        // Verifica que deletou as transações no extrato pelo prefixo
        verify(transactionRepository, times(1)).deleteAllByUserIdAndNotesStartingWith(
                userId,
                "RECURRING_BILL:" + billId
        );

        // Verifica que deletou a despesa fixa
        verify(recurringBillRepository, times(1)).deleteByIdAndUserId(billId, userId);
    }

    @Test
    @DisplayName("Deve falhar ao tentar remover despesa recorrente inexistente ou de outro usuário")
    void shouldThrowWhenBillNotFound() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, billId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Despesa recorrente não encontrada ou não pertence ao usuário.");

        verifyNoInteractions(transactionRepository);
        verify(recurringBillRepository, never()).deleteByIdAndUserId(any(), any());
    }
}
