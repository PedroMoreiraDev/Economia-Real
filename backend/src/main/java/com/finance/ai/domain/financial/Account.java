package com.finance.ai.domain.financial;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio representando uma Conta Financeira do Usuário.
 * Regras invariantes: escala monetária estritamente 2 e arredondamento HALF_EVEN.
 */
public class Account {

    private final UUID id;
    private final UUID userId;
    private final String name;
    private final AccountType type;
    private final BigDecimal initialBalance;
    private final String currency;
    private final boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    public Account(UUID id, UUID userId, String name, AccountType type,
                   BigDecimal initialBalance, String currency, boolean active,
                   Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da conta é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.name = validateName(name);
        this.type = Objects.requireNonNull(type, "Tipo da conta é obrigatório.");
        this.initialBalance = normalizeMoney(initialBalance);
        this.currency = (currency == null || currency.isBlank()) ? "BRL" : currency.toUpperCase().trim();
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static Account create(UUID userId, String name, AccountType type, BigDecimal initialBalance) {
        var now = Instant.now();
        return new Account(
                UUID.randomUUID(),
                userId,
                name,
                type,
                initialBalance != null ? initialBalance : BigDecimal.ZERO,
                "BRL",
                true,
                now,
                now
        );
    }

    private static String validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome da conta não pode ser vazio.");
        }
        return name.trim();
    }

    private static BigDecimal normalizeMoney(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        return amount.setScale(2, RoundingMode.HALF_EVEN);
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getName() { return name; }
    public AccountType getType() { return type; }
    public BigDecimal getInitialBalance() { return initialBalance; }
    public String getCurrency() { return currency; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
