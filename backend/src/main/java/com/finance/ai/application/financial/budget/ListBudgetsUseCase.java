package com.finance.ai.application.financial.budget;

import com.finance.ai.application.financial.budget.dto.BudgetProgressDto;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ListBudgetsUseCase {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    public ListBudgetsUseCase(BudgetRepository budgetRepository,
                              CategoryRepository categoryRepository,
                              TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    public List<BudgetProgressDto> execute(UUID userId, LocalDate monthReference) {
        LocalDate normalizedMonth = (monthReference != null ? monthReference : LocalDate.now()).withDayOfMonth(1);
        LocalDate startDate = normalizedMonth;
        LocalDate endDate = normalizedMonth.plusMonths(1).minusDays(1);

        List<Budget> allUserBudgets = budgetRepository.findAllByUserId(userId);

        Map<UUID, List<Budget>> byCategory = allUserBudgets.stream()
                .collect(Collectors.groupingBy(Budget::getCategoryId));

        List<Budget> budgets = new ArrayList<>();
        for (Map.Entry<UUID, List<Budget>> entry : byCategory.entrySet()) {
            List<Budget> catBudgets = entry.getValue();

            Optional<Budget> exact = catBudgets.stream()
                    .filter(b -> b.getMonthReference().withDayOfMonth(1).isEqual(normalizedMonth))
                    .findFirst();

            if (exact.isPresent()) {
                budgets.add(exact.get());
            } else {
                catBudgets.stream()
                        .max(Comparator.comparing(Budget::getMonthReference))
                        .ifPresent(latest -> budgets.add(new Budget(
                                latest.getId(),
                                latest.getUserId(),
                                latest.getCategoryId(),
                                normalizedMonth,
                                latest.getMonthlyLimit(),
                                latest.getAlertThresholdPercentage(),
                                latest.getCreatedAt(),
                                latest.getUpdatedAt()
                        )));
            }
        }

        Map<UUID, Category> categoryMap = categoryRepository.findAllByUserIdOrSystemDefault(userId).stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        List<Transaction> monthTransactions = transactionRepository.findAllByUserIdAndPeriod(userId, startDate, endDate);

        // Agrupar despesas primárias por categoria (por ID e por Nome Normalizado)
        Map<UUID, BigDecimal> expensesByCategoryId = new HashMap<>();
        Map<String, BigDecimal> expensesByCategoryName = new HashMap<>();

        for (Transaction tx : monthTransactions) {
            if (tx.getType() == TransactionType.EXPENSE && tx.getCategoryId() != null) {
                expensesByCategoryId.merge(tx.getCategoryId(), tx.getAmount(), BigDecimal::add);
                Category txCat = categoryMap.get(tx.getCategoryId());
                if (txCat != null && txCat.getName() != null) {
                    String normName = txCat.getName().trim().toLowerCase();
                    expensesByCategoryName.merge(normName, tx.getAmount(), BigDecimal::add);
                }
            }
        }

        List<BudgetProgressDto> result = new ArrayList<>();
        Set<UUID> budgetedCategoryIds = new HashSet<>();
        Set<String> budgetedCategoryNames = new HashSet<>();

        for (Budget budget : budgets) {
            Category cat = categoryMap.get(budget.getCategoryId());
            String catName = cat != null ? cat.getName() : "Categoria Desconhecida";
            String normCatName = catName.trim().toLowerCase();
            String catIcon = cat != null ? cat.getIcon() : "tag";
            String catColor = cat != null ? cat.getColorHex() : "#64748b";

            // Busca por ID direto; se não houver ou for zero, busca por nome normalizado
            BigDecimal spent = expensesByCategoryId.get(budget.getCategoryId());
            if (spent == null || spent.compareTo(BigDecimal.ZERO) == 0) {
                spent = expensesByCategoryName.getOrDefault(normCatName, BigDecimal.ZERO);
            }
            spent = spent.setScale(2, RoundingMode.HALF_EVEN);

            BigDecimal limit = budget.getMonthlyLimit().setScale(2, RoundingMode.HALF_EVEN);
            BigDecimal remaining = limit.subtract(spent).setScale(2, RoundingMode.HALF_EVEN);

            double percentage = 0.0;
            if (limit.compareTo(BigDecimal.ZERO) > 0) {
                percentage = spent.divide(limit, 4, RoundingMode.HALF_EVEN).doubleValue() * 100.0;
            }

            boolean isWarning = percentage >= budget.getAlertThresholdPercentage() && percentage < 100.0;
            boolean isExceeded = percentage >= 100.0;

            result.add(new BudgetProgressDto(
                    budget.getId(),
                    budget.getCategoryId(),
                    catName,
                    catIcon,
                    catColor,
                    budget.getMonthReference(),
                    limit,
                    spent,
                    remaining,
                    Math.round(percentage * 10.0) / 10.0,
                    budget.getAlertThresholdPercentage(),
                    isWarning,
                    isExceeded
            ));

            budgetedCategoryIds.add(budget.getCategoryId());
            budgetedCategoryNames.add(normCatName);
        }

        // Adiciona categorias com despesas reais no mês que ainda não possuem meta orçamentária definida
        for (Map.Entry<UUID, BigDecimal> entry : expensesByCategoryId.entrySet()) {
            UUID catId = entry.getKey();
            Category c = categoryMap.get(catId);
            String name = c != null ? c.getName() : "Outros";
            String normName = name.trim().toLowerCase();

            if (!budgetedCategoryIds.contains(catId) && !budgetedCategoryNames.contains(normName)) {
                BigDecimal spent = entry.getValue().setScale(2, RoundingMode.HALF_EVEN);
                String catIcon = c != null ? c.getIcon() : "tag";
                String catColor = c != null ? c.getColorHex() : "#64748b";

                result.add(new BudgetProgressDto(
                        null,
                        catId,
                        name,
                        catIcon,
                        catColor,
                        normalizedMonth,
                        BigDecimal.ZERO,
                        spent,
                        spent.negate(),
                        0.0,
                        80,
                        false,
                        false
                ));
                budgetedCategoryNames.add(normName);
            }
        }

        // Ordena: primeiro os que têm limite estabelecido (por % decrescente), depois os sem limite por gasto decrescente
        result.sort((a, b) -> {
            boolean aHasLimit = a.monthlyLimit().compareTo(BigDecimal.ZERO) > 0;
            boolean bHasLimit = b.monthlyLimit().compareTo(BigDecimal.ZERO) > 0;
            if (aHasLimit && !bHasLimit) return -1;
            if (!aHasLimit && bHasLimit) return 1;
            if (aHasLimit) {
                return Double.compare(b.percentageUsed(), a.percentageUsed());
            }
            return b.spentAmount().compareTo(a.spentAmount());
        });

        return result;
    }
}
