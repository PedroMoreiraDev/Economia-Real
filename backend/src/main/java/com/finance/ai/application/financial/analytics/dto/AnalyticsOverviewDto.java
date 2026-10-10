package com.finance.ai.application.financial.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AnalyticsOverviewDto(
        List<MonthlyEvolutionDto> monthlyEvolution,
        List<CategoryDistributionDto> categoryDistribution,
        BurnRateDto burnRate
) {
    public record MonthlyEvolutionDto(
            String monthLabel, // ex: "Mai", "Jun", "Jul", "Ago", "Set", "Out"
            String monthIso,   // ex: "2026-10"
            BigDecimal income,
            BigDecimal expense,
            BigDecimal netSavings
    ) {}

    public record CategoryDistributionDto(
            UUID categoryId,
            String categoryName,
            String categoryIcon,
            String colorHex,
            BigDecimal totalAmount,
            double percentage
    ) {}

    public record BurnRateDto(
            BigDecimal spentSoFar,
            BigDecimal dailyAverage,
            BigDecimal projectedMonthEnd,
            BigDecimal monthlyBudgetTotal,
            int daysElapsed,
            int daysRemaining,
            int totalDaysInMonth,
            String burnStatus // "SAFE", "WARNING", "CRITICAL"
    ) {}
}
