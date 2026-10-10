---
name: software-architecture
description: >-
  Define e preserva os padrões arquiteturais do sistema: Monólito Modular,
  Clean Architecture pragmática, SOLID, DDD e limites de dependência.
  Use ao desenhar novos módulos, criar entidades de domínio ou definir contratos de integração.
---

# Skill: Software Architecture

Esta skill orienta o desenho estrutural, modularidade, separação de camadas e regras de dependência da plataforma.

## 1. Objetivo
Garantir que o sistema permaneça modular, coeso, com baixo acoplamento e altamente testável, evitando complexidade prematura ou vazamento de abstrações.

## 2. Quando Utilizar Esta Skill
- Ao criar ou refatorar pacotes e módulos do backend ou frontend.
- Ao definir a fronteira entre regras de domínio puras e serviços de infraestrutura/framework.
- Ao avaliar a introdução de novos padrões de projeto (Patterns).
- Ao analisar se uma funcionalidade exige um novo ADR em [ARCHITECTURE_DECISION_RECORDS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md).

## 3. Diretrizes de Camadas (Clean Architecture)
```
[Presentation] ──> [Application (Use Cases)] ──> [Domain (Core Puro)]
                                                       ▲
[Infrastructure (JPA, AI, Parsers)] ──────────────────┘ (Inversão de Dependência)
```
- **Domain (`core/domain`):** Entidades, Objetos de Valor e Serviços de Domínio. Nenhuma referência a Spring Web, JPA ou provedores de IA.
- **Application (`core/application`):** Orquestração de casos de uso e controle de transações.
- **Presentation (`entrypoints/web`):** Controllers REST, DTOs e validação sintática.
- **Infrastructure (`infrastructure`):** Implementação concreta de persistência, clientes HTTP e parsers de arquivos.

## 4. Regras Obrigatórias
- **Monólito Modular:** Proibida a introdução de microsserviços ou filas distribuídas sem justificativa quantitativa documentada.
- **Sem Vazamento de Detalhes:** Repositórios retornam entidades ou projeções de domínio; controllers nunca acessam o banco diretamente sem passar por caso de uso.
- **KISS e YAGNI:** Proibido criar interfaces artificiais que possuam apenas uma implementação simples e sem intenção de substituição ou mock.

## 5. Critérios de Validação
- O pacote `domain` compila sem nenhuma dependência de infraestrutura ou frameworks externos.
- As dependências entre módulos respeitam a direção de dentro para fora.
- As decisões não-triviais possuem ADR correspondente aprovado.

## 6. Referências
- [Especificação Arquitetural](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE.md)
- [Registro de Decisões Arquiteturais](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
