---
name: tech-lead
description: >-
  Orienta a liderança técnica do projeto, decomposição de tarefas complexas,
  controle de riscos, alinhamento com o roadmap e garantia de integridade sistêmica.
  Use ao planejar novas entregas, decompor épicos ou avaliar consistência global.
---

# Skill: Tech Lead

Esta skill define as responsabilidades e procedimentos operacionais do Tech Lead para guiar o desenvolvimento do produto de gestão financeira pessoal com inteligência artificial.

## 1. Objetivo
Garantir que todas as entregas do projeto sejam sustentáveis, pequenas, testáveis, alinhadas aos requisitos de produto e livres de complexidade acidental, mantendo a visão global da arquitetura.

## 2. Quando Utilizar Esta Skill
- Ao iniciar uma nova fase ou funcionalidade relevante do [Roadmap de Implementação](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/IMPLEMENTATION_ROADMAP.md).
- Ao decompor tarefas complexas em entregas incrementais.
- Ao identificar divergências arquiteturais entre diferentes módulos do sistema.
- Ao priorizar débitos técnicos e gerenciar riscos de engenharia.

## 3. Procedimento Recomendado de Liderança Técnica
1. **Compreensão do Objetivo Maior:** Identificar o impacto da tarefa no produto como um todo antes de aprovar qualquer linha de código.
2. **Decomposição em Fatias Verticais Finas:** Dividir a funcionalidade em passos menores (ex.: contrato -> migração de banco -> domínio -> caso de uso -> controller -> tela).
3. **Mapeamento de Dependências e Riscos:** Avaliar se a mudança introduz dependência de outros módulos, risco de quebra de contrato de API ou impacto financeiro.
4. **Definição de Critérios de Aceitação Claros:** Estabelecer o que caracteriza a conclusão da tarefa antes de iniciar a implementação.
5. **Revisão Pós-Implementação:** Verificar se a entrega gerou código duplicado, violações arquiteturais ou necessidade de atualizar documentação.

## 4. Regras Obrigatórias
- **Proibição de Entregas Gigantescas:** Nenhuma tarefa deve implementar múltiplos módulos não correlacionados de uma só vez.
- **Evidência sobre Suposição:** Nunca considerar uma tarefa pronta sem testes automatizados executados e verificáveis.
- **Documentação Sincronizada:** Toda decisão que altere fluxo ou arquitetura deve resultar na atualização imediata de [PROJECT_STATUS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md) e [ARCHITECTURE_DECISION_RECORDS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md).

## 5. Critérios de Validação
- A entrega resolve o problema proposto sem introduzir débito técnico não documentado.
- Os testes unitários e de integração cobrem os cenários de sucesso e erro.
- O [Status do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md) foi atualizado com precisão.

## 6. Referências
- [Visão Geral da Arquitetura](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE.md)
- [Roadmap de Implementação](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/IMPLEMENTATION_ROADMAP.md)
- [Fluxo Permanente de Trabalho](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/DEVELOPMENT_WORKFLOW.md)
