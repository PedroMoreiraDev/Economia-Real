package com.finance.ai.application.financial.budget.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CategoryBudgetSuggestionDto(
        UUID categoryId,
        String categoryName,
        String icon,
        String colorHex,
        BigDecimal suggestedLimit,
        BigDecimal currentExpense,
        int percentageOfTotal,
        String recommendationReason
) {}
