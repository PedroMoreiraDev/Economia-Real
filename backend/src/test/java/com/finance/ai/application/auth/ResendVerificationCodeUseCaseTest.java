package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.EmailSenderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: ResendVerificationCodeUseCase")
class ResendVerificationCodeUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailSenderService emailSenderService;

    private ResendVerificationCodeUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new ResendVerificationCodeUseCase(userRepository, emailSenderService);
    }

    @Test
    @DisplayName("Deve renovar código de ativação e enviar e-mail com sucesso")
    void shouldRenewCodeAndSendEmail() {
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "hash", false, "111111", Instant.now().plusSeconds(300), null, null, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));
        when(emailSenderService.isConfigured()).thenReturn(true);

        String message = useCase.execute("pedro@teste.com");

        assertThat(message).contains("Novo código de verificação enviado");
        verify(userRepository).save(user);
        verify(emailSenderService).sendVerificationCode(eq("pedro@teste.com"), eq("Pedro Silva"), anyString());
    }

    @Test
    @DisplayName("Deve retornar o código na mensagem quando SMTP não estiver configurado")
    void shouldReturnCodeWhenSmtpNotConfigured() {
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "hash", false, "111111", Instant.now().plusSeconds(300), null, null, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));
        when(emailSenderService.isConfigured()).thenReturn(false);

        String message = useCase.execute("pedro@teste.com");

        assertThat(message).contains("Novo código de ativação:").contains("(Servidor SMTP não configurado localmente)");
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("Deve falhar se a conta já estiver verificada")
    void shouldFailIfAccountAlreadyVerified() {
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "hash", true, null, null, null, null, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute("pedro@teste.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("já está ativada");
    }

    @Test
    @DisplayName("Deve falhar se o usuário não for encontrado")
    void shouldFailIfUserNotFound() {
        when(userRepository.findByEmail("inexistente@teste.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute("inexistente@teste.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("não encontrado");
    }
}
