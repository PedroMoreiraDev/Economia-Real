package com.finance.ai.presentation.ai.dto;

import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AiExtractionResponse(
        String description,
        BigDecimal amount,
        TransactionType type,
        LocalDate accrualDate,
        String suggestedCategoryName,
        UUID suggestedCategoryId,
        String suggestedPaymentMethod,
        double confidenceScore,
        List<String> ambiguities,
        TransactionOrigin origin,
        String rawInput,
        String transcribedText
) {
    public static AiExtractionResponse from(ExtractedTransaction extracted, String transcribedText) {
        return new AiExtractionResponse(
                extracted.description(),
                extracted.amount(),
                extracted.type(),
                extracted.accrualDate(),
                extracted.suggestedCategoryName(),
                extracted.suggestedCategoryId(),
                extracted.suggestedPaymentMethod(),
                extracted.confidenceScore(),
                extracted.ambiguities(),
                extracted.origin(),
                extracted.rawInput(),
                transcribedText
        );
    }
}
