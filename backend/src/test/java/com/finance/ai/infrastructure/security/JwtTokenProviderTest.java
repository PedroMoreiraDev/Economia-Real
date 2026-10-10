package com.finance.ai.infrastructure.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes Unitários: JwtTokenProvider")
class JwtTokenProviderTest {

    private static final String VALID_SECRET = "super-secret-jwt-key-finance-ai-2026-minimum-32-chars-long!";
    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(VALID_SECRET);
    }

    @Test
    @DisplayName("Deve gerar token e extrair claims de userId e email com sucesso")
    void shouldGenerateAndExtractClaims() {
        UUID userId = UUID.randomUUID();
        String email = "pedro@financas.com";

        String token = tokenProvider.generateAccessToken(userId, email);

        assertThat(token).isNotBlank();
        assertThat(tokenProvider.isTokenValid(token)).isTrue();
        assertThat(tokenProvider.extractUserId(token)).isEqualTo(userId);
        assertThat(tokenProvider.extractEmail(token)).isEqualTo(email);
    }

    @Test
    @DisplayName("Deve invalidar token malformado ou adulterado")
    void shouldRejectInvalidToken() {
        assertThat(tokenProvider.isTokenValid("token-invalido-123")).isFalse();
        assertThat(tokenProvider.isTokenValid("")).isFalse();
    }

    @Test
    @DisplayName("Deve lançar exceção se a chave secreta for muito curta (< 32 caracteres)")
    void shouldThrowWhenSecretIsTooShort() {
        assertThatThrownBy(() -> new JwtTokenProvider("curta"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ao menos 32 caracteres");
    }
}
