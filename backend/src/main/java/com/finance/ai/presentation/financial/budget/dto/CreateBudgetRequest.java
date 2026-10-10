package com.finance.ai.presentation.financial.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBudgetRequest(
        @NotNull(message = "A categoria é obrigatória.")
        UUID categoryId,

        LocalDate monthReference,

        @NotNull(message = "O limite mensal é obrigatório.")
        @DecimalMin(value = "0.01", message = "O limite mensal deve ser maior que zero.")
        BigDecimal monthlyLimit,

        @Min(value = 1, message = "O percentual de alerta deve ser no mínimo 1%.")
        @Max(value = 100, message = "O percentual de alerta deve ser no máximo 100%.")
        Integer alertThresholdPercentage
) {}
