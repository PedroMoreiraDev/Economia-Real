package com.finance.ai.application.financial.goal.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record WithdrawGoalCommand(
        BigDecimal amount,
        UUID destinationAccountId
) {}
