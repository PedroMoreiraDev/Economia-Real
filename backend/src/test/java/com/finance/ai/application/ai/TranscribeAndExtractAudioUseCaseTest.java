package com.finance.ai.application.ai;

import com.finance.ai.domain.ai.AudioTranscriptionPort;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TranscribeAndExtractAudioUseCaseTest {

    @Mock
    private AudioTranscriptionPort audioTranscriptionPort;

    @Mock
    private ExtractTransactionFromTextUseCase extractTextUseCase;

    @InjectMocks
    private TranscribeAndExtractAudioUseCase useCase;

    @Test
    @DisplayName("Deve transcrever áudio e extrair transação com origem AI_AUDIO")
    void shouldTranscribeAndExtractAudio() {
        UUID userId = UUID.randomUUID();
        byte[] audioBytes = new byte[]{1, 2, 3};
        String contentType = "audio/webm";

        when(audioTranscriptionPort.transcribeAudio(audioBytes, contentType))
                .thenReturn("Uber 25 reais");

        ExtractedTransaction textResult = new ExtractedTransaction(
                "Uber",
                new BigDecimal("25.00"),
                TransactionType.EXPENSE,
                LocalDate.now(),
                "Transporte",
                null,
                "CREDIT_CARD",
                0.95,
                List.of(),
                TransactionOrigin.AI_TEXT,
                "Uber 25 reais"
        );

        when(extractTextUseCase.execute(eq(userId), eq("Uber 25 reais")))
                .thenReturn(textResult);

        var result = useCase.execute(userId, audioBytes, contentType);

        assertThat(result.transcribedText()).isEqualTo("Uber 25 reais");
        assertThat(result.transaction().origin()).isEqualTo(TransactionOrigin.AI_AUDIO);
        assertThat(result.transaction().amount()).isEqualByComparingTo(new BigDecimal("25.00"));
    }
}
