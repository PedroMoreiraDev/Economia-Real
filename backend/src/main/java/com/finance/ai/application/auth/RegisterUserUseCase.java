package com.finance.ai.application.auth;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.CaptchaService;
import com.finance.ai.infrastructure.security.EmailSenderService;
import com.finance.ai.infrastructure.security.EmailValidationService;
import com.finance.ai.infrastructure.security.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Caso de uso: Registro de novo usuário com proteção CAPTCHA, validação DNS de e-mail
 * e envio de código de 6 dígitos para ativação.
 */
@Service
public class RegisterUserUseCase {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final DefaultCategorySeeder defaultCategorySeeder;
    private final EmailValidationService emailValidationService;
    private final CaptchaService captchaService;
    private final EmailSenderService emailSenderService;

    public RegisterUserUseCase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenProvider tokenProvider,
            DefaultCategorySeeder defaultCategorySeeder) {
        this(userRepository, passwordEncoder, tokenProvider, defaultCategorySeeder, null, null, null);
    }

    @Autowired
    public RegisterUserUseCase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenProvider tokenProvider,
            DefaultCategorySeeder defaultCategorySeeder,
            EmailValidationService emailValidationService,
            CaptchaService captchaService,
            EmailSenderService emailSenderService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.defaultCategorySeeder = defaultCategorySeeder;
        this.emailValidationService = emailValidationService;
        this.captchaService = captchaService;
        this.emailSenderService = emailSenderService;
    }

    /**
     * Registro completo com CAPTCHA, validação DNS de e-mail e geração de código de 6 dígitos.
     */
    @Transactional
    public RegistrationResult executeWithVerification(
            String email,
            String fullName,
            String rawPassword,
            String captchaToken,
            String captchaAnswer) {

        // 1. Validação de CAPTCHA contra bots
        if (captchaService != null && captchaToken != null && !captchaToken.isBlank()) {
            captchaService.validateCaptcha(captchaToken, captchaAnswer);
        }

        // 2. Validação Rigorosa de E-mail (Sintaxe + Provedores descartáveis + Registros DNS MX)
        if (emailValidationService != null) {
            emailValidationService.validate(email);
        }

        var normalizedEmail = email.toLowerCase().trim();

        // 3. Verificação de Duplicidade
        var existingUserOpt = userRepository.findByEmail(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            var existing = existingUserOpt.get();
            if (existing.isEmailVerified()) {
                throw new EmailAlreadyRegisteredException("E-mail já cadastrado: " + normalizedEmail);
            }

            // Se ainda não ativou a conta, renova o código e reenvia o e-mail em vez de travar
            String renewedCode = String.format("%06d", RANDOM.nextInt(1000000));
            existing.renewVerificationCode(renewedCode, Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(existing);
            if (emailSenderService != null) {
                emailSenderService.sendVerificationCode(existing.getEmail(), existing.getFullName(), renewedCode);
            }

            String renewMsg = "Novo código de verificação enviado! Se o e-mail não chegar na caixa de entrada, utilize o código: " + renewedCode;

            return new RegistrationResult(
                    existing.getId().toString(),
                    existing.getEmail(),
                    existing.getFullName(),
                    true,
                    renewMsg
            );
        }

        // 4. Criação do Usuário com Código de 6 Dígitos
        var passwordHash = passwordEncoder.encode(rawPassword);
        String code = String.format("%06d", RANDOM.nextInt(1000000));
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        var user = User.createWithVerification(normalizedEmail, fullName, passwordHash, code, expiresAt);
        var saved = userRepository.save(user);

        // 5. Semeia Categorias Padrão
        defaultCategorySeeder.seedDefaultsForUser(saved.getId());

        // 6. Envio de E-mail com Template HTML
        if (emailSenderService != null) {
            emailSenderService.sendVerificationCode(saved.getEmail(), saved.getFullName(), code);
        }

        String regMsg = "Código de verificação enviado! Se o e-mail não chegar na caixa de entrada, utilize o código: " + code;

        return new RegistrationResult(
                saved.getId().toString(),
                saved.getEmail(),
                saved.getFullName(),
                true,
                regMsg
        );
    }

    /**
     * Método de compatibilidade para testes e endpoints legados.
     */
    @Transactional
    public AuthResult execute(String email, String fullName, String rawPassword) {
        if (userRepository.existsByEmail(email.toLowerCase().trim())) {
            throw new EmailAlreadyRegisteredException("E-mail já cadastrado: " + email);
        }

        var passwordHash = passwordEncoder.encode(rawPassword);
        var user = User.create(email, fullName, passwordHash);
        var saved = userRepository.save(user);

        defaultCategorySeeder.seedDefaultsForUser(saved.getId());

        var token = tokenProvider.generateAccessToken(saved.getId(), saved.getEmail());
        return new AuthResult(saved.getId().toString(), saved.getEmail(), saved.getFullName(), token);
    }
}
