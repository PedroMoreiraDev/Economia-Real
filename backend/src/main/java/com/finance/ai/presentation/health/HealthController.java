package com.finance.ai.presentation.health;

import com.finance.ai.presentation.health.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "Verificação de disponibilidade e saúde do backend")
public class HealthController {

    private final String activeModel;

    public HealthController(
            @org.springframework.beans.factory.annotation.Value("${ai.gemini.model:gemini-2.5-flash}") String activeModel
    ) {
        this.activeModel = activeModel;
    }

    @GetMapping
    @Operation(summary = "Verifica se a API está operacional")
    public ResponseEntity<HealthResponse> checkHealth() {
        return ResponseEntity.ok(HealthResponse.of(activeModel));
    }
}
