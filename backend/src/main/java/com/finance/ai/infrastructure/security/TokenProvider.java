package com.finance.ai.infrastructure.security;

import java.util.UUID;

/**
 * Contrato de emissão de tokens de acesso para desacoplamento de casos de uso.
 */
public interface TokenProvider {
    String generateAccessToken(UUID userId, String email);
}
