package com.finance.ai.infrastructure.persistence.financial.goal;

import com.finance.ai.domain.financial.goal.SavingsGoal;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "savings_goals")
public class SavingsGoalJpaEntity {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "target_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "current_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public SavingsGoalJpaEntity() {}

    public static SavingsGoalJpaEntity fromDomain(SavingsGoal goal) {
        var entity = new SavingsGoalJpaEntity();
        entity.id = goal.getId();
        entity.userId = goal.getUserId();
        entity.title = goal.getTitle();
        entity.targetAmount = goal.getTargetAmount();
        entity.currentAmount = goal.getCurrentAmount();
        entity.targetDate = goal.getTargetDate();
        entity.createdAt = goal.getCreatedAt();
        entity.updatedAt = goal.getUpdatedAt();
        return entity;
    }

    public SavingsGoal toDomain() {
        return new SavingsGoal(
                this.id,
                this.userId,
                this.title,
                this.targetAmount,
                this.currentAmount,
                this.targetDate,
                this.createdAt,
                this.updatedAt
        );
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
