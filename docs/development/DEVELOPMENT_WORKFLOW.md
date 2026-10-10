# Fluxo Permanente de Trabalho (DEVELOPMENT_WORKFLOW.md)

Este documento estabelece o protocolo de engenharia obrigatório para todas as tarefas de desenvolvimento realizadas por agentes de inteligência artificial ou desenvolvedores humanos neste repositório.

---

## 1. Visão Geral do Ciclo de Engenharia

O processo é composto por 7 etapas sequenciais e não negociáveis. Tarefas de maior risco exigem planejamento e revisão mais detalhados; tarefas de baixo risco mantêm o processo conciso, mas sem suprimir etapas essenciais.

```
[1. Análise] ➔ [2. Planejamento] ➔ [3. Implementação] ➔ [4. Validação] ➔ [5. Revisão] ➔ [6. Documentação] ➔ [7. Relatório]
```

---

## 2. Detalhamento das Etapas

### Etapa 1 — Análise e Entendimento
- **Objetivo:** Compreender profundamente o problema antes de tocar em qualquer código.
- **Ações:**
  1. Identificar o objetivo de negócio e os requisitos funcionais e não-funcionais envolvidos.
  2. Consultar o mapa de skills no `AGENTS.md` e ler os arquivos `SKILL.md` aplicáveis.
  3. Inspecionar o código existente e a modelagem relacional (`DATA_MODEL.md`).
  4. Identificar impactos colaterais em segurança, concorrência, integridade financeira e APIs.

### Etapa 2 — Planejamento Técnico
- **Objetivo:** Projetar a solução de forma segura antes de implementá-la.
- **Ações:**
  1. Decompor a tarefa em passos atômicos e progressivos.
  2. Identificar exatamente os arquivos a serem criados ou modificados.
  3. Definir os testes automatizados necessários e casos de borda a serem cobertos.
  4. Registrar dúvidas ou ambiguidades antes de assumir premissas arriscadas.

### Etapa 3 — Implementação Focada
- **Objetivo:** Escrever a menor solução completa que resolva o problema com excelência técnica.
- **Ações:**
  1. Aplicar Clean Architecture, SOLID e convenções tipadas de Java e TypeScript.
  2. Evitar alterações em arquivos não relacionados à tarefa (evitar "escopo rastejante").
  3. Proibido introduzir bibliotecas externas ou frameworks sem justificativa e registro prévio.
  4. Manter o código limpo, sem trechos comentados ou dependências mortas.

### Etapa 4 — Validação e Execução Factual
- **Objetivo:** Comprovar empiricamente que a implementação funciona e não quebrou nada.
- **Ações:**
  1. Executar os testes automatizados no backend (`mvn test`) e frontend (`npm test`).
  2. Executar o build do projeto para verificar tipagem e compilação.
  3. Coletar e analisar os logs de execução.
  4. **Regra de Ouro:** Nunca afirme que um teste passou sem tê-lo executado de fato.

### Etapa 5 — Revisão Independente de Engenharia
- **Objetivo:** Avaliar a própria implementação com olhar crítico de um revisor independente.
- **Ações:**
  1. Verificar vulnerabilidades de segurança (IDOR, SQLi, injeção de prompt).
  2. Auditar integridade financeira (`BigDecimal`, ausência de dupla contagem de faturas).
  3. Avaliar se a complexidade introduzida foi estritamente necessária (princípios KISS e YAGNI).
  4. Garantir aderência às convenções de código e ausência de regressões funcionais.

### Etapa 6 — Documentação e Atualização de Estado
- **Objetivo:** Manter a documentação sincronizada com o estado real do código.
- **Ações:**
  1. Se houve decisão técnica relevante, registrar novo ADR em `ARCHITECTURE_DECISION_RECORDS.md`.
  2. Atualizar o arquivo `PROJECT_STATUS.md` com o que foi entregue, testes executados e pendências.
  3. Atualizar diagramas ou tabelas em `DATA_MODEL.md` ou `API_CONVENTIONS.md` caso o contrato tenha sido alterado.

### Etapa 7 — Relatório Executivo Final
- **Objetivo:** Comunicar de forma transparente o trabalho realizado ao usuário.
- **Ações:** Apresentar relatório estruturado contendo:
  - Resumo executivo da entrega.
  - Arquivos criados ou modificados.
  - Testes executados e evidências objetivas de sucesso.
  - Limitações conhecidas e premissas adotadas.
  - Próximo passo recomendado de acordo com o roadmap.

---

## 3. Diretrizes de Preservação e Autonomia

- **Segurança de Dados:** Não realize resets no Git, exclusão de arquivos ou operações que possam descartar histórico ou código sem confirmação explícita.
- **Resolução de Bloqueios:** Se uma dependência estiver ausente no host ou um comando falhar inesperadamente, investigue a causa raiz, registre o diagnóstico no relatório e apresente a alternativa recomendada.
