package com.finance.ai.application.financial;

import java.math.BigDecimal;

public record FinancialSummaryResult(
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal netSavings,
        BigDecimal totalAccountBalance,
        long transactionCount
) {}
