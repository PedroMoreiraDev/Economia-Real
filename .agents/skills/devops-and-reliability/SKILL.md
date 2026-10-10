---
name: devops-and-reliability
description: >-
  Orienta a infraestrutura local com Docker, Docker Compose, pipelines de build,
  observabilidade, logs estruturados e monitoramento com Spring Boot Actuator.
  Use ao configurar ambientes, docker-compose, CI/CD, logs ou verificações de saúde.
---

# Skill: DevOps & Reliability Engineering

Esta skill estabelece as práticas de containerização, automação de build, observabilidade e confiabilidade da infraestrutura do projeto.

## 1. Objetivo
Garantir que a aplicação seja fácil de executar localmente com um único comando, possua builds reprodutíveis, emita métricas operacionais claras e mantenha alta disponibilidade.

## 2. Quando Utilizar Esta Skill
- Ao criar ou atualizar o arquivo `docker-compose.yml` para infraestrutura local.
- Ao configurar endpoints de saúde (`/actuator/health`) e métricas com Spring Boot Actuator.
- Ao estruturar logs em formato JSON padronizado com identificadores de correlação (`Correlation ID`).
- Ao planejar pipelines de CI (integração contínua) e verificação estática.

## 3. Padrão de Infraestrutura Local
- **Docker Compose:**
  - Manter serviços essenciais organizados com healthchecks configurados:
  ```yaml
  version: '3.8'
  services:
    postgres:
      image: postgres:16-alpine
      container_name: finance_postgres
      environment:
        POSTGRES_DB: finance_db
        POSTGRES_USER: finance_user
        POSTGRES_PASSWORD: finance_password
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U finance_user -d finance_db"]
        interval: 5s
        timeout: 5s
        retries: 5
  volumes:
    postgres_data:
  ```

## 4. Observabilidade e Logs Estruturados
- **Formato:** Logs em console ou arquivo formatados em JSON para fácil ingestão.
- **Rastreabilidade:** O cabeçalho `X-Correlation-ID` recebido nas requisições deve ser injetado no MDC (Mapped Diagnostic Context) do SLF4J e propagado em todas as mensagens de log da requisição.
- **Health Checks:** Expor `/actuator/health` com verificações detalhadas do banco PostgreSQL e status da aplicação.

## 5. Regras Obrigatórias
- Não comitar dados de volume local ou dumps de banco no Git.
- Garantir que a aplicação suba em portas que não conflitem com serviços padrão do host sem parametrização.

## 6. Referências
- [Visão Geral do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/README.md)
- [Estratégia de Testes](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/quality/TEST_STRATEGY.md)
