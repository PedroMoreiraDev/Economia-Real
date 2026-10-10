package com.finance.ai.infrastructure.persistence.financial.card;

import com.finance.ai.domain.financial.card.InvoiceStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "credit_card_invoices")
public class CreditCardInvoiceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "credit_card_id", nullable = false)
    private UUID creditCardId;

    @Column(name = "reference_month", nullable = false)
    private LocalDate referenceMonth;

    @Column(name = "closing_date", nullable = false)
    private LocalDate closingDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(name = "paid_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal paidAmount;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CreditCardInvoiceJpaEntity() {}

    public CreditCardInvoiceJpaEntity(UUID id, UUID creditCardId, LocalDate referenceMonth,
                                      LocalDate closingDate, LocalDate dueDate, InvoiceStatus status,
                                      BigDecimal paidAmount, Instant paidAt,
                                      Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.creditCardId = creditCardId;
        this.referenceMonth = referenceMonth;
        this.closingDate = closingDate;
        this.dueDate = dueDate;
        this.status = status;
        this.paidAmount = paidAmount;
        this.paidAt = paidAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getCreditCardId() { return creditCardId; }
    public LocalDate getReferenceMonth() { return referenceMonth; }
    public LocalDate getClosingDate() { return closingDate; }
    public LocalDate getDueDate() { return dueDate; }
    public InvoiceStatus getStatus() { return status; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public Instant getPaidAt() { return paidAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
