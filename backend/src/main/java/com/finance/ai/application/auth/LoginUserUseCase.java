package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.CaptchaService;
import com.finance.ai.infrastructure.security.TokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso: Autenticação de usuário existente com verificação de status de e-mail e CAPTCHA.
 */
@Service
public class LoginUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenProvider tokenProvider;
    private final CaptchaService captchaService;

    public LoginUserUseCase(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            TokenProvider tokenProvider,
            @Autowired(required = false) CaptchaService captchaService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.captchaService = captchaService;
    }

    @Transactional(readOnly = true)
    public AuthResult execute(String email, String rawPassword, String captchaToken, String captchaAnswer) {
        if (captchaService != null && captchaToken != null && !captchaToken.isBlank()) {
            captchaService.validateCaptcha(captchaToken, captchaAnswer);
        }

        var user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas."));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new InvalidCredentialsException("Credenciais inválidas.");
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException("E-mail não verificado. Digite o código de 6 dígitos enviado para sua caixa de entrada para ativar sua conta.");
        }

        var token = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        return new AuthResult(user.getId().toString(), user.getEmail(), user.getFullName(), token);
    }

    @Transactional(readOnly = true)
    public AuthResult execute(String email, String rawPassword) {
        return execute(email, rawPassword, null, null);
    }
}
