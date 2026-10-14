package com.finance.ai.application.financial.recurring;

import com.finance.ai.application.financial.recurring.dto.UpdateRecurringBillCommand;
import com.finance.ai.domain.financial.*;
import com.finance.ai.domain.financial.card.CreditCardRepository;
import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringBillRepository;
import com.finance.ai.domain.financial.recurring.RecurringFrequency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UpdateRecurringBillUseCaseTest {

    private RecurringBillRepository recurringBillRepository;
    private CategoryRepository categoryRepository;
    private AccountRepository accountRepository;
    private CreditCardRepository creditCardRepository;
    private TransactionRepository transactionRepository;
    private UpdateRecurringBillUseCase useCase;

    @BeforeEach
    void setUp() {
        recurringBillRepository = mock(RecurringBillRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        accountRepository = mock(AccountRepository.class);
        creditCardRepository = mock(CreditCardRepository.class);
        transactionRepository = mock(TransactionRepository.class);

        useCase = new UpdateRecurringBillUseCase(
                recurringBillRepository,
                categoryRepository,
                accountRepository,
                creditCardRepository,
                transactionRepository
        );
    }

    @Test
    @DisplayName("Deve atualizar a despesa fixa e sincronizar movimentações do extrato deste mês e dos meses futuros")
    void shouldUpdateBillAndSyncPresentAndFutureTransactions() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();
        var oldCatId = UUID.randomUUID();
        var newCatId = UUID.randomUUID();

        var bill = new RecurringBill(
                billId,
                userId,
                oldCatId,
                null,
                null,
                "Internet 300MB",
                new BigDecimal("99.90"),
                RecurringFrequency.MONTHLY,
                10,
                true,
                Instant.now(),
                Instant.now()
        );

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(bill));
        when(categoryRepository.findByIdAndUserId(newCatId, userId)).thenReturn(Optional.of(mock(Category.class)));
        when(recurringBillRepository.save(any(RecurringBill.class))).thenAnswer(i -> i.getArgument(0));

        // Simula duas transações geradas: uma no mês atual (outubro) e uma no mês futuro (novembro)
        var txMonthCurrent = new Transaction(
                UUID.randomUUID(),
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("99.90"),
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 10),
                "Internet 300MB",
                null,
                null,
                oldCatId,
                TransactionStatus.COMPLETED,
                TransactionOrigin.MANUAL,
                "RECURRING_BILL:" + billId + " - Lançamento da despesa fixa: Internet 300MB",
                Instant.now(),
                Instant.now()
        );

        var txMonthFuture = new Transaction(
                UUID.randomUUID(),
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("99.90"),
                LocalDate.of(2026, 11, 10),
                LocalDate.of(2026, 11, 10),
                "Internet 300MB",
                null,
                null,
                oldCatId,
                TransactionStatus.COMPLETED,
                TransactionOrigin.MANUAL,
                "RECURRING_BILL:" + billId + " - Lançamento da despesa fixa: Internet 300MB",
                Instant.now(),
                Instant.now()
        );

        when(transactionRepository.findAllByUserIdAndNotesStartingWith(userId, "RECURRING_BILL:" + billId))
                .thenReturn(List.of(txMonthCurrent, txMonthFuture));

        var cmd = new UpdateRecurringBillCommand(
                "Internet Fibra 600MB",
                new BigDecimal("129.90"),
                RecurringFrequency.MONTHLY,
                20, // Mudou o dia de 10 para 20
                newCatId,
                null,
                null,
                true
        );

        var response = useCase.execute(userId, billId, cmd);

        assertThat(response.description()).isEqualTo("Internet Fibra 600MB");
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("129.90"));
        assertThat(response.dayOfMonth()).isEqualTo(20);

        // Verifica que ambas as transações foram salvas com os novos dados
        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(captor.capture());

        List<Transaction> updatedTxs = captor.getAllValues();
        Transaction updatedOct = updatedTxs.stream()
                .filter(t -> t.getAccrualDate().getMonthValue() == 10)
                .findFirst().orElseThrow();
        Transaction updatedNov = updatedTxs.stream()
                .filter(t -> t.getAccrualDate().getMonthValue() == 11)
                .findFirst().orElseThrow();

        // Validação da transação de Outubro
        assertThat(updatedOct.getDescription()).isEqualTo("Internet Fibra 600MB");
        assertThat(updatedOct.getAmount()).isEqualByComparingTo(new BigDecimal("129.90"));
        assertThat(updatedOct.getCategoryId()).isEqualTo(newCatId);
        assertThat(updatedOct.getAccrualDate()).isEqualTo(LocalDate.of(2026, 10, 20));
        assertThat(updatedOct.getNotes()).contains("RECURRING_BILL:" + billId);

        // Validação da transação de Novembro (mês futuro)
        assertThat(updatedNov.getDescription()).isEqualTo("Internet Fibra 600MB");
        assertThat(updatedNov.getAmount()).isEqualByComparingTo(new BigDecimal("129.90"));
        assertThat(updatedNov.getCategoryId()).isEqualTo(newCatId);
        assertThat(updatedNov.getAccrualDate()).isEqualTo(LocalDate.of(2026, 11, 20));
        assertThat(updatedNov.getNotes()).contains("RECURRING_BILL:" + billId);
    }

    @Test
    @DisplayName("Deve falhar ao tentar atualizar despesa recorrente inexistente")
    void shouldThrowWhenBillNotFound() {
        var userId = UUID.randomUUID();
        var billId = UUID.randomUUID();

        when(recurringBillRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.empty());

        var cmd = new UpdateRecurringBillCommand(
                "Aluguel",
                new BigDecimal("2000.00"),
                RecurringFrequency.MONTHLY,
                5,
                null,
                null,
                null,
                true
        );

        assertThatThrownBy(() -> useCase.execute(userId, billId, cmd))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Despesa recorrente não encontrada ou não pertence ao usuário.");

        verifyNoInteractions(transactionRepository);
    }
}
