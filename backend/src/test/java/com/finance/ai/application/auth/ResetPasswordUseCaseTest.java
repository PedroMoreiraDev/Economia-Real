package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: ResetPasswordUseCase")
class ResetPasswordUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private ResetPasswordUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new ResetPasswordUseCase(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Deve redefinir a senha com sucesso quando o código é correto e válido")
    void shouldResetPasswordSuccessfully() {
        var expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "velho_hash", true, null, null, "123456", expiresAt, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NovaSenha123!")).thenReturn("novo_hash_bcrypt");

        assertThatCode(() -> useCase.execute("pedro@teste.com", "123456", "NovaSenha123!"))
                .doesNotThrowAnyException();

        verify(userRepository).save(user);
        assertThat(user.getPasswordHash()).isEqualTo("novo_hash_bcrypt");
        assertThat(user.getPasswordResetCode()).isNull();
        assertThat(user.getPasswordResetExpiresAt()).isNull();
    }

    @Test
    @DisplayName("Deve rejeitar redefinição com código incorreto")
    void shouldRejectInvalidCode() {
        var expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "velho_hash", true, null, null, "123456", expiresAt, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute("pedro@teste.com", "999999", "NovaSenha123!"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Código de redefinição inválido");
    }

    @Test
    @DisplayName("Deve rejeitar senha com menos de 8 caracteres")
    void shouldRejectShortPassword() {
        assertThatThrownBy(() -> useCase.execute("pedro@teste.com", "123456", "curta"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mínimo 8 caracteres");
    }
}
