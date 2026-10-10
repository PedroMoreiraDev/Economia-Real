package com.finance.ai.infrastructure.persistence.financial.card;

import com.finance.ai.domain.financial.card.CreditCardInvoice;
import com.finance.ai.domain.financial.card.CreditCardInvoiceRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class CreditCardInvoiceRepositoryAdapter implements CreditCardInvoiceRepository {

    private final CreditCardInvoiceSpringDataRepository jpa;

    CreditCardInvoiceRepositoryAdapter(CreditCardInvoiceSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<CreditCardInvoice> findAllByCreditCardId(UUID creditCardId) {
        return jpa.findAllByCreditCardIdOrderByReferenceMonthDesc(creditCardId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<CreditCardInvoice> findByCreditCardIdAndReferenceMonth(UUID creditCardId, LocalDate referenceMonth) {
        return jpa.findByCreditCardIdAndReferenceMonth(creditCardId, referenceMonth).map(this::toDomain);
    }

    @Override
    public Optional<CreditCardInvoice> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public CreditCardInvoice save(CreditCardInvoice invoice) {
        var entity = toJpaEntity(invoice);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    private CreditCardInvoice toDomain(CreditCardInvoiceJpaEntity e) {
        return new CreditCardInvoice(
                e.getId(),
                e.getCreditCardId(),
                e.getReferenceMonth(),
                e.getClosingDate(),
                e.getDueDate(),
                e.getStatus(),
                e.getPaidAmount(),
                e.getPaidAt(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private CreditCardInvoiceJpaEntity toJpaEntity(CreditCardInvoice i) {
        return new CreditCardInvoiceJpaEntity(
                i.getId(),
                i.getCreditCardId(),
                i.getReferenceMonth(),
                i.getClosingDate(),
                i.getDueDate(),
                i.getStatus(),
                i.getPaidAmount(),
                i.getPaidAt(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }
}
