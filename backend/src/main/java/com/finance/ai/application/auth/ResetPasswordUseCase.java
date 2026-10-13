package com.finance.ai.application.auth;

import com.finance.ai.domain.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso: Confirmação e redefinição de senha com validação de código de 6 dígitos.
 */
@Service
public class ResetPasswordUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ResetPasswordUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void execute(String email, String code, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório.");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Código de redefinição é obrigatório.");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("A nova senha deve ter no mínimo 8 caracteres.");
        }

        var normalizedEmail = email.toLowerCase().trim();
        var user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para o e-mail informado."));

        var newPasswordHash = passwordEncoder.encode(newPassword);
        user.resetPassword(code, newPasswordHash);

        userRepository.save(user);
    }
}
