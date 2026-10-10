package com.finance.ai.application.financial.analytics;

import com.finance.ai.application.financial.analytics.dto.AnalyticsOverviewDto;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.financial.budget.BudgetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GetAnalyticsOverviewUseCase {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;

    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");

    public GetAnalyticsOverviewUseCase(TransactionRepository transactionRepository,
                                       CategoryRepository categoryRepository,
                                       BudgetRepository budgetRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
    }

    public AnalyticsOverviewDto execute(UUID userId, LocalDate targetMonth) {
        LocalDate currentMonth = (targetMonth != null ? targetMonth : LocalDate.now()).withDayOfMonth(1);
        LocalDate today = LocalDate.now();
        boolean isCurrentMonth = currentMonth.getYear() == today.getYear() && currentMonth.getMonthValue() == today.getMonthValue();

        // 1. Evolução Mensal dos Últimos 6 Meses
        List<AnalyticsOverviewDto.MonthlyEvolutionDto> monthlyEvolution = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate m = currentMonth.minusMonths(i);
            LocalDate start = m.withDayOfMonth(1);
            LocalDate end = m.withDayOfMonth(m.lengthOfMonth());

            List<Transaction> txs = transactionRepository.findAllByUserIdAndPeriod(userId, start, end);

            BigDecimal inc = BigDecimal.ZERO;
            BigDecimal exp = BigDecimal.ZERO;

            for (Transaction tx : txs) {
                if (tx.getType() == TransactionType.INCOME) {
                    inc = inc.add(tx.getAmount());
                } else if (tx.getType() == TransactionType.EXPENSE) {
                    // Sem dupla contagem: despesas primárias
                    exp = exp.add(tx.getAmount());
                }
            }

            inc = inc.setScale(2, RoundingMode.HALF_EVEN);
            exp = exp.setScale(2, RoundingMode.HALF_EVEN);
            BigDecimal net = inc.subtract(exp).setScale(2, RoundingMode.HALF_EVEN);

            String monthName = m.getMonth().getDisplayName(TextStyle.SHORT, PT_BR);
            monthName = monthName.substring(0, 1).toUpperCase(PT_BR) + monthName.substring(1).replace(".", "");

            monthlyEvolution.add(new AnalyticsOverviewDto.MonthlyEvolutionDto(
                    monthName,
                    m.toString().substring(0, 7),
                    inc,
                    exp,
                    net
            ));
        }

        // 2. Distribuição por Categoria no Mês Atual
        LocalDate monthStart = currentMonth;
        LocalDate monthEnd = currentMonth.withDayOfMonth(currentMonth.lengthOfMonth());
        List<Transaction> targetMonthTxs = transactionRepository.findAllByUserIdAndPeriod(userId, monthStart, monthEnd);

        Map<UUID, Category> categoryMap = categoryRepository.findAllByUserIdOrSystemDefault(userId).stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        Map<UUID, BigDecimal> expenseByCat = new HashMap<>();
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (Transaction tx : targetMonthTxs) {
            if (tx.getType() == TransactionType.EXPENSE) {
                BigDecimal val = tx.getAmount();
                totalExpenses = totalExpenses.add(val);
                if (tx.getCategoryId() != null) {
                    expenseByCat.merge(tx.getCategoryId(), val, BigDecimal::add);
                }
            }
        }
        totalExpenses = totalExpenses.setScale(2, RoundingMode.HALF_EVEN);

        List<AnalyticsOverviewDto.CategoryDistributionDto> categoryDistribution = new ArrayList<>();
        for (Map.Entry<UUID, BigDecimal> entry : expenseByCat.entrySet()) {
            Category cat = categoryMap.get(entry.getKey());
            String name = cat != null ? cat.getName() : "Outros";
            String icon = cat != null ? cat.getIcon() : "tag";
            String color = (cat != null && cat.getColorHex() != null) ? cat.getColorHex() : "#6366f1";
            BigDecimal amt = entry.getValue().setScale(2, RoundingMode.HALF_EVEN);

            double percentage = 0.0;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amt.divide(totalExpenses, 4, RoundingMode.HALF_EVEN).doubleValue() * 100.0;
            }

            categoryDistribution.add(new AnalyticsOverviewDto.CategoryDistributionDto(
                    entry.getKey(),
                    name,
                    icon,
                    color,
                    amt,
                    Math.round(percentage * 10.0) / 10.0
            ));
        }
        categoryDistribution.sort(Comparator.comparing(AnalyticsOverviewDto.CategoryDistributionDto::totalAmount).reversed());

        // 3. Burn Rate e Projeção Linear de Consumo
        int totalDays = currentMonth.lengthOfMonth();
        int daysElapsed = isCurrentMonth ? Math.max(1, today.getDayOfMonth()) : totalDays;
        int daysRemaining = Math.max(0, totalDays - daysElapsed);

        BigDecimal spentSoFar = totalExpenses;
        BigDecimal dailyAverage = spentSoFar.divide(BigDecimal.valueOf(daysElapsed), 2, RoundingMode.HALF_EVEN);
        BigDecimal projectedMonthEnd = dailyAverage.multiply(BigDecimal.valueOf(totalDays)).setScale(2, RoundingMode.HALF_EVEN);

        // Somatório dos limites orçados para o mês
        List<Budget> userBudgets = budgetRepository.findAllByUserIdAndMonthReference(userId, currentMonth);
        BigDecimal budgetTotal = userBudgets.stream()
                .map(Budget::getMonthlyLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_EVEN);

        String burnStatus = "SAFE";
        if (budgetTotal.compareTo(BigDecimal.ZERO) > 0) {
            if (projectedMonthEnd.compareTo(budgetTotal) > 0) {
                burnStatus = "CRITICAL";
            } else if (projectedMonthEnd.compareTo(budgetTotal.multiply(new BigDecimal("0.85"))) > 0) {
                burnStatus = "WARNING";
            }
        }

        AnalyticsOverviewDto.BurnRateDto burnRate = new AnalyticsOverviewDto.BurnRateDto(
                spentSoFar,
                dailyAverage,
                projectedMonthEnd,
                budgetTotal,
                daysElapsed,
                daysRemaining,
                totalDays,
                burnStatus
        );

        return new AnalyticsOverviewDto(monthlyEvolution, categoryDistribution, burnRate);
    }
}
