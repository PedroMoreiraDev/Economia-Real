package com.finance.ai.application.financial.recurring.dto;

import com.finance.ai.domain.financial.recurring.RecurringFrequency;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RecurringBillResponse(
        UUID id,
        UUID userId,
        String description,
        BigDecimal amount,
        RecurringFrequency frequency,
        int dayOfMonth,
        UUID categoryId,
        String categoryName,
        UUID accountId,
        String accountName,
        UUID creditCardId,
        String creditCardName,
        boolean active,
        LocalDate nextDueDate,
        boolean isDueSoon,
        boolean isPaidThisMonth,
        Instant createdAt,
        Instant updatedAt
) {}
