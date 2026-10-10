---
name: java-spring-backend
description: >-
  Orienta as práticas de desenvolvimento Java 21 e Spring Boot 3.3.x: convenções,
  Records, injeção de dependências, JPA, transações, validação e REST.
  Use ao implementar endpoints, regras de aplicação, entidades e serviços backend.
---

# Skill: Java & Spring Backend Engineering

Esta skill estabelece os padrões técnicos e convenções de código para o backend em Java 21 e Spring Boot.

## 1. Objetivo
Produzir código backend robusto, idiomático, de alta performance e manutenível, aproveitando os recursos modernos do Java 21 (Records, Pattern Matching, Virtual Threads) e do ecossistema Spring.

## 2. Quando Utilizar Esta Skill
- Ao criar ou modificar classes Java no backend (`controllers`, `use cases`, `entities`, `repositories`, `DTOs`).
- Ao estruturar consultas JPA/Hibernate ou configurar transações (`@Transactional`).
- Ao implementar validações de entrada e tratamento padronizado de exceções.
- Ao definir contratos de API documentados via OpenAPI.

## 3. Convenções de Código e Estrutura
- **Java 21 Moderno:**
  - Utilize `record` para DTOs de requisição e resposta imutáveis.
  - Evite Lombok quando `record` ou métodos nativos do Java 21 forem suficientes.
  - Utilize Pattern Matching para `instanceof` e `switch` expressions exaustivos.
- **Injeção de Dependências:**
  - Prefira sempre injeção por construtor com atributos `private final`. Evite `@Autowired` em campos.
- **Transações:**
  - Aplique `@Transactional` na camada de aplicação/serviço, nunca nos controllers ou diretamente nos repositórios.
  - Utilize `@Transactional(readOnly = true)` em métodos de consulta para otimizar o Hibernate.
- **Prevenção do Problema N+1:**
  - Ao consultar relacionamentos (`@ManyToOne`, `@OneToMany`), utilize `JOIN FETCH` explícito ou `@EntityGraph` para evitar múltiplas queries desnecessárias.
- **Validação de Entrada:**
  - Anote DTOs com Jakarta Bean Validation (`@NotNull`, `@NotBlank`, `@Positive`, `@Size`).
  - Trate erros via `@RestControllerAdvice` retornando Problem Details (RFC 7807).

## 4. Regras Obrigatórias
- **Proibição de Tipos Flutuantes:** É estritamente proibido o uso de `float` ou `double` para representar moeda. Use sempre `BigDecimal`.
- **Zero Lógica em Controllers:** Controllers devem apenas receber DTOs, delegar ao caso de uso e retornar DTOs de resposta ou `ResponseEntity`.
- **Nenhum Mock Silencioso:** Não deixe dados falsos (hardcoded) em endpoints sem documentação explícita de stub.

## 5. Referências
- [Convenções de API REST](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/API_CONVENTIONS.md)
- [Modelo de Dados Relacional](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/DATA_MODEL.md)
- [Estratégia de Testes](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/quality/TEST_STRATEGY.md)
