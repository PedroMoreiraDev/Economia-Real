package com.finance.ai.application.financial.analytics;

import com.finance.ai.application.financial.analytics.dto.AnalyticsOverviewDto;
import com.finance.ai.domain.financial.*;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetAnalyticsOverviewUseCaseTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private GetAnalyticsOverviewUseCase useCase;

    @Test
    @DisplayName("Deve gerar evolução de 6 meses e burn rate ignorando INVOICE_PAYMENT e TRANSFER")
    void shouldGenerateAnalyticsOverviewWithoutDoubleCounting() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        LocalDate targetMonth = LocalDate.of(2026, 10, 1);

        Category cat = new Category(catId, userId, null, "Lazer", "film", "#3b82f6", false, Instant.now(), null);
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(cat));

        // Transações: Receita 3000, Despesa 1200, Pagamento de fatura 800 (não conta), Transferência 500 (não conta)
        Transaction r1 = Transaction.create(userId, TransactionType.INCOME, new BigDecimal("3000.00"), targetMonth, targetMonth, "Salário", UUID.randomUUID(), null, null, null);
        Transaction d1 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("1200.00"), targetMonth, targetMonth, "Cinema e Viagem", UUID.randomUUID(), null, catId, null);
        Transaction inv = new Transaction(
                UUID.randomUUID(), userId, TransactionType.INVOICE_PAYMENT, new BigDecimal("800.00"),
                targetMonth, targetMonth, "Pgto Fatura", UUID.randomUUID(), null, null,
                TransactionStatus.COMPLETED, TransactionOrigin.MANUAL, null, Instant.now(), null
        );

        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any()))
                .thenReturn(List.of(r1, d1, inv));

        Budget b1 = Budget.create(userId, catId, targetMonth, new BigDecimal("2000.00"), 80);
        when(budgetRepository.findAllByUserIdAndMonthReference(eq(userId), eq(targetMonth)))
                .thenReturn(List.of(b1));

        AnalyticsOverviewDto overview = useCase.execute(userId, targetMonth);

        // 6 meses de evolução
        assertThat(overview.monthlyEvolution()).hasSize(6);

        // Distribuição por categoria deve conter apenas os 1200 de despesa primária
        assertThat(overview.categoryDistribution()).hasSize(1);
        assertThat(overview.categoryDistribution().get(0).totalAmount()).isEqualByComparingTo(new BigDecimal("1200.00"));
        assertThat(overview.categoryDistribution().get(0).percentage()).isEqualTo(100.0);

        // Burn rate
        assertThat(overview.burnRate().spentSoFar()).isEqualByComparingTo(new BigDecimal("1200.00"));
        assertThat(overview.burnRate().monthlyBudgetTotal()).isEqualByComparingTo(new BigDecimal("2000.00"));
    }
}
