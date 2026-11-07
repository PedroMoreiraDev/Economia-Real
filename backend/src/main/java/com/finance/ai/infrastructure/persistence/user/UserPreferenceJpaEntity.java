package com.finance.ai.infrastructure.persistence.user;

import com.finance.ai.domain.user.UserPreference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
public class UserPreferenceJpaEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserPreferenceJpaEntity() {}

    public static UserPreferenceJpaEntity fromDomain(UserPreference domain) {
        var entity = new UserPreferenceJpaEntity();
        entity.userId = domain.getUserId();
        entity.onboardingCompleted = domain.isOnboardingCompleted();
        entity.createdAt = domain.getCreatedAt();
        entity.updatedAt = domain.getUpdatedAt();
        return entity;
    }

    public UserPreference toDomain() {
        return new UserPreference(
                this.userId,
                this.onboardingCompleted,
                this.createdAt,
                this.updatedAt
        );
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
