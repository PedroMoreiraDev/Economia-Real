package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.TokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: VerifyEmailUseCase")
class VerifyEmailUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenProvider tokenProvider;

    @InjectMocks
    private VerifyEmailUseCase verifyEmailUseCase;

    @Test
    @DisplayName("Deve verificar e-mail com código válido e retornar token de acesso")
    void shouldVerifyEmailSuccessfully() {
        String email = "pedro@finance.com";
        String code = "123456";
        User user = User.createWithVerification(
                email,
                "Pedro",
                "hash123",
                code,
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenProvider.generateAccessToken(any(UUID.class), eq(email))).thenReturn("token.jwt.valido");

        AuthResult result = verifyEmailUseCase.execute(email, code);

        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo(email);
        assertThat(result.accessToken()).isEqualTo("token.jwt.valido");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(user.getVerificationCode()).isNull();

        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Deve falhar com código incorreto")
    void shouldFailWithIncorrectCode() {
        String email = "pedro@finance.com";
        User user = User.createWithVerification(
                email,
                "Pedro",
                "hash123",
                "123456",
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> verifyEmailUseCase.execute(email, "654321"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Código de verificação incorreto");
    }

    @Test
    @DisplayName("Deve falhar com código expirado")
    void shouldFailWithExpiredCode() {
        String email = "pedro@finance.com";
        User user = User.createWithVerification(
                email,
                "Pedro",
                "hash123",
                "123456",
                Instant.now().minus(5, ChronoUnit.MINUTES) // Expirou 5 minutos atrás
        );

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> verifyEmailUseCase.execute(email, "123456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("expirado");
    }
}
