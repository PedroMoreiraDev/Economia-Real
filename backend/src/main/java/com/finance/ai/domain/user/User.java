package com.finance.ai.domain.user;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidade de domínio do usuário. Pura — sem anotações de framework.
 * A persistência é responsabilidade da camada de infraestrutura.
 */
public class User {

    private final UUID id;
    private final String email;
    private final String fullName;
    private String passwordHash;
    private final Instant createdAt;
    private Instant updatedAt;

    // Construtor para criação de novo usuário
    public User(UUID id, String email, String fullName, String passwordHash, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    // Invariante: e-mail não pode ser vazio
    public static User create(String email, String fullName, String passwordHash) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("E-mail é obrigatório.");
        if (fullName == null || fullName.isBlank()) throw new IllegalArgumentException("Nome completo é obrigatório.");
        if (passwordHash == null || passwordHash.isBlank()) throw new IllegalArgumentException("Hash de senha é obrigatório.");
        var now = Instant.now();
        return new User(UUID.randomUUID(), email.toLowerCase().trim(), fullName.trim(), passwordHash, now);
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
