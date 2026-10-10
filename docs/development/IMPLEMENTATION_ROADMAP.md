# Roadmap de Implementação Incremental (IMPLEMENTATION_ROADMAP.md)

Este documento estrutura a evolução do produto em fases atômicas, sequenciais e verificáveis, definindo objetivos, dependências, entregáveis e critérios de conclusão para cada etapa.

---

## Matriz Geral de Fases

```
[Fase 0: Fundação de Engenharia] (Concluída nesta sessão)
       │
       ▼
[Fase 1: Esqueleto Executável & Infra Local] (Docker, Spring Boot base, React/Vite base)
       │
       ▼
[Fase 2: Identidade & Isolamento de Usuários] (Auth JWT, BCrypt, Security Filters)
       │
       ▼
[Fase 3: Núcleo Financeiro] (Contas, Categorias, Lançamentos, Saldo em BigDecimal)
       │
       ▼
[Fase 4: Recorrências, Parcelas & Cartões] (Faturas, Divisão de parcelas sem dupla contagem)
       │
       ▼
[Fase 5: Importação de Extratos] (Parsers OFX/CSV, Preview, Deduplicação)
       │
       ▼
[Fase 6: Dashboard, Gráficos & Orçamentos] (Limites mensais, Burn rate semanal, KPIs)
       │
       ▼
[Fase 7: Inteligência Artificial Financeira] (Insights em linguagem natural, categorização)
       │
       ▼
[Fase 8: Registro de Despesas por Áudio] (Captura, transcrição, proposta tipada)
       │
       ▼
[Fase 9: Robustez, Observabilidade & Evolução] (APM, CI/CD, Acessibilidade avançada)
```

---

## Detalhamento das Fases

### Fase 0 — Fundação de Engenharia e Documentação (Status: EM ANDAMENTO)
- **Objetivo:** Estabelecer a governança técnica, documentação abrangente, skills do Antigravity e regras de qualidade do repositório.
- **Dependências:** Nenhuma.
- **Entregáveis:**
  - `README.md` e `AGENTS.md`.
  - Pasta `docs/` estruturada (Requisitos, Glossário, Arquitetura, ADRs, Modelo de Dados, APIs, Segurança, Testes, Workflow, Roadmap, Status).
  - 13 skills especializadas em `.agents/skills/`.
  - Validação de ferramentas no ambiente host.
- **Critério de Conclusão:** Repositório organizado, skills validadas e nenhuma linha de código de negócio implementada prematuramente.

---

### Fase 1 — Esqueleto Executável, Banco Local e Integração Contínua
- **Objetivo:** Subir a estrutura inicial executável de ponta a ponta sem lógica de negócio.
- **Dependências:** Fase 0 concluída.
- **Entregáveis:**
  - `docker-compose.yml` provisionando PostgreSQL 16 local.
  - Projeto Spring Boot 3.3.x inicial com Java 21, Maven, Flyway e Spring Web (`/api/v1/health` retornando 200).
  - Projeto frontend React 18+ com Vite, TypeScript estrito e Tailwind CSS integrado.
  - Script Flyway `V1__init_schema.sql` com tabelas fundamentais.
- **Critério de Conclusão:** Backend compila e passa nos testes (`mvn test`); frontend inicializa localmente (`npm run dev`); container do banco sobe saudavelmente via Docker.

---

### Fase 2 — Identidade, Autenticação e Isolamento de Usuários
- **Objetivo:** Garantir que todo acesso ao sistema seja autenticado e estritamente isolado por usuário.
- **Dependências:** Fase 1 concluída.
- **Entregáveis:**
  - Endpoints de registro e login com hash BCrypt (`/api/v1/auth/register`, `/api/v1/auth/login`).
  - Emissão e validação de tokens JWT no Spring Security.
  - Interceptor de isolamento de dados no backend (injeção automática do `user_id` autenticado).
  - Telas de Login e Cadastro no frontend com validação de formulários via Zod.
- **Critério de Conclusão:** Testes de segurança comprovando que o Usuário A não consegue acessar recursos do Usuário B (status 403/404).

---

### Fase 3 — Núcleo Financeiro: Contas, Categorias e Transações
- **Objetivo:** Permitir a gestão manual completa de contas, categorias e transações simples.
- **Dependências:** Fase 2 concluída.
- **Entregáveis:**
  - CRUD de contas bancárias (corrente, poupança, dinheiro).
  - CRUD de categorias com suporte a árvore pai/filho e cores visuais.
  - Lançamento de receitas e despesas com valor monetário determinístico (`BigDecimal`).
  - Tabela reativa e editável no frontend com filtros por data, conta e categoria.
- **Critério de Conclusão:** Testes unitários de saldo garantem precisão centésimo a centésimo sem perda de precisão.

---

### Fase 4 — Recorrências, Parcelamentos e Faturas de Cartão
- **Objetivo:** Gerenciar o ciclo de vida de cartões de crédito e despesas fixas futuras sem distorções no fluxo de caixa.
- **Dependências:** Fase 3 concluída.
- **Entregáveis:**
  - Cadastro de cartões de crédito com dias de fechamento e vencimento.
  - Mecanismo de divisão de compras parceladas com ajuste do centavo residual na primeira parcela.
  - Fechamento de fatura e registro do pagamento como liquidação de passivo (prevenção comprovada de dupla contagem).
  - Gestão de despesas fixas recorrentes.
- **Critério de Conclusão:** Testes automatizados validam que compras parceladas projetam valores futuros sem inflar o gasto realizado atual.

---

### Fase 5 — Importação e Deduplicação de Extratos Bancários
- **Objetivo:** Automatizar a entrada de dados via arquivos CSV e OFX com preview e segurança.
- **Dependências:** Fase 4 concluída.
- **Entregáveis:**
  - Parsers seguros para OFX bancário e CSV estruturado.
  - Endpoint de pré-visualização de extrato com detecção de transações duplicadas.
  - Interface no frontend para conferência prévia e seleção seletiva antes da importação definitiva.
- **Critério de Conclusão:** Nenhuma transação duplicada é persistida silenciosamente.

---

### Fase 6 — Dashboard Analítico, Gráficos e Orçamentos
- **Objetivo:** Consolidar métricas financeiras visuais em tempo real para tomada de decisão.
- **Dependências:** Fase 5 concluída.
- **Entregáveis:**
  - Indicadores principais: Receitas totais, despesas totais, saldo consolidado e comprometimento futuro.
  - Gráficos de evolução temporal e distribuição percentual por categoria.
  - Módulo de orçamento com tetos mensais e barra de ritmo semanal (burn rate).
  - Alertas visuais na interface ao atingir 80% e 100% dos limites configurados.
- **Critério de Conclusão:** Gráficos e tabela de transações 100% sincronizados a partir da mesma fonte canônica de dados.

---

### Fase 7 — Inteligência Artificial Financeira e Categorização Assistida
- **Objetivo:** Fornecer interpretações contextuais inteligentes e sugestões de corte de gastos com governança de dados.
- **Dependências:** Fase 6 concluída.
- **Entregáveis:**
  - Porta de integração com LLM na camada de infraestrutura com limites de timeout e custo.
  - Módulo de categorização assistida para transações não classificadas.
  - Assistente de insights em linguagem natural baseado em dados estatísticos pré-computados pelo backend.
- **Critério de Conclusão:** O modelo LLM nunca realiza cálculos de soma/saldo diretamente; toda resposta obedece a JSON Schemas validados.

---

### Fase 8 — Registro Rápido de Despesas por Áudio e Texto Natural
- **Objetivo:** Reduzir atrito diário de lançamento permitindo entrada por voz ou frases soltas.
- **Dependências:** Fase 7 concluída.
- **Entregáveis:**
  - Gravação de áudio no frontend via Web Audio API.
  - Serviço backend de transcrição segura e extração de entidades (valor, data, categoria, meio de pagamento).
  - Modal de revisão estruturada exigindo confirmação explícita do usuário antes da persistência.
- **Critério de Conclusão:** Testes com frases coloquiais demonstram extração estruturada sem alucinação de dados ausentes.

---

### Fase 9 — Robustez, Observabilidade, Acessibilidade e Evolução
- **Objetivo:** Elevar o produto aos mais altos padrões de confiabilidade corporativa e conformidade legal.
- **Dependências:** Fase 8 concluída.
- **Entregáveis:**
  - Métricas de saúde com Spring Boot Actuator e Prometheus.
  - Auditoria completa de acessibilidade WCAG 2.1 AA na interface frontend.
  - Ferramenta de exportação e exclusão total de dados do usuário (LGPD).
  - Pipeline de CI/CD automatizado no GitHub Actions / GitLab CI.
- **Critério de Conclusão:** Aplicação pronta para operação contínua com monitoramento ativo e tolerância a falhas.
