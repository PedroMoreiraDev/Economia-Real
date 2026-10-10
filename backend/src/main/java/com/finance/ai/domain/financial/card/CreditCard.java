package com.finance.ai.domain.financial.card;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio representando um Cartão de Crédito.
 */
public class CreditCard {

    private final UUID id;
    private final UUID userId;
    private final String name;
    private final BigDecimal creditLimit;
    private final int closingDay;
    private final int dueDay;
    private final boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    public CreditCard(UUID id, UUID userId, String name, BigDecimal creditLimit,
                      int closingDay, int dueDay, boolean active,
                      Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID do cartão é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.name = validateName(name);
        this.creditLimit = validateCreditLimit(creditLimit);
        this.closingDay = validateDay(closingDay, "Dia de fechamento");
        this.dueDay = validateDay(dueDay, "Dia de vencimento");
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static CreditCard create(UUID userId, String name, BigDecimal creditLimit, int closingDay, int dueDay) {
        var now = Instant.now();
        return new CreditCard(
                UUID.randomUUID(),
                userId,
                name,
                creditLimit,
                closingDay,
                dueDay,
                true,
                now,
                now
        );
    }

    private static String validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome do cartão é obrigatório.");
        }
        return name.trim();
    }

    private static BigDecimal validateCreditLimit(BigDecimal limit) {
        if (limit == null || limit.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Limite do cartão não pode ser negativo.");
        }
        return limit.setScale(2, RoundingMode.HALF_EVEN);
    }

    private static int validateDay(int day, String fieldName) {
        if (day < 1 || day > 31) {
            throw new IllegalArgumentException(fieldName + " deve estar entre 1 e 31.");
        }
        return day;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getName() { return name; }
    public BigDecimal getCreditLimit() { return creditLimit; }
    public int getClosingDay() { return closingDay; }
    public int getDueDay() { return dueDay; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
