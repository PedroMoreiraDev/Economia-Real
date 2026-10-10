package com.finance.ai.application.financial.goal.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SavingsGoalResponse(
        UUID id,
        UUID userId,
        String title,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal remainingAmount,
        BigDecimal progressPercentage,
        boolean isReached,
        LocalDate targetDate,
        Instant createdAt,
        Instant updatedAt
) {}
