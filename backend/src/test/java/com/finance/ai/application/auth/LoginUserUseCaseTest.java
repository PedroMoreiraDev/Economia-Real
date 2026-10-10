package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: LoginUserUseCase")
class LoginUserUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private LoginUserUseCase loginUserUseCase;

    @Test
    @DisplayName("Deve autenticar com credenciais válidas e retornar token")
    void shouldLoginSuccessfully() {
        String email = "pedro@finance.com";
        String rawPassword = "Password123!";
        String passwordHash = "$2a$12$hashed";
        User user = User.create(email, "Pedro", passwordHash);
        String fakeToken = "jwt.token.mock";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(rawPassword, passwordHash)).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(any(UUID.class), eq(email))).thenReturn(fakeToken);

        AuthResult result = loginUserUseCase.execute(email, rawPassword);

        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo(email);
        assertThat(result.accessToken()).isEqualTo(fakeToken);
    }

    @Test
    @DisplayName("Deve falhar quando o usuário não existe")
    void shouldFailWhenUserNotFound() {
        when(userRepository.findByEmail("inexistente@finance.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> loginUserUseCase.execute("inexistente@finance.com", "senha"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Credenciais inválidas");
    }

    @Test
    @DisplayName("Deve falhar quando a senha não confere")
    void shouldFailWhenPasswordMismatch() {
        String email = "pedro@finance.com";
        User user = User.create(email, "Pedro", "$2a$12$hashed");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("senha-errada", user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> loginUserUseCase.execute(email, "senha-errada"))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Credenciais inválidas");
    }
}
