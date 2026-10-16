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

        byte[] audioBytes = file.getBytes();
        validateAudioIntegrity(audioBytes, contentType);

        var result = transcribeAudioUseCase.execute(user.userId(), audioBytes, contentType);
        return ResponseEntity.ok(AiExtractionResponse.from(result.transaction(), result.transcribedText()));
    }

    private void validateAudioIntegrity(byte[] bytes, String declaredContentType) {
        if (bytes == null || bytes.length < 16) {
            throw new IllegalArgumentException("O arquivo de áudio enviado é muito curto ou inválido.");
        }

        // Bloqueio imediato de binários executáveis e scripts (MZ, ELF, Java bytecode, Shell script)
        if (bytes[0] == 0x4D && bytes[1] == 0x5A) { // MZ
            throw new IllegalArgumentException("Arquivo inválido: binários executáveis não são permitidos.");
        }
        if (bytes.length >= 4 && bytes[0] == 0x7F && bytes[1] == 0x45 && bytes[2] == 0x4C && bytes[3] == 0x46) { // ELF
            throw new IllegalArgumentException("Arquivo inválido: binários executáveis não são permitidos.");
        }
        if (bytes.length >= 4 && (bytes[0] & 0xFF) == 0xCA && (bytes[1] & 0xFF) == 0xFE && (bytes[2] & 0xFF) == 0xBA && (bytes[3] & 0xFF) == 0xBE) { // CAFEBABE
            throw new IllegalArgumentException("Arquivo inválido: binários compilados não são permitidos.");
        }
        if (bytes[0] == 0x23 && bytes[1] == 0x21) { // #!
            throw new IllegalArgumentException("Arquivo inválido: scripts de comando não são permitidos.");
        }

        // Verifica se é um dos formatos comuns de áudio:
        // WAV: RIFF...WAVE
        boolean isWav = bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F';
        // WebM / Matroska: 1A 45 DF A3
        boolean isWebm = (bytes[0] & 0xFF) == 0x1A && (bytes[1] & 0xFF) == 0x45 && (bytes[2] & 0xFF) == 0xDF && (bytes[3] & 0xFF) == 0xA3;
        // MP3 ID3v2 ou MPEG Frame Sync
        boolean isMp3 = (bytes[0] == 'I' && bytes[1] == 'D' && bytes[2] == '3') ||
                ((bytes[0] & 0xFF) == 0xFF && ((bytes[1] & 0xFF) & 0xE0) == 0xE0);
        // OggS
        boolean isOgg = bytes.length >= 4 && bytes[0] == 'O' && bytes[1] == 'g' && bytes[2] == 'g' && bytes[3] == 'S';
        // MP4 / M4A (ftyp a partir do offset 4)
        boolean isM4a = bytes.length >= 8 && bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p';
        // FLAC: fLaC
        boolean isFlac = bytes.length >= 4 && bytes[0] == 'f' && bytes[1] == 'L' && bytes[2] == 'a' && bytes[3] == 'C';

        if (!isWav && !isWebm && !isMp3 && !isOgg && !isM4a && !isFlac) {
            // Se não bateu nenhum cabeçalho padrão, valida se o content type pelo menos é audio/
            if (!declaredContentType.toLowerCase().startsWith("audio/")) {
                throw new IllegalArgumentException("O arquivo enviado não possui assinatura válida de áudio suportado.");
            }
        }
    }
}
