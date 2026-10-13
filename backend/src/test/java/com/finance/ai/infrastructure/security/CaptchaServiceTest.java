package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes Unitários: CaptchaService")
class CaptchaServiceTest {

    private CaptchaService captchaService;

    @BeforeEach
    void setUp() {
        captchaService = new CaptchaService();
    }

    @Test
    @DisplayName("Deve gerar desafio de CAPTCHA com pergunta, id e token assinado")
    void shouldGenerateChallenge() {
        var challenge = captchaService.generateChallenge();

        assertThat(challenge).isNotNull();
        assertThat(challenge.challengeId()).isNotBlank();
        assertThat(challenge.token()).isNotBlank();
        assertThat(challenge.question()).isNotBlank();
    }

    @Test
    @DisplayName("Deve validar com sucesso a resposta correta do desafio")
    void shouldValidateCorrectAnswer() {
        var challenge = captchaService.generateChallenge();
        String question = challenge.question();

        // O formato pode ser "X + Y", "X - Y" ou "X × Y"
        int expected;
        if (question.contains(" + ")) {
            String[] parts = question.split(" \\+ ");
            expected = Integer.parseInt(parts[0]) + Integer.parseInt(parts[1]);
        } else if (question.contains(" - ")) {
            String[] parts = question.split(" - ");
            expected = Integer.parseInt(parts[0]) - Integer.parseInt(parts[1]);
        } else {
            String[] parts = question.split(" × ");
            expected = Integer.parseInt(parts[0]) * Integer.parseInt(parts[1]);
        }

        assertThatCode(() -> captchaService.validateCaptcha(challenge.token(), String.valueOf(expected)))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Deve rejeitar resposta incorreta do CAPTCHA")
    void shouldRejectIncorrectAnswer() {
        var challenge = captchaService.generateChallenge();

        assertThatThrownBy(() -> captchaService.validateCaptcha(challenge.token(), "9999"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Resposta do desafio de segurança incorreta");
    }

    @Test
    @DisplayName("Deve rejeitar token adulterado ou vazio")
    void shouldRejectTamperedToken() {
        assertThatThrownBy(() -> captchaService.validateCaptcha("token-invalido.adulterado", "10"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> captchaService.validateCaptcha("", "10"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
