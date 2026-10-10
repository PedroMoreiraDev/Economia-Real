package com.finance.ai.infrastructure.security;

import java.util.UUID;

/**
 * Principal autenticado disponível no SecurityContext.
 * Utilizado nos controllers para obter o userId sem confiar no corpo da requisição.
 */
public record AuthenticatedUser(UUID userId, String email) {}
