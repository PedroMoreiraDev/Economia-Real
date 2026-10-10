package com.finance.ai.domain.financial.card;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreditCardInvoiceRepository {
    List<CreditCardInvoice> findAllByCreditCardId(UUID creditCardId);
    Optional<CreditCardInvoice> findByCreditCardIdAndReferenceMonth(UUID creditCardId, LocalDate referenceMonth);
    Optional<CreditCardInvoice> findById(UUID id);
    CreditCardInvoice save(CreditCardInvoice invoice);
}
