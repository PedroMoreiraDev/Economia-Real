package com.finance.ai.presentation.ai;

import com.finance.ai.application.ai.ExtractTransactionFromTextUseCase;
import com.finance.ai.application.ai.TranscribeAndExtractAudioUseCase;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import com.finance.ai.presentation.ai.dto.AiExtractionResponse;
import com.finance.ai.presentation.ai.dto.TextExtractionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "Inteligência Artificial", description = "Extração estruturada de transações por texto natural e áudio de voz")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final ExtractTransactionFromTextUseCase extractTextUseCase;
    private final TranscribeAndExtractAudioUseCase transcribeAudioUseCase;

    public AiController(ExtractTransactionFromTextUseCase extractTextUseCase,
                        TranscribeAndExtractAudioUseCase transcribeAudioUseCase) {
        this.extractTextUseCase = extractTextUseCase;
        this.transcribeAudioUseCase = transcribeAudioUseCase;
    }

    @PostMapping("/extract-text")
    @Operation(summary = "Extrai entidade de transação financeira estruturada a partir de texto natural")
    public ResponseEntity<AiExtractionResponse> extractFromText(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody TextExtractionRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ExtractedTransaction extracted = extractTextUseCase.execute(user.userId(), request.text());
        return ResponseEntity.ok(AiExtractionResponse.from(extracted, null));
    }

    @PostMapping(value = "/extract-audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Transcreve áudio de voz e extrai proposta de transação estruturada")
    public ResponseEntity<AiExtractionResponse> extractFromAudio(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de áudio gravado ou enviado está vazio.");
        }

        // Validação de limite de tamanho de 15MB
        if (file.getSize() > 15 * 1024 * 1024) {
            throw new IllegalArgumentException("O arquivo de áudio excede o limite máximo permitido de 15MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "audio/webm";
        }

        var result = transcribeAudioUseCase.execute(user.userId(), file.getBytes(), contentType);
        return ResponseEntity.ok(AiExtractionResponse.from(result.transaction(), result.transcribedText()));
    }
}
