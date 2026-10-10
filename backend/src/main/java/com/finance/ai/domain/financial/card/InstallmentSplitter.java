package com.finance.ai.domain.financial.card;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Serviço de domínio determinístico para divisão de compras parceladas.
 *
 * Invariante Contábil:
 * Se a divisão resultar em resíduo fracionário de centavos,
 * a diferença é somada obrigatoriamente à PRIMEIRA parcela.
 * A soma de todas as parcelas é estritamente igual ao valor total da compra.
 */
public final class InstallmentSplitter {

    private InstallmentSplitter() {}

    public static List<BigDecimal> split(BigDecimal totalAmount, int totalInstallments) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor total para parcelamento deve ser maior que zero.");
        }
        if (totalInstallments < 1) {
            throw new IllegalArgumentException("Número de parcelas deve ser no mínimo 1.");
        }

        var normalizedTotal = totalAmount.setScale(2, RoundingMode.HALF_EVEN);
        if (totalInstallments == 1) {
            return List.of(normalizedTotal);
        }

        // Parcela base truncada para baixo
        var baseAmount = normalizedTotal.divide(BigDecimal.valueOf(totalInstallments), 2, RoundingMode.DOWN);
        var totalBase = baseAmount.multiply(BigDecimal.valueOf(totalInstallments));
        var remainder = normalizedTotal.subtract(totalBase); // Centavos residuais

        List<BigDecimal> installments = new ArrayList<>(totalInstallments);

        // A primeira parcela absorve os centavos residuais
        var firstInstallment = baseAmount.add(remainder).setScale(2, RoundingMode.HALF_EVEN);
        installments.add(firstInstallment);

        for (int i = 1; i < totalInstallments; i++) {
            installments.add(baseAmount.setScale(2, RoundingMode.HALF_EVEN));
        }

        return List.copyOf(installments);
    }
}
