package com.finance.ai.domain.financial.budget;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio pura representando um Orçamento Mensal por Categoria.
 * Obedece estritamente às regras de precisão monetária BigDecimal com escala 2.
 */
public class Budget {

    private final UUID id;
    private final UUID userId;
    private final UUID categoryId;
    private final LocalDate monthReference; // Normalizado para o 1º dia do mês
    private final BigDecimal monthlyLimit;
    private final int alertThresholdPercentage;
    private final Instant createdAt;
    private Instant updatedAt;

    public Budget(UUID id, UUID userId, UUID categoryId, LocalDate monthReference,
                  BigDecimal monthlyLimit, int alertThresholdPercentage,
                  Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID do orçamento é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.categoryId = Objects.requireNonNull(categoryId, "Categoria do orçamento é obrigatória.");
        this.monthReference = normalizeMonthReference(monthReference);
        this.monthlyLimit = validateAndNormalizeLimit(monthlyLimit);
        this.alertThresholdPercentage = validateThreshold(alertThresholdPercentage);
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static Budget create(UUID userId, UUID categoryId, LocalDate monthReference,
                                BigDecimal monthlyLimit, Integer alertThresholdPercentage) {
        var now = Instant.now();
        int threshold = (alertThresholdPercentage != null && alertThresholdPercentage > 0)
                ? alertThresholdPercentage : 80;

        return new Budget(
                UUID.randomUUID(),
                userId,
                categoryId,
                monthReference,
                monthlyLimit,
                threshold,
                now,
                now
        );
    }

    public Budget updateLimit(BigDecimal newLimit, Integer newThreshold) {
        int threshold = (newThreshold != null && newThreshold > 0) ? newThreshold : this.alertThresholdPercentage;
        return new Budget(
                this.id,
                this.userId,
                this.categoryId,
                this.monthReference,
                newLimit,
                threshold,
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

    private static BigDecimal validateAndNormalizeLimit(BigDecimal limit) {
        if (limit == null) {
            throw new IllegalArgumentException("O limite mensal do orçamento é obrigatório.");
        }
        var normalized = limit.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O limite mensal deve ser estritamente maior que zero.");
        }
        return normalized;
    }

    private static int validateThreshold(int threshold) {
        if (threshold < 1 || threshold > 100) {
            throw new IllegalArgumentException("O percentual de alerta deve estar entre 1% e 100%.");
        }
        return threshold;
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
