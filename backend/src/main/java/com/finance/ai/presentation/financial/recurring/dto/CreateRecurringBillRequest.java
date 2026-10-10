package com.finance.ai.presentation.financial.recurring.dto;

import com.finance.ai.domain.financial.recurring.RecurringFrequency;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateRecurringBillRequest(
        @NotBlank(message = "Descrição é obrigatória.")
        String description,

        @NotNull(message = "Valor é obrigatório.")
        @Positive(message = "Valor deve ser maior que zero.")
        BigDecimal amount,

        RecurringFrequency frequency,

        @Min(value = 1, message = "Dia do mês deve ser entre 1 e 31.")
        @Max(value = 31, message = "Dia do mês deve ser entre 1 e 31.")
        int dayOfMonth,

        UUID categoryId,
        UUID accountId,
        UUID creditCardId
) {}
