package com.finance.ai.domain.financial.recurring;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de Domínio representando uma Despesa Fixa ou Assinatura Recorrente.
 * Obedece estritamente às regras de precisão monetária BigDecimal com escala 2.
 */
public class RecurringBill {

    private final UUID id;
    private final UUID userId;
    private final UUID categoryId;
    private final UUID accountId;
    private final UUID creditCardId;
    private final String description;
    private final BigDecimal amount;
    private final RecurringFrequency frequency;
    private final int dayOfMonth;
    private final boolean active;
    private final Instant createdAt;
    private Instant updatedAt;

    public RecurringBill(UUID id, UUID userId, UUID categoryId, UUID accountId, UUID creditCardId,
                         String description, BigDecimal amount, RecurringFrequency frequency,
                         int dayOfMonth, boolean active, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da despesa recorrente é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.description = validateDescription(description);
        this.amount = validateAndNormalizeAmount(amount);
        this.frequency = frequency != null ? frequency : RecurringFrequency.MONTHLY;
        this.dayOfMonth = validateDayOfMonth(dayOfMonth);
        this.categoryId = categoryId;
        this.accountId = accountId;
        this.creditCardId = creditCardId;
        this.active = active;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static RecurringBill create(UUID userId, UUID categoryId, UUID accountId, UUID creditCardId,
                                       String description, BigDecimal amount, RecurringFrequency frequency,
                                       int dayOfMonth) {
        var now = Instant.now();
        return new RecurringBill(
                UUID.randomUUID(),
                userId,
                categoryId,
                accountId,
                creditCardId,
                description,
                amount,
                frequency,
                dayOfMonth,
                true,
                now,
                now
        );
    }

    public RecurringBill update(UUID categoryId, UUID accountId, UUID creditCardId,
                                String description, BigDecimal amount, RecurringFrequency frequency,
                                int dayOfMonth, boolean active) {
        return new RecurringBill(
                this.id,
                this.userId,
                categoryId,
                accountId,
                creditCardId,
                description,
                amount,
                frequency,
                dayOfMonth,
                active,
                this.createdAt,
                Instant.now()
        );
    }

    /**
     * Calcula a próxima data de vencimento a partir de uma data de referência.
     */
    public LocalDate calculateDueDate(LocalDate referenceDate) {
        int year = referenceDate.getYear();
        int month = referenceDate.getMonthValue();
        int maxDay = referenceDate.lengthOfMonth();
        int targetDay = Math.min(this.dayOfMonth, maxDay);
        return LocalDate.of(year, month, targetDay);
    }

    /**
     * Verifica se a despesa vence dentro de uma janela de dias a partir de hoje.
     */
    public boolean isDueWithinDays(LocalDate today, int daysAhead) {
        if (!this.active) {
            return false;
        }
        LocalDate currentMonthDueDate = calculateDueDate(today);
        long daysDiff = java.time.temporal.ChronoUnit.DAYS.between(today, currentMonthDueDate);
        return daysDiff >= 0 && daysDiff <= daysAhead;
    }

    private static String validateDescription(String desc) {
        if (desc == null || desc.trim().isBlank()) {
            throw new IllegalArgumentException("Descrição da despesa recorrente é obrigatória.");
        }
        return desc.trim();
    }

    private static BigDecimal validateAndNormalizeAmount(BigDecimal value) {
        if (value == null) {
            throw new IllegalArgumentException("Valor da despesa recorrente é obrigatório.");
        }
        BigDecimal normalized = value.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor da despesa recorrente deve ser estritamente positivo.");
        }
        return normalized;
    }

    private static int validateDayOfMonth(int day) {
        if (day < 1 || day > 31) {
            throw new IllegalArgumentException("Dia do vencimento deve estar entre 1 e 31.");
        }
        return day;
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
