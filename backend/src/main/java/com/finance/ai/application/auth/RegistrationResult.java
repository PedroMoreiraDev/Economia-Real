package com.finance.ai.application.auth;

public record RegistrationResult(
        String userId,
        String email,
        String fullName,
        boolean requiresVerification,
        String message
) {}
