package com.finance.ai.domain.ai;

import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Objeto de valor que encapsula a proposta de transação estruturada extraída por IA.
 * Não é uma transação persistida: representa a interpretação estruturada
 * pendente de validação e confirmação humana pelo usuário.
 */
public record ExtractedTransaction(
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
        String rawInput
) {
    public ExtractedTransaction {
        Objects.requireNonNull(description, "A descrição extraída não pode ser nula.");
        Objects.requireNonNull(type, "O tipo da transação não pode ser nulo.");
        Objects.requireNonNull(accrualDate, "A data da transação não pode ser nula.");
        Objects.requireNonNull(origin, "A origem da transação não pode ser nula.");

        if (amount != null) {
            amount = amount.setScale(2, RoundingMode.HALF_EVEN);
        }
        if (ambiguities == null) {
            ambiguities = List.of();
        }
    }

    public ExtractedTransaction withCategoryId(UUID categoryId) {
        return new ExtractedTransaction(
                this.description,
                this.amount,
                this.type,
                this.accrualDate,
                this.suggestedCategoryName,
                categoryId,
                this.suggestedPaymentMethod,
                this.confidenceScore,
                this.ambiguities,
                this.origin,
                this.rawInput
        );
    }
}
