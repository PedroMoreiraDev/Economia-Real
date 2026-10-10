package com.finance.ai.presentation.financial.card;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.financial.card.*;
import com.finance.ai.domain.financial.card.CreditCard;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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

@WebMvcTest(controllers = CreditCardController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: CreditCardController e Isolamento Anti-IDOR")
class CreditCardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateCreditCardUseCase createCreditCardUseCase;

    @MockBean
    private ListCreditCardsUseCase listCreditCardsUseCase;

    @MockBean
    private CreateCreditCardPurchaseUseCase createPurchaseUseCase;

    @MockBean
    private ListInvoicesUseCase listInvoicesUseCase;

    @MockBean
    private PayInvoiceUseCase payInvoiceUseCase;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/credit-cards - deve rejeitar acesso sem token (403)")
    void shouldDenyUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/credit-cards"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/credit-cards - deve cadastrar cartão para usuário autenticado")
    void shouldCreateCreditCard() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var request = new CreditCardController.CreateCardRequest("Nubank Ultravioleta", new BigDecimal("15000.00"), 10, 17);
        var created = CreditCard.create(userId, "Nubank Ultravioleta", new BigDecimal("15000.00"), 10, 17);

        when(createCreditCardUseCase.execute(eq(userId), eq("Nubank Ultravioleta"), any(), eq(10), eq(17)))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/credit-cards")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nubank Ultravioleta"))
                .andExpect(jsonPath("$.creditLimit").value(15000.00))
                .andExpect(jsonPath("$.closingDay").value(10))
                .andExpect(jsonPath("$.dueDay").value(17));

        verify(createCreditCardUseCase).execute(eq(userId), eq("Nubank Ultravioleta"), any(), eq(10), eq(17));
    }

    @Test
    @DisplayName("POST /api/v1/credit-cards/{id}/purchases - deve registrar compra parcelada")
    void shouldCreateInstallmentPurchase() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var request = new CreditCardController.CreatePurchaseRequest("Notebook", new BigDecimal("3000.00"), 3, LocalDate.now(), null, "Para trabalho");
        var result = new CreditCardPurchaseResult(
                UUID.randomUUID(),
                "Notebook",
                new BigDecimal("3000.00"),
                3,
                List.of(
                        new CreditCardPurchaseResult.InstallmentInfo(1, new BigDecimal("1000.00"), LocalDate.now(), UUID.randomUUID()),
                        new CreditCardPurchaseResult.InstallmentInfo(2, new BigDecimal("1000.00"), LocalDate.now().plusMonths(1), UUID.randomUUID()),
                        new CreditCardPurchaseResult.InstallmentInfo(3, new BigDecimal("1000.00"), LocalDate.now().plusMonths(2), UUID.randomUUID())
                )
        );

        when(createPurchaseUseCase.execute(eq(userId), eq(cardId), eq("Notebook"), any(), eq(3), any(), any(), eq("Para trabalho")))
                .thenReturn(result);

        mockMvc.perform(post("/api/v1/credit-cards/" + cardId + "/purchases")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Notebook"))
                .andExpect(jsonPath("$.totalInstallments").value(3))
                .andExpect(jsonPath("$.installments.length()").value(3));
    }
}
