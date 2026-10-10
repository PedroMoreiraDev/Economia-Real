package com.finance.ai.presentation.health.dto;

import java.time.Instant;

public record HealthResponse(
        String status,
        String service,
        String version,
        Instant timestamp
) {
    public static HealthResponse ok() {
        return new HealthResponse("UP", "finance-backend", "0.1.0", Instant.now());
    }
}
