---
trigger: always_on
description: Garante integridade matemática monetária e prevenção contra dupla contagem contábil.
---

# Regra: Integridade Financeira Obrigatória

1. **Moeda e Precisão:** Nunca utilize tipos de ponto flutuante binário (`float` ou `double`) para armazenar ou calcular valores monetários. Utilize estritamente `java.math.BigDecimal` com escala 2 e arredondamento `RoundingMode.HALF_EVEN`.
2. **Cálculos Determinísticos:** Cálculos de saldos, faturas, juros e limites devem ser processados no backend determinístico. Nunca utilize modelos de IA como autoridade de cálculos matemáticos.
3. **Prevenção de Dupla Contagem:** O pagamento de faturas de cartão de crédito não é uma despesa primária, mas uma liquidação de passivo financeiro decorrente das compras parceladas já registradas.
4. **Resíduo de Parcelamento:** Na divisão de compras parceladas que resultem em frações indivisíveis de centavo, a diferença residual deve ser alocada na primeira parcela.
