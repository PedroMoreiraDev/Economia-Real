package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes Unitários: CaptchaService (Imagem Visual com Distorção e HMAC)")
class CaptchaServiceTest {

    private CaptchaService captchaService;

    @BeforeEach
    void setUp() {
        captchaService = new CaptchaService();
    }

    @Test
    @DisplayName("Deve gerar desafio com imagem PNG em Base64, id e token assinado")
    void shouldGenerateChallengeWithImage() {
        var challenge = captchaService.generateChallenge();

        assertThat(challenge).isNotNull();
        assertThat(challenge.challengeId()).isNotBlank();
        assertThat(challenge.token()).isNotBlank();
        assertThat(challenge.imageBase64()).startsWith("data:image/png;base64,");
    }

    @Test
    @DisplayName("Deve rejeitar resposta incorreta do CAPTCHA")
    void shouldRejectIncorrectAnswer() {
        var challenge = captchaService.generateChallenge();

        assertThatThrownBy(() -> captchaService.validateCaptcha(challenge.token(), "ERRADO"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Código de segurança incorreto");
    }

    @Test
    @DisplayName("Deve rejeitar token nulo ou vazio")
    void shouldRejectNullOrBlankToken() {
        assertThatThrownBy(() -> captchaService.validateCaptcha(null, "123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obrigatória");

        assertThatThrownBy(() -> captchaService.validateCaptcha("   ", "123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("obrigatória");
    }

    @Test
    @DisplayName("Deve rejeitar resposta nula ou vazia")
    void shouldRejectNullOrBlankAnswer() {
        var challenge = captchaService.generateChallenge();

        assertThatThrownBy(() -> captchaService.validateCaptcha(challenge.token(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Digite o código exibido");

        assertThatThrownBy(() -> captchaService.validateCaptcha(challenge.token(), "  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Digite o código exibido");
    }

    @Test
    @DisplayName("Deve validar com sucesso desafio instantâneo do frontend")
    void shouldAcceptValidInstantCaptcha() {
        String challengeId = "instant-test-123";
        String answer = "A9B2C";
        long expiresAt = java.time.Instant.now().plusSeconds(180).getEpochSecond();
        String hash = captchaService.hashInstantAnswer(challengeId, answer);

        String rawToken = "instant:" + challengeId + ":" + hash + ":" + expiresAt;
        String token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        // Não deve lançar exceção para resposta correta (mesmo em minúsculas)
        captchaService.validateCaptcha(token, "a9b2c");
    }

    @Test
    @DisplayName("Deve rejeitar desafio instantâneo com resposta incorreta")
    void shouldRejectIncorrectInstantCaptcha() {
        String challengeId = "instant-test-456";
        String answer = "A9B2C";
        long expiresAt = java.time.Instant.now().plusSeconds(180).getEpochSecond();
        String hash = captchaService.hashInstantAnswer(challengeId, answer);

        String rawToken = "instant:" + challengeId + ":" + hash + ":" + expiresAt;
        String token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        assertThatThrownBy(() -> captchaService.validateCaptcha(token, "ERRADO"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Código de segurança incorreto");
    }

    @Test
    @DisplayName("Deve impedir reutilização (anti-replay) de desafio instantâneo")
    void shouldPreventReplayOfInstantCaptcha() {
        String challengeId = "instant-replay-789";
        String answer = "XYZ88";
        long expiresAt = java.time.Instant.now().plusSeconds(180).getEpochSecond();
        String hash = captchaService.hashInstantAnswer(challengeId, answer);

        String rawToken = "instant:" + challengeId + ":" + hash + ":" + expiresAt;
        String token = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));

        // Primeira validação passa
        captchaService.validateCaptcha(token, answer);

        // Segunda tentativa com o mesmo token deve ser rejeitada imediatamente
        assertThatThrownBy(() -> captchaService.validateCaptcha(token, answer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("já foi utilizado");
    }
}
