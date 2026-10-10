# Glossário de Domínio Financeiro (DOMAIN_GLOSSARY.md)

Este documento estabelece as definições formais, inequívocas e canônicas dos conceitos financeiros do sistema, eliminando divergências conceituais entre regras de negócio, modelagem de dados, backend e frontend.

---

## 1. Conceitos Fundamentais e Fluxo Monetário

### 1.1. Transação Financeira
Qualquer registro de movimentação de recursos monetários associado a uma conta ou cartão pertencente a um usuário. Possui obrigatoriamente:
- Identificador único.
- Tipo canônico (Receita, Despesa, Transferência, Estorno).
- Valor nominal monetário estritamente positivo (`BigDecimal` com escala 2).
- Data de competência e data de liquidação.
- Status (Pendente, Realizada, Cancelada, Estornada).
- Categoria associada e conta de custódia / cartão.

### 1.2. Receita
Entrada financeira que aumenta o patrimônio líquido disponível do usuário (ex.: salário, rendimento de aplicações, bonificações, vendas).
- **Impacto no Saldo:** Positivo (+).

### 1.3. Despesa
Saída financeira que reduz o patrimônio do usuário, destinada ao consumo ou quitação de obrigações (ex.: alimentação, moradia, transporte).
- **Impacto no Saldo:** Negativo (-).

### 1.4. Transferência
Movimentação de recursos entre duas contas do próprio usuário (ex.: da Conta Corrente para a Poupança/Investimento).
- **Regra:** Não altera o patrimônio líquido total do usuário; apenas transfere saldo entre fontes de custódia.
- **Modelagem:** Representada por um par atômico débito/crédito vinculado ou uma transação de tipo Transferência com conta de origem e conta de destino.

---

## 2. Temporalidade e Liquidação

### 2.1. Data de Competência (Accrual Date)
A data em que o fato gerador da receita ou despesa ocorreu, independentemente de quando o dinheiro efetivamente saiu ou entrou na conta bancária (ex.: o dia em que o almoço foi consumido no cartão de crédito).

### 2.2. Data de Liquidação / Pagamento (Cash Date)
A data em que o recurso financeiro efetivamente sai da conta ou entra nela (ex.: o dia em que a fatura do cartão é debitada na conta corrente).

### 2.3. Despesa Realizada
Despesa cujo fato gerador já ocorreu e cujo valor é definitivo no período de apuração (já debitada na conta ou já lançada na fatura fechada/em aberto).

### 2.4. Despesa Prevista
Despesa estimada ou agendada para o futuro (ex.: aluguel do próximo mês, faturas futuras não fechadas, parcelas de compras já realizadas que vencerão nos próximos meses). Utilizada em projeções de fluxo de caixa futuro.

---

## 3. Cartões de Crédito, Parcelamentos e Faturas

### 3.1. Cartão de Crédito
Meio de pagamento baseado em limite concedido por instituição financeira, onde compras geram compromissos futuros agrupados periodicamente em faturas.

### 3.2. Fatura de Cartão
Agrupamento periódico (geralmente mensal) de lançamentos realizados em um cartão de crédito.
- **Data de Fechamento:** Data de corte na qual novas compras passam a ser contabilizadas na fatura seguinte.
- **Data de Vencimento:** Data limite para pagamento sem incidência de juros/multas.
- **Status da Fatura:** Aberta, Fechada, Paga, Parcialmente Paga, Atrasada.

### 3.3. Compra Parcelada e Parcela
- **Compra Parcelada:** Transação de consumo cujo valor total é dividido em $N$ parcelas mensais sucessivas.
- **Parcela:** Fração unitária ($k/N$) de uma compra parcelada que é alocada a uma fatura específica.
- **Regra de Arredondamento da Parcela:** Quando o valor total não é perfeitamente divisível por $N$ (ex.: R$ 100,00 em 3x = R$ 33,33 + R$ 33,33 + R$ 33,34), a diferença residual de centavos deve ser atribuída à primeira parcela para garantir soma determinística exata.

### 3.4. Pagamento de Fatura (Prevenção Crítica de Dupla Contagem)
A liquidação da fatura do cartão mediante débito em conta corrente **NÃO É UMA NOVA DESPESA DE CONSUMO**.
- Trata-se de uma quitação de passivo/transferência de liquidação.
- Se o usuário contabilizasse a compra do celular (ex.: R$ 2.000,00) como despesa e também o pagamento da fatura (R$ 2.000,00) como despesa, seus gastos seriam erroneamente duplicados (R$ 4.000,00).
- O sistema trata a compra como fato gerador da despesa categorizada, e o pagamento da fatura como operação de liquidação de saldo devedor do cartão.

---

## 4. Recorrências e Obrigações Fixas

### 4.1. Despesa Fixa
Despesa cujo valor é constante ou varia muito pouco mês a mês, essencial para manutenção (ex.: condomínio, mensalidade escolar, plano de saúde).

### 4.2. Despesa Recorrente
Compromisso financeiro que se repete em intervalos regulares de tempo (mensal, anual, semanal), como serviços de streaming e aluguéis. Pode ser debitada em conta corrente ou cobrada em cartão de crédito.

---

## 5. Regularizações e Ajustes

### 5.1. Estorno (Refund / Chargeback)
Anulação total ou parcial de uma despesa anterior, onde o valor retorna como crédito na conta ou na fatura do cartão.
- **Regra:** O estorno deve preferencialmente abater a categoria da despesa original (para não distorcer indicadores de receita com falsos ganhos).

### 5.2. Deduplicação
Processo de identificação e consolidação de transações idênticas geradas por importações repetidas do mesmo extrato ou conciliação entre registro manual prévio e extrato bancário oficial.

---

## 6. Orçamentos, Metas e Acompanhamento

### 6.1. Orçamento por Categoria
Teto financeiro planejado que o usuário estipula para gastar em uma categoria específica durante um ciclo mensal (ex.: Limite de Alimentação = R$ 1.500,00).

### 6.2. Ritmo Semanal (Weekly Burn Rate)
Métrica que divide o orçamento disponível pelos dias úteis ou semanas restantes do mês para orientar o usuário sobre o ritmo seguro de gastos.

### 6.3. Alerta de Extrapolação
Avisos progressivos emitidos pelo sistema:
- **Atenção:** 80% do limite atingido antes do término do período.
- **Crítico:** 100% atingido ou ultrapassado.

### 6.4. Meta de Economia
Objetivo financeiro de poupança com valor alvo e prazo (ex.: "Reserva de Emergência de R$ 10.000,00 até Dezembro").
