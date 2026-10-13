package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes Unitários: EmailValidationService")
class EmailValidationServiceTest {

    private EmailValidationService emailValidationService;

    @BeforeEach
    void setUp() {
        emailValidationService = new EmailValidationService();
    }

    @Test
    @DisplayName("Deve aceitar e-mails comuns de provedores legítimos")
    void shouldAcceptLegitimateEmails() {
        assertThatCode(() -> emailValidationService.validate("usuario@gmail.com"))
                .doesNotThrowAnyException();
        assertThatCode(() -> emailValidationService.validate("contato@outlook.com"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Deve rejeitar e-mails com sintaxe inválida")
    void shouldRejectInvalidSyntax() {
        assertThatThrownBy(() -> emailValidationService.validate("invalido@@email"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Formato de e-mail inválido");

        assertThatThrownBy(() -> emailValidationService.validate("sem-dominio@"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Deve bloquear e-mails descartáveis e temporários conhecidos")
    void shouldRejectDisposableEmails() {
        assertThatThrownBy(() -> emailValidationService.validate("teste@yopmail.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mails descartáveis e temporários não são permitidos");

        assertThatThrownBy(() -> emailValidationService.validate("bot@mailinator.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mails descartáveis e temporários não são permitidos");

        assertThatThrownBy(() -> emailValidationService.validate("temp@tempmail.com"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
