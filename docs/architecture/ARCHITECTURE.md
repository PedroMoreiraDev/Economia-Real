# Arquitetura de Software (ARCHITECTURE.md)

Este documento define a visão arquitetural, o modelo estrutural do sistema, os módulos funcionais, os limites de dependência e as regras de evolução técnica do projeto.

---

## 1. Visão Geral e Estilo Arquitetural

O sistema adota o padrão de **Monólito Modular** com princípios de **Clean Architecture Pragmática** e **Domain-Driven Design (DDD) Pragmático**.

```
+-------------------------------------------------------------------------+
|                           CLIENTE WEB (React / Vite)                    |
|       UI Components (shadcn/ui)  |  TanStack Query  |  Recharts / Zod   |
+-------------------------------------------------------------------------+
                                     │  HTTPS / JSON REST
                                     ▼
+-------------------------------------------------------------------------+
|                      BACKEND SPRING BOOT (Java 21)                      |
|                                                                         |
|  [Presentation Layer]                                                   |
|    - REST Controllers, OpenAPI Docs, Request/Response DTOs              |
|                                     │                                   |
|                                     ▼                                   |
|  [Application Layer]                                                    |
|    - Use Cases / Application Services, Orchestration, Transaction Mgt   |
|                                     │                                   |
|                 ┌───────────────────┴───────────────────┐               |
|                 ▼                                       ▼               |
|  [Domain Layer (Core Puro)]              [Infrastructure Layer]         |
|    - Entities, Value Objects,              - Spring Data JPA, Flyway    |
|      Domain Services, Invariants           - AI Adapters / Transcribers |
|      (Zero dependência de frameworks)      - Security & JWT Filters     |
|                                            - File Storage & Parsers     |
+-------------------------------------------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                  BANCO DE DADOS RELACIONAL (PostgreSQL 16+)             |
+-------------------------------------------------------------------------+
```

### Justificativa da Escolha (Monólito Modular vs. Microsserviços)
- **Eliminação de Complexidade Acidental:** Não há overhead de rede distribuída, particionamento de banco, orquestração de containers complexa (Kubernetes) ou transações distribuídas (Saga).
- **Consistência Transacional Forte:** Fundamental em sistemas financeiros para garantir atomicidade entre débitos, créditos, parcelas e faturas no PostgreSQL.
- **Velocidade de Evolução:** Permite refatorações seguras de contratos tipados em tempo de compilação.
- **Isolamento Modular Claro:** Cada módulo possui limites bem definidos, permitindo futura extração caso surja demanda extrema comprovada de escala.

---

## 2. Estrutura de Camadas e Regras de Dependência

A regra fundamental de dependência da Clean Architecture é estritamente aplicada: **o código de camadas internas nunca depende de camadas externas**.

```
   Presentation (Web/Controllers)
         │
         ▼
    Application (Use Cases)
         │
         ▼
     Domain (Regras Financeiras Puras)
         ▲
         │ (Inversão de Dependência via Interfaces/Ports)
   Infrastructure (JPA, PostgreSQL, Integrações IA, Parsers)
```

### 2.1. Domain Layer (`core/domain`)
- **Responsabilidade:** Contém entidades financeiras, objetos de valor (ex.: `Money`, `InstallmentSchedule`), invariantes e serviços de domínio.
- **Restrição Absoluta:** Não possui anotações de framework web (sem `@RestController`), sem dependência de banco (sem anotações JPA obrigatórias no core puro quando isolado, ou com separação estrita de modelo de persistência), e zero dependência de SDKs de IA.
- **Determinismo:** Todos os cálculos de juros, parcelas e orçamentos residem aqui em classes Java puras testáveis via JUnit sem mocks.

### 2.2. Application Layer (`core/application`)
- **Responsabilidade:** Orquestra os fluxos de caso de uso (ex.: `CreateTransactionUseCase`, `ImportBankStatementUseCase`), gerencia transações de aplicação (`@Transactional`), valida autorização e dispara notificações.
- **Regra:** Não conhece detalhes HTTP (como `HttpServletRequest` ou status codes).

### 2.3. Presentation Layer (`entrypoints/web`)
- **Responsabilidade:** Controllers REST, serialização JSON, documentação OpenAPI/Swagger e mapeamento de DTOs de entrada/saída.
- **Regra:** Valida payloads com Spring Validation / Bean Validation antes de repassar aos casos de uso. Jamais contém cálculos de negócio.

### 2.4. Infrastructure Layer (`infrastructure`)
- **Responsabilidade:** Implementação de repositórios JPA, consultas SQL otimizadas, migrações Flyway, clientes HTTP para serviços externos de transcrição/LLM, parsers de arquivos OFX/CSV e filtros de segurança JWT.

---

## 3. Módulos Funcionais do Sistema

1. **Módulo de Identidade & Acesso (`identity`):** Cadastro de usuários, autenticação JWT, hash de senhas (BCrypt), isolamento multi-tenant lógico por `user_id`.
2. **Módulo de Contas e Ativos (`accounts`):** Gestão de contas correntes, poupanças e limites de cartões de crédito.
3. **Módulo de Transações (`transactions`):** Lançamento de receitas, despesas, transferências, estornos e categorização.
4. **Módulo de Cartões e Parcelamentos (`credit-cards`):** Fechamento de faturas, geração de parcelas, regras de liquidação sem dupla contagem.
5. **Módulo de Recorrências (`recurring`):** Despesas fixas e assinaturas periódicas.
6. **Módulo de Importação & Deduplicação (`importer`):** Parsers de extratos CSV/OFX, matching de transações existentes e staging de importação.
7. **Módulo de Orçamentos & Metas (`budgets`):** Tetos por categoria, acompanhamento de burn rate e metas de economia.
8. **Módulo de Inteligência Artificial (`ai-gateway`):** Porta de integração para modelos de linguagem e transcrição, com contratos tipados e isolamento estrito de dados sensíveis.

---

## 4. Princípios de Engenharia Obrigatórios

- **SOLID Pragmático:**
  - *Single Responsibility:* Serviços focados em um caso de uso ou agregado.
  - *Open/Closed:* Adição de novos formatos de importação (ex.: OFX, CSV Santander, CSV Nubank) via estratégia de plugins/parsers sem alterar o orquestrador.
  - *Interface Segregation:* Interfaces de repositório e serviços externas enxutas, sem métodos redundantes.
  - *Dependency Inversion:* Domínio define contratos; infraestrutura implementa.
- **KISS, DRY e YAGNI:**
  - Proibido criar fábricas genéricas, wrappers abstratos ou camadas extras que apenas repassam chamadas sem lógica.
  - Não introduzir mensageria assíncrona (RabbitMQ/Kafka) ou Redis até que haja métrica demonstrando gargalo real no PostgreSQL.

---

## 5. Estratégia de Integração com Inteligência Artificial

A arquitetura define 4 pilares invioláveis para IA:
1. **Não-Autoridade Numérica:** A IA não realiza contas financeiras. O backend calcula e entrega os totais consolidados para a IA apenas interpretar ou contextualizar.
2. **Entradas Não-Confiáveis:** Toda resposta de modelo LLM ou transcrição de áudio é tratada como `untrusted input`, submetida a validação de schema e requer aprovação explícita do usuário na UI.
3. **Privacidade e LGPD:** Dados como CPF, nomes de terceiros e números de contas são removidos ou mascarados antes do envio a provedores externos.
4. **Resiliência e Orçamento:** Timeouts rígidos (ex.: 10s para LLM), retries com backoff exponencial e limite orçamentário configurável por usuário.

---

## 6. Estratégia de Segurança e Isolamento

- **Isolamento de Dados Obrigatório:** Cada entidade de negócio contém chave estrangeira para o `user_id`. As consultas de repositório filtram obrigatoriamente pelo usuário do contexto de segurança.
- **Validação de Autorização no Backend:** O frontend nunca dita permissões de acesso.
- **Proteção de Arquivos:** Uploads de extratos são validados por tamanho (máx. 10MB), tipo MIME real e analisados em memória ou armazenamento efêmero seguro.
