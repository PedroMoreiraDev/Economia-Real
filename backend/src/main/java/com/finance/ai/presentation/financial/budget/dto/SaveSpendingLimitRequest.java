package com.finance.ai.presentation.financial.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SaveSpendingLimitRequest(
        @NotBlank(message = "O mês de referência é obrigatório.")
        String month,

        @NotNull(message = "O valor do teto é obrigatório.")
        @DecimalMin(value = "0.00", message = "O valor do teto não pode ser negativo.")
        BigDecimal amount
) {}

