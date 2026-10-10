package com.finance.ai.application.auth;

public record AuthResult(String userId, String email, String fullName, String accessToken) {}
