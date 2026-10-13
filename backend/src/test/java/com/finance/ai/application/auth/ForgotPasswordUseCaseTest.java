package com.finance.ai.application.auth;

import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.CaptchaService;
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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: ForgotPasswordUseCase")
class ForgotPasswordUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CaptchaService captchaService;

    @Mock
    private EmailSenderService emailSenderService;

    private ForgotPasswordUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new ForgotPasswordUseCase(userRepository, captchaService, emailSenderService);
    }

    @Test
    @DisplayName("Deve gerar código de 6 dígitos e enviar e-mail quando usuário existe e está verificado")
    void shouldGenerateResetCodeAndSendEmail() {
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "hash", true, null, null, null, null, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));

        assertThatCode(() -> useCase.execute("pedro@teste.com", "token_valido", "ABC12"))
                .doesNotThrowAnyException();

        verify(captchaService).validateCaptcha("token_valido", "ABC12");
        verify(userRepository).save(user);
        assertThat(user.getPasswordResetCode()).isNotNull().hasSize(6);
        assertThat(user.getPasswordResetExpiresAt()).isNotNull();
        verify(emailSenderService).sendPasswordResetCode(eq("pedro@teste.com"), eq("Pedro Silva"), anyString());
    }

    @Test
    @DisplayName("Não deve vazar erro se o e-mail não existir (Anti-User-Enumeration)")
    void shouldNotThrowIfEmailDoesNotExist() {
        when(userRepository.findByEmail("inexistente@teste.com")).thenReturn(Optional.empty());

        assertThatCode(() -> useCase.execute("inexistente@teste.com", null, null))
                .doesNotThrowAnyException();

        verify(userRepository, never()).save(any());
        verify(emailSenderService, never()).sendPasswordResetCode(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Deve rejeitar e-mail nulo ou em branco")
    void shouldRejectBlankEmail() {
        assertThatThrownBy(() -> useCase.execute("", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mail é obrigatório");
    }

    @Test
    @DisplayName("Deve retornar mensagem com código quando SMTP não estiver configurado")
    void shouldReturnCodeInMessageWhenSmtpNotConfigured() {
        var user = new User(UUID.randomUUID(), "pedro@teste.com", "Pedro Silva", "hash", true, null, null, null, null, Instant.now(), Instant.now());
        when(userRepository.findByEmail("pedro@teste.com")).thenReturn(Optional.of(user));
        when(emailSenderService.isConfigured()).thenReturn(false);

        String result = useCase.execute("pedro@teste.com", null, null);

        assertThat(result).contains("Código de recuperação:").contains("(Servidor SMTP não configurado localmente)");
    }
}
