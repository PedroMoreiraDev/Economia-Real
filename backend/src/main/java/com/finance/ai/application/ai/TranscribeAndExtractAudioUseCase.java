package com.finance.ai.application.ai;

import com.finance.ai.domain.ai.AudioTranscriptionPort;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Caso de uso para transcrição de áudio e extração estruturada de transações.
 */
@Service
public class TranscribeAndExtractAudioUseCase {

    private final AudioTranscriptionPort audioTranscriptionPort;
    private final ExtractTransactionFromTextUseCase extractTextUseCase;

    public TranscribeAndExtractAudioUseCase(AudioTranscriptionPort audioTranscriptionPort,
                                           ExtractTransactionFromTextUseCase extractTextUseCase) {
        this.audioTranscriptionPort = audioTranscriptionPort;
        this.extractTextUseCase = extractTextUseCase;
    }

    public AudioExtractionResult execute(UUID userId, byte[] audioBytes, String contentType) {
        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("O arquivo de áudio não pode estar vazio.");
        }

        String transcribedText = audioTranscriptionPort.transcribeAudio(audioBytes, contentType);
        if (transcribedText == null || transcribedText.isBlank()) {
            transcribedText = "Áudio não compreendido";
        }

        ExtractedTransaction extracted = extractTextUseCase.execute(userId, transcribedText);

        // Ajusta a origem para AI_AUDIO
        ExtractedTransaction audioOriginExtracted = new ExtractedTransaction(
                extracted.description(),
                extracted.amount(),
                extracted.type(),
                extracted.accrualDate(),
                extracted.suggestedCategoryName(),
                extracted.suggestedCategoryId(),
                extracted.suggestedPaymentMethod(),
                extracted.confidenceScore(),
                extracted.ambiguities(),
                TransactionOrigin.AI_AUDIO,
                transcribedText
        );

        return new AudioExtractionResult(transcribedText, audioOriginExtracted);
    }

    public record AudioExtractionResult(String transcribedText, ExtractedTransaction transaction) {}
}
