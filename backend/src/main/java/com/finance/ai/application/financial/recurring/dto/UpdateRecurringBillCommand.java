package com.finance.ai.application.financial.recurring.dto;

import com.finance.ai.domain.financial.recurring.RecurringFrequency;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateRecurringBillCommand(
        String description,
        BigDecimal amount,
        RecurringFrequency frequency,
        int dayOfMonth,
        UUID categoryId,
        UUID accountId,
        UUID creditCardId,
        boolean active
) {}
