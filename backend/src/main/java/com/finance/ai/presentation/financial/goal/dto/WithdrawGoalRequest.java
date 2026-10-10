package com.finance.ai.presentation.financial.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record WithdrawGoalRequest(
        @NotNull(message = "Valor do resgate é obrigatório.")
        @Positive(message = "Valor do resgate deve ser estritamente positivo.")
        BigDecimal amount,

        UUID destinationAccountId
) {}
