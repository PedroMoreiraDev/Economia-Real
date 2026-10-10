package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.Budget;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budgets")
public class BudgetJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "month_reference", nullable = false)
    private LocalDate monthReference;

    @Column(name = "monthly_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimit;

    @Column(name = "alert_threshold_percentage", nullable = false)
    private int alertThresholdPercentage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public BudgetJpaEntity() {}

    public static BudgetJpaEntity fromDomain(Budget budget) {
        var entity = new BudgetJpaEntity();
        entity.id = budget.getId();
        entity.userId = budget.getUserId();
        entity.categoryId = budget.getCategoryId();
        entity.monthReference = budget.getMonthReference();
        entity.monthlyLimit = budget.getMonthlyLimit();
        entity.alertThresholdPercentage = budget.getAlertThresholdPercentage();
        entity.createdAt = budget.getCreatedAt();
        entity.updatedAt = budget.getUpdatedAt();
        return entity;
    }

    public Budget toDomain() {
        return new Budget(
                this.id,
                this.userId,
                this.categoryId,
                this.monthReference,
                this.monthlyLimit,
                this.alertThresholdPercentage,
                this.createdAt,
                this.updatedAt
        );
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getCategoryId() { return categoryId; }
    public LocalDate getMonthReference() { return monthReference; }
    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
    public int getAlertThresholdPercentage() { return alertThresholdPercentage; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
