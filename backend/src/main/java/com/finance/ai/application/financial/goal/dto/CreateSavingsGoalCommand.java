package com.finance.ai.application.financial.goal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateSavingsGoalCommand(
        String title,
        BigDecimal targetAmount,
        LocalDate targetDate
) {}
