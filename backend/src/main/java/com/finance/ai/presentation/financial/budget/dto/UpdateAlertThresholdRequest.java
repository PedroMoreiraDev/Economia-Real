package com.finance.ai.presentation.financial.budget.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record UpdateAlertThresholdRequest(
        @Min(value = 1, message = "O percentual de alerta deve ser no mínimo 1%.")
        @Max(value = 100, message = "O percentual de alerta deve ser no máximo 100%.")
        int alertThresholdPercentage,
        LocalDate monthReference
) {
}
