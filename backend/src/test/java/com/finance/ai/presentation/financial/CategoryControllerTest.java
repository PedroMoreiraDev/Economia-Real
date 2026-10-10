package com.finance.ai.presentation.financial;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.financial.CreateCategoryUseCase;
import com.finance.ai.application.financial.ListCategoriesUseCase;
import com.finance.ai.domain.financial.Category;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CategoryController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: CategoryController")
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateCategoryUseCase createCategoryUseCase;

    @MockBean
    private ListCategoriesUseCase listCategoriesUseCase;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private final UUID userId = UUID.randomUUID();
    private final String validToken = "valid.jwt.token";

    private void setupAuthenticatedUser() {
        when(jwtTokenProvider.isTokenValid(validToken)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(validToken)).thenReturn(userId);
        User mockUser = new User(userId, "pedro@test.com", "Pedro Silva", "hash", Instant.now());
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    }

    @Test
    @DisplayName("GET /api/v1/categories - Deve retornar categorias do usuário com sucesso")
    void shouldListCategories() throws Exception {
        setupAuthenticatedUser();
        var cat1 = Category.createSystemDefault(userId, "Alimentação", "utensils", "#EF4444");
        var cat2 = Category.create(userId, "Hobbies", "gamepad", "#8B5CF6");

        when(listCategoriesUseCase.execute(userId)).thenReturn(List.of(cat1, cat2));

        mockMvc.perform(get("/api/v1/categories")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Alimentação"))
                .andExpect(jsonPath("$[0].systemDefault").value(true))
                .andExpect(jsonPath("$[1].name").value("Hobbies"))
                .andExpect(jsonPath("$[1].systemDefault").value(false));

        verify(listCategoriesUseCase).execute(userId);
    }

    @Test
    @DisplayName("POST /api/v1/categories - Deve criar nova categoria com sucesso")
    void shouldCreateCategory() throws Exception {
        setupAuthenticatedUser();
        var cat = Category.create(userId, "Viagens", "plane", "#3B82F6");

        when(createCategoryUseCase.execute(eq(userId), eq("Viagens"), eq("plane"), eq("#3B82F6")))
                .thenReturn(cat);

        var request = new CategoryController.CreateCategoryRequest("Viagens", "plane", "#3B82F6");

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Viagens"))
                .andExpect(jsonPath("$.icon").value("plane"))
                .andExpect(jsonPath("$.colorHex").value("#3B82F6"))
                .andExpect(jsonPath("$.systemDefault").value(false));

        verify(createCategoryUseCase).execute(eq(userId), eq("Viagens"), eq("plane"), eq("#3B82F6"));
    }

    @Test
    @DisplayName("POST /api/v1/categories - Deve retornar 400 Bad Request se nome for vazio")
    void shouldReturnBadRequestWhenNameIsBlank() throws Exception {
        setupAuthenticatedUser();
        var request = new CategoryController.CreateCategoryRequest("", "plane", "#3B82F6");

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
