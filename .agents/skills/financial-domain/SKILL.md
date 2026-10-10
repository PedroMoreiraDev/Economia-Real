---
name: financial-domain
description: >-
  Orienta a integridade e regras de negócio financeiras: precisão com BigDecimal,
  divisão de parcelas, fechamento de faturas, prevenção de dupla contagem e competência vs. caixa.
  Use ao implementar qualquer cálculo monetário, liquidação ou relatório contábil.
---

# Skill: Financial Domain & Invariants

Esta skill estabelece as regras invioláveis de integridade contábil, cálculos matemáticos determinísticos e precisão monetária do sistema.

## 1. Objetivo
Garantir exatidão matemática absoluta, integridade de lançamentos, prevenção de dupla contagem em faturas e perfeita separação entre datas de competência e liquidação.

## 2. Quando Utilizar Esta Skill
- Ao implementar qualquer classe ou método que lide com dinheiro, saldos, parcelas ou faturas.
- Ao modelar compras parceladas de cartão de crédito.
- Ao conciliar pagamentos de fatura com saldos bancários.
- Ao calcular relatórios de fechamento de mês e projeções orçamentárias.

## 3. Regras Matemáticas e Casos de Borda

### 3.1. Precisão e Arredondamento
- Valores monetários utilizam sempre `BigDecimal` com escala 2 e modo de arredondamento bancário (`RoundingMode.HALF_EVEN`).
- Conversões e divisões devem especificar escala e arredondamento explicitamente:
  ```java
  BigDecimal total = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_EVEN);
  BigDecimal parcelas = total.divide(BigDecimal.valueOf(3), 2, RoundingMode.DOWN); // R$ 33.33
  ```

### 3.2. Divisão de Compras Parceladas com Centavo Residual
- Em compras parceladas onde a divisão gera dízimas periódicas (ex.: R$ 100,00 em 3x):
  - Calcula-se a parcela base: `100.00 / 3 = 33.33`.
  - A soma das 3 parcelas base seria `33.33 * 3 = 99.99` (diferença de R$ 0.01).
  - **Regra do Sistema:** A diferença de centavos é somada obrigatoriamente à primeira parcela (`Parcela 1 = 33.34`, `Parcela 2 = 33.33`, `Parcela 3 = 33.33`).
  - Soma total das parcelas deve ser estritamente igual ao valor total da compra.

### 3.3. Prevenção de Dupla Contagem (Regra Crítica de Faturas)
- A despesa de consumo é registrada no ato da compra categorizada (ex.: R$ 200 em Restaurante na fatura do cartão).
- O pagamento da fatura debitado da conta corrente é uma **operação de liquidação de passivo financeiro** (transferência entre conta corrente e fatura), **NUNCA UMA NOVA DESPESA DE CONSUMO**.
- O somatório de despesas mensais do usuário deve considerar as compras do cartão, e não o pagamento da fatura.

### 3.4. Temporalidade: Competência vs. Caixa
- **Regime de Competência (`accrualDate`):** Utilizado para relatórios orçamentários e gráficos de consumo do mês em que o gasto foi contratado.
- **Regime de Caixa (`settlementDate`):** Utilizado para fluxo de caixa e saldo bancário no momento em que o dinheiro efetivamente entra ou sai da conta.

## 4. Referências
- [Glossário de Domínio Financeiro](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/DOMAIN_GLOSSARY.md)
- [ADR-005: Precisão Monetária](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
- [ADR-006: Prevenção de Dupla Contagem](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
