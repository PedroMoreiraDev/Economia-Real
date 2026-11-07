package com.finance.ai.domain.financial.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio representando o Teto Global Mensal de Gastos do Usuário.
 * Garante a integridade financeira e precisão monetária (BigDecimal escala 2).
 */
public class MonthlySpendingLimit {

    private final UUID id;
    private final UUID userId;
    private final LocalDate monthReference;
    private final BigDecimal amount;
    private final Instant createdAt;
    private Instant updatedAt;

    public MonthlySpendingLimit(UUID id, UUID userId, LocalDate monthReference,
                                BigDecimal amount, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID do teto de gastos é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.monthReference = normalizeMonthReference(monthReference);
        this.amount = validateAndNormalizeAmount(amount);
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static MonthlySpendingLimit create(UUID userId, LocalDate monthReference, BigDecimal amount) {
        var now = Instant.now();
        return new MonthlySpendingLimit(
                UUID.randomUUID(),
                userId,
                monthReference,
                amount,
                now,
                now
        );
    }

    public MonthlySpendingLimit updateAmount(BigDecimal newAmount) {
        return new MonthlySpendingLimit(
                this.id,
                this.userId,
                this.monthReference,
                newAmount,
                this.createdAt,
                Instant.now()
        );
    }

    private static LocalDate normalizeMonthReference(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        return date.withDayOfMonth(1);
    }

    private static BigDecimal validateAndNormalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        }
        var normalized = amount.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("O valor do teto de gastos não pode ser negativo.");
        }
        return normalized;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public LocalDate getMonthReference() { return monthReference; }
    public BigDecimal getAmount() { return amount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

