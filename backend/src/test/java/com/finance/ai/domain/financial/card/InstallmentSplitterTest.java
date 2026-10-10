package com.finance.ai.domain.financial.card;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Testes de Domínio: InstallmentSplitter (Invariante do Centavo Residual)")
class InstallmentSplitterTest {

    @Test
    @DisplayName("R$ 100,00 em 3x deve gerar 33.34 na 1ª parcela e 33.33 nas demais com soma exata de 100.00")
    void shouldSplitOneHundredInThreeInstallmentsWithCentInFirst() {
        var total = new BigDecimal("100.00");
        List<BigDecimal> installments = InstallmentSplitter.split(total, 3);

        assertThat(installments).hasSize(3);
        assertThat(installments.get(0)).isEqualByComparingTo(new BigDecimal("33.34"));
        assertThat(installments.get(1)).isEqualByComparingTo(new BigDecimal("33.33"));
        assertThat(installments.get(2)).isEqualByComparingTo(new BigDecimal("33.33"));

        // Invariante absoluta: a soma exata das parcelas é igual ao total original
        var sum = installments.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(total);
    }

    @ParameterizedTest
    @CsvSource({
            "1000.00, 6, 166.70, 166.66",
            "50.00, 1, 50.00, 50.00",
            "120.00, 4, 30.00, 30.00",
            "79.90, 3, 26.64, 26.63",
            "99.99, 7, 14.31, 14.28"
    })
    @DisplayName("Deve garantir que a soma de todas as parcelas é matematicamente idêntica ao total")
    void shouldEnsureMathematicalExactnessAcrossScenarios(String totalStr, int count, String firstExpected, String baseExpected) {
        var total = new BigDecimal(totalStr);
        List<BigDecimal> installments = InstallmentSplitter.split(total, count);

        assertThat(installments).hasSize(count);
        assertThat(installments.get(0)).isEqualByComparingTo(new BigDecimal(firstExpected));
        if (count > 1) {
            assertThat(installments.get(1)).isEqualByComparingTo(new BigDecimal(baseExpected));
        }

        var sum = installments.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sum).isEqualByComparingTo(total);
    }

    @Test
    @DisplayName("Deve lançar exceção para valores zero ou parcelas menores que 1")
    void shouldThrowOnInvalidInput() {
        assertThatThrownBy(() -> InstallmentSplitter.split(BigDecimal.ZERO, 3))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> InstallmentSplitter.split(new BigDecimal("100.00"), 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
