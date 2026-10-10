package com.finance.ai.domain.financial.goal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio pura representando uma Meta de Economia (Savings Goal).
 * Obedece estritamente às regras de precisão monetária BigDecimal com escala 2 e RoundingMode.HALF_EVEN.
 */
public class SavingsGoal {

    private final UUID id;
    private final UUID userId;
    private final String title;
    private final BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private final LocalDate targetDate;
    private final Instant createdAt;
    private Instant updatedAt;

    public SavingsGoal(UUID id, UUID userId, String title, BigDecimal targetAmount,
                       BigDecimal currentAmount, LocalDate targetDate,
                       Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da meta é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.title = validateTitle(title);
        this.targetAmount = validateAndNormalizeAmount(targetAmount, "Valor alvo");
        this.currentAmount = currentAmount != null
                ? currentAmount.setScale(2, RoundingMode.HALF_EVEN)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        this.targetDate = targetDate;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;

        if (this.currentAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Saldo atual da meta não pode ser negativo.");
        }
    }

    public static SavingsGoal create(UUID userId, String title, BigDecimal targetAmount, LocalDate targetDate) {
        var now = Instant.now();
        return new SavingsGoal(
                UUID.randomUUID(),
                userId,
                title,
                targetAmount,
                BigDecimal.ZERO,
                targetDate,
                now,
                now
        );
    }

    public SavingsGoal update(String newTitle, BigDecimal newTargetAmount, LocalDate newTargetDate) {
        return new SavingsGoal(
                this.id,
                this.userId,
                newTitle != null ? newTitle : this.title,
                newTargetAmount != null ? newTargetAmount : this.targetAmount,
                this.currentAmount,
                newTargetDate,
                this.createdAt,
                Instant.now()
        );
    }

    /**
     * Realiza um aporte na meta aumentando o saldo acumulado.
     */
    public void deposit(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Valor do aporte é obrigatório.");
        }
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor do aporte deve ser estritamente positivo.");
        }
        this.currentAmount = this.currentAmount.add(normalized);
        this.updatedAt = Instant.now();
    }

    /**
     * Realiza um resgate/retirada da meta diminuindo o saldo acumulado.
     */
    public void withdraw(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Valor do resgate é obrigatório.");
        }
        BigDecimal normalized = amount.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor do resgate deve ser estritamente positivo.");
        }
        if (normalized.compareTo(this.currentAmount) > 0) {
            throw new IllegalStateException("Saldo insuficiente na meta para este resgate.");
        }
        this.currentAmount = this.currentAmount.subtract(normalized);
        this.updatedAt = Instant.now();
    }

    /**
     * Calcula o percentual de conclusão da meta (0% a 100%+).
     */
    public BigDecimal calculateProgressPercentage() {
        if (this.targetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
        }
        return this.currentAmount
                .multiply(BigDecimal.valueOf(100))
                .divide(this.targetAmount, 2, RoundingMode.HALF_EVEN);
    }

    /**
     * Calcula o valor restante para atingir a meta.
     */
    public BigDecimal getRemainingAmount() {
        BigDecimal diff = this.targetAmount.subtract(this.currentAmount);
        return diff.compareTo(BigDecimal.ZERO) > 0 ? diff : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_EVEN);
    }

    public boolean isReached() {
        return this.currentAmount.compareTo(this.targetAmount) >= 0;
    }

    private static String validateTitle(String title) {
        if (title == null || title.trim().isBlank()) {
            throw new IllegalArgumentException("Título da meta é obrigatório.");
        }
        return title.trim();
    }

    private static BigDecimal validateAndNormalizeAmount(BigDecimal val, String fieldName) {
        if (val == null) {
            throw new IllegalArgumentException(fieldName + " é obrigatório.");
        }
        BigDecimal normalized = val.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(fieldName + " deve ser estritamente positivo.");
        }
        return normalized;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTitle() { return title; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public LocalDate getTargetDate() { return targetDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
