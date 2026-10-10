package com.finance.ai.application.ai;

import com.finance.ai.domain.ai.AiExtractionPort;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExtractTransactionFromTextUseCaseTest {

    @Mock
    private AiExtractionPort aiExtractionPort;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ExtractTransactionFromTextUseCase useCase;

    @Test
    @DisplayName("Deve extrair transação e associar o ID da categoria correspondente")
    void shouldExtractAndMatchCategoryId() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        Category cat = new Category(categoryId, userId, null, "Alimentação", "utensils", "#FF0000", true, Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(cat));

        ExtractedTransaction rawExtracted = new ExtractedTransaction(
                "Almoço",
                new BigDecimal("45.00"),
                TransactionType.EXPENSE,
                LocalDate.now(),
                "Alimentação",
                null,
                "DEBIT_CARD",
                0.9,
                List.of(),
                TransactionOrigin.AI_TEXT,
                "Almoço 45 reais"
        );

        when(aiExtractionPort.extractFromText(eq("Almoço 45 reais"), any())).thenReturn(rawExtracted);

        ExtractedTransaction result = useCase.execute(userId, "Almoço 45 reais");

        assertThat(result.description()).isEqualTo("Almoço");
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("45.00"));
        assertThat(result.suggestedCategoryName()).isEqualTo("Alimentação");
        assertThat(result.suggestedCategoryId()).isEqualTo(categoryId);
    }
}
