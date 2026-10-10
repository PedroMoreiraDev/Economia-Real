package com.finance.ai.presentation.financial;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.financial.CreateTransactionUseCase;
import com.finance.ai.application.financial.UpdateTransactionUseCase;
import com.finance.ai.application.financial.DeleteTransactionUseCase;
import com.finance.ai.application.financial.FinancialSummaryResult;
import com.finance.ai.application.financial.GetFinancialSummaryUseCase;
import com.finance.ai.application.financial.ListTransactionsUseCase;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionType;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TransactionController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: TransactionController e Proteção Anti-IDOR")
class TransactionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CreateTransactionUseCase createTransactionUseCase;

    @MockBean
    private UpdateTransactionUseCase updateTransactionUseCase;

    @MockBean
    private DeleteTransactionUseCase deleteTransactionUseCase;

    @MockBean
    private ListTransactionsUseCase listTransactionsUseCase;

    @MockBean
    private GetFinancialSummaryUseCase getFinancialSummaryUseCase;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/transactions - deve rejeitar requisição sem token (403)")
    void shouldDenyUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/transactions"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/transactions - deve criar transação vinculando estritamente ao userId do token")
    void shouldCreateTransactionBoundToAuthenticatedUser() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var request = new TransactionController.CreateTransactionRequest(
                TransactionType.INCOME,
                new BigDecimal("2500.00"),
                LocalDate.now(),
                null,
                "Freelance",
                null, null, null, "Projeto de software"
        );

        var created = Transaction.create(userId, TransactionType.INCOME, new BigDecimal("2500.00"),
                LocalDate.now(), null, "Freelance", null, null, null, "Projeto de software");

        when(createTransactionUseCase.execute(eq(userId), eq(TransactionType.INCOME), any(), any(), any(), eq("Freelance"), any(), any(), any(), any()))
                .thenReturn(created);

        mockMvc.perform(post("/api/v1/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("INCOME"))
                .andExpect(jsonPath("$.amount").value(2500.00))
                .andExpect(jsonPath("$.description").value("Freelance"));

        // Verificação anti-IDOR: o use case recebeu OBRIGATORIAMENTE o userId do token
        verify(createTransactionUseCase).execute(eq(userId), any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("GET /api/v1/transactions/summary - deve retornar métricas determinísticas para o usuário logado")
    void shouldReturnSummaryForAuthenticatedUser() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var summary = new FinancialSummaryResult(
                new BigDecimal("5000.00"),
                new BigDecimal("2000.00"),
                new BigDecimal("3000.00"),
                new BigDecimal("10000.00"),
                12
        );

        when(getFinancialSummaryUseCase.execute(eq(userId), isNull(), isNull())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/transactions/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalIncome").value(5000.00))
                .andExpect(jsonPath("$.totalExpense").value(2000.00))
                .andExpect(jsonPath("$.netSavings").value(3000.00))
                .andExpect(jsonPath("$.transactionCount").value(12));

        verify(getFinancialSummaryUseCase).execute(eq(userId), isNull(), isNull());
    }

    @Test
    @DisplayName("PUT /api/v1/transactions/{id} - deve atualizar transação existente do usuário autenticado")
    void shouldUpdateTransactionSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var updated = Transaction.create(
                userId,
                TransactionType.EXPENSE,
                new BigDecimal("250.00"),
                LocalDate.of(2026, 10, 6),
                LocalDate.of(2026, 10, 6),
                "Mercado Atualizado",
                null,
                null,
                null,
                "Nota atualizada"
        );

        when(updateTransactionUseCase.execute(
                eq(userId), eq(transactionId), eq(TransactionType.EXPENSE), eq(new BigDecimal("250.00")),
                eq(LocalDate.of(2026, 10, 6)), isNull(), eq("Mercado Atualizado"),
                isNull(), isNull(), isNull(), eq("Nota atualizada")
        )).thenReturn(updated);

        var requestBody = new TransactionController.UpdateTransactionRequest(
                TransactionType.EXPENSE,
                new BigDecimal("250.00"),
                LocalDate.of(2026, 10, 6),
                null,
                "Mercado Atualizado",
                null,
                null,
                null,
                "Nota atualizada"
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/transactions/" + transactionId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(250.00))
                .andExpect(jsonPath("$.description").value("Mercado Atualizado"));

        verify(updateTransactionUseCase).execute(
                eq(userId), eq(transactionId), eq(TransactionType.EXPENSE), eq(new BigDecimal("250.00")),
                eq(LocalDate.of(2026, 10, 6)), isNull(), eq("Mercado Atualizado"),
                isNull(), isNull(), isNull(), eq("Nota atualizada")
        );
    }

    @Test
    @DisplayName("DELETE /api/v1/transactions/{id} - deve excluir transação com sucesso (204 No Content)")
    void shouldDeleteTransactionSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/transactions/" + transactionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        verify(deleteTransactionUseCase).execute(eq(userId), eq(transactionId));
    }

    @Test
    @DisplayName("POST /api/v1/transactions/batch-delete - deve excluir múltiplas transações com sucesso (204 No Content)")
    void shouldDeleteBatchTransactionsSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID tx1 = UUID.randomUUID();
        UUID tx2 = UUID.randomUUID();
        List<UUID> ids = List.of(tx1, tx2);
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/v1/transactions/batch-delete")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ids)))
                .andExpect(status().isNoContent());

        verify(deleteTransactionUseCase).executeBatch(eq(userId), eq(ids));
    }
}
