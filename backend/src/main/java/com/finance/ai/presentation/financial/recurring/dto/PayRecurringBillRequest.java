package com.finance.ai.presentation.financial.recurring.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PayRecurringBillRequest(
        LocalDate paymentDate,
        UUID accountId,
        UUID creditCardId,
        Integer replicateMonths
) {}
