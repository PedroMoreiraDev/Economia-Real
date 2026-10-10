# Instruções Globais para Agentes de IA (AGENTS.md)

Este documento estabelece as diretrizes permanentes, regras operacionais e convenções arquiteturais obrigatórias para qualquer agente de inteligência artificial ou desenvolvedor atuando neste repositório.

---

## 1. Princípios Operacionais Fundamentais

1. **Aja como Líder Técnico e Engenheiro Responsável:** Não seja um executor cego de comandos. Analise requisitos explícitos e implícitos, avalie riscos, formule planos pequenos e consistentes, garanta testabilidade e preserve a integridade da arquitetura.
2. **Proibição de Código Improvisado ou Simulado Sem Alerta:** Jamais declare que algo funciona sem evidências verificáveis de execução (testes, logs, build). Nunca deixe mocks temporários em produção sem declarar explicitamente a limitação.
3. **Respeito aos Limites de Autonomia:**
   - **Autorizado:** Criação de documentação, skills, testes, código incremental, execução de builds e testes locais não destrutivos.
   - **Não Autorizado Sem Confirmação Explícita:** Comandos destrutivos (`git reset --hard`, `rm -rf`, exclusão de branches), `git push`, commits desnecessários, deploys externos, contratação de serviços pagos ou exposição de segredos.
4. **Comunicação Rigorosa:** Sempre distinga fatos verificados, decisões aprovadas, propostas técnicas, hipóteses e pendências. O idioma padrão para documentação, explicações e relatórios é **Português Brasil**.

---

## 2. Mapa de Consulta e Ativação de Skills

Antes de iniciar qualquer tarefa, consulte as skills especializadas do projeto localizadas em `.agents/skills/<skill-name>/SKILL.md`:

| Tipo de Tarefa | Skills Obrigatórias a Consultar |
| :--- | :--- |
| **Planejamento de Fase / Decomposição / Alinhamento de Riscos** | `tech-lead`, `product-requirements`, `software-architecture` |
| **Decisão Arquitetural / Limites de Módulos / Padrões Estruturais** | `software-architecture`, `tech-lead`, `code-review` |
| **Regras Financeiras (Cálculos, Parcelas, Faturas, Conciliação)** | `financial-domain`, `java-spring-backend`, `testing-and-quality` |
| **Backend Java / Spring Boot / APIs / JPA** | `java-spring-backend`, `financial-domain`, `security-and-privacy` |
| **Modelagem de Dados / Migrações PostgreSQL / Índices** | `database-and-migrations`, `financial-domain`, `testing-and-quality` |
| **Frontend React / TypeScript / UX / Acessibilidade / Gráficos** | `frontend-engineering`, `frontend-design`, `product-requirements` |
| **Design Visual / Identidade Estética / Tipografia / Paletas** | `frontend-design`, `frontend-engineering` |
| **Integração com IA / Transcrição / Extração Estruturada** | `ai-integration`, `security-and-privacy`, `testing-and-quality` |
| **Segurança / Autenticação / LGPD / Uploads / Isolamento** | `security-and-privacy`, `software-architecture` |
| **Criação de Testes / Estratégia de Qualidade / QA** | `testing-and-quality`, `code-review` |
| **Infraestrutura / Docker / CI / Observabilidade** | `devops-and-reliability`, `software-architecture` |
| **Atualização de Documentação / ADRs / Status** | `documentation-and-decisions`, `tech-lead` |
| **Revisão Independente Prévia à Conclusão da Tarefa** | `code-review`, `testing-and-quality` |
| **Descoberta de Novas Capacidades / Extensões de Agente** | `find-skills` |

---

## 3. Fluxo Permanente de Trabalho (Ciclo de 8 Etapas)

Toda tarefa neste repositório deve seguir rigorosamente o ciclo de desenvolvimento:

1. **Etapa A — Entendimento:** Compreender o objetivo real de negócio, os requisitos funcionais/não-funcionais e critérios de aceitação.
2. **Etapa B — Inspeção:** Inspecionar o código existente, schemas de banco e consultar as skills do projeto aplicáveis.
3. **Etapa C — Planejamento Técnico:** Decompor a tarefa em passos atômicos, mapear riscos de integridade e definir a estratégia de testes correspondente.
4. **Etapa D — Implementação:** Desenvolver a menor solução completa e robusta aderente aos princípios de Clean Architecture e DDD pragmático.
5. **Etapa E — Validação:** Executar os testes automatizados, build local e linters. Reportar os resultados factuais.
6. **Etapa F — Revisão Independente:** Analisar o código implementado sob a perspectiva de um revisor crítico (segurança, complexidade, performance, integridade monetária e ausência de regressões).
7. **Etapa G — Documentação:** Atualizar ADRs, status do projeto (`docs/development/PROJECT_STATUS.md`) e documentação afetada.
8. **Etapa H — Relatório:** Apresentar relatório executivo com o que foi feito, testes executados, limitações identificadas e o próximo passo recomendado.

---

## 4. Invariantes Arquiteturais e Regras Financeiras

- **Precisão Monetária Absoluta:** Jamais utilize `float` ou `double` para valores financeiros. Utilize `BigDecimal` com escala definida e modo de arredondamento explícito (`RoundingMode.HALF_EVEN` / Banker's Rounding) documentado no domínio.
- **Cálculos Determinísticos no Backend:** A Inteligência Artificial nunca realiza cálculos de saldos, projeções ou fechamentos de fatura. A IA apenas interpreta, classifica ou transcreve texto/áudio.
- **Prevenção de Dupla Contagem:** O pagamento de uma fatura de cartão de crédito não é uma despesa primária, mas uma liquidação de passivo financeiro decorrente das compras parceladas já registradas.
- **Isolamento de Usuários:** Todas as consultas, inserções e filtros devem garantir que os dados sejam estritamente isolados pelo identificador do usuário autenticado no backend.
- **Fonte Única de Verdade:** Gráficos, relatórios e tabelas refletem a mesma fonte canônica de transações. Totais agregados cacheados devem possuir estratégia clara de invalidação.

---

## 5. Referências à Documentação Permanente

- [Visão Geral do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/README.md)
- [Requisitos de Produto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/PRODUCT_REQUIREMENTS.md)
- [Glossário de Domínio Financeiro](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/DOMAIN_GLOSSARY.md)
- [Arquitetura de Software](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE.md)
- [Registro de Decisões Arquiteturais (ADRs)](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
- [Modelo de Dados Conceitual](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/DATA_MODEL.md)
- [Convenções de API REST](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/API_CONVENTIONS.md)
- [Segurança e Privacidade](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/security/SECURITY_AND_PRIVACY.md)
- [Estratégia de Testes](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/quality/TEST_STRATEGY.md)
- [Fluxo de Desenvolvimento Permanente](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/DEVELOPMENT_WORKFLOW.md)
- [Roadmap de Implementação](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/IMPLEMENTATION_ROADMAP.md)
- [Status Atual do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md)
