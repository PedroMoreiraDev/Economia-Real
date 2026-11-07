package com.finance.ai.domain.financial.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class BudgetCategoryLock {

    private final UUID id;
    private final UUID userId;
    private final UUID categoryId;
    private final LocalDate monthReference;
    private final BigDecimal lockedAmount;
    private final Instant createdAt;
    private Instant updatedAt;

    public BudgetCategoryLock(UUID id, UUID userId, UUID categoryId, LocalDate monthReference,
                              BigDecimal lockedAmount, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID do cadeado é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.categoryId = Objects.requireNonNull(categoryId, "ID da categoria é obrigatório.");
        this.monthReference = normalizeMonth(monthReference);
        this.lockedAmount = validateAmount(lockedAmount);
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static BudgetCategoryLock create(UUID userId, UUID categoryId, LocalDate monthReference, BigDecimal lockedAmount) {
        var now = Instant.now();
        return new BudgetCategoryLock(
                UUID.randomUUID(),
                userId,
                categoryId,
                monthReference,
                lockedAmount,
                now,
                now
        );
    }

    private static LocalDate normalizeMonth(LocalDate date) {
        return (date != null ? date : LocalDate.now()).withDayOfMonth(1);
    }

    private static BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        return amount.setScale(2, RoundingMode.HALF_EVEN);
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getCategoryId() { return categoryId; }
    public LocalDate getMonthReference() { return monthReference; }
    public BigDecimal getLockedAmount() { return lockedAmount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
