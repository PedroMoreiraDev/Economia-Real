---
name: database-and-migrations
description: >-
  Orienta a modelagem de dados relacional, índices, restrições e migrações versionadas
  com PostgreSQL 16+ e Flyway. Use ao criar ou alterar tabelas, colunas, índices e scripts SQL.
---

# Skill: Database & Migrations

Esta skill estabelece os procedimentos para modelagem relacional segura, garantia de integridade referencial e gestão de migrações determinísticas com Flyway no PostgreSQL.

## 1. Objetivo
Garantir integridade estrutural, desempenho nas consultas mais frequentes e total rastreabilidade de mudanças de banco de dados sem risco de perda de dados ou inconsistência.

## 2. Quando Utilizar Esta Skill
- Ao criar ou alterar tabelas, colunas, chaves estrangeiras ou índices no banco de dados.
- Ao escrever scripts de migração Flyway em `src/main/resources/db/migration/`.
- Ao otimizar consultas lentas ou planejar índices parciais.
- Ao modelar estratégias de deduplicação e constraints de unicidade.

## 3. Padrão de Nomenclatura e Versionamento do Flyway
- Formato obrigatório: `V<versao>__<descricao_em_snake_case>.sql`
- Exemplo: `V1__init_schema.sql`, `V2__add_index_to_transactions.sql`
- **Regras Estritas:**
  - Uma vez executada em qualquer ambiente, uma migração Flyway é **imutável**. Proibido editar arquivos de migrações passadas já aplicadas.
  - Toda nova alteração requer um novo script versionado incremental.

## 4. Diretrizes de Modelagem Relacional
- **Chaves Primárias:** Sempre utilize `UUID PRIMARY KEY` com `DEFAULT gen_random_uuid()` no PostgreSQL.
- **Moeda e Números Exatos:** Utilize estritamente `NUMERIC(15, 2)`. Proibido `FLOAT` ou `DOUBLE`.
- **Integridade Referencial:**
  - Defina sempre `ON DELETE RESTRICT` para entidades críticas que possuem movimentações (ex.: deletar uma conta bancária com transações existentes deve ser bloqueado).
  - Use `ON DELETE CASCADE` para relações de composição estrita subordinadas ao usuário (`user_id`).
- **Índices de Alta Frequência:**
  - Crie índices compostos para ordenação e filtros comuns: `CREATE INDEX idx_trans_user_date ON transactions(user_id, accrual_date DESC);`.
  - Use índices parciais para deduplicação: `CREATE UNIQUE INDEX idx_trans_external_id ON transactions(user_id, account_id, external_id) WHERE external_id IS NOT NULL;`.

## 5. Critérios de Validação
- O script Flyway executa sem erros em banco limpo no PostgreSQL via Testcontainers ou Docker.
- Não existem alterações manuais no banco que divirjam dos arquivos de migração.

## 6. Referências
- [Modelo de Dados Conceitual e Relacional](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/DATA_MODEL.md)
- [ADR-003: PostgreSQL com Flyway](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
