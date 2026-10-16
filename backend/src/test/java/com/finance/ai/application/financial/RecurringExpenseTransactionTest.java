package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: Lançamentos de Despesas Recorrentes (Criação, Edição e Exclusão Futura)")
class RecurringExpenseTransactionTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    private CreateTransactionUseCase createUseCase;
    private UpdateTransactionUseCase updateUseCase;
    private DeleteTransactionUseCase deleteUseCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID categoryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        createUseCase = new CreateTransactionUseCase(transactionRepository, accountRepository);
        updateUseCase = new UpdateTransactionUseCase(transactionRepository, accountRepository);
        deleteUseCase = new DeleteTransactionUseCase(transactionRepository);
    }

    @Test
    @DisplayName("Deve criar despesa recorrente replicando para os próximos meses especificados")
    void shouldCreateRecurringExpenseForNextMonths() {
        var account = Account.create(userId, "Banco Principal", AccountType.CHECKING, new BigDecimal("10000.00"));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        LocalDate baseDate = LocalDate.of(2026, 10, 5);
        Transaction first = createUseCase.execute(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                baseDate,
                baseDate,
                "Condomínio Residencial",
                accountId,
                null,
                categoryId,
                null,
                6 // 6 meses
        );

        assertThat(first).isNotNull();
        assertThat(first.getNotes()).startsWith("RECURRING_EXPENSE:");

        ArgumentCaptor<Transaction> batchCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(6)).save(batchCaptor.capture());

        List<Transaction> replicated = batchCaptor.getAllValues();
        assertThat(replicated).hasSize(6);
        assertThat(replicated.get(0).getAccrualDate()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(replicated.get(1).getAccrualDate()).isEqualTo(LocalDate.of(2026, 11, 5));
        assertThat(replicated.get(1).getNotes()).startsWith("RECURRING_EXPENSE:");
        assertThat(replicated.get(5).getAccrualDate()).isEqualTo(LocalDate.of(2027, 3, 5));
    }

    @Test
    @DisplayName("Deve atualizar despesas futuras do mesmo grupo quando updateFutureRecurring for verdadeiro")
    void shouldUpdateFutureRecurringExpenses() {
        UUID groupId = UUID.randomUUID();
        String notePrefix = "RECURRING_EXPENSE:" + groupId;

        Transaction current = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                LocalDate.of(2026, 11, 5),
                LocalDate.of(2026, 11, 5),
                "Condomínio",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction future = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                LocalDate.of(2026, 12, 5),
                LocalDate.of(2026, 12, 5),
                "Condomínio",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        when(transactionRepository.findByIdAndUserId(current.getId(), userId)).thenReturn(Optional.of(current));
        when(accountRepository.findByIdAndUserId(accountId, userId))
                .thenReturn(Optional.of(Account.create(userId, "Banco", AccountType.CHECKING, new BigDecimal("10000.00"))));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.findAllByUserIdAndNotesStartingWith(userId, notePrefix))
                .thenReturn(List.of(current, future));

        Transaction updated = updateUseCase.execute(
                userId,
                current.getId(),
                TransactionType.EXPENSE,
                new BigDecimal("380.00"),
                LocalDate.of(2026, 11, 8),
                LocalDate.of(2026, 11, 8),
                "Condomínio Atualizado",
                accountId,
                null,
                categoryId,
                notePrefix,
                true // sincronizar com os próximos meses
        );

        assertThat(updated.getAmount()).isEqualByComparingTo(new BigDecimal("380.00"));
        assertThat(updated.getDescription()).isEqualTo("Condomínio Atualizado");

        ArgumentCaptor<Transaction> saveCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(saveCaptor.capture());

        List<Transaction> futureSaved = saveCaptor.getAllValues();
        assertThat(futureSaved).hasSize(2);
        Transaction updatedFuture = futureSaved.get(1);
        assertThat(updatedFuture.getAmount()).isEqualByComparingTo(new BigDecimal("380.00"));
        assertThat(updatedFuture.getDescription()).isEqualTo("Condomínio Atualizado");
        assertThat(updatedFuture.getAccrualDate()).isEqualTo(LocalDate.of(2026, 12, 8));
    }

    @Test
    @DisplayName("Deve excluir esta e todas as despesas futuras vinculadas quando deleteFutureRecurring for verdadeiro")
    void shouldDeleteCurrentAndFutureRecurringExpenses() {
        UUID groupId = UUID.randomUUID();
        String notePrefix = "RECURRING_EXPENSE:" + groupId;

        Transaction past = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                LocalDate.of(2026, 10, 5),
                LocalDate.of(2026, 10, 5),
                "Condomínio Out",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction current = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                LocalDate.of(2026, 11, 5),
                LocalDate.of(2026, 11, 5),
                "Condomínio Nov",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction future = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("350.00"),
                LocalDate.of(2026, 12, 5),
                LocalDate.of(2026, 12, 5),
                "Condomínio Dez",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        when(transactionRepository.findByIdAndUserId(current.getId(), userId)).thenReturn(Optional.of(current));
        when(transactionRepository.findAllByUserIdAndNotesStartingWith(userId, notePrefix))
                .thenReturn(List.of(past, current, future));

        deleteUseCase.execute(userId, current.getId(), true);

        // Deve excluir apenas o mês corrente (Nov) e o futuro (Dez), preservando o passado (Out)
        verify(transactionRepository, times(1)).deleteByIdAndUserId(current.getId(), userId);
        verify(transactionRepository, times(1)).deleteByIdAndUserId(future.getId(), userId);
        verify(transactionRepository, never()).deleteByIdAndUserId(past.getId(), userId);
    }
}
