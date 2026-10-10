package com.finance.ai.infrastructure.persistence.financial.recurring;

import com.finance.ai.domain.financial.recurring.RecurringBill;
import com.finance.ai.domain.financial.recurring.RecurringFrequency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recurring_bills")
public class RecurringBillJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "credit_card_id")
    private UUID creditCardId;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false)
    private RecurringFrequency frequency;

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public RecurringBillJpaEntity() {}

    public static RecurringBillJpaEntity fromDomain(RecurringBill bill) {
        var entity = new RecurringBillJpaEntity();
        entity.id = bill.getId();
        entity.userId = bill.getUserId();
        entity.categoryId = bill.getCategoryId();
        entity.accountId = bill.getAccountId();
        entity.creditCardId = bill.getCreditCardId();
        entity.description = bill.getDescription();
        entity.amount = bill.getAmount();
        entity.frequency = bill.getFrequency();
        entity.dayOfMonth = bill.getDayOfMonth();
        entity.active = bill.isActive();
        entity.createdAt = bill.getCreatedAt();
        entity.updatedAt = bill.getUpdatedAt();
        return entity;
    }

    public RecurringBill toDomain() {
        return new RecurringBill(
                this.id,
                this.userId,
                this.categoryId,
                this.accountId,
                this.creditCardId,
                this.description,
                this.amount,
                this.frequency,
                this.dayOfMonth,
                this.active,
                this.createdAt,
                this.updatedAt
        );
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getCategoryId() { return categoryId; }
    public UUID getAccountId() { return accountId; }
    public UUID getCreditCardId() { return creditCardId; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public RecurringFrequency getFrequency() { return frequency; }
    public int getDayOfMonth() { return dayOfMonth; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
