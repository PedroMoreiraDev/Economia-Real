package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

@DisplayName("Testes Unitários: EmailSenderService")
class EmailSenderServiceTest {

    @Test
    @DisplayName("Deve registrar código e não lançar exceção quando nenhum provedor configurado")
    void shouldHandleUnconfiguredGracefully() {
        EmailSenderService service = new EmailSenderService(
                null, "", "", "", "Economia Real", "", ""
        );

        assertThat(service.isConfigured()).isFalse();
        assertThat(service.isSmtpConfigured()).isFalse();
        assertThat(service.isHttpConfigured()).isFalse();

        CompletableFuture<Void> future = service.sendVerificationCode("teste@exemplo.com", "Usuário Teste", "123456");
        assertThat(future).isCompleted();
    }

    @Test
    @DisplayName("Deve reconhecer configuração SMTP válida")
    void shouldRecognizeSmtpConfigured() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        EmailSenderService service = new EmailSenderService(
                mailSender, "smtp.gmail.com", "economiareal.ia@gmail.com", "senha123", "Economia Real", "", ""
        );

        assertThat(service.isConfigured()).isTrue();
        assertThat(service.isSmtpConfigured()).isTrue();
        assertThat(service.isHttpConfigured()).isFalse();
    }

    @Test
    @DisplayName("Deve reconhecer configuração Brevo API HTTP válida")
    void shouldRecognizeBrevoConfigured() {
        EmailSenderService service = new EmailSenderService(
                null, "", "", "", "Economia Real", "xkeysib-mock-api-key", ""
        );

        assertThat(service.isConfigured()).isTrue();
        assertThat(service.isSmtpConfigured()).isFalse();
        assertThat(service.isHttpConfigured()).isTrue();
    }
}
