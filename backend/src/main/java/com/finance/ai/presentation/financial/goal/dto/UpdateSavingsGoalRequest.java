package com.finance.ai.presentation.financial.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateSavingsGoalRequest(
        @NotBlank(message = "Título da meta é obrigatório.")
        String title,

        @NotNull(message = "Valor alvo é obrigatório.")
        @Positive(message = "Valor alvo deve ser estritamente positivo.")
        BigDecimal targetAmount,

        LocalDate targetDate
) {}
