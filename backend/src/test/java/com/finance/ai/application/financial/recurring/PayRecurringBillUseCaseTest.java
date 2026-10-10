package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.card.CreateCreditCardPurchaseUseCase;
import com.finance.ai.application.financial.recurring.dto.PayRecurringBillCommand;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import com.finance.ai.domain.financial.recurring.RecurringFrequency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class PayRecurringBillUseCaseTest {

    private RecurringBillRepository recurringBillRepository;
    private CreateTransactionUseCase createTransactionUseCase;
    private CreateCreditCardPurchaseUseCase createCreditCardPurchaseUseCase;
    private PayRecurringBillUseCase useCase;

    @BeforeEach
    void setUp() {
        recurringBillRepository = mock(RecurringBillRepository.class);
        createTransactionUseCase = mock(CreateTransactionUseCase.class);
        createCreditCardPurchaseUseCase = mock(CreateCreditCardPurchaseUseCase.class);
        useCase = new PayRecurringBillUseCase(
                recurringBillRepository,
                createTransactionUseCase,
                createCreditCardPurchaseUseCase
        );
    }

    @Test
    @DisplayName("Deve gerar transação de débito em conta quando a despesa recorrente for vinculada a uma conta bancária")
    void shouldGenerateExpenseTransactionWhenLinkedToAccount() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();
        var accountId = UUID.randomUUID();
        var categoryId = UUID.randomUUID();

        var bill = new RecurringBill(
                billId,
                userId,
                categoryId,
                accountId,
                null,
                "Internet Residencial",
                new BigDecimal("129.90"),
                RecurringFrequency.MONTHLY,
                10,
                true,
                java.time.Instant.now(),
                java.time.Instant.now()
        );

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(bill));

        var cmd = new PayRecurringBillCommand(LocalDate.of(2026, 10, 10), null, null);
        useCase.execute(userId, billId, cmd);

        var notesCaptor = ArgumentCaptor.forClass(String.class);
        verify(createTransactionUseCase).execute(
                eq(userId),
                eq(TransactionType.EXPENSE),
                eq(new BigDecimal("129.90")),
                eq(LocalDate.of(2026, 10, 10)),
                eq(LocalDate.of(2026, 10, 10)),
                eq("Internet Residencial"),
                eq(accountId),
                isNull(),
                eq(categoryId),
                notesCaptor.capture()
        );

        assertThat(notesCaptor.getValue()).contains("RECURRING_BILL:" + billId);
        verifyNoInteractions(createCreditCardPurchaseUseCase);
    }

    @Test
    @DisplayName("Deve gerar despesa de cartão de crédito de 1 parcela quando vinculada a cartão de crédito")
    void shouldGenerateCreditCardPurchaseWhenLinkedToCard() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();
        var cardId = UUID.randomUUID();
        var categoryId = UUID.randomUUID();

        var bill = new RecurringBill(
                billId,
                userId,
                categoryId,
                null,
                cardId,
                "Spotify Family",
                new BigDecimal("34.90"),
                RecurringFrequency.MONTHLY,
                5,
                true,
                java.time.Instant.now(),
                java.time.Instant.now()
        );

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(bill));

        var cmd = new PayRecurringBillCommand(LocalDate.of(2026, 10, 5), null, null);
        useCase.execute(userId, billId, cmd);

        var notesCaptor = ArgumentCaptor.forClass(String.class);
        verify(createCreditCardPurchaseUseCase).execute(
                eq(userId),
                eq(cardId),
                eq("Spotify Family"),
                eq(new BigDecimal("34.90")),
                eq(1),
                eq(LocalDate.of(2026, 10, 5)),
                eq(categoryId),
                notesCaptor.capture()
        );

        assertThat(notesCaptor.getValue()).contains("RECURRING_BILL:" + billId);
        verifyNoInteractions(createTransactionUseCase);
    }

    @Test
    @DisplayName("Deve replicar os lançamentos da despesa fixa para os meses subsequentes quando replicateMonths for maior que 1")
    void shouldReplicateExpenseTransactionAcrossSubsequentMonths() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();
        var accountId = UUID.randomUUID();
        var categoryId = UUID.randomUUID();

        var bill = new RecurringBill(
                billId,
                userId,
                categoryId,
                accountId,
                null,
                "Aluguel do Apartamento",
                new BigDecimal("2500.00"),
                RecurringFrequency.MONTHLY,
                10,
                true,
                java.time.Instant.now(),
                java.time.Instant.now()
        );

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(bill));

        // Lança a partir de 2026-10-10 replicando por 3 meses (Outubro, Novembro e Dezembro)
        var cmd = new PayRecurringBillCommand(LocalDate.of(2026, 10, 10), null, null, 3);
        useCase.execute(userId, billId, cmd);

        var dateCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(createTransactionUseCase, times(3)).execute(
                eq(userId),
                eq(TransactionType.EXPENSE),
                eq(new BigDecimal("2500.00")),
                dateCaptor.capture(),
                any(LocalDate.class),
                eq("Aluguel do Apartamento"),
                eq(accountId),
                isNull(),
                eq(categoryId),
                contains("RECURRING_BILL:" + billId)
        );

        assertThat(dateCaptor.getAllValues()).containsExactly(
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 11, 10),
                LocalDate.of(2026, 12, 10)
        );
    }
}
