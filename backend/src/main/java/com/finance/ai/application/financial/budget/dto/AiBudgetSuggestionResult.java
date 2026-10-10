package com.finance.ai.application.financial.budget.dto;

import java.math.BigDecimal;
import java.util.List;

public record AiBudgetSuggestionResult(
        BigDecimal globalLimit,
        List<CategoryBudgetSuggestionDto> suggestions,
        String aiInsight
) {}
