---
name: testing-and-quality
description: >-
  Orienta a estratégia e execução de testes: JUnit 5, AssertJ, Mockito, Testcontainers,
  testes unitários de domínio e prevenção de testes mascarados.
  Use ao escrever testes automatizados, validar alterações ou diagnosticar falhas.
---

# Skill: Testing & Quality Assurance

Esta skill estabelece a metodologia de testes automatizados, cobertura de casos de borda e critérios rigorosos de aceitação de código.

## 1. Objetivo
Garantir que o software seja confiavelmente testado contra regressões, com foco em regras de negócio críticas e verificações empíricas reais de execução.

## 2. Quando Utilizar Esta Skill
- Ao escrever ou refatorar qualquer classe de domínio, aplicação ou controller.
- Ao validar o funcionamento de migrações e consultas de banco de dados.
- Ao executar suites de testes locais no backend (`mvn test`) ou frontend (`npm test`).
- Ao investigar a causa raiz de um teste que falhou.

## 3. Práticas Obrigatórias de Testes
- **JUnit 5 + AssertJ:**
  - Prefira `assertThat(...)` fluente do AssertJ para mensagens de falha claras e legíveis.
  - Utilize `@ParameterizedTest` com `@CsvSource` ou `@MethodSource` para testar matrizes de regras monetárias e parcelamentos.
- **Testcontainers para Testes de Integração:**
  - Proibido usar H2 para simular o PostgreSQL em testes de integração de persistência.
  - Suba um container real do PostgreSQL com a imagem oficial `postgres:16-alpine`.
- **Proibição de Mascaramento:**
  - Nunca utilize `@Disabled` ou ignore asserções para fazer um build passar. Se um teste falhou, corrija a implementação ou atualize o teste caso a regra de negócio tenha mudado legitimamente.
- **Nunca Afirme Sucesso sem Execução Factual:**
  - É expressamente proibido relatar "testes passaram com sucesso" sem ter executado o comando correspondente e capturado a evidência do log.

## 4. Matriz de Cobertura Crítica
Antes de considerar uma entrega concluída, certifique-se de que os seguintes pontos possuem testes:
1. Cálculo de parcelamento com divisão não exata de centavos.
2. Isolamento de usuário em consultas (tentativa de acessar dados de outro `user_id`).
3. Comportamento determinístico de liquidação de fatura sem dupla contagem.
4. Parsing e validação de arquivos CSV/OFX malformados ou com transações duplicadas.

## 5. Referências
- [Estratégia de Testes e Qualidade](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/quality/TEST_STRATEGY.md)
- [Fluxo Permanente de Trabalho](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/DEVELOPMENT_WORKFLOW.md)
