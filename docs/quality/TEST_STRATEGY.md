# Estratégia de Testes e Qualidade (TEST_STRATEGY.md)

Este documento define a pirâmide de testes, as ferramentas obrigatórias, os critérios de aceitação e os procedimentos de validação de qualidade para o ciclo de vida do software.

---

## 1. Princípios Invioláveis de Qualidade

1. **Nunca Afirme que um Teste Passou sem Evidência Real:** Toda declaração de sucesso deve ser acompanhada do comando executado e do resumo da saída factual da ferramenta de testes.
2. **Proibição de Mascarar Falhas:** É terminantemente proibido comentar testes falhos, usar `@Disabled` / `@Ignore` ou afrouxar asserções apenas para obter build verde. Se um teste falhar, o defeito na regra ou na implementação deve ser corrigido.
3. **Prioridade a Regras Críticas:** Foco prioritário na cobertura de invariantes financeiras e limites de segurança sobre código boilerplate ou getters/setters.

---

## 2. Pirâmide de Testes do Projeto

```
               / \
              /   \      E2E / UI Tests (Cypress / Playwright)
             / E2E \     - Fluxos críticos de ponta a ponta
            /-------\
           /         \   Testes de Integração & API (Spring Boot + Testcontainers)
          / Integracao\  - Repositórios PostgreSQL reais, Controllers REST, Migrações Flyway
         /-------------\
        /               \ Testes Unitários de Domínio (JUnit 5 + Mockito / AssertJ / Vitest)
       /    Unitários    \- Regras financeiras puras, divisões de parcelas, cálculos orçamentários
      /-------------------\
```

### 2.1. Testes Unitários de Domínio (Backend - JUnit 5 + AssertJ)
- **Escopo:** Regras puras no módulo `core/domain`.
- **Características:** Execução ultra-rápida (milissegundos), sem inicializar contexto Spring Boot, sem banco de dados.
- **Exigência Absoluta:** Toda função de cálculo de parcelamento, distribuição de centavos residuais, consolidação de faturas e validação de saldos deve possuir testes parametrizados (`@ParameterizedTest`).

### 2.2. Testes de Integração e Persistência (Spring Boot + Testcontainers)
- **Escopo:** Módulos de persistência (`Spring Data JPA`) e endpoints REST (`MockMvc` / `WebTestClient`).
- **Uso de Testcontainers:** Não utilizamos H2 para testes de integração de persistência, pois H2 possui dialeto SQL diferente e mascara incompatibilidades de tipos `UUID`, `NUMERIC` e funções do PostgreSQL. Testes de integração sobem container temporário de PostgreSQL via Testcontainers.
- **Isolamento Transacional:** Cada teste executa dentro de uma transação revertida ao final ou utiliza instâncias limpas para evitar contaminação de estado entre cenários.

### 2.3. Testes Unitários e de Componentes (Frontend - Vitest + React Testing Library)
- **Escopo:** Hooks customizados de cálculo financeiro, componentes com lógica de formulário (Zod) e renderização de tabelas e gráficos.
- **Foco:** Acessibilidade (testar interações por acessibilidade `getByRole`, `getByLabelText`) e resposta a estados vazios, erros de API e carregamento (`loading`).

---

## 3. Matriz de Casos de Borda Financeiros Obrigatórios

Os seguintes cenários devem possuir cobertura de testes automatizados explícita:

| Cenário de Teste | Caso de Borda Testado | Comportamento Esperado |
| :--- | :--- | :--- |
| **Parcelamento ímpar / dízima** | R$ 100,00 parcelado em 3x | Parcela 1 = R$ 33,34; Parcela 2 = R$ 33,33; Parcela 3 = R$ 33,33. Soma exata = R$ 100,00. |
| **Fechamento na virada de ano** | Fatura de Dezembro com vencimento em Janeiro | Ano de competência e ano de vencimento calculados corretamente. |
| **Ano Bissexto** | Recorrência com vencimento em 29 de Fevereiro | Em anos não bissextos, ajusta automaticamente para 28 de Fevereiro. |
| **Pagamento de Fatura** | Fatura com R$ 500,00 em compras | Quitação deduz R$ 500 da conta bancária sem somar R$ 500 nas despesas de consumo. |
| **Extrato com transação repetida** | Arquivo OFX importado duas vezes com mesmo `FITID` | Segunda importação identifica duplicata e ignora o registro com aviso. |
| **Estorno Parcial** | Compra de R$ 200,00 com estorno de R$ 50,00 | Categoria exibe gasto líquido de R$ 150,00 sem criar falso registro de receita. |

---

## 4. Critérios de Homologação de Entrega

Uma tarefa é considerada tecnicamente concluída somente quando:
1. `mvn test` executa com sucesso no backend (0 testes com erro, 0 falhas).
2. `npm run test` (quando configurado no frontend) executa com sucesso.
3. O build completo passa sem warnings críticos.
4. Toda nova regra de negócio possui pelo menos um teste positivo e dois testes de caso de borda/erro associados.
