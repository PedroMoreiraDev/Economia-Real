package com.finance.ai.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes de Invariantes e Precisão do Domínio Financeiro")
class FinancialDomainInvariantsTest {

    @Test
    @DisplayName("Garante precisão decimal exata com BigDecimal sem imprecisões de ponto flutuante")
    void shouldMaintainExactDecimalPrecision() {
        BigDecimal a = new BigDecimal("0.10");
        BigDecimal b = new BigDecimal("0.20");
        BigDecimal sum = a.add(b);

        assertThat(sum).isEqualByComparingTo(new BigDecimal("0.30"));
    }

    @ParameterizedTest(name = "Total R$ {0} em {1} parcelas deve somar exatamente o total original")
    @CsvSource({
            "100.00, 3, 33.34, 33.33",
            "50.00, 3, 16.68, 16.66",
            "10.00, 6, 1.70, 1.66",
            "200.00, 4, 50.00, 50.00"
    })
    @DisplayName("Divisão de parcelas aloca o centavo residual na primeira parcela e preserva a soma determinística")
    void shouldAllocateResidualCentToFirstInstallment(
            String totalAmountStr,
            int installmentCount,
            String expectedFirstInstallmentStr,
            String expectedOtherInstallmentsStr
    ) {
        BigDecimal total = new BigDecimal(totalAmountStr).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal base = total.divide(BigDecimal.valueOf(installmentCount), 2, RoundingMode.DOWN);

        BigDecimal baseSum = base.multiply(BigDecimal.valueOf(installmentCount));
        BigDecimal remainder = total.subtract(baseSum);

        List<BigDecimal> installments = new ArrayList<>();
        for (int i = 0; i < installmentCount; i++) {
            if (i == 0) {
                installments.add(base.add(remainder));
            } else {
                installments.add(base);
            }
        }

        assertThat(installments.get(0)).isEqualByComparingTo(new BigDecimal(expectedFirstInstallmentStr));
        for (int i = 1; i < installmentCount; i++) {
            assertThat(installments.get(i)).isEqualByComparingTo(new BigDecimal(expectedOtherInstallmentsStr));
        }

        BigDecimal calculatedTotal = installments.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(calculatedTotal).isEqualByComparingTo(total);
    }
}
