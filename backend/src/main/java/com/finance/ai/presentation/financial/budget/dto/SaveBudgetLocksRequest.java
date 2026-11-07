package com.finance.ai.presentation.financial.budget.dto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record SaveBudgetLocksRequest(
        String month,
        Map<UUID, BigDecimal> locks
) {}
