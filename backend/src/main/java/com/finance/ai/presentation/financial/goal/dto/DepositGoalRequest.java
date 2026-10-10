package com.finance.ai.presentation.financial.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record DepositGoalRequest(
        @NotNull(message = "Valor do aporte é obrigatório.")
        @Positive(message = "Valor do aporte deve ser estritamente positivo.")
        BigDecimal amount,

        UUID sourceAccountId
) {}
