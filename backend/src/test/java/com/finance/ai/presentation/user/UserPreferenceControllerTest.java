package com.finance.ai.presentation.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.user.GetUserPreferenceUseCase;
import com.finance.ai.application.user.UpdateUserPreferenceUseCase;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserPreference;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtAuthenticationFilter;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import com.finance.ai.infrastructure.security.SecurityConfig;
import com.finance.ai.presentation.common.GlobalExceptionHandler;
import com.finance.ai.presentation.user.dto.UpdateUserPreferenceRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserPreferenceController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: UserPreferenceController")
class UserPreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GetUserPreferenceUseCase getUserPreferenceUseCase;

    @MockBean
    private UpdateUserPreferenceUseCase updateUserPreferenceUseCase;

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
    @DisplayName("GET /api/v1/users/preferences - Deve retornar as preferências do usuário")
    void deveRetornarPreferenciasDoUsuario() throws Exception {
        mockAuthentication();
        UserPreference pref = new UserPreference(userId, true, Instant.now(), Instant.now());
        when(getUserPreferenceUseCase.execute(eq(userId))).thenReturn(pref);

        mockMvc.perform(get("/api/v1/users/preferences")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/preferences - Deve atualizar preferências com sucesso")
    void deveAtualizarPreferenciasComSucesso() throws Exception {
        mockAuthentication();
        UserPreference updated = new UserPreference(userId, true, Instant.now(), Instant.now());
        when(updateUserPreferenceUseCase.execute(eq(userId), eq(true))).thenReturn(updated);

        var request = new UpdateUserPreferenceRequest(true);

        mockMvc.perform(patch("/api/v1/users/preferences")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }
}

