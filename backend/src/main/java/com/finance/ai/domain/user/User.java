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
    private boolean emailVerified;
    private String verificationCode;
    private Instant verificationCodeExpiresAt;
    private String passwordResetCode;
    private Instant passwordResetExpiresAt;
    private final Instant createdAt;
    private Instant updatedAt;

    // Construtor completo (utilizado na reidratação a partir da infraestrutura)
    public User(UUID id, String email, String fullName, String passwordHash,
                boolean emailVerified, String verificationCode, Instant verificationCodeExpiresAt,
                String passwordResetCode, Instant passwordResetExpiresAt,
                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.emailVerified = emailVerified;
        this.verificationCode = verificationCode;
        this.verificationCodeExpiresAt = verificationCodeExpiresAt;
        this.passwordResetCode = passwordResetCode;
        this.passwordResetExpiresAt = passwordResetExpiresAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    // Construtor de compatibilidade para reidratação sem reset
    public User(UUID id, String email, String fullName, String passwordHash,
                boolean emailVerified, String verificationCode, Instant verificationCodeExpiresAt,
                Instant createdAt, Instant updatedAt) {
        this(id, email, fullName, passwordHash, emailVerified, verificationCode, verificationCodeExpiresAt, null, null, createdAt, updatedAt);
    }

    // Construtor de compatibilidade para testes e entidades legadas
    public User(UUID id, String email, String fullName, String passwordHash, Instant createdAt) {
        this(id, email, fullName, passwordHash, true, null, null, null, null, createdAt, createdAt);
    }

    // Criação de usuário com fluxo de verificação de e-mail ativo
    public static User createWithVerification(String email, String fullName, String passwordHash,
                                             String verificationCode, Instant verificationCodeExpiresAt) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("E-mail é obrigatório.");
        if (fullName == null || fullName.isBlank()) throw new IllegalArgumentException("Nome completo é obrigatório.");
        if (passwordHash == null || passwordHash.isBlank()) throw new IllegalArgumentException("Hash de senha é obrigatório.");
        var now = Instant.now();
        return new User(UUID.randomUUID(), email.toLowerCase().trim(), fullName.trim(), passwordHash,
                false, verificationCode, verificationCodeExpiresAt, now, now);
    }

    // Criação tradicional (já verificado)
    public static User create(String email, String fullName, String passwordHash) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("E-mail é obrigatório.");
        if (fullName == null || fullName.isBlank()) throw new IllegalArgumentException("Nome completo é obrigatório.");
        if (passwordHash == null || passwordHash.isBlank()) throw new IllegalArgumentException("Hash de senha é obrigatório.");
        var now = Instant.now();
        return new User(UUID.randomUUID(), email.toLowerCase().trim(), fullName.trim(), passwordHash,
                true, null, null, now, now);
    }

    /**
     * Valida o código de 6 dígitos informado pelo usuário e ativa a conta.
     */
    public void verifyEmail(String code) {
        if (this.emailVerified) {
            return;
        }
        if (this.verificationCode == null || !this.verificationCode.trim().equalsIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Código de verificação incorreto.");
        }
        if (this.verificationCodeExpiresAt != null && Instant.now().isAfter(this.verificationCodeExpiresAt)) {
            throw new IllegalStateException("Código de verificação expirado. Solicite um novo código.");
        }
        this.emailVerified = true;
        this.verificationCode = null;
        this.verificationCodeExpiresAt = null;
        this.updatedAt = Instant.now();
    }

    /**
     * Atualiza o código de verificação para reenvio.
     */
    public void renewVerificationCode(String newCode, Instant newExpiresAt) {
        this.verificationCode = newCode;
        this.verificationCodeExpiresAt = newExpiresAt;
        this.updatedAt = Instant.now();
    }

    /**
     * Gera uma solicitação de redefinição de senha com código e expiração.
     */
    public void generatePasswordReset(String resetCode, Instant expiresAt) {
        if (resetCode == null || resetCode.isBlank()) {
            throw new IllegalArgumentException("Código de redefinição não pode ser vazio.");
        }
        this.passwordResetCode = resetCode.trim();
        this.passwordResetExpiresAt = expiresAt;
        this.updatedAt = Instant.now();
    }

    /**
     * Redefine a senha do usuário após validar o código e expiração.
     */
    public void resetPassword(String code, String newPasswordHash) {
        if (this.passwordResetCode == null || !this.passwordResetCode.trim().equalsIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Código de redefinição inválido.");
        }
        if (this.passwordResetExpiresAt != null && Instant.now().isAfter(this.passwordResetExpiresAt)) {
            throw new IllegalStateException("Código de redefinição expirado. Solicite uma nova recuperação.");
        }
        if (newPasswordHash == null || newPasswordHash.isBlank()) {
            throw new IllegalArgumentException("Nova senha não pode ser vazia.");
        }
        this.passwordHash = newPasswordHash;
        this.passwordResetCode = null;
        this.passwordResetExpiresAt = null;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
    public boolean isEmailVerified() { return emailVerified; }
    public String getVerificationCode() { return verificationCode; }
    public Instant getVerificationCodeExpiresAt() { return verificationCodeExpiresAt; }
    public String getPasswordResetCode() { return passwordResetCode; }
    public Instant getPasswordResetExpiresAt() { return passwordResetExpiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

