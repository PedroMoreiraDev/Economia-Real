package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.MonthlySpendingLimit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "monthly_spending_limits")
public class MonthlySpendingLimitJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "month_reference", nullable = false)
    private LocalDate monthReference;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MonthlySpendingLimitJpaEntity() {}

    public static MonthlySpendingLimitJpaEntity fromDomain(MonthlySpendingLimit domain) {
        var entity = new MonthlySpendingLimitJpaEntity();
        entity.id = domain.getId();
        entity.userId = domain.getUserId();
        entity.monthReference = domain.getMonthReference();
        entity.amount = domain.getAmount();
        entity.createdAt = domain.getCreatedAt();
        entity.updatedAt = domain.getUpdatedAt();
        return entity;
    }

    public MonthlySpendingLimit toDomain() {
        return new MonthlySpendingLimit(
                this.id,
                this.userId,
                this.monthReference,
                this.amount,
                this.createdAt,
                this.updatedAt
        );
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public LocalDate getMonthReference() { return monthReference; }
    public void setMonthReference(LocalDate monthReference) { this.monthReference = monthReference; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

