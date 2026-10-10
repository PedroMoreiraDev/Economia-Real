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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Caso de Uso: ImportBankStatementUseCase (Deduplicação Inteligente)")
class ImportBankStatementUseCaseTest {

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
    @DisplayName("Deve importar novo lançamento e ignorar lançamento já existente com mesma data, valor e descrição")
    void shouldImportNewAndSkipDuplicateTransactions() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Itaú Corrente", AccountType.CHECKING, new BigDecimal("1000.00"));
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));

        // Transação pré-existente
        var existingTx = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("50.00"),
                LocalDate.of(2026, 10, 5),
                LocalDate.of(2026, 10, 5),
                "Restaurante Sabor",
                accountId,
                null,
                null,
                "Lançamento manual anterior"
        );
        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of(existingTx));

        // Conteúdo CSV: uma transação duplicada e uma nova
        String csvContent = """
                Data,Descricao,Valor
                2026-10-05,Restaurante Sabor,-50.00
                2026-10-06,Combustivel Posto,-120.00
                """;

        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = importUseCase.execute(userId, accountId, "extrato_outubro.csv", csvContent.getBytes(StandardCharsets.UTF_8));

        assertThat(result).isNotNull();
        assertThat(result.importedCount()).isEqualTo(1); // Somente Combustível Posto
        assertThat(result.skippedCount()).isEqualTo(1);  // Restaurante Sabor duplicado foi ignorado!
        assertThat(result.fileType()).isEqualTo("CSV");

        verify(transactionRepository, times(1)).save(any(Transaction.class));
        verify(importBatchRepository).save(any(ImportBatch.class));
    }

    @Test
    @DisplayName("Deve importar compras de fatura de cartão como despesas (EXPENSE) e pagamento como INVOICE_PAYMENT")
    void shouldImportCreditCardInvoicePurchasesAsExpenses() throws IOException {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();

        var account = Account.create(userId, "Nubank", AccountType.CHECKING, BigDecimal.ZERO);
        when(accountRepository.findByIdAndUserId(accountId, userId)).thenReturn(Optional.of(account));
        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of());

        String csvContent = """
                date,category,title,amount
                2026-10-01,alimentacao,Almoco Executivo,48.00
                2026-10-05,,Pagamento de fatura,-48.00
                """;

        when(importBatchRepository.save(any(ImportBatch.class))).thenAnswer(inv -> inv.getArgument(0));

        when(merchantCategoryClassifier.resolveCategoryId(eq(userId), anyString())).thenReturn(UUID.randomUUID());

        var result = importUseCase.execute(userId, accountId, "fatura_nubank.csv", csvContent.getBytes(StandardCharsets.UTF_8));

        assertThat(result.importedCount()).isEqualTo(2);

        org.mockito.ArgumentCaptor<Transaction> txCaptor = org.mockito.ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository, times(2)).save(txCaptor.capture());

        var savedTransactions = txCaptor.getAllValues();

        // 1. Compra de almoço deve ser DESPESA (EXPENSE) e não receita!
        var purchase = savedTransactions.get(0);
        assertThat(purchase.getDescription()).isEqualTo("Almoco Executivo");
        assertThat(purchase.getAmount()).isEqualByComparingTo(new BigDecimal("48.00"));
        assertThat(purchase.getType()).isEqualTo(TransactionType.EXPENSE);
        assertThat(purchase.getOrigin()).isEqualTo(TransactionOrigin.CSV_IMPORT);
        assertThat(purchase.getCategoryId()).isNotNull();

        // 2. Pagamento de fatura deve ser INVOICE_PAYMENT para não distorcer receitas/despesas
        var payment = savedTransactions.get(1);
        assertThat(payment.getDescription()).isEqualTo("Pagamento de fatura");
        assertThat(payment.getAmount()).isEqualByComparingTo(new BigDecimal("48.00"));
        assertThat(payment.getType()).isEqualTo(TransactionType.INVOICE_PAYMENT);
        assertThat(payment.getOrigin()).isEqualTo(TransactionOrigin.CSV_IMPORT);
    }
}
