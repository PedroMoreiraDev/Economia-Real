package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Caso de Uso: UpdateTransactionUseCase (Edição Segura e Anti-IDOR)")
class UpdateTransactionUseCaseTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private UpdateTransactionUseCase updateUseCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID transactionId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID categoryId = UUID.randomUUID();
    private Transaction existingTransaction;

    @BeforeEach
    void setUp() {
        existingTransaction = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("150.00"),
                LocalDate.of(2026, 10, 5),
                LocalDate.of(2026, 10, 5),
                "Mercado Sem Nome",
                accountId,
                null,
                null,
                "Lançamento antigo"
        );
    }

    @Test
    @DisplayName("Deve atualizar os campos da transação com sucesso mantendo o ID original e atualizando timestamp")
    void shouldUpdateTransactionSuccessfully() {
        when(transactionRepository.findByIdAndUserId(transactionId, userId))
                .thenReturn(Optional.of(existingTransaction));

        var account = Account.create(userId, "Banco Inter", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId))
                .thenReturn(Optional.of(account));

        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var updated = updateUseCase.execute(
                userId,
                transactionId,
                TransactionType.EXPENSE,
                new BigDecimal("199.90"),
                LocalDate.of(2026, 10, 8),
                LocalDate.of(2026, 10, 8),
                "Supermercado Pão de Açúcar",
                accountId,
                null,
                categoryId,
                "Ajustado na conferência do extrato"
        );

        assertThat(updated).isNotNull();
        assertThat(updated.getId()).isEqualTo(existingTransaction.getId());
        assertThat(updated.getDescription()).isEqualTo("Supermercado Pão de Açúcar");
        assertThat(updated.getAmount()).isEqualByComparingTo(new BigDecimal("199.90"));
        assertThat(updated.getAccrualDate()).isEqualTo(LocalDate.of(2026, 10, 8));
        assertThat(updated.getCategoryId()).isEqualTo(categoryId);
        assertThat(updated.getNotes()).isEqualTo("Ajustado na conferência do extrato");

        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Deve lançar exceção se transação não for encontrada para o usuário autenticado (Anti-IDOR)")
    void shouldThrowExceptionWhenTransactionNotFoundOrNotOwned() {
        when(transactionRepository.findByIdAndUserId(transactionId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateUseCase.execute(
                userId,
                transactionId,
                TransactionType.EXPENSE,
                new BigDecimal("50.00"),
                LocalDate.now(),
                LocalDate.now(),
                "Desc",
                null,
                null,
                null,
                null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("não encontrada ou não pertence ao usuário");
    }

    @Test
    @DisplayName("Deve lançar exceção se conta de origem não pertencer ao usuário autenticado")
    void shouldThrowExceptionWhenAccountNotOwned() {
        when(transactionRepository.findByIdAndUserId(transactionId, userId))
                .thenReturn(Optional.of(existingTransaction));

        when(accountRepository.findByIdAndUserId(accountId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateUseCase.execute(
                userId,
                transactionId,
                TransactionType.EXPENSE,
                new BigDecimal("50.00"),
                LocalDate.now(),
                LocalDate.now(),
                "Desc",
                accountId,
                null,
                null,
                null
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Conta de origem não encontrada ou não pertence ao usuário");
    }
}
