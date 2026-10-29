package com.finance.ai.domain.financial;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio pura representando uma Transação Financeira.
 * Cumpre as regras invioláveis de precisão monetária (BigDecimal escala 2) e
 * separação entre datas de competência (accrualDate) e liquidação (settlementDate).
 */
public class Transaction {

    private final UUID id;
    private final UUID userId;
    private final TransactionType type;
    private final BigDecimal amount;
    private final LocalDate accrualDate;
    private final LocalDate settlementDate;
    private final String description;
    private final UUID accountId;
    private final UUID destinationAccountId;
    private final UUID categoryId;
    private final TransactionStatus status;
    private final TransactionOrigin origin;
    private final String notes;
    private final Instant createdAt;
    private Instant updatedAt;

    public Transaction(UUID id, UUID userId, TransactionType type, BigDecimal amount,
                       LocalDate accrualDate, LocalDate settlementDate, String description,
                       UUID accountId, UUID destinationAccountId, UUID categoryId,
                       TransactionStatus status, TransactionOrigin origin, String notes,
                       Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da transação é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.type = Objects.requireNonNull(type, "Tipo da transação é obrigatório.");
        this.amount = validateAndNormalizeAmount(amount);
        this.accrualDate = Objects.requireNonNull(accrualDate, "Data de competência é obrigatória.");
        this.settlementDate = settlementDate != null ? settlementDate : accrualDate;
        this.description = validateDescription(description);
        this.accountId = accountId;
        this.destinationAccountId = destinationAccountId;
        this.categoryId = categoryId;
        this.status = status != null ? status : TransactionStatus.COMPLETED;
        this.origin = origin != null ? origin : TransactionOrigin.MANUAL;
        this.notes = notes;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;

        validateTransferInvariants();
    }

    public static Transaction create(UUID userId, TransactionType type, BigDecimal amount,
                                     LocalDate accrualDate, LocalDate settlementDate,
                                     String description, UUID accountId, UUID destinationAccountId,
                                     UUID categoryId, String notes) {
        return create(userId, type, amount, accrualDate, settlementDate, description,
                accountId, destinationAccountId, categoryId, TransactionOrigin.MANUAL, notes);
    }

    public static Transaction create(UUID userId, TransactionType type, BigDecimal amount,
                                     LocalDate accrualDate, LocalDate settlementDate,
                                     String description, UUID accountId, UUID destinationAccountId,
                                     UUID categoryId, TransactionOrigin origin, String notes) {
        var now = Instant.now();
        return new Transaction(
                UUID.randomUUID(),
                userId,
                type,
                amount,
                accrualDate,
                settlementDate,
                description,
                accountId,
                destinationAccountId,
                categoryId,
                TransactionStatus.COMPLETED,
                origin != null ? origin : TransactionOrigin.MANUAL,
                notes,
                now,
                now
        );
    }

    public Transaction withUpdates(TransactionType type, BigDecimal amount,
                                   LocalDate accrualDate, LocalDate settlementDate,
                                   String description, UUID accountId, UUID destinationAccountId,
                                   UUID categoryId, String notes) {
        return new Transaction(
                this.id,
                this.userId,
                type != null ? type : this.type,
                amount != null ? amount : this.amount,
                accrualDate != null ? accrualDate : this.accrualDate,
                settlementDate != null ? settlementDate : (accrualDate != null ? accrualDate : this.settlementDate),
                description != null ? description : this.description,
                accountId,
                destinationAccountId,
                categoryId,
                this.status,
                this.origin,
                notes,
                this.createdAt,
                Instant.now()
        );
    }

    public Transaction withCategory(UUID newCategoryId) {
        return new Transaction(
                this.id,
                this.userId,
                this.type,
                this.amount,
                this.accrualDate,
                this.settlementDate,
                this.description,
                this.accountId,
                this.destinationAccountId,
                newCategoryId,
                this.status,
                this.origin,
                this.notes,
                this.createdAt,
                Instant.now()
        );
    }


    private static BigDecimal validateAndNormalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Valor da transação não pode ser nulo.");
        }
        var normalized = amount.setScale(2, RoundingMode.HALF_EVEN);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor da transação deve ser estritamente maior que zero.");
        }
        return normalized;
    }

    private static String validateDescription(String description) {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Descrição da transação é obrigatória.");
        }
        return description.trim();
    }

    private void validateTransferInvariants() {
        if (type == TransactionType.TRANSFER) {
            if (accountId == null || destinationAccountId == null) {
                throw new IllegalArgumentException("Transferências exigem conta de origem e conta de destino.");
            }
            if (accountId.equals(destinationAccountId)) {
                throw new IllegalArgumentException("Conta de origem e destino não podem ser iguais em uma transferência.");
            }
        }
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public TransactionType getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getAccrualDate() { return accrualDate; }
    public LocalDate getSettlementDate() { return settlementDate; }
    public String getDescription() { return description; }
    public UUID getAccountId() { return accountId; }
    public UUID getDestinationAccountId() { return destinationAccountId; }
    public UUID getCategoryId() { return categoryId; }
    public TransactionStatus getStatus() { return status; }
    public TransactionOrigin getOrigin() { return origin; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
