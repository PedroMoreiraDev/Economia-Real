package com.finance.ai.application.financial.card;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreditCardPurchaseResult(
        UUID purchaseId,
        String description,
        BigDecimal totalAmount,
        int totalInstallments,
        List<InstallmentInfo> installments
) {
    public record InstallmentInfo(
            int installmentNumber,
            BigDecimal amount,
            LocalDate invoiceMonth,
            UUID invoiceId
    ) {}
}
