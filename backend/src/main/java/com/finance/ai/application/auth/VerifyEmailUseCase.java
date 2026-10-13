package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.TokenProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso: Verificação e ativação de conta por código de e-mail (6 dígitos).
 */
@Service
public class VerifyEmailUseCase {

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;

    public VerifyEmailUseCase(UserRepository userRepository, TokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResult execute(String email, String code) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Código de verificação é obrigatório.");
        }

        var normalizedEmail = email.toLowerCase().trim();
        var user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para o e-mail informado."));

        user.verifyEmail(code);
        var updated = userRepository.save(user);

        var token = tokenProvider.generateAccessToken(updated.getId(), updated.getEmail());
        return new AuthResult(updated.getId().toString(), updated.getEmail(), updated.getFullName(), token);
    }
}
