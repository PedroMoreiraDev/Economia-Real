package com.finance.ai.presentation.health.dto;

import java.time.Instant;

public record HealthResponse(
        String status,
        String service,
        String version,
        String activeModel,
        Instant timestamp
) {
    public static HealthResponse of(String activeModel) {
        return new HealthResponse("UP", "finance-backend", "0.1.0-gemini-2.5", activeModel, Instant.now());
    }

    public static HealthResponse ok() {
        return of("gemini-2.5-flash");
    }
}
