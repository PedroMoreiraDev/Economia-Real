package com.finance.ai.infrastructure.persistence.financial;

import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionStatus;
import com.finance.ai.domain.financial.TransactionType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class TransactionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "accrual_date", nullable = false)
    private LocalDate accrualDate;

    @Column(name = "settlement_date")
    private LocalDate settlementDate;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "destination_account_id")
    private UUID destinationAccountId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 20)
    private TransactionOrigin origin;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TransactionJpaEntity() {}

    public TransactionJpaEntity(UUID id, UUID userId, TransactionType type, BigDecimal amount,
                                LocalDate accrualDate, LocalDate settlementDate, String description,
                                UUID accountId, UUID destinationAccountId, UUID categoryId,
                                TransactionStatus status, TransactionOrigin origin, String notes,
                                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.amount = amount;
        this.accrualDate = accrualDate;
        this.settlementDate = settlementDate;
        this.description = description;
        this.accountId = accountId;
        this.destinationAccountId = destinationAccountId;
        this.categoryId = categoryId;
        this.status = status;
        this.origin = origin;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
