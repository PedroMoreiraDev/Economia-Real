package com.finance.ai.domain.user;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidade de domínio do usuário. Pura — sem anotações de framework.
 * A persistência é responsabilidade da camada de infraestrutura.
 */
public class User {

    public static final int MAX_SECURITY_ATTEMPTS = 5;

    private final UUID id;
    private final String email;
    private final String fullName;
    private String passwordHash;
    private boolean emailVerified;
    private String verificationCode;
    private Instant verificationCodeExpiresAt;
    private int verificationAttempts;
    private String passwordResetCode;
    private Instant passwordResetExpiresAt;
    private int passwordResetAttempts;
    private final Instant createdAt;
    private Instant updatedAt;

    // Construtor completo com contadores de tentativas de segurança
    public User(UUID id, String email, String fullName, String passwordHash,
                boolean emailVerified, String verificationCode, Instant verificationCodeExpiresAt,
                int verificationAttempts,
                String passwordResetCode, Instant passwordResetExpiresAt,
                int passwordResetAttempts,
                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.emailVerified = emailVerified;
        this.verificationCode = verificationCode;
        this.verificationCodeExpiresAt = verificationCodeExpiresAt;
        this.verificationAttempts = Math.max(0, verificationAttempts);
        this.passwordResetCode = passwordResetCode;
        this.passwordResetExpiresAt = passwordResetExpiresAt;
        this.passwordResetAttempts = Math.max(0, passwordResetAttempts);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    // Construtor de compatibilidade para reidratação a partir da infraestrutura
    public User(UUID id, String email, String fullName, String passwordHash,
                boolean emailVerified, String verificationCode, Instant verificationCodeExpiresAt,
                String passwordResetCode, Instant passwordResetExpiresAt,
                Instant createdAt, Instant updatedAt) {
        this(id, email, fullName, passwordHash, emailVerified, verificationCode, verificationCodeExpiresAt,
                0, passwordResetCode, passwordResetExpiresAt, 0, createdAt, updatedAt);
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
                false, verificationCode, verificationCodeExpiresAt, 0, null, null, 0, now, now);
    }

    // Criação tradicional (já verificado)
    public static User create(String email, String fullName, String passwordHash) {
        if (email == null || email.isBlank()) throw new IllegalArgumentException("E-mail é obrigatório.");
        if (fullName == null || fullName.isBlank()) throw new IllegalArgumentException("Nome completo é obrigatório.");
        if (passwordHash == null || passwordHash.isBlank()) throw new IllegalArgumentException("Hash de senha é obrigatório.");
        var now = Instant.now();
        return new User(UUID.randomUUID(), email.toLowerCase().trim(), fullName.trim(), passwordHash,
                true, null, null, 0, null, null, 0, now, now);
    }

    /**
     * Valida o código de 6 dígitos informado pelo usuário e ativa a conta.
     * Implementa proteção anti-força bruta (máx 5 tentativas) e comparação em tempo constante.
     */
    public void verifyEmail(String code) {
        if (this.emailVerified) {
            return;
        }

        if (this.verificationCodeExpiresAt != null && Instant.now().isAfter(this.verificationCodeExpiresAt)) {
            this.verificationCode = null;
            this.verificationCodeExpiresAt = null;
            this.verificationAttempts = 0;
            this.updatedAt = Instant.now();
            throw new IllegalStateException("Código de verificação expirado. Solicite um novo código.");
        }

        if (this.verificationCode == null || !constantTimeEquals(this.verificationCode, code)) {
            this.verificationAttempts++;
            this.updatedAt = Instant.now();

            if (this.verificationAttempts >= MAX_SECURITY_ATTEMPTS) {
                this.verificationCode = null;
                this.verificationCodeExpiresAt = null;
                this.verificationAttempts = 0;
                throw new IllegalStateException("Número máximo de tentativas incorretas excedido (" + MAX_SECURITY_ATTEMPTS +
                        "). Por segurança, o código foi invalidado. Solicite um novo código.");
            }

            int remaining = MAX_SECURITY_ATTEMPTS - this.verificationAttempts;
            throw new IllegalArgumentException("Código de verificação incorreto. Tentativas restantes: " + remaining + ".");
        }

        this.emailVerified = true;
        this.verificationCode = null;
        this.verificationCodeExpiresAt = null;
        this.verificationAttempts = 0;
        this.updatedAt = Instant.now();
    }

    /**
     * Atualiza o código de verificação para reenvio e zera o contador de tentativas.
     */
    public void renewVerificationCode(String newCode, Instant newExpiresAt) {
        this.verificationCode = newCode;
        this.verificationCodeExpiresAt = newExpiresAt;
        this.verificationAttempts = 0;
        this.updatedAt = Instant.now();
    }

    /**
     * Gera uma solicitação de redefinição de senha com código e expiração, zerando tentativas.
     */
    public void generatePasswordReset(String resetCode, Instant expiresAt) {
        if (resetCode == null || resetCode.isBlank()) {
            throw new IllegalArgumentException("Código de redefinição não pode ser vazio.");
        }
        this.passwordResetCode = resetCode.trim();
        this.passwordResetExpiresAt = expiresAt;
        this.passwordResetAttempts = 0;
        this.updatedAt = Instant.now();
    }

    /**
     * Redefine a senha do usuário após validar o código e expiração.
     * Implementa proteção anti-força bruta (máx 5 tentativas) e comparação em tempo constante.
     */
    public void resetPassword(String code, String newPasswordHash) {
        if (this.passwordResetExpiresAt != null && Instant.now().isAfter(this.passwordResetExpiresAt)) {
            this.passwordResetCode = null;
            this.passwordResetExpiresAt = null;
            this.passwordResetAttempts = 0;
            this.updatedAt = Instant.now();
            throw new IllegalStateException("Código de redefinição expirado. Solicite uma nova recuperação.");
        }

        if (this.passwordResetCode == null || !constantTimeEquals(this.passwordResetCode, code)) {
            this.passwordResetAttempts++;
            this.updatedAt = Instant.now();

            if (this.passwordResetAttempts >= MAX_SECURITY_ATTEMPTS) {
                this.passwordResetCode = null;
                this.passwordResetExpiresAt = null;
                this.passwordResetAttempts = 0;
                throw new IllegalStateException("Número máximo de tentativas incorretas excedido (" + MAX_SECURITY_ATTEMPTS +
                        "). Por segurança, o código foi invalidado. Solicite uma nova recuperação de senha.");
            }

            int remaining = MAX_SECURITY_ATTEMPTS - this.passwordResetAttempts;
            throw new IllegalArgumentException("Código de redefinição incorreto. Tentativas restantes: " + remaining + ".");
        }

        if (newPasswordHash == null || newPasswordHash.isBlank()) {
            throw new IllegalArgumentException("Nova senha não pode ser vazia.");
        }

        this.passwordHash = newPasswordHash;
        this.passwordResetCode = null;
        this.passwordResetExpiresAt = null;
        this.passwordResetAttempts = 0;
        this.updatedAt = Instant.now();
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] aBytes = a.trim().getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(aBytes, bBytes);
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getPasswordHash() { return passwordHash; }
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
