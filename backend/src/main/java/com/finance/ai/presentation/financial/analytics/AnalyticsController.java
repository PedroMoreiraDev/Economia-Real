package com.finance.ai.presentation.financial.analytics;

import com.finance.ai.application.financial.analytics.GetAnalyticsOverviewUseCase;
import com.finance.ai.application.financial.analytics.dto.AnalyticsOverviewDto;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics & KPIs", description = "Agregações financeiras, evolução mensal, distribuição por categoria e burn rate")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final GetAnalyticsOverviewUseCase analyticsOverviewUseCase;

    public AnalyticsController(GetAnalyticsOverviewUseCase analyticsOverviewUseCase) {
        this.analyticsOverviewUseCase = analyticsOverviewUseCase;
    }

    @GetMapping("/overview")
    @Operation(summary = "Retorna visão analítica completa: histórico de 6 meses, gráfico de categorias e ritmo de queima")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(value = "month", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LocalDate targetMonth = month != null ? month : LocalDate.now();
        var overview = analyticsOverviewUseCase.execute(user.userId(), targetMonth);
        return ResponseEntity.ok(overview);
    }
}
