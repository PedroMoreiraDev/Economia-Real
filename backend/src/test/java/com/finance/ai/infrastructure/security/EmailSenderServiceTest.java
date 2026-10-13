package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes Unitários: EmailSenderService")
class EmailSenderServiceTest {

    @Test
    @DisplayName("Deve registrar código e não lançar exceção quando nenhum provedor configurado")
    void shouldHandleUnconfiguredGracefully() {
        EmailSenderService service = new EmailSenderService(
                "", "", "", "Economia Real", "", ""
        );

        assertThat(service.isConfigured()).isFalse();
        assertThat(service.isSmtpConfigured()).isFalse();
        assertThat(service.isHttpConfigured()).isFalse();

        CompletableFuture<Void> future = service.sendVerificationCode("teste@exemplo.com", "Usuário Teste", "123456");
        assertThat(future).isCompleted();
    }

    @Test
    @DisplayName("Deve reconhecer configuração Brevo API HTTP válida")
    void shouldRecognizeBrevoConfigured() {
        EmailSenderService service = new EmailSenderService(
                "", "", "", "Economia Real", "xkeysib-mock-api-key", ""
        );

        assertThat(service.isConfigured()).isTrue();
        assertThat(service.isSmtpConfigured()).isFalse();
        assertThat(service.isHttpConfigured()).isTrue();
    }

    @Test
    @DisplayName("Deve reconhecer configuração Resend API HTTP válida")
    void shouldRecognizeResendConfigured() {
        EmailSenderService service = new EmailSenderService(
                "", "", "", "Economia Real", "", "re_123456789"
        );

        assertThat(service.isConfigured()).isTrue();
        assertThat(service.isSmtpConfigured()).isFalse();
        assertThat(service.isHttpConfigured()).isTrue();
    }
}
