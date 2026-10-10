---
name: documentation-and-decisions
description: >-
  Orienta a manutenção contínua da documentação permanente, registro de ADRs,
  atualização de status do projeto e sincronização entre código e contratos.
  Use ao concluir tarefas, alterar decisões arquiteturais ou atualizar status.
---

# Skill: Documentation & Architecture Decisions

Esta skill orienta a criação e manutenção da documentação permanente do projeto, garantindo que o conhecimento de engenharia permaneça vivo, auditável e sincronizado com o código.

## 1. Objetivo
Evitar a deterioração da documentação, garantindo que qualquer desenvolvedor ou agente de IA possa assumir o projeto em sessões futuras com total clareza do contexto, decisões aprovadas e limitações.

## 2. Quando Utilizar Esta Skill
- Ao tomar uma decisão arquitetural relevante que mereça registro em [ARCHITECTURE_DECISION_RECORDS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md).
- Ao alterar tabelas, colunas ou relacionamentos para sincronizar [DATA_MODEL.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/DATA_MODEL.md).
- Ao adicionar ou alterar rotas REST para manter [API_CONVENTIONS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/API_CONVENTIONS.md).
- Ao finalizar qualquer entrega ou tarefa para atualizar [PROJECT_STATUS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md).

## 3. Estrutura de um Architecture Decision Record (ADR)
Sempre que uma nova decisão relevante for tomada, registre-a com:
- **Título e Status:** (ex.: ADR-008: Provedor Whisper Local vs. Cloud - Status: Aprovado).
- **Contexto:** Por que esta decisão precisou ser tomada agora?
- **Alternativas Consideradas:** Quais opções foram avaliadas?
- **Decisão:** Qual opção foi escolhida e por quê?
- **Consequências:** Quais são os impactos positivos e os trade-offs/custos aceitos?
- **Critério de Reavaliação:** Sob quais condições esta decisão deve ser revista?

## 4. Regras Obrigatórias
- **Distinção Clara:** Sempre diferencie decisões confirmadas, propostas técnicas e hipóteses em aberto.
- **Proibição de Documentos Fantasma:** Não crie arquivos de documentação redundantes fora da estrutura canônica de `docs/`.
- **Sincronização em Tempo Real:** Uma tarefa não é considerada concluída se o código divergir da documentação.

## 5. Referências
- [Registro de Decisões Arquiteturais](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
- [Status do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md)
