package com.finance.ai.infrastructure.persistence.user;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidade JPA de usuário — isolada da entidade de domínio.
 * Conversão explícita evita acoplamento do domínio ao ORM.
 */
@Entity
@Table(name = "users")
public class UserJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = true;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_code_expires_at")
    private Instant verificationCodeExpiresAt;

    @Column(name = "verification_attempts", nullable = false)
    private int verificationAttempts = 0;

    @Column(name = "password_reset_code", length = 6)
    private String passwordResetCode;

    @Column(name = "password_reset_expires_at")
    private Instant passwordResetExpiresAt;

    @Column(name = "password_reset_attempts", nullable = false)
    private int passwordResetAttempts = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserJpaEntity() {}

    public UserJpaEntity(UUID id, String email, String passwordHash, String fullName,
                         boolean emailVerified, String verificationCode, Instant verificationCodeExpiresAt,
                         int verificationAttempts,
                         String passwordResetCode, Instant passwordResetExpiresAt,
                         int passwordResetAttempts,
                         Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.emailVerified = emailVerified;
        this.verificationCode = verificationCode;
        this.verificationCodeExpiresAt = verificationCodeExpiresAt;
        this.verificationAttempts = verificationAttempts;
        this.passwordResetCode = passwordResetCode;
        this.passwordResetExpiresAt = passwordResetExpiresAt;
        this.passwordResetAttempts = passwordResetAttempts;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getFullName() { return fullName; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getVerificationCode() { return verificationCode; }
    public Instant getVerificationCodeExpiresAt() { return verificationCodeExpiresAt; }
    public int getVerificationAttempts() { return verificationAttempts; }
    public String getPasswordResetCode() { return passwordResetCode; }
    public Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
    public int getPasswordResetAttempts() { return passwordResetAttempts; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
