package com.finance.ai.presentation.financial.analytics;

import com.finance.ai.application.financial.analytics.GetAnalyticsOverviewUseCase;
import com.finance.ai.application.financial.analytics.dto.AnalyticsOverviewDto;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtAuthenticationFilter;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import com.finance.ai.infrastructure.security.SecurityConfig;
import com.finance.ai.presentation.common.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AnalyticsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: AnalyticsController")
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetAnalyticsOverviewUseCase analyticsOverviewUseCase;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    private final UUID userId = UUID.randomUUID();
    private final String validToken = "valid.jwt.token";

    private void mockAuthentication() {
        User user = new User(userId, "pedro@email.com", "Pedro", "$2a$12$hash", Instant.now());
        when(jwtTokenProvider.isTokenValid(validToken)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(validToken)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/overview - deve retornar dados do dashboard analítico")
    void shouldReturnAnalyticsOverviewSuccessfully() throws Exception {
        mockAuthentication();

        var evolution = List.of(
                new AnalyticsOverviewDto.MonthlyEvolutionDto("Out", "2026-10", new BigDecimal("5000.00"), new BigDecimal("3200.00"), new BigDecimal("1800.00"))
        );

        var categories = List.of(
                new AnalyticsOverviewDto.CategoryDistributionDto(UUID.randomUUID(), "Moradia", "home", "#4f46e5", new BigDecimal("1500.00"), 46.9)
        );

        var burnRate = new AnalyticsOverviewDto.BurnRateDto(
                new BigDecimal("3200.00"),
                new BigDecimal("355.56"),
                new BigDecimal("11022.36"),
                new BigDecimal("4000.00"),
                9,
                22,
                31,
                "SAFE"
        );

        var overview = new AnalyticsOverviewDto(evolution, categories, burnRate);
        when(analyticsOverviewUseCase.execute(eq(userId), any())).thenReturn(overview);

        mockMvc.perform(get("/api/v1/analytics/overview")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyEvolution[0].monthLabel").value("Out"))
                .andExpect(jsonPath("$.monthlyEvolution[0].income").value(5000.00))
                .andExpect(jsonPath("$.categoryDistribution[0].categoryName").value("Moradia"))
                .andExpect(jsonPath("$.burnRate.burnStatus").value("SAFE"));
    }
}
