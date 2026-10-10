package com.finance.ai.application.financial.budget;

import com.finance.ai.application.financial.budget.dto.AiBudgetSuggestionResult;
import com.finance.ai.application.financial.budget.dto.CategoryBudgetSuggestionDto;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes: SuggestBudgetsWithAiUseCase")
class SuggestBudgetsWithAiUseCaseTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private SuggestBudgetsWithAiUseCase useCase;

    @Test
    @DisplayName("Deve distribuir o teto global exatamente entre as categorias respeitando a soma total")
    void shouldDistributeGlobalLimitAccurately() {
        UUID userId = UUID.randomUUID();
        UUID alimentacaoId = UUID.randomUUID();
        UUID deliveryId = UUID.randomUUID();
        UUID moradiaId = UUID.randomUUID();

        var catAlimentacao = new Category(alimentacaoId, userId, null, "Alimentação", "utensils", "#EF4444", true, java.time.Instant.now(), null);
        var catDelivery = new Category(deliveryId, userId, null, "Delivery", "bike", "#EA1D2C", true, java.time.Instant.now(), null);
        var catMoradia = new Category(moradiaId, userId, null, "Moradia", "home", "#3B82F6", true, java.time.Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId))
                .thenReturn(List.of(catAlimentacao, catDelivery, catMoradia));

        // Transação histórica de R$ 300 em Delivery
        var txDelivery = Transaction.create(userId, TransactionType.EXPENSE, new BigDecimal("300.00"),
                LocalDate.now(), null, "iFood", null, null, deliveryId, "");

        when(transactionRepository.findAllByUserIdAndPeriod(eq(userId), any(), any()))
                .thenReturn(List.of(txDelivery));

        BigDecimal globalLimit = new BigDecimal("2500.00");
        AiBudgetSuggestionResult result = useCase.execute(userId, globalLimit, LocalDate.now());

        assertThat(result).isNotNull();
        assertThat(result.globalLimit()).isEqualByComparingTo(globalLimit);
        assertThat(result.suggestions()).hasSize(3);

        // A soma exata de todos os limites sugeridos deve bater 100% com o globalLimit (sem erro de centavos)
        BigDecimal totalSugerido = result.suggestions().stream()
                .map(CategoryBudgetSuggestionDto::suggestedLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(totalSugerido).isEqualByComparingTo(globalLimit);
        assertThat(result.aiInsight()).contains("R$ 2500,00");
    }
}
