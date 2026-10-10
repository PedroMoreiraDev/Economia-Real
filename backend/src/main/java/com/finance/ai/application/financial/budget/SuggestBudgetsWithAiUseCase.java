package com.finance.ai.application.financial.budget;

import com.finance.ai.application.financial.budget.dto.AiBudgetSuggestionResult;
import com.finance.ai.application.financial.budget.dto.CategoryBudgetSuggestionDto;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import com.finance.ai.domain.financial.TransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Caso de uso para sugerir distribuição inteligente de um Teto Global de Gastos
 * entre as categorias do usuário a partir da análise de hábitos de consumo e faturas.
 * Mantém integridade monetária absoluta com BigDecimal e alocação do resíduo de centavos.
 */
@Service
public class SuggestBudgetsWithAiUseCase {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public SuggestBudgetsWithAiUseCase(TransactionRepository transactionRepository,
                                       CategoryRepository categoryRepository) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public AiBudgetSuggestionResult execute(UUID userId, BigDecimal globalLimit, LocalDate monthReference) {
        if (globalLimit == null || globalLimit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O teto global de gastos deve ser maior que zero.");
        }

        LocalDate normalizedMonth = (monthReference != null ? monthReference : LocalDate.now()).withDayOfMonth(1);
        BigDecimal normalizedGlobalLimit = globalLimit.setScale(2, RoundingMode.HALF_EVEN);

        // 1. Obter categorias disponíveis do usuário
        List<Category> categories = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        if (categories.isEmpty()) {
            throw new IllegalStateException("Nenhuma categoria encontrada para o usuário.");
        }

        // 2. Histórico de despesas dos últimos 60 dias (mês atual e anterior)
        LocalDate historyStart = normalizedMonth.minusMonths(2).withDayOfMonth(1);
        LocalDate historyEnd = normalizedMonth.withDayOfMonth(normalizedMonth.lengthOfMonth());
        List<Transaction> transactions = transactionRepository.findAllByUserIdAndPeriod(userId, historyStart, historyEnd);

        Map<UUID, BigDecimal> expenseByCategory = new HashMap<>();
        BigDecimal totalHistoricalExpense = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            if (tx.getType() == TransactionType.EXPENSE && tx.getCategoryId() != null) {
                expenseByCategory.merge(tx.getCategoryId(), tx.getAmount(), BigDecimal::add);
                totalHistoricalExpense = totalHistoricalExpense.add(tx.getAmount());
            }
        }

        // 3. Pesos base padrão (para categorias sem histórico ou como guia equilibrado)
        Map<String, Double> defaultWeights = Map.of(
                "moradia", 0.28,
                "alimentação", 0.20,
                "serviços & contas", 0.14,
                "transporte", 0.08,
                "aplicativo de transporte", 0.06,
                "delivery", 0.06,
                "saúde", 0.06,
                "lazer", 0.06,
                "compras", 0.06
        );

        // Categorias relevantes (as que têm histórico ou pesos padrão)
        List<Category> activeCategories = categories.stream()
                .filter(c -> !c.getName().equalsIgnoreCase("Salário & Renda") && !c.getName().equalsIgnoreCase("Investimentos"))
                .toList();

        if (activeCategories.isEmpty()) {
            activeCategories = categories;
        }

        // Calcular peso para cada categoria ativa
        Map<UUID, Double> categoryWeights = new LinkedHashMap<>();
        double sumWeights = 0.0;

        for (Category cat : activeCategories) {
            UUID catId = cat.getId();
            String normName = cat.getName().trim().toLowerCase();
            BigDecimal catExpense = expenseByCategory.getOrDefault(catId, BigDecimal.ZERO);

            double weight;
            if (totalHistoricalExpense.compareTo(BigDecimal.ZERO) > 0 && catExpense.compareTo(BigDecimal.ZERO) > 0) {
                // Mistura 70% peso histórico com 30% recomendação balanceada
                double histWeight = catExpense.divide(totalHistoricalExpense, 4, RoundingMode.HALF_EVEN).doubleValue();
                double defWeight = defaultWeights.getOrDefault(normName, 0.05);
                weight = (histWeight * 0.70) + (defWeight * 0.30);
            } else {
                weight = defaultWeights.getOrDefault(normName, 0.05);
            }

            categoryWeights.put(catId, weight);
            sumWeights += weight;
        }

        // 4. Distribuir o limite monetário proporcionalmente garantindo soma exata
        List<CategoryBudgetSuggestionDto> suggestions = new ArrayList<>();
        BigDecimal allocatedTotal = BigDecimal.ZERO;

        for (int i = 0; i < activeCategories.size(); i++) {
            Category cat = activeCategories.get(i);
            UUID catId = cat.getId();
            double weight = categoryWeights.getOrDefault(catId, 0.05);
            double normalizedProportion = sumWeights > 0 ? (weight / sumWeights) : (1.0 / activeCategories.size());

            int percentage = (int) Math.round(normalizedProportion * 100);

            BigDecimal limitForCat = normalizedGlobalLimit
                    .multiply(BigDecimal.valueOf(normalizedProportion))
                    .setScale(2, RoundingMode.HALF_EVEN);

            // Garante pelo menos R$ 10 se a categoria for ativa
            if (limitForCat.compareTo(new BigDecimal("10.00")) < 0 && normalizedGlobalLimit.compareTo(new BigDecimal("100.00")) > 0) {
                limitForCat = new BigDecimal("10.00");
            }

            allocatedTotal = allocatedTotal.add(limitForCat);
            BigDecimal currentSpent = expenseByCategory.getOrDefault(catId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_EVEN);

            String reason = generateReason(cat.getName(), currentSpent, limitForCat, percentage);

            suggestions.add(new CategoryBudgetSuggestionDto(
                    cat.getId(),
                    cat.getName(),
                    cat.getIcon() != null ? cat.getIcon() : "tag",
                    cat.getColorHex() != null ? cat.getColorHex() : "#3b82f6",
                    limitForCat,
                    currentSpent,
                    percentage,
                    reason
            ));
        }

        // 5. Alocar resíduo de centavos na primeira categoria para soma exata bater com o teto global
        BigDecimal difference = normalizedGlobalLimit.subtract(allocatedTotal);
        if (difference.compareTo(BigDecimal.ZERO) != 0 && !suggestions.isEmpty()) {
            CategoryBudgetSuggestionDto first = suggestions.get(0);
            BigDecimal adjustedLimit = first.suggestedLimit().add(difference).setScale(2, RoundingMode.HALF_EVEN);
            suggestions.set(0, new CategoryBudgetSuggestionDto(
                    first.categoryId(),
                    first.categoryName(),
                    first.icon(),
                    first.colorHex(),
                    adjustedLimit,
                    first.currentExpense(),
                    first.percentageOfTotal(),
                    first.recommendationReason()
            ));
        }

        // Ordenar as sugestões pelo maior teto sugerido
        suggestions.sort(Comparator.comparing(CategoryBudgetSuggestionDto::suggestedLimit).reversed());

        String aiInsight = String.format(
                "Distribuímos seu teto de %s entre %d categorias prioritárias com base nos seus lançamentos recentes. Priorizamos despesas essenciais e equilibramos categorias de conveniência (como Delivery e Aplicativos) para você manter o controle e economizar com consistência.",
                "R$ " + normalizedGlobalLimit.toString().replace('.', ','),
                suggestions.size()
        );

        return new AiBudgetSuggestionResult(normalizedGlobalLimit, suggestions, aiInsight);
    }

    private String generateReason(String categoryName, BigDecimal spent, BigDecimal limit, int percentage) {
        String lower = categoryName.toLowerCase();
        if (lower.contains("delivery")) {
            return String.format("Teto de %d%% para frear gastos impulsivos com pedidos e refeições rápidas.", percentage);
        } else if (lower.contains("aplicativo de transporte")) {
            return String.format("Estimativa de %d%% ajustada para seu volume médio de corridas urbanas.", percentage);
        } else if (lower.contains("alimentação")) {
            return String.format("Garante %d%% do orçamento para supermercado e compras essenciais do mês.", percentage);
        } else if (lower.contains("moradia") || lower.contains("serviços")) {
            return String.format("Alocação segura de %d%% para cobrir contas básicas e custos fixos.", percentage);
        } else if (lower.contains("lazer") || lower.contains("compras")) {
            return String.format("Margem controlada de %d%% para permitir estilo de vida sem estourar a meta.", percentage);
        }
        return String.format("Meta recomendada de %d%% do teto global para equilibrar seus gastos.", percentage);
    }
}
