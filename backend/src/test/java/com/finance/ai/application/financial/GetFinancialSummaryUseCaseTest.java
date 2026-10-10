package com.finance.ai.application.financial;

import com.finance.ai.domain.financial.*;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Caso de Uso: GetFinancialSummaryUseCase")
class GetFinancialSummaryUseCaseTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private GetFinancialSummaryUseCase summaryUseCase;

    @Test
    @DisplayName("Deve calcular totais determinísticos e prevenir dupla contagem em pagamentos de fatura e transferências")
    void shouldCalculateSummaryWithAntiDoubleCounting() {
        UUID userId = UUID.randomUUID();
        LocalDate now = LocalDate.now();

        var income = Transaction.create(userId, TransactionType.INCOME, new BigDecimal("5000.00"), now, now, "Salário", null, null, null, null);
        var expense1 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("1200.50"), now, now, "Aluguel", null, null, null, null);
        var expense2 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("350.25"), now, now, "Mercado", null, null, null, null);
        
        // Operação de liquidação de fatura (NÃO deve ser somada como despesa de consumo primário)
        var invoicePayment = Transaction.create(userId, TransactionType.INVOICE_PAYMENT, new BigDecimal("800.00"), now, now, "Pgto Fatura Cartão", null, null, null, null);
        
        // Transferência entre contas (NÃO deve ser despesa nem receita)
        var transfer = Transaction.create(userId, TransactionType.TRANSFER, new BigDecimal("400.00"), now, now, "Transferência Poupança", UUID.randomUUID(), UUID.randomUUID(), null, null);

        when(transactionRepository.findAllByUserId(userId)).thenReturn(List.of(income, expense1, expense2, invoicePayment, transfer));

        // Contas bancárias
        var acc1 = Account.create(userId, "Nubank", AccountType.CHECKING, new BigDecimal("2500.00"));
        var acc2 = Account.create(userId, "Itaú", AccountType.SAVINGS, new BigDecimal("10000.00"));
        when(accountRepository.findAllByUserId(userId)).thenReturn(List.of(acc1, acc2));

        var result = summaryUseCase.execute(userId, null, null);

        // Receitas: 5000.00
        assertThat(result.totalIncome()).isEqualByComparingTo(new BigDecimal("5000.00"));

        // Despesas: 1200.50 + 350.25 = 1550.75 (invoicePayment e transfer NÃO são despesas)
        assertThat(result.totalExpense()).isEqualByComparingTo(new BigDecimal("1550.75"));

        // Economia líquida: 5000.00 - 1550.75 = 3449.25
        assertThat(result.netSavings()).isEqualByComparingTo(new BigDecimal("3449.25"));

        // Saldo consolidado das contas: 2500.00 + 10000.00 = 12500.00
        assertThat(result.totalAccountBalance()).isEqualByComparingTo(new BigDecimal("12500.00"));

        assertThat(result.transactionCount()).isEqualTo(5);
    }
}
