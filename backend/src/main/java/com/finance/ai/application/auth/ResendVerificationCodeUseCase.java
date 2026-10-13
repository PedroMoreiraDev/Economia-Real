package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.EmailSenderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Caso de uso: Reenvio de código de ativação por e-mail com geração de novo código de 6 dígitos.
 */
@Service
public class ResendVerificationCodeUseCase {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailSenderService emailSenderService;

    public ResendVerificationCodeUseCase(UserRepository userRepository, EmailSenderService emailSenderService) {
        this.userRepository = userRepository;
        this.emailSenderService = emailSenderService;
    }

    @Transactional
    public String execute(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }

        var normalizedEmail = email.toLowerCase().trim();
        var user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (user.isEmailVerified()) {
            throw new IllegalStateException("Esta conta já está ativada. Você já pode fazer login.");
        }

        String newCode = String.format("%06d", RANDOM.nextInt(1000000));
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        user.renewVerificationCode(newCode, expiresAt);
        userRepository.save(user);

        if (emailSenderService != null) {
            emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), newCode);
        }

        return "Novo código de verificação enviado! Se o e-mail não chegar na caixa de entrada, utilize o código: " + newCode;
    }
}
