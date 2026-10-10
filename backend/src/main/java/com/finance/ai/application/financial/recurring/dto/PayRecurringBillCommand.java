package com.finance.ai.application.financial.recurring.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PayRecurringBillCommand(
        LocalDate paymentDate,
        UUID accountId,
        UUID creditCardId,
        Integer replicateMonths
) {
    public PayRecurringBillCommand(LocalDate paymentDate, UUID accountId, UUID creditCardId) {
        this(paymentDate, accountId, creditCardId, 1);
    }
}
