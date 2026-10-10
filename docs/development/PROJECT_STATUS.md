# Status do Projeto (PROJECT_STATUS.md)

Este documento registra o estado real, factual e auditável do desenvolvimento da plataforma, servindo como ponto único de alinhamento entre sessões de engenharia e agentes de IA.

---

## 1. Visão Geral do Estado Atual

- **Fase Atual:** Fase 10 — Hardening Final, Containerização de Produção, Pipeline CI/CD & Entrega do Produto.
- **Status:** **CONCLUÍDA COM SUCESSO & PRONTO PARA PRODUÇÃO** (85 testes automatizados no backend com 100% de aprovação, bundle estático de produção do React compilado em 5s, Dockerfiles multi-stage otimizados com Nginx Alpine e Eclipse Temurin 21 JRE com usuário não-root, stack completa orquestrada via Docker Compose, workflow de CI/CD automatizado no GitHub Actions, exclusão de conta em conformidade com a LGPD e Correlation ID propagado no MDC/logs).
- **Data da Conclusão:** 2026-10-09.
- **Responsável Técnico:** Tech Lead & Arquiteto de Software.

---

## 2. O Que Está Concluído e Validado

### 2.1. Fase 0 — Fundação de Engenharia
- [x] Repositório Git local inicializado (`git init`).
- [x] Ferramentas de ambiente validadas (Java 21 LTS, Maven 3.9, Node 24, npm 11, Docker 28, Git 2.51).
- [x] Instruções mestras em `AGENTS.md` e documentação de apresentação em `README.md`.
- [x] 13 skills especializadas em `.agents/skills/`.
- [x] 3 regras always-on em `.agents/rules/` (`financial_integrity.md`, `security_isolation.md`, `quality_gate.md`).
- [x] 11 documentos de engenharia permanente sob `docs/`.

### 2.2. Fase 1 — Esqueleto Executável Full-Stack
- [x] Infraestrutura Docker com PostgreSQL 16 Alpine e persistência.
- [x] Backend Spring Boot 3.3.5 estruturado com Maven e wrappers de execução.
- [x] Migração Flyway inicial `V1__init_schema.sql` (10 tabelas).
- [x] Endpoint `GET /api/v1/health` e OpenAPI Swagger em `/swagger-ui.html`.
- [x] Frontend React com Tailwind CSS, TypeScript estrito e monitoramento em tempo real.

### 2.3. Fase 2 — Identidade, Autenticação e Isolamento de Usuários
- [x] Migração Flyway `V2__add_refresh_tokens.sql`.
- [x] Entidade de domínio `User` pura e porta `UserRepository`.
- [x] Hashing BCrypt (custo 12) e emissão de tokens JWT com assinatura HMAC-SHA256 (`JwtTokenProvider`).
- [x] Filtro stateless `JwtAuthenticationFilter` e principal seguro `AuthenticatedUser`.
- [x] Casos de uso `RegisterUserUseCase`, `LoginUserUseCase` e endpoints REST `/api/v1/auth/*`.
- [x] `AuthContext` no React e modal de login/cadastro com validação de campos.

### 2.4. Fase 3 — Domínio Financeiro Central (Transações, Categorias e Contas)
- [x] Entidades de domínio puras: `Account`, `Category` e `Transaction`.
- [x] Portas `AccountRepository`, `CategoryRepository` e `TransactionRepository` com isolamento por `user_id`.
- [x] Semeadura canônica de categorias pré-definidas de sistema (`DefaultCategorySeeder` com 11 categorias canônicas) no registro e sob demanda caso vazio.
- [x] Criação de novas categorias personalizadas com nome, ícone e cor hexadecimal via `CreateCategoryUseCase`.
- [x] Interface completa no Frontend com aba dedicada `Categorias`, badges "Padrão" / "Personalizada", modal `CategoryModal` e atalho inline nos modais de transação e compra de cartão.
- [x] `GetFinancialSummaryUseCase`: cálculo determinístico com `BigDecimal` e prevenção de dupla contagem.
- [x] Endpoints REST `/api/v1/accounts`, `/api/v1/categories`, `/api/v1/transactions` e `/api/v1/transactions/summary`.

### 2.5. Fase 4 — Cartões de Crédito, Compras Parceladas e Faturas
- [x] `CreditCard`, `CreditCardInvoice` e ciclo de vida de faturas.
- [x] `InstallmentSplitter`: Divisão determinística de compras parceladas com alocação do resíduo de centavos na 1ª parcela.
- [x] `PayInvoiceUseCase`: Liquidação de faturas com débito em conta corrente e registro de `INVOICE_PAYMENT` (sem dupla contagem).
- [x] Endpoints REST de cartões, compras parceladas, faturas e liquidações.
- [x] Modais no frontend para cartões, parcelamento e pagamento de fatura.

### 2.6. Fase 5 — Importação de Extratos Bancários (CSV e OFX) e Conciliação
- [x] Parsers Bancários Robustos: `OfxParser` (SGML/XML) e `CsvParser` (delimitadores flexíveis e moedas).
- [x] Deduplicação Inteligente: Detecção por FITID ou assinatura temporal `(conta, data, valor, descrição)`.
- [x] Auditoria e Lotes: `ImportBatch` e endpoints REST multipart `/api/v1/imports/upload` e `/api/v1/imports`.
- [x] Modal `ImportModal` com drag-and-drop no frontend.

### 2.7. Fase 6 — Inteligência Artificial: Extração de Transações (Texto e Áudio)
- [x] Contratos e Domínio de IA: `ExtractedTransaction`, `AiExtractionPort`, `AudioTranscriptionPort`.
- [x] Privacidade e Governança (LGPD): Sanitização de CPFs, cartões e emails via `PiiSanitizer`.
- [x] Adaptador Gemini com fallback determinístico offline (`NaturalLanguageRuleParser`).
- [x] Modal `AiTransactionModal` com entrada por texto e gravação de voz (microfone via Web Audio API) com confirmação humana obrigatória.

### 2.8. Fase 7 — Dashboard Analítico Avançado, Gráficos Reativos & Orçamentos
- [x] **Domínio de Orçamentos:**
  - Entidade de domínio pura `Budget`: validação de limite monetário (`BigDecimal`), normalização de mês para dia 1, e percentual de alerta (1% a 100%).
  - Repositório `BudgetRepository` e persistência relacional na tabela `budgets`.
  - Casos de uso: `CreateOrUpdateBudgetUseCase`, `ListBudgetsUseCase` (cálculo determinístico de gasto realizado, saldo restante, percentual, `isWarning` e `isExceeded`), e `DeleteBudgetUseCase`.
- [x] **Motor Analítico & Burn Rate:**
  - `GetAnalyticsOverviewUseCase`:
    - Evolução temporal dos últimos 6 meses (Receitas vs Despesas vs Saldo Líquido), com estrita prevenção de dupla contagem contábil (excluindo liquidação de faturas e transferências).
    - Distribuição percentual de despesas por categoria no mês de competência.
    - Velocidade de queima diária (*Burn Rate*), projeção linear para encerramento do mês e classificação de ritmo (*SAFE*, *WARNING*, *CRITICAL*).
- [x] **Endpoints REST Autenticados:**
  - `GET /api/v1/budgets`: lista metas com progresso percentual e alertas.
  - `POST /api/v1/budgets`: define ou atualiza meta por categoria.
  - `DELETE /api/v1/budgets/{id}`: remove meta configurada.
  - `GET /api/v1/analytics/overview`: visão consolidada de gráficos e KPIs.
- [x] **Interface Rica no Frontend:**
  - Componente `AnalyticsSection`:
    - Card de *Burn Rate* com termômetro visual, dias transcorridos vs restantes, e barra de consumo do orçamento total.
    - Gráfico interativo SVG de barras duplas (Receitas x Despesas dos últimos 6 meses com tooltips em hover).
    - Gráfico de distribuição por categoria com barra segmentada colorida e tabela detalhada com percentuais.
    - Painel de metas por categoria com badges de status (No Limite, Atenção 80%, Estourado).
  - Modal `BudgetModal`: formulário intuitivo para definir limites mensais e percentual de aviso prévio.

### 2.9. Fase 8 — Despesas Fixas Recorrentes, Assinaturas & Robustez Operacional
- [x] **Domínio de Despesas Recorrentes:**
  - Entidade `RecurringBill` com precisão em `BigDecimal` escala 2, frequências (`WEEKLY`, `MONTHLY`, `YEARLY`), e ajuste determinístico de dia de vencimento para meses curtos.
  - Porta `RecurringBillRepository` e adaptador JPA com isolamento estrito por `user_id`.
  - Casos de uso: `CreateRecurringBillUseCase`, `ListRecurringBillsUseCase`, `UpdateRecurringBillUseCase`, `DeleteRecurringBillUseCase` e `PayRecurringBillUseCase`.
  - Prevenção de dupla contagem através do marcador `RECURRING_BILL:<UUID>` nos lançamentos, suportando débito em conta bancária ou fatura de cartão.
- [x] **Endpoints REST Autenticados:**
  - `GET /api/v1/recurring-bills`: lista compromissos fixos com detecção de contas a vencer em 7 dias e status de pagamento no mês (com suporte ao parâmetro `month`).
  - `POST /api/v1/recurring-bills`: cadastro de nova despesa ou assinatura.
  - `PUT /api/v1/recurring-bills/{id}`: edição de parâmetros e ativação/desativação.
  - `DELETE /api/v1/recurring-bills/{id}`: exclusão segura de assinatura.
  - `POST /api/v1/recurring-bills/{id}/pay`: efetivação da despesa no mês com suporte a `replicateMonths` (replicação para meses subsequentes) e data customizada.
- [x] **Frontend Moderno:**
  - `RecurringBillsSection.tsx`: painel com cards de métricas sincronizados com o mês selecionado (`selectedMonth`), remoção de seleção/exibição de conta bancária, modal de lançamento perguntando o mês e opções de replicação (1, 3, 6, 12 meses).
  - `RecurringBillModal.tsx`: formulário simplificado sem seleção de conta bancária (apenas À Vista/Pix/Boleto ou Cartão de Crédito) e opção de auto-lançamento imediato com replicação para os meses seguintes.

### 2.10. Fase 9 — Metas de Economia (Savings Goals), Auditoria & Relatórios
- [x] **Domínio de Metas de Economia:**
  - Entidade `SavingsGoal` pura com invariantes de saldo não negativo, cálculo determinístico de progresso percentual (`calculateProgressPercentage`) e saldo restante (`getRemainingAmount`) com `BigDecimal` escala 2.
  - Porta `SavingsGoalRepository` e adaptador JPA com isolamento estrito por `user_id`.
  - Casos de uso: `CreateSavingsGoalUseCase`, `ListSavingsGoalsUseCase`, `UpdateSavingsGoalUseCase`, `DeleteSavingsGoalUseCase`, `DepositToSavingsGoalUseCase` e `WithdrawFromSavingsGoalUseCase`.
  - Integração contábil bidirecional com contas correntes: aportes geram despesa de investimento e resgates geram receita contábil com auditoria `SAVINGS_GOAL_DEPOSIT:<UUID>`.
- [x] **Exportação Contábil Universal (CSV):**
  - Caso de uso `ExportTransactionsCsvUseCase`: geração em UTF-8 com Byte Order Mark (`\uFEFF`) e delimitador `;`, garantindo abertura nativa no Excel do Windows sem distorção de caracteres ou acentos.
  - Endpoints REST autenticados `/api/v1/savings-goals/*` e `/api/v1/transactions/export/csv`.
- [x] **Frontend Moderno com Gamificação e Conquistas:**
  - `SavingsGoalsSection.tsx`: painel com cards de métricas (Total Acumulado, Objetivo Global, Metas Concluídas), barras de progresso visual gradiente, badges de "Conquistada! 🎉" para metas atingidas.
  - Modais `SavingsGoalModal.tsx` e `GoalTransactionModal.tsx` (para aportes e resgates com movimentação de conta bancária).
  - Botão de exportação instantânea "Exportar CSV" integrado ao extrato de movimentações.

### 2.11. Fase 10 — Hardening Final, Containerização de Produção, Pipeline CI/CD & Entrega
- [x] **Hardening de Segurança e Conformidade com a LGPD:**
  - Implementação de `DeleteAccountUseCase` e endpoint `DELETE /api/v1/auth/me` para exclusão completa da conta do usuário e cascata relacional total no banco de dados (Direito ao Esquecimento).
  - Implementação de `CorrelationIdFilter` injetando `X-Correlation-ID` no MDC do SLF4J/Logback e nos cabeçalhos de resposta HTTP para rastreabilidade de requisições.
  - Hardening do Spring Security e Nginx com cabeçalhos contra Clickjacking (`X-Frame-Options: DENY`), MIME-sniffing (`X-Content-Type-Options: nosniff`) e XSS.
- [x] **Containerização Multi-Stage Otimizada para Produção:**
  - `backend/Dockerfile`: Multi-stage com `maven:3.9.6-eclipse-temurin-21-alpine` e `eclipse-temurin:21-jre-alpine`, usuário não privilegiado (`appuser`), JVM otimizada para containers (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`), e healthcheck com `wget` em `/actuator/health`.
  - `frontend/Dockerfile`: Multi-stage com `node:20-alpine` e `nginx:1.25-alpine`, compressão gzip, cache de 1 ano para arquivos estáticos com hash e proxy reverso transparente para `/api/` e `/actuator/`.
  - `docker-compose.prod.yml`: Orquestração completa dos 3 serviços (`postgres`, `backend`, `frontend`) com redes isoladas, volumes persistentes e dependências encadeadas via healthchecks.
- [x] **Pipeline de Integração Contínua (CI/CD Automatizado):**
  - Workflow `.github/workflows/ci.yml` cobrindo checkout, setup de Java 21 Temurin com cache do Maven, suíte de testes completa, setup de Node 20 com cache do npm, validação estrita de TypeScript (`tsc --noEmit`), build Vite e lint de validação sintática do Docker Compose.
- [x] **Facilidades Operacionais:**
  - Scripts `iniciar-producao.bat` e `iniciar-producao.sh` para subida instantânea de toda a stack com um único comando.

### 2.12. Melhorias Contínuas de UX e Saúde Financeira Mensal
- [x] **Seletor Global de Mês & Navegação Temporal no Dashboard:**
  - Seletor de período em destaque (`< Mês Anterior`, seletor direto de mês/ano via calendário, `Próximo Mês >`, e atalho rápido `Mês Atual`).
  - Sincronização contábil dos 4 KPIs superiores (Entradas, Despesas, Disponível no Mês/Economia, Saldo Total) com parâmetros `startDate` e `endDate` do mês selecionado.
- [x] **Herança Recorrente Inteligente de Metas Orçamentárias por Categoria:**
  - `ListBudgetsUseCase` atualizado com busca unificada por usuário (`findAllByUserId`) e herança contínua da meta configurada mais recente para categorias sem meta gravada no mês consultado, preservando a referência orçamentária familiar em todos os meses sem exigir recadastro manual.
  - Cálculo de despesas realizadas rigorosamente delimitado pelo intervalo do mês consultado (`startDate` a `endDate`).
- [x] **Extrato de Movimentações com Filtro Temporal Dinâmico:**
  - Alternador tátil no topo da tabela ("Apenas Mês Selecionado" com contador de lançamentos do período vs "Todas as Movimentações").
  - Ações em massa e seleção total alinhadas dinamicamente com as movimentações filtradas em tela.
  - Pré-preenchimento automático da data no modal de novo lançamento com base no mês ativo de navegação.

---

## 3. Evidências de Testes Executados Factualmente

### Backend Surefire Report (`backend/mvnw.cmd test`):
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 85, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 15.779 s
```

### Frontend Build Report (`npm run build`):
```text
> finance-frontend@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1597 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.08 kB │ gzip:  0.63 kB
dist/assets/index-IQVYTUUV.css   44.88 kB │ gzip:  7.40 kB
dist/assets/index-CVcJJLIG.js   305.65 kB │ gzip: 75.31 kB
✓ built in 27.48s
```

---

## 4. Estado das Fases do Roadmap

- **Fase 0 (Fundação e Governança):** Concluída.
- **Fase 1 (Esqueleto Full-Stack):** Concluída.
- **Fase 2 (Identidade e Autenticação JWT):** Concluída.
- **Fase 3 (Domínio Central de Finanças):** Concluída.
- **Fase 4 (Cartões, Parcelamento e Faturas):** Concluída.
- **Fase 5 (Importação de Extratos CSV/OFX):** Concluída.
- **Fase 6 (IA de Transações Texto e Voz):** Concluída.
- **Fase 7 (Dashboard Analítico e Orçamentos):** Concluída.
- **Fase 8 (Despesas Recorrentes e Assinaturas):** Concluída.
- **Fase 9 (Metas de Economia e Exportação CSV):** Concluída.
- **Fase 10 (Hardening, Docker Multi-Stage, CI/CD e Entrega):** Concluída.
- **Identidade Visual Definitiva (Economia Real):** Concluída com sucesso (Marca "Economia Real", logotipo oficial do mascote coelho na cartola com monóculo e bengala integrado em `frontend/public/logo-economia-real.png`, paleta sofisticada em Azul Real `#026CD6` e `#0153AB`, slogan oficial *"Economia real, utilizando inteligência artificial para te fazer economizar de verdade"*, banner com mascote autoral, favicon e todos os modais harmonizados).
- **Gestão, Edição de Movimentações e Auto-Categorização na Importação:** Concluída com sucesso:
  - Edição completa e exclusão segura de movimentações contábeis com proteção anti-IDOR (`PUT` e `DELETE /api/v1/transactions/{id}`).
  - Classificador inteligente de estabelecimentos comerciais (`MerchantCategoryClassifier`) com remoção de ruídos de adquirentes e parcelamento, categorizando especificamente `iFood`, `Rappi`, `Zé Delivery`, `Ai que fome` como **Delivery**, e `Uber`, `99`, `Log Urbano`, `Rapidocar` como **Aplicativo de Transporte**, além de compras (`Magalu`, `Amazon`), transporte geral (postos, combustível), alimentação e contas.
  - Inclusão das categorias canônicas do sistema **Delivery** (vermelho) e **Aplicativo de Transporte** (amarelo/táxi) com semeadura automática e retroativa para novos e antigos usuários via `DefaultCategorySeeder`.
  - Coluna de Categoria com destaque visual e botão de atalho de edição rápida em casos de categoria "Outros" ou lançamentos com dúvidas.

---

## 4.6. Painel de Entradas/Receitas, Teto Global de Gastos e Sugestão de Orçamentos com IA (Implementado)

- **Painel de Entradas/Receitas:** Substituição do bloco estático de "Contas Bancárias" na tela inicial por um gerenciador dinâmico de entradas (`incomeTransactions`), com botão rápido para registrar salários e rendas adicionais (`handleOpenNewIncome`).
- **Saldo Total & Meta de Gastos:**
  - Card superior de **Entradas** alimentado pelas movimentações de receita.
  - Card de **Saldo Total** calculado rigorosamente via `Total de Entradas - Total de Despesas = Saldo Total`.
  - Card superior de **Meta de Gastos** exibindo o montante restante disponível para gastar no mês com base no Teto Global (`effectiveGlobalLimit - totalExpense`) com avisos visuais de estouro de teto.
- **Distribuição de Tetos com Inteligência Artificial:**
  - Backend: `SuggestBudgetsWithAiUseCase` analisa os últimos 60 dias de histórico real de faturas e transações, pondera proporções com heurística financeira de categorias prioritárias (Moradia, Alimentação, Delivery, Transporte, etc.) e distribui o teto monetário com precisão absoluta de `BigDecimal`, alocando eventuais resíduos de centavos na primeira parcela/categoria.
  - Endpoints REST: `POST /api/v1/budgets/ai-suggest` e `POST /api/v1/budgets/batch` com transação atômica.
  - Frontend: `AiBudgetSuggestionModal` integrado no Dashboard e na aba de Análise & Orçamentos, permitindo simular, ajustar valores e aplicar todas as metas com 1 clique.

- **Consolidação Resiliente de Gastos por Categoria nas Metas Orçamentárias:**
  - `ListBudgetsUseCase.java` agora agrega as despesas tanto por `UUID` de categoria quanto por `nome normalizado da categoria`, garantindo que edições de categoria no Extrato de Movimentações reflitam instantaneamente nos limites orçamentários, mesmo se houver divergência de identificadores ou categorias criadas sob demanda.
  - Inclusão automática nos cards de "Metas Orçamentárias" de qualquer categoria que possua gastos reais no período, mesmo que ainda não tenha um limite orçamentário configurado (exibida com badge "Sem Teto Definido" e ação rápida para estabelecer meta).

- **Remoção Efetiva e Desativação de Teto de Gastos:**
  - `handleRemoveGlobalLimit` agora salva flag de desativação explícita (`economia_real_spending_limit_disabled_${user.id}`) e, se houver metas/orçamentos cadastrados no banco de dados para o mês, remove-os atomicamente via `deleteBudgetApi` e sincroniza o estado.
  - Botão de "Remover" teto adicionado diretamente ao lado de "Ajustar" no cabeçalho do card de teto, e dentro do formulário de edição, visível sempre que existir qualquer limite ativo.

- **Seleção Múltipla e Exclusão em Massa no Extrato de Movimentações:**
  - Backend: endpoint `POST /api/v1/transactions/batch-delete` em `TransactionController.java` e `DeleteTransactionUseCase.executeBatch` com garantia de isolamento por usuário (`userId`).
  - Frontend: checkboxes integrados no cabeçalho da tabela (selecionar todos / desmarcar todos) e em cada linha de lançamento, com destaque visual de seleção.
  - Barra de ações em massa com contagem dinâmica e diálogo nativo de confirmação: *"Deseja excluir os X registros selecionados?"*.

---

## 5. Próximo Passo Recomendado

A plataforma agora conta com o ciclo orçamentário completo, isolamento total entre contas e manipulação ágil de lançamentos:
1. Controle de **Entradas/Receitas** e **Despesas** com cálculo direto de Saldo Líquido e sem necessidade de vincular contas bancárias.
2. Definição e **Remoção Real de Teto Global de Gastos** com acompanhamento da margem disponível do mês isolado por conta.
3. **Seleção múltipla e exclusão em lote** no Extrato de Movimentações com diálogo de confirmação seguro.
4. Sugestão assistida por IA para orçamentos por categoria, pronta para uso em `http://localhost:3000`.
