package com.finance.ai.domain.user;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class UserPreference {
    private final UUID userId;
    private final boolean onboardingCompleted;
    private final Instant createdAt;
    private Instant updatedAt;

    public UserPreference(UUID userId, boolean onboardingCompleted, Instant createdAt, Instant updatedAt) {
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.onboardingCompleted = onboardingCompleted;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static UserPreference createDefault(UUID userId) {
        var now = Instant.now();
        return new UserPreference(userId, false, now, now);
    }

    public UserPreference withOnboardingCompleted(boolean completed) {
        return new UserPreference(this.userId, completed, this.createdAt, Instant.now());
    }

    public UUID getUserId() { return userId; }
    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

