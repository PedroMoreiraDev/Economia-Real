package com.finance.ai.application.financial.budget;

import com.finance.ai.application.financial.budget.dto.BudgetProgressDto;
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
class ListBudgetsUseCaseTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private ListBudgetsUseCase useCase;

    @Test
    @DisplayName("Deve calcular gasto, saldo restante, percentual e avisos de limite")
    void shouldCalculateBudgetProgressAccurately() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        LocalDate month = LocalDate.of(2026, 10, 1);

        Budget budget = Budget.create(userId, categoryId, month, new BigDecimal("1000.00"), 80);
        when(budgetRepository.findAllByUserId(userId)).thenReturn(List.of(budget));

        Category cat = new Category(categoryId, userId, null, "Alimentação", "utensils", "#FF5722", false, Instant.now(), null);
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(cat));

        // 2 transações de despesa somando 850.00 (85% do limite -> deve dar isWarning = true, isExceeded = false)
        Transaction t1 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("500.00"), month, month, "Mercado", UUID.randomUUID(), null, categoryId, null);
        Transaction t2 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("350.00"), month, month, "Restaurante", UUID.randomUUID(), null, categoryId, null);
        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of(t1, t2));

        List<BudgetProgressDto> result = useCase.execute(userId, month);

        assertThat(result).hasSize(1);
        BudgetProgressDto dto = result.get(0);
        assertThat(dto.categoryName()).isEqualTo("Alimentação");
        assertThat(dto.monthlyLimit()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(dto.spentAmount()).isEqualByComparingTo(new BigDecimal("850.00"));
        assertThat(dto.remainingAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(dto.percentageUsed()).isEqualTo(85.0);
        assertThat(dto.isWarning()).isTrue();
        assertThat(dto.isExceeded()).isFalse();
    }

    @Test
    @DisplayName("Deve computar gastos por nome de categoria quando IDs divergirem e listar categoria sem teto")
    void shouldMatchCategoryByNameAndIncludeUnbudgetedExpenses() {
        UUID userId = UUID.randomUUID();
        UUID budgetCatId = UUID.randomUUID();
        UUID txCatId = UUID.randomUUID(); // ID diferente, mas mesmo nome
        UUID unbudgetedCatId = UUID.randomUUID();
        LocalDate month = LocalDate.of(2026, 10, 1);

        Budget budget = Budget.create(userId, budgetCatId, month, new BigDecimal("500.00"), 80);
        when(budgetRepository.findAllByUserId(userId)).thenReturn(List.of(budget));

        Category catBudget = new Category(budgetCatId, userId, null, "Delivery", "bike", "#FF9600", false, Instant.now(), null);
        Category catTx = new Category(txCatId, userId, null, "Delivery", "bike", "#FF9600", false, Instant.now(), null);
        Category catUnbudgeted = new Category(unbudgetedCatId, userId, null, "Farmácia", "cross", "#1CB0F6", false, Instant.now(), null);
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(catBudget, catTx, catUnbudgeted));

        // Transação 1: Delivery com txCatId (divergente de budgetCatId) -> deve somar no orçamento Delivery!
        Transaction t1 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("200.00"), month, month, "iFood", UUID.randomUUID(), null, txCatId, null);
        // Transação 2: Farmácia sem orçamento cadastrado -> deve aparecer com monthlyLimit = 0!
        Transaction t2 = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("75.00"), month, month, "Remédios", UUID.randomUUID(), null, unbudgetedCatId, null);
        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of(t1, t2));

        List<BudgetProgressDto> result = useCase.execute(userId, month);

        assertThat(result).hasSize(2);
        
        // Delivery
        BudgetProgressDto deliveryDto = result.stream().filter(r -> r.categoryName().equals("Delivery")).findFirst().orElseThrow();
        assertThat(deliveryDto.spentAmount()).isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(deliveryDto.monthlyLimit()).isEqualByComparingTo(new BigDecimal("500.00"));

        // Farmácia (sem teto definido)
        BudgetProgressDto farmaciaDto = result.stream().filter(r -> r.categoryName().equals("Farmácia")).findFirst().orElseThrow();
        assertThat(farmaciaDto.spentAmount()).isEqualByComparingTo(new BigDecimal("75.00"));
        assertThat(farmaciaDto.monthlyLimit()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Deve herdar meta definida em mês anterior para acompanhar gastos quando não houver orçamento explícito no mês consultado")
    void shouldInheritBudgetFromOtherMonthWhenNotExplicitlyConfigured() {
        UUID userId = UUID.randomUUID();
        UUID saudeCatId = UUID.randomUUID();
        LocalDate configuredMonth = LocalDate.of(2026, 8, 1); // Configurado em agosto
        LocalDate consultedMonth = LocalDate.of(2026, 10, 1); // Consulta em outubro (mês posterior)

        Budget budget = Budget.create(userId, saudeCatId, configuredMonth, new BigDecimal("567.94"), 80);
        when(budgetRepository.findAllByUserId(userId)).thenReturn(List.of(budget));

        Category catSaude = new Category(saudeCatId, userId, null, "Saúde", "heart", "#10B981", false, Instant.now(), null);
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(catSaude));

        // Transação em outubro: R$ 245,57
        Transaction txOutubro = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("245.57"), LocalDate.of(2026, 10, 17), LocalDate.of(2026, 10, 17), "Farmácia e Clínica", UUID.randomUUID(), null, saudeCatId, null);
        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), eq(LocalDate.of(2026, 10, 1)), eq(LocalDate.of(2026, 10, 31))))
                .thenReturn(List.of(txOutubro));

        List<BudgetProgressDto> result = useCase.execute(userId, consultedMonth);

        assertThat(result).hasSize(1);
        BudgetProgressDto dto = result.get(0);
        assertThat(dto.categoryName()).isEqualTo("Saúde");
        assertThat(dto.monthlyLimit()).isEqualByComparingTo(new BigDecimal("567.94"));
        assertThat(dto.spentAmount()).isEqualByComparingTo(new BigDecimal("245.57"));
        assertThat(dto.remainingAmount()).isEqualByComparingTo(new BigDecimal("322.37"));
    }

    @Test
    @DisplayName("Não deve herdar meta de mês futuro quando o mês consultado for anterior à primeira definição histórica")
    void shouldNotInheritBudgetFromFutureMonths() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        LocalDate configuredMonth = LocalDate.of(2026, 10, 1); // Configurado apenas em Outubro
        LocalDate consultedMonth = LocalDate.of(2026, 8, 1);  // Consulta em Agosto anterior

        Budget budget = Budget.create(userId, catId, configuredMonth, new BigDecimal("1000.00"), 80);
        when(budgetRepository.findAllByUserId(userId)).thenReturn(List.of(budget));
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of());
        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of());

        List<BudgetProgressDto> result = useCase.execute(userId, consultedMonth);

        // Agosto não possui meta porque foi definida apenas a partir de Outubro
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Deve manter meta de 4000 nos meses passados e reajustar para 8000 no mês atual e subsequentes")
    void shouldMaintainPastBudgetsAndProjectNewBudgetToCurrentAndSubsequentMonths() {
        UUID userId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();

        // Usuário definiu 4000 em Outubro/2026 e reajustou para 8000 em Dezembro/2026
        Budget budgetOutubro = Budget.create(userId, catId, LocalDate.of(2026, 10, 1), new BigDecimal("4000.00"), 80);
        Budget budgetDezembro = Budget.create(userId, catId, LocalDate.of(2026, 12, 1), new BigDecimal("8000.00"), 80);

        when(budgetRepository.findAllByUserId(userId)).thenReturn(List.of(budgetOutubro, budgetDezembro));

        Category cat = new Category(catId, userId, null, "Alimentação", "utensils", "#FF5722", false, Instant.now(), null);
        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(cat));
        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of());

        // 1. Mês de Outubro/2026 (mês da criação inicial) -> deve ser 4000
        List<BudgetProgressDto> resultOutubro = useCase.execute(userId, LocalDate.of(2026, 10, 1));
        assertThat(resultOutubro.get(0).monthlyLimit()).isEqualByComparingTo(new BigDecimal("4000.00"));

        // 2. Mês de Novembro/2026 (mês intermediário passado) -> deve manter 4000
        List<BudgetProgressDto> resultNovembro = useCase.execute(userId, LocalDate.of(2026, 11, 1));
        assertThat(resultNovembro.get(0).monthlyLimit()).isEqualByComparingTo(new BigDecimal("4000.00"));

        // 3. Mês de Dezembro/2026 (mês do reajuste) -> deve ser 8000
        List<BudgetProgressDto> resultDezembro = useCase.execute(userId, LocalDate.of(2026, 12, 1));
        assertThat(resultDezembro.get(0).monthlyLimit()).isEqualByComparingTo(new BigDecimal("8000.00"));

        // 4. Mês de Janeiro/2027 (mês subsequente) -> deve herdar 8000
        List<BudgetProgressDto> resultJaneiro = useCase.execute(userId, LocalDate.of(2027, 1, 1));
        assertThat(resultJaneiro.get(0).monthlyLimit()).isEqualByComparingTo(new BigDecimal("8000.00"));

        // 5. Mês de Fevereiro/2027 (dois meses subsequentes) -> deve continuar herdando 8000
        List<BudgetProgressDto> resultFevereiro = useCase.execute(userId, LocalDate.of(2027, 2, 1));
        assertThat(resultFevereiro.get(0).monthlyLimit()).isEqualByComparingTo(new BigDecimal("8000.00"));
    }
}
