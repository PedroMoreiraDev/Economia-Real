package com.finance.ai.presentation.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.ai.ExtractTransactionFromTextUseCase;
import com.finance.ai.application.ai.TranscribeAndExtractAudioUseCase;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import com.finance.ai.domain.user.User;
import com.finance.ai.domain.user.UserRepository;
import com.finance.ai.infrastructure.security.JwtAuthenticationFilter;
import com.finance.ai.infrastructure.security.JwtTokenProvider;
import com.finance.ai.infrastructure.security.SecurityConfig;
import com.finance.ai.presentation.ai.dto.TextExtractionRequest;
import com.finance.ai.presentation.common.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AiController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: AiController (Texto e Áudio)")
class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ExtractTransactionFromTextUseCase extractTextUseCase;

    @MockBean
    private TranscribeAndExtractAudioUseCase transcribeAudioUseCase;

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
    @DisplayName("POST /api/v1/ai/extract-text - deve rejeitar requisição sem autenticação")
    void shouldRejectUnauthenticatedRequest() throws Exception {
        mockMvc.perform(post("/api/v1/ai/extract-text")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TextExtractionRequest("Almoço 35"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/ai/extract-text - deve extrair dados com sucesso quando autenticado")
    void shouldExtractTextSuccessfully() throws Exception {
        mockAuthentication();

        ExtractedTransaction extracted = new ExtractedTransaction(
                "Almoço executivo",
                new BigDecimal("42.50"),
                TransactionType.EXPENSE,
                LocalDate.now(),
                "Alimentação",
                UUID.randomUUID(),
                "DEBIT_CARD",
                0.95,
                List.of(),
                TransactionOrigin.AI_TEXT,
                "Almoço executivo 42,50 no débito"
        );

        when(extractTextUseCase.execute(eq(userId), eq("Almoço executivo 42,50 no débito")))
                .thenReturn(extracted);

        mockMvc.perform(post("/api/v1/ai/extract-text")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TextExtractionRequest("Almoço executivo 42,50 no débito"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Almoço executivo"))
                .andExpect(jsonPath("$.amount").value(42.50))
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.suggestedCategoryName").value("Alimentação"))
                .andExpect(jsonPath("$.origin").value("AI_TEXT"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/extract-audio - deve processar upload de áudio com sucesso")
    void shouldExtractAudioSuccessfully() throws Exception {
        mockAuthentication();

        MockMultipartFile audioFile = new MockMultipartFile(
                "file",
                "audio.webm",
                "audio/webm",
                "conteudo_de_audio_binario".getBytes()
        );

        ExtractedTransaction extracted = new ExtractedTransaction(
                "Combustível",
                new BigDecimal("100.00"),
                TransactionType.EXPENSE,
                LocalDate.now(),
                "Transporte",
                null,
                "CREDIT_CARD",
                0.9,
                List.of(),
                TransactionOrigin.AI_AUDIO,
                "Gasolina 100 reais no crédito"
        );

        var audioResult = new TranscribeAndExtractAudioUseCase.AudioExtractionResult(
                "Gasolina 100 reais no crédito",
                extracted
        );

        when(transcribeAudioUseCase.execute(eq(userId), any(), eq("audio/webm")))
                .thenReturn(audioResult);

        mockMvc.perform(multipart("/api/v1/ai/extract-audio")
                        .file(audioFile)
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Combustível"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.origin").value("AI_AUDIO"))
                .andExpect(jsonPath("$.transcribedText").value("Gasolina 100 reais no crédito"));
    }
}
