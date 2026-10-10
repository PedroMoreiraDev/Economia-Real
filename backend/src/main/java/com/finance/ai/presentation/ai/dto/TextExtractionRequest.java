package com.finance.ai.presentation.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TextExtractionRequest(
        @NotBlank(message = "O texto para análise não pode estar em branco.")
        @Size(max = 1000, message = "O texto de entrada não pode ultrapassar 1000 caracteres.")
        String text
) {}
