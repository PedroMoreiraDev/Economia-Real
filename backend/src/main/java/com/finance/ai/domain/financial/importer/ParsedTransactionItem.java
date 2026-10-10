package com.finance.ai.domain.financial.importer;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Item bruto extraído durante o parsing de um arquivo OFX ou CSV.
 */
public record ParsedTransactionItem(
        String externalId,
        LocalDate date,
        BigDecimal amount,
        String description,
        boolean isExpense
) {}
