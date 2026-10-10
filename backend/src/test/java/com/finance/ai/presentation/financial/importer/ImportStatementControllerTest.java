package com.finance.ai.presentation.financial.importer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.application.financial.importer.ImportBankStatementUseCase;
import com.finance.ai.application.financial.importer.ImportStatementResult;
import com.finance.ai.application.financial.importer.ListImportBatchesUseCase;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ImportStatementController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
@DisplayName("Testes de Integração Web: ImportStatementController e Upload Seguro")
class ImportStatementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImportBankStatementUseCase importUseCase;

    @MockBean
    private ListImportBatchesUseCase listBatchesUseCase;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/imports - deve rejeitar acesso sem token (403)")
    void shouldDenyUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/imports"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/imports/upload - deve processar arquivo OFX com sucesso (201)")
    void shouldUploadOfxFileSuccessfully() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "extrato.ofx",
                "application/x-ofx",
                "<OFX>conteudo</OFX>".getBytes()
        );

        var result = new ImportStatementResult(
                UUID.randomUUID(),
                "extrato.ofx",
                "OFX",
                5,
                1,
                "Importação concluída com sucesso."
        );

        when(importUseCase.execute(eq(userId), eq(accountId), eq("extrato.ofx"), any())).thenReturn(result);

        mockMvc.perform(multipart("/api/v1/imports/upload")
                        .file(file)
                        .param("accountId", accountId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importedCount").value(5))
                .andExpect(jsonPath("$.skippedCount").value(1))
                .andExpect(jsonPath("$.fileType").value("OFX"));

        verify(importUseCase).execute(eq(userId), eq(accountId), eq("extrato.ofx"), any());
    }

    @Test
    @DisplayName("POST /api/v1/imports/upload - deve rejeitar extensão inválida (400)")
    void shouldRejectUnsupportedFileExtension() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        String token = "valid.jwt.token";
        User user = new User(userId, "pedro@teste.com", "Pedro", "$2a$12$hash", Instant.now());

        when(jwtTokenProvider.isTokenValid(token)).thenReturn(true);
        when(jwtTokenProvider.extractUserId(token)).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "documento.pdf",
                "application/pdf",
                "%PDF-1.4".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/imports/upload")
                        .file(file)
                        .param("accountId", accountId.toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Formato não suportado. Envie apenas arquivos .ofx ou .csv."));
    }
}
