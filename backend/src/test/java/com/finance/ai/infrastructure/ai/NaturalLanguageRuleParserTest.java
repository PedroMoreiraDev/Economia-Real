package com.finance.ai.infrastructure.ai;

import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class NaturalLanguageRuleParserTest {

    private final NaturalLanguageRuleParser parser = new NaturalLanguageRuleParser();
    private final List<String> categories = List.of("Alimentação", "Transporte", "Moradia", "Lazer", "Salário");

    @Test
    @DisplayName("Deve extrair despesa com valor, data hoje e categoria alimentação")
    void shouldExtractExpenseCorrectly() {
        String text = "Gastei 45,50 no almoço hoje";
        ExtractedTransaction result = parser.parse(text, categories, TransactionOrigin.AI_TEXT);

        assertThat(result.type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("45.50"));
        assertThat(result.accrualDate()).isEqualTo(LocalDate.now());
        assertThat(result.suggestedCategoryName()).isEqualTo("Alimentação");
        assertThat(result.confidenceScore()).isGreaterThanOrEqualTo(0.8);
    }

    @Test
    @DisplayName("Deve extrair transporte com cartão de crédito e data de ontem")
    void shouldExtractTransportWithCreditCardAndYesterday() {
        String text = "Uber 23.90 ontem no cartão de crédito";
        ExtractedTransaction result = parser.parse(text, categories, TransactionOrigin.AI_TEXT);

        assertThat(result.type()).isEqualTo(TransactionType.EXPENSE);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("23.90"));
        assertThat(result.accrualDate()).isEqualTo(LocalDate.now().minusDays(1));
        assertThat(result.suggestedCategoryName()).isEqualTo("Transporte");
        assertThat(result.suggestedPaymentMethod()).isEqualTo("CREDIT_CARD");
    }

    @Test
    @DisplayName("Deve extrair receita de salário com PIX")
    void shouldExtractSalaryIncomeWithPix() {
        String text = "Recebi 5000 de salário no pix";
        ExtractedTransaction result = parser.parse(text, categories, TransactionOrigin.AI_TEXT);

        assertThat(result.type()).isEqualTo(TransactionType.INCOME);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(result.suggestedCategoryName()).isEqualTo("Salário");
        assertThat(result.suggestedPaymentMethod()).isEqualTo("PIX");
    }

    @Test
    @DisplayName("Deve extrair transferência com valor")
    void shouldExtractTransfer() {
        String text = "Transferi 150 reais";
        ExtractedTransaction result = parser.parse(text, categories, TransactionOrigin.AI_TEXT);

        assertThat(result.type()).isEqualTo(TransactionType.TRANSFER);
        assertThat(result.amount()).isEqualByComparingTo(new BigDecimal("150.00"));
    }

    @Test
    @DisplayName("Deve registrar ambiguidade quando o valor não for especificado")
    void shouldFlagAmbiguityWhenAmountIsMissing() {
        String text = "Fui à padaria tomar café";
        ExtractedTransaction result = parser.parse(text, categories, TransactionOrigin.AI_TEXT);

        assertThat(result.amount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.ambiguities()).isNotEmpty();
    }
}
