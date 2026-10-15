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
@DisplayName("Testes Unitários: Lançamentos de Receitas Recorrentes (Criação, Edição e Exclusão Futura)")
class RecurringIncomeTransactionTest {

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
    @DisplayName("Deve criar entrada recorrente replicando para os próximos meses especificados")
    void shouldCreateRecurringIncomeForNextMonths() {
        var account = Account.create(userId, "Banco Principal", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        LocalDate baseDate = LocalDate.of(2026, 10, 10);
        Transaction first = createUseCase.execute(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                baseDate,
                baseDate,
                "Salário Mensal",
                accountId,
                null,
                categoryId,
                null,
                3 // 3 meses: mês atual + 2 próximos
        );

        assertThat(first).isNotNull();
        assertThat(first.getNotes()).startsWith("RECURRING_INCOME:");

        ArgumentCaptor<Transaction> batchCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(3)).save(batchCaptor.capture());

        List<Transaction> replicated = batchCaptor.getAllValues();
        assertThat(replicated).hasSize(3);
        assertThat(replicated.get(1).getAccrualDate()).isEqualTo(LocalDate.of(2026, 11, 10));
        assertThat(replicated.get(1).getNotes()).startsWith("RECURRING_INCOME:");
        assertThat(replicated.get(2).getAccrualDate()).isEqualTo(LocalDate.of(2026, 12, 10));
    }

    @Test
    @DisplayName("Deve atualizar receitas futuras do mesmo grupo quando updateFutureRecurring for verdadeiro")
    void shouldUpdateFutureRecurringIncomes() {
        UUID groupId = UUID.randomUUID();
        String notePrefix = "RECURRING_INCOME:" + groupId;

        Transaction current = Transaction.create(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 11, 10),
                LocalDate.of(2026, 11, 10),
                "Salário",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction future = Transaction.create(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 12, 10),
                LocalDate.of(2026, 12, 10),
                "Salário",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        when(transactionRepository.findByIdAndUserId(current.getId(), userId)).thenReturn(Optional.of(current));
        when(accountRepository.findByIdAndUserId(accountId, userId))
                .thenReturn(Optional.of(Account.create(userId, "Banco", AccountType.CHECKING, BigDecimal.ZERO)));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.findAllByUserIdAndNotesStartingWith(userId, notePrefix))
                .thenReturn(List.of(current, future));

        Transaction updated = updateUseCase.execute(
                userId,
                current.getId(),
                TransactionType.INCOME,
                new BigDecimal("5500.00"),
                LocalDate.of(2026, 11, 15),
                LocalDate.of(2026, 11, 15),
                "Salário Reajustado",
                accountId,
                null,
                categoryId,
                notePrefix,
                true // sincronizar com os próximos meses
        );

        assertThat(updated.getAmount()).isEqualByComparingTo(new BigDecimal("5500.00"));
        assertThat(updated.getDescription()).isEqualTo("Salário Reajustado");

        ArgumentCaptor<Transaction> saveCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(saveCaptor.capture());

        List<Transaction> futureSaved = saveCaptor.getAllValues();
        assertThat(futureSaved).hasSize(2);
        Transaction updatedFuture = futureSaved.get(1);
        assertThat(updatedFuture.getAmount()).isEqualByComparingTo(new BigDecimal("5500.00"));
        assertThat(updatedFuture.getDescription()).isEqualTo("Salário Reajustado");
        assertThat(updatedFuture.getAccrualDate()).isEqualTo(LocalDate.of(2026, 12, 15));
    }

    @Test
    @DisplayName("Deve excluir esta e todas as receitas futuras vinculadas quando deleteFutureRecurring for verdadeiro")
    void shouldDeleteCurrentAndFutureRecurringIncomes() {
        UUID groupId = UUID.randomUUID();
        String notePrefix = "RECURRING_INCOME:" + groupId;

        Transaction past = Transaction.create(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 10, 10),
                LocalDate.of(2026, 10, 10),
                "Salário Out",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction current = Transaction.create(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 11, 10),
                LocalDate.of(2026, 11, 10),
                "Salário Nov",
                accountId,
                null,
                categoryId,
                notePrefix
        );

        Transaction future = Transaction.create(
                userId,
                TransactionType.INCOME,
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 12, 10),
                LocalDate.of(2026, 12, 10),
                "Salário Dez",
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
