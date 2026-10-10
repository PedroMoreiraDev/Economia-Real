package com.finance.ai.application.financial.goal.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DepositGoalCommand(
        BigDecimal amount,
        UUID sourceAccountId
) {}
