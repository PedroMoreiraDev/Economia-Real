package com.finance.ai.application.financial.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetProgressDto(
        UUID id,
        UUID categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColorHex,
        LocalDate monthReference,
        BigDecimal monthlyLimit,
        BigDecimal spentAmount,
        BigDecimal remainingAmount,
        double percentageUsed,
        int alertThresholdPercentage,
        boolean isWarning,
        boolean isExceeded
) {}
