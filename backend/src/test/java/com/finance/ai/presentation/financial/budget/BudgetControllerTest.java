package com.finance.ai.presentation.financial.budget;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.financial.budget.BatchCreateBudgetsUseCase;
import com.finance.ai.application.financial.budget.CreateOrUpdateBudgetUseCase;
import com.finance.ai.application.financial.budget.DeleteBudgetUseCase;
import com.finance.ai.application.financial.budget.ListBudgetsUseCase;
import com.finance.ai.application.financial.budget.SuggestBudgetsWithAiUseCase;
import com.finance.ai.application.financial.budget.dto.BudgetProgressDto;
import com.finance.ai.domain.financial.budget.Budget;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtAuthenticationFilter;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import com.finance.ai.infrastructure.security.SecurityConfig;
import com.finance.ai.presentation.common.GlobalExceptionHandler;
import com.finance.ai.presentation.financial.budget.dto.CreateBudgetRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BudgetController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: BudgetController")
class BudgetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateOrUpdateBudgetUseCase createOrUpdateBudgetUseCase;

    @MockBean
    private ListBudgetsUseCase listBudgetsUseCase;

    @MockBean
    private DeleteBudgetUseCase deleteBudgetUseCase;

    @MockBean
    private SuggestBudgetsWithAiUseCase suggestBudgetsWithAiUseCase;

    @MockBean
    private BatchCreateBudgetsUseCase batchCreateBudgetsUseCase;

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
    @DisplayName("GET /api/v1/budgets - deve listar orçamentos com sucesso")
    void shouldListBudgetsSuccessfully() throws Exception {
        mockAuthentication();

        BudgetProgressDto dto = new BudgetProgressDto(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Alimentação",
                "utensils",
                "#FF5722",
                LocalDate.of(2026, 10, 1),
                new BigDecimal("1200.00"),
                new BigDecimal("600.00"),
                new BigDecimal("600.00"),
                50.0,
                80,
                false,
                false
        );

        when(listBudgetsUseCase.execute(eq(userId), any())).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/budgets")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].categoryName").value("Alimentação"))
                .andExpect(jsonPath("$[0].monthlyLimit").value(1200.00))
                .andExpect(jsonPath("$[0].spentAmount").value(600.00))
                .andExpect(jsonPath("$[0].percentageUsed").value(50.0));
    }

    @Test
    @DisplayName("POST /api/v1/budgets - deve criar orçamento com sucesso")
    void shouldCreateBudgetSuccessfully() throws Exception {
        mockAuthentication();

        UUID catId = UUID.randomUUID();
        CreateBudgetRequest request = new CreateBudgetRequest(
                catId,
                LocalDate.of(2026, 10, 1),
                new BigDecimal("1500.00"),
                80
        );

        Budget created = Budget.create(userId, catId, LocalDate.of(2026, 10, 1), new BigDecimal("1500.00"), 80);
        when(createOrUpdateBudgetUseCase.execute(eq(userId), eq(catId), any(), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/v1/budgets")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.monthlyLimit").value(1500.00))
                .andExpect(jsonPath("$.alertThresholdPercentage").value(80));
    }
}
