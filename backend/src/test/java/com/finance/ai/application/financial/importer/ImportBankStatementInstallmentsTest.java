package com.finance.ai.application.financial.importer;

import com.finance.ai.domain.financial.Account;
import com.finance.ai.domain.financial.AccountRepository;
import com.finance.ai.domain.financial.AccountType;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.importer.ImportBatch;
import com.finance.ai.domain.financial.importer.ImportBatchRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Caso de Uso: Importação de Fatura com Compras Parceladas e Prevenção de Duplicatas Futuras")
class ImportBankStatementInstallmentsTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ImportBatchRepository importBatchRepository;

    @Mock
    private MerchantCategoryClassifier merchantCategoryClassifier;

    @InjectMocks
    private ImportBankStatementUseCase importUseCase;

    @Test
    @DisplayName("Fatura com compra parcelada: deve salvar a parcela 3/5 em Outubro e projetar 4/5 (Novembro) e 5/5 (Dezembro)")
    void shouldImportCurrentInstallmentAndProjectRemainingFutureMonths() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Nubank Cartão", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of());
        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        // Fatura de Outubro com "Havan 3/5" no dia 15/10/2026 de R$ 100.00
        String csvContent = """
                date,title,amount
                2026-10-15,Havan 3/5,100.00
                """;

        var result = importUseCase.execute(userId, accountId, "fatura_outubro.csv", csvContent.getBytes(StandardCharsets.UTF_8), true);

        // Deve importar 3 transações no total: a parcela atual 3/5 e as duas parcelas futuras (4/5 e 5/5)
        assertThat(result.importedCount()).isEqualTo(3);
        assertThat(result.skippedCount()).isEqualTo(0);

        org.mockito.ArgumentCaptor<Transaction> txCaptor = org.mockito.ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(3)).save(txCaptor.capture());

        var savedList = txCaptor.getAllValues();

        // 1. Parcela 3/5 no mês correto (Outubro)
        var p3 = savedList.get(0);
        assertThat(p3.getDescription()).isEqualTo("Havan 3/5");
        assertThat(p3.getAccrualDate()).isEqualTo(LocalDate.of(2026, 10, 15));
        assertThat(p3.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(p3.getType()).isEqualTo(TransactionType.EXPENSE);

        // 2. Parcela 4/5 projetada para Novembro (+1 mês)
        var p4 = savedList.get(1);
        assertThat(p4.getDescription()).isEqualTo("Havan 4/5");
        assertThat(p4.getAccrualDate()).isEqualTo(LocalDate.of(2026, 11, 15));
        assertThat(p4.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(p4.getType()).isEqualTo(TransactionType.EXPENSE);
        assertThat(p4.getNotes()).contains("projetada automaticamente");

        // 3. Parcela 5/5 projetada para Dezembro (+2 meses)
        var p5 = savedList.get(2);
        assertThat(p5.getDescription()).isEqualTo("Havan 5/5");
        assertThat(p5.getAccrualDate()).isEqualTo(LocalDate.of(2026, 12, 15));
        assertThat(p5.getAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(p5.getType()).isEqualTo(TransactionType.EXPENSE);
        assertThat(p5.getNotes()).contains("projetada automaticamente");
    }

    @Test
    @DisplayName("Prevenção de duplicidade: ao importar a fatura do mês seguinte com Havan 4/5, não deve duplicar os lançamentos já projetados")
    void shouldNotDuplicateFutureInstallmentWhenImportingNextMonthInvoice() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Nubank Cartão", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        // Simula que no banco de dados JÁ EXISTEM a parcela 3/5 em Outubro, 4/5 em Novembro e 5/5 em Dezembro
        var existingP3 = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("100.00"),
                LocalDate.of(2026, 10, 15), LocalDate.of(2026, 10, 15),
                "Havan 3/5", accountId, null, null, TransactionOrigin.CSV_IMPORT, "Importado via CSV"
        );
        var existingP4 = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("100.00"),
                LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 15),
                "Havan 4/5", accountId, null, null, TransactionOrigin.CSV_IMPORT, "Importado via CSV [Parcela futura 4/5 projetada automaticamente]"
        );
        var existingP5 = Transaction.create(
                userId, TransactionType.EXPENSE, new BigDecimal("100.00"),
                LocalDate.of(2026, 12, 15), LocalDate.of(2026, 12, 15),
                "Havan 5/5", accountId, null, null, TransactionOrigin.CSV_IMPORT, "Importado via CSV [Parcela futura 5/5 projetada automaticamente]"
        );

        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of(existingP3, existingP4, existingP5));

        // Usuário agora importa a fatura oficial de Novembro contendo "HAVAN 04/05" no dia 15/11/2026
        String nextMonthCsv = """
                date,title,amount
                2026-11-15,HAVAN 04/05,100.00
                """;

        var result = importUseCase.execute(userId, accountId, "fatura_novembro.csv", nextMonthCsv.getBytes(StandardCharsets.UTF_8), true);

        // Deve identificar que a parcela 4/5 já existe e que a 5/5 em Dezembro já existe:
        // NÃO deve criar novas transações duplicadas!
        assertThat(result.importedCount()).isEqualTo(0);
        assertThat(result.skippedCount()).isEqualTo(1);

        // Nenhuma transação com ID novo deve ter sido criada
        verify(transactionRepository, never()).save(argThat(tx -> tx.getId() != existingP4.getId()));
    }

    @Test
    @DisplayName("Quando a fatura já trouxer a última parcela (ex: 5/5), não deve tentar projetar nada para frente")
    void shouldNotProjectWhenLastInstallment() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Nubank Cartão", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of());
        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        // Última parcela de um parcelamento
        String csvContent = """
                date,title,amount
                2026-10-15,Havan 5/5,100.00
                """;

        var result = importUseCase.execute(userId, accountId, "fatura_outubro.csv", csvContent.getBytes(StandardCharsets.UTF_8), true);

        // Importa apenas a parcela 5/5
        assertThat(result.importedCount()).isEqualTo(1);
        assertThat(result.skippedCount()).isEqualTo(0);

        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Quando a fatura contiver 'Parcela 5/6', deve vincular como recorrente e projetar a parcela restante 6/6 para o próximo mês")
    void shouldImportInstallmentWithParcelaFormatAndLinkAsRecurringWithRemainingCount() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Nubank Cartão", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of());
        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        String csvContent = """
                date,title,amount
                2026-10-15,Magazine Luiza Parcela 5/6,150.00
                """;

        var result = importUseCase.execute(userId, accountId, "fatura_outubro.csv", csvContent.getBytes(StandardCharsets.UTF_8), true);

        // Deve importar 2 transações: a 5/6 e a 6/6
        assertThat(result.importedCount()).isEqualTo(2);
        assertThat(result.skippedCount()).isEqualTo(0);

        org.mockito.ArgumentCaptor<Transaction> txCaptor = org.mockito.ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(txCaptor.capture());

        var savedList = txCaptor.getAllValues();
        var p5 = savedList.get(0);
        var p6 = savedList.get(1);

        assertThat(p5.getDescription()).isEqualTo("Magazine Luiza Parcela 5/6");
        assertThat(p5.getAccrualDate()).isEqualTo(LocalDate.of(2026, 10, 15));
        assertThat(p5.getNotes()).contains("RECURRING_EXPENSE:");
        assertThat(p5.getNotes()).contains("(5/6)");

        assertThat(p6.getDescription()).isEqualTo("Magazine Luiza Parcela 6/6");
        assertThat(p6.getAccrualDate()).isEqualTo(LocalDate.of(2026, 11, 15));
        assertThat(p6.getNotes()).contains("RECURRING_EXPENSE:");
        assertThat(p6.getNotes()).contains("(6/6)");
        assertThat(p6.getNotes()).contains("projetada automaticamente");

        // O prefixo do grupo de recorrência deve ser idêntico para vincular as parcelas
        String prefix5 = com.finance.ai.application.financial.UpdateTransactionUseCase.extractRecurringPrefix(p5.getNotes());
        String prefix6 = com.finance.ai.application.financial.UpdateTransactionUseCase.extractRecurringPrefix(p6.getNotes());
        assertThat(prefix5).isNotNull();
        assertThat(prefix6).isNotNull();
        assertThat(prefix5).isEqualTo(prefix6);
    }
}
