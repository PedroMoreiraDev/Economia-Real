package com.finance.ai.infrastructure.persistence.financial.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface CreditCardInvoiceSpringDataRepository extends JpaRepository<CreditCardInvoiceJpaEntity, UUID> {
    List<CreditCardInvoiceJpaEntity> findAllByCreditCardIdOrderByReferenceMonthDesc(UUID creditCardId);
    Optional<CreditCardInvoiceJpaEntity> findByCreditCardIdAndReferenceMonth(UUID creditCardId, LocalDate referenceMonth);
}
