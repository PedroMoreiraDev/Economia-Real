package com.finance.ai.presentation.financial.recurring.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;
import java.util.UUID;

public record PayRecurringBillRequest(
        LocalDate paymentDate,
        UUID accountId,
        UUID creditCardId,
        @Min(value = 1, message = "O período de replicação deve ser de no mínimo 1 mês.")
        @Max(value = 60, message = "O período de replicação não pode exceder 60 meses.")
        Integer replicateMonths
) {}
