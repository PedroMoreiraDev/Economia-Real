package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.CaptchaService;
import com.finance.ai.infrastructure.security.EmailSenderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Caso de uso: Solicitação de recuperação de senha por e-mail com proteção CAPTCHA visual.
 */
@Service
public class ForgotPasswordUseCase {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final CaptchaService captchaService;
    private final EmailSenderService emailSenderService;

    @Autowired
    public ForgotPasswordUseCase(
            UserRepository userRepository,
            @Autowired(required = false) CaptchaService captchaService,
            @Autowired(required = false) EmailSenderService emailSenderService) {
        this.userRepository = userRepository;
        this.captchaService = captchaService;
        this.emailSenderService = emailSenderService;
    }

    @Transactional
    public String execute(String email, String captchaToken, String captchaAnswer) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }

        // Validação de CAPTCHA visual para impedir spam de disparos
        if (captchaService != null && captchaToken != null && !captchaToken.isBlank()) {
            captchaService.validateCaptcha(captchaToken, captchaAnswer);
        }

        var normalizedEmail = email.toLowerCase().trim();
        var userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isPresent()) {
            var user = userOpt.get();
            if (user.isEmailVerified()) {
                String code = String.format("%06d", RANDOM.nextInt(1000000));
                Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

                user.generatePasswordReset(code, expiresAt);
                userRepository.save(user);

                if (emailSenderService != null) {
                    emailSenderService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code);
                }
                return "Código de recuperação gerado! Se o e-mail não chegar na caixa de entrada, utilize o código: " + code;
            }
        }

        return "Se o e-mail informado estiver cadastrado, enviamos o código de recuperação para sua caixa de entrada.";
    }
}
