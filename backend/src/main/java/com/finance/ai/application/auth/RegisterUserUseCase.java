package com.finance.ai.application.auth;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Caso de uso: Registro de novo usuário.
 * Valida unicidade do e-mail, faz hash da senha, semeia categorias padrão e emite token JWT de acesso.
 */
@Service
public class RegisterUserUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final DefaultCategorySeeder defaultCategorySeeder;

    public RegisterUserUseCase(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                JwtTokenProvider jwtTokenProvider,
                                DefaultCategorySeeder defaultCategorySeeder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.defaultCategorySeeder = defaultCategorySeeder;
    }

    @Transactional
    public AuthResult execute(String email, String fullName, String rawPassword) {
        if (userRepository.existsByEmail(email.toLowerCase().trim())) {
            throw new EmailAlreadyRegisteredException("E-mail já cadastrado: " + email);
        }

        var passwordHash = passwordEncoder.encode(rawPassword);
        var user = User.create(email, fullName, passwordHash);
        var saved = userRepository.save(user);

        defaultCategorySeeder.seedDefaultsForUser(saved.getId());

        var token = jwtTokenProvider.generateAccessToken(saved.getId(), saved.getEmail());
        return new AuthResult(saved.getId().toString(), saved.getEmail(), saved.getFullName(), token);
    }
}
