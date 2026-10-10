package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso: Autenticação de usuário existente.
 * Valida credenciais e emite novo token JWT de acesso.
 */
@Service
public class LoginUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginUserUseCase(UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional(readOnly = true)
    public AuthResult execute(String email, String rawPassword) {
        var user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Credenciais inválidas."));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new InvalidCredentialsException("Credenciais inválidas.");
        }

        var token = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        return new AuthResult(user.getId().toString(), user.getEmail(), user.getFullName(), token);
    }
}
