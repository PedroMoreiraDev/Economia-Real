package com.finance.ai.infrastructure.persistence.financial.budget;

import com.finance.ai.domain.financial.budget.BudgetCategoryLock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "budget_category_locks")
public class BudgetCategoryLockJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "category_id", nullable = false)
    private UUID categoryId;

    @Column(name = "month_reference", nullable = false)
    private LocalDate monthReference;

    @Column(name = "locked_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal lockedAmount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public BudgetCategoryLockJpaEntity() {}

    public static BudgetCategoryLockJpaEntity fromDomain(BudgetCategoryLock domain) {
        var entity = new BudgetCategoryLockJpaEntity();
        entity.id = domain.getId();
        entity.userId = domain.getUserId();
        entity.categoryId = domain.getCategoryId();
        entity.monthReference = domain.getMonthReference();
        entity.lockedAmount = domain.getLockedAmount();
        entity.createdAt = domain.getCreatedAt();
        entity.updatedAt = domain.getUpdatedAt();
        return entity;
    }

    public BudgetCategoryLock toDomain() {
        return new BudgetCategoryLock(
                this.id,
                this.userId,
                this.categoryId,
                this.monthReference,
                this.lockedAmount,
                this.createdAt,
                this.updatedAt
        );
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }

    public LocalDate getMonthReference() { return monthReference; }
    public void setMonthReference(LocalDate monthReference) { this.monthReference = monthReference; }

    public BigDecimal getLockedAmount() { return lockedAmount; }
    public void setLockedAmount(BigDecimal lockedAmount) { this.lockedAmount = lockedAmount; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
