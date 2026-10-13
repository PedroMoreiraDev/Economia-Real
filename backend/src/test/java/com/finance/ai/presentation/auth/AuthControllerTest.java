package com.finance.ai.presentation.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.auth.AuthResult;
import com.finance.ai.application.auth.DeleteAccountUseCase;
import com.finance.ai.application.auth.InvalidCredentialsException;
import com.finance.ai.application.auth.LoginUserUseCase;
import com.finance.ai.application.auth.RegisterUserUseCase;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtAuthenticationFilter;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import com.finance.ai.infrastructure.security.SecurityConfig;
import com.finance.ai.presentation.common.GlobalExceptionHandler;
import com.finance.ai.application.auth.*;
import com.finance.ai.infrastructure.security.CaptchaService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: AuthController e Spring Security")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RegisterUserUseCase registerUseCase;

    @MockBean
    private LoginUserUseCase loginUseCase;

    @MockBean
    private DeleteAccountUseCase deleteAccountUseCase;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private VerifyEmailUseCase verifyEmailUseCase;

    @MockBean
    private ResendVerificationCodeUseCase resendVerificationCodeUseCase;

    @MockBean
    private CaptchaService captchaService;

    @MockBean
    private ForgotPasswordUseCase forgotPasswordUseCase;

    @MockBean
    private ResetPasswordUseCase resetPasswordUseCase;

    @Test
    @DisplayName("POST /api/v1/auth/register - deve retornar 201 com confirmação de verificação quando dados são válidos")
    void shouldRegisterSuccessfully() throws Exception {
        var request = new AuthController.RegisterRequest("novo@teste.com", "Pedro Silva", "senha12345");
        var result = new RegistrationResult(UUID.randomUUID().toString(), "novo@teste.com", "Pedro Silva", true, "Código enviado com sucesso.");

        when(registerUseCase.executeWithVerification(eq(request.email()), eq(request.fullName()), eq(request.password()), any(), any()))
                .thenReturn(result);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("novo@teste.com"))
                .andExpect(jsonPath("$.requiresVerification").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - deve retornar 400 quando e-mail for inválido")
    void shouldReturnBadRequestWhenEmailInvalid() throws Exception {
        var request = new AuthController.RegisterRequest("email-invalido", "Pedro", "senha12345");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.email").exists());
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - deve retornar 200 com token em credenciais válidas")
    void shouldLoginSuccessfully() throws Exception {
        var request = new AuthController.LoginRequest("pedro@teste.com", "senha12345");
        var result = new AuthResult(UUID.randomUUID().toString(), "pedro@teste.com", "Pedro", "token.jwt.valido");

        when(loginUseCase.execute(eq(request.email()), eq(request.password()), any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("pedro@teste.com"))
                .andExpect(jsonPath("$.accessToken").value("token.jwt.valido"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - deve retornar 401 quando credenciais forem inválidas")
    void shouldReturn401OnInvalidCredentials() throws Exception {
        var request = new AuthController.LoginRequest("pedro@teste.com", "senhaErrada");

        when(loginUseCase.execute(anyString(), anyString(), any(), any()))
                .thenThrow(new InvalidCredentialsException("Credenciais inválidas."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Credenciais inválidas."));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - deve retornar 403 quando requisição não possui Bearer token")
    void shouldDenyAccessToProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - deve retornar 200 e dados do usuário quando token Bearer for válido")
    void shouldReturnUserProfileWithValidToken() throws Exception {
        UUID userId = UUID.randomUUID();
        String validToken = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro Silva", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(validToken)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(validToken)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("pedro@teste.com"))
                .andExpect(jsonPath("$.fullName").value("Pedro Silva"));
    }

    @Test
    @DisplayName("DELETE /api/v1/auth/me - deve retornar 204 No Content ao excluir a conta autenticada")
    void shouldDeleteAccountSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        String validToken = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro Silva", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(validToken)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(validToken)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());

        org.mockito.Mockito.verify(deleteAccountUseCase).execute(userId);
    }
}
