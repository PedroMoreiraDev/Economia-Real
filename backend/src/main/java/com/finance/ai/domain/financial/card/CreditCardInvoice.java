package com.finance.ai.domain.financial.card;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio representando a Fatura Mensal do Cartão de Crédito.
 */
public class CreditCardInvoice {

    private final UUID id;
    private final UUID creditCardId;
    private final LocalDate referenceMonth;
    private final LocalDate closingDate;
    private final LocalDate dueDate;
    private InvoiceStatus status;
    private BigDecimal paidAmount;
    private Instant paidAt;
    private final Instant createdAt;
    private Instant updatedAt;

    public CreditCardInvoice(UUID id, UUID creditCardId, LocalDate referenceMonth,
                             LocalDate closingDate, LocalDate dueDate, InvoiceStatus status,
                             BigDecimal paidAmount, Instant paidAt,
                             Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da fatura é obrigatório.");
        this.creditCardId = Objects.requireNonNull(creditCardId, "ID do cartão é obrigatório.");
        this.referenceMonth = Objects.requireNonNull(referenceMonth, "Mês de referência é obrigatório.");
        this.closingDate = Objects.requireNonNull(closingDate, "Data de fechamento é obrigatória.");
        this.dueDate = Objects.requireNonNull(dueDate, "Data de vencimento é obrigatória.");
        this.status = status != null ? status : InvoiceStatus.OPEN;
        this.paidAmount = paidAmount != null ? paidAmount.setScale(2, RoundingMode.HALF_EVEN) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        this.paidAt = paidAt;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static CreditCardInvoice create(UUID creditCardId, LocalDate referenceMonth,
                                           LocalDate closingDate, LocalDate dueDate) {
        var now = Instant.now();
        return new CreditCardInvoice(
                UUID.randomUUID(),
                creditCardId,
                referenceMonth,
                closingDate,
                dueDate,
                InvoiceStatus.OPEN,
                BigDecimal.ZERO,
                null,
                now,
                now
        );
    }

    public void registerPayment(BigDecimal paymentAmount, Instant paymentInstant) {
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor do pagamento da fatura deve ser maior que zero.");
        }
        this.paidAmount = this.paidAmount.add(paymentAmount.setScale(2, RoundingMode.HALF_EVEN));
        this.paidAt = paymentInstant;
        this.status = InvoiceStatus.PAID;
        this.updatedAt = Instant.now();
    }

    public void closeInvoice() {
        if (this.status == InvoiceStatus.OPEN) {
            this.status = InvoiceStatus.CLOSED;
            this.updatedAt = Instant.now();
        }
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
