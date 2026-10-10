package com.finance.ai.presentation.financial.budget.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SuggestBudgetsRequest(
        @NotNull(message = "O limite global de gastos é obrigatório.")
        @Positive(message = "O limite global de gastos deve ser maior que zero.")
        BigDecimal globalLimit,

        LocalDate monthReference
) {}
