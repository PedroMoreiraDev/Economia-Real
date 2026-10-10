package com.finance.ai.application.financial.export;

import com.finance.ai.domain.financial.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ExportTransactionsCsvUseCaseTest {

    private TransactionRepository transactionRepository;
    private CategoryRepository categoryRepository;
    private AccountRepository accountRepository;
    private ExportTransactionsCsvUseCase useCase;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(TransactionRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        accountRepository = mock(AccountRepository.class);
        useCase = new ExportTransactionsCsvUseCase(transactionRepository, categoryRepository, accountRepository);
    }

    @Test
    @DisplayName("Deve gerar arquivo CSV formatado com cabeçalho, UTF-8 BOM e valores com vírgula")
    void shouldExportCsvWithBomAndCorrectFormatting() {
        var userId = UUID.randomUUID();
        var categoryId = UUID.randomUUID();
        var accountId = UUID.randomUUID();

        var category = Category.create(userId, "Alimentação", "cart", "#FF0000");
        var account = Account.create(userId, "Nubank Principal", AccountType.CHECKING, new BigDecimal("1000.00"));

        var tx = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("45.50"),
                LocalDate.of(2026, 10, 8),
                LocalDate.of(2026, 10, 8),
                "Restaurante Sabor;Natural",
                account.getId(),
                null,
                category.getId(),
                "Almoço executivo"
        );

        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of(tx));
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(category));
        when(accountRepository.findAllByUserId(userId)).thenReturn(List.of(account));

        byte[] csvBytes = useCase.execute(userId, null, null);
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        // Verifica presença do BOM UTF-8 (\uFEFF)
        assertThat(csvContent.charAt(0)).isEqualTo('\uFEFF');

        // Verifica cabeçalho
        assertThat(csvContent).contains("Data;Tipo;Descrição;Valor;Categoria;Conta;Status;Notas");

        // Verifica escape de campos contendo ';' e valor com vírgula decimal
        assertThat(csvContent).contains("08/10/2026;Despesa;\"Restaurante Sabor;Natural\";45,50;Alimentação;Nubank Principal;COMPLETED;Almoço executivo");
    }
}
