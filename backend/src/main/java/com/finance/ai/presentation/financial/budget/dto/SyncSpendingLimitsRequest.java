package com.finance.ai.presentation.financial.budget.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SyncSpendingLimitsRequest(
        Map<String, BigDecimal> timeline
) {}

