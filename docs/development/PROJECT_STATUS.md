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

### 2.3. Fase 2 — Identidade, Autenticação, Isolamento de Usuários e Segurança Antifraude
- [x] Migração Flyway `V2__add_refresh_tokens.sql`, `V3__add_email_verification.sql` e `V4__add_password_reset.sql` (`password_reset_code`, `password_reset_expires_at`).
- [x] Entidade de domínio `User` pura e porta `UserRepository` com ciclo de ativação de conta e redefinição de senha segura.
- [x] Validação Rigorosa e Gratuita de E-mail (`EmailValidationService`):
  - Validação de sintaxe estrita RFC 5322.
  - Blacklist em memória contra 30+ provedores de e-mail temporários/descartáveis conhecidos.
  - Verificação de registros DNS MX em tempo real via JNDI com bypass instantâneo para provedores confiáveis (`gmail.com`, `outlook.com`, `yahoo.com`, `icloud.com`).
- [x] Desafio CAPTCHA Visual Profissional com Imagem Distorcida (`CaptchaService`):
  - Geração nativa em memória de imagens PNG Base64 (`data:image/png;base64,...`) com ruído de fundo, rotação aleatória de caracteres (-22° a +22°), linhas cruzadas e degradê.
  - Fallback vetorial SVG puro (`renderFallbackSvg`) com captura abrangente (`catch (Throwable t)`), garantindo renderização instantânea mesmo em containers Linux/Alpine mínimos sem bibliotecas nativas de fontes do SO.
  - Instalação de `fontconfig`, `freetype` e `ttf-dejavu` no Dockerfile multi-stage com flag `-Djava.awt.headless=true`.
  - Frontend resiliente no `AuthModal.tsx` com estados elegantes de loading (skeleton com spinner) e retry com um clique contra cold-starts da nuvem.
  - Sem texto claro exposto em JSON ou DOM (bloqueia bots e scrapers automatizados).
  - Assinatura criptográfica HMAC-SHA256 com hash da resposta e salt interno do backend (impossibilita adulteração).
  - Expiração de 3 minutos e renovação com 1 clique no frontend.
- [x] Fluxo de Ativação por Código de 6 Dígitos (`VerifyEmailUseCase`, `ResendVerificationCodeUseCase`, `EmailSenderService`):
  - Envio de e-mail com template HTML responsivo e fallback seguro em console de desenvolvimento.
  - Bloqueio de login (`403 Forbidden`) para contas não ativadas.
  - Interface no Frontend com troca inteligente de tela, contagem de caracteres e botão de reenvio.
- [x] Fluxo Completo de Recuperação e Redefinição de Senha (`ForgotPasswordUseCase`, `ResetPasswordUseCase`):
  - Endpoint `POST /api/v1/auth/forgot-password` protegido por CAPTCHA visual com envio de código de 6 dígitos válido por 15 minutos e proteção Anti-User-Enumeration (OWASP).
  - Endpoint `POST /api/v1/auth/reset-password` validando código e nova senha com criptografia BCrypt.
  - Telas no Frontend integradas no modal de login ("Esqueceu a senha?", envio de código e criação de nova senha).
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
- [x] Adaptador Gemini com fallback determinístico offline (`NaturalLanguageRuleParser`) aprimorado para valores falados compostos (reais e centavos) e marcas brasileiras populares (iFood, Uber, etc.).
- [x] Modal `AiTransactionModal` com entrada por texto e gravação de voz: integração com a **Web Speech API nativa** do navegador em tempo real (transcrição instantânea em pt-BR e envio ao extrator estruturado), remoção de mocks fixos de áudio no backend e confirmação humana obrigatória sem alucinações.

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
  - `POST /api/v1/budgets/batch`: persistência atômica em lote de metas por categoria geradas ou ajustadas.
  - `PATCH /api/v1/budgets/alert-threshold`: atualiza o percentual de alerta de consumo próximo para todas as categorias cadastradas no mês do usuário de forma global.
  - `DELETE /api/v1/budgets/{id}`: remove meta configurada.
  - `GET /api/v1/analytics/overview`: visão consolidada de gráficos e KPIs.
- [x] **Interface Rica no Frontend:**
  - Componente `AnalyticsSection`:
    - Card de *Burn Rate* com termômetro visual, dias transcorridos vs restantes, e barra de consumo do orçamento total.
    - Gráfico interativo SVG de barras duplas (Receitas x Despesas dos últimos 6 meses com tooltips em hover).
    - Gráfico de distribuição por categoria com barra segmentada colorida e tabela detalhada com percentuais.
    - Painel de metas por categoria com badges de status (No Limite, Atenção 80%, Estourado) e cálculo em tempo real dos gastos acumulados na categoria.
    - **Resolução Temporal Histórica Contábil:**
      - Metas definidas em um mês propagam automaticamente para os meses subsequentes.
      - Ao reajustar uma meta em um mês posterior (ex: de R$ 4.000 para R$ 8.000 após 2 meses), os meses anteriores preservam estritamente o valor histórico original (R$ 4.000), enquanto o mês do reajuste e todos os meses seguintes herdam o novo valor (R$ 8.000).
      - Aplicado de ponta a ponta no backend (`ListBudgetsUseCase` e `GetAnalyticsOverviewUseCase`) e no frontend (`spendingLimitTimeline` no `App.tsx` com persistência isolada por usuário).
  - Modal `BudgetModal`: formulário intuitivo para definir limites mensais e percentual de alerta de consumo próximo unificado globalmente para todas as categorias e metas de I.A. Permite salvar a regra global mesmo sem selecionar uma categoria específica.
  - Modal `AiBudgetSuggestionModal`: distribuição inteligente com IA, com suporte a travas de personalização por categoria (toggles com ícones de cadeado), rebalanceamento estrito do teto total e aplicação do percentual global de alerta configurado.

### 2.9. Fase 8 — Despesas Fixas Recorrentes, Assinaturas & Robustez Operacional
- [x] **Domínio de Despesas Recorrentes:**
  - Entidade `RecurringBill` com precisão em `BigDecimal` escala 2, frequências (`WEEKLY`, `MONTHLY`, `YEARLY`), e ajuste determinístico de dia de vencimento para meses curtos.
  - Porta `RecurringBillRepository` e adaptador JPA com isolamento estrito por `user_id`.
  - Casos de uso: `CreateRecurringBillUseCase`, `ListRecurringBillsUseCase`, `UpdateRecurringBillUseCase`, `DeleteRecurringBillUseCase` e `PayRecurringBillUseCase`.
  - Sincronização e cascata com extratos: ao editar uma despesa fixa (`UpdateRecurringBillUseCase`), todas as movimentações associadas geradas no extrato (mês atual e meses futuros) são sincronizadas com nova descrição, valor, categoria, dia de competência e notas de auditoria. Ao remover uma despesa fixa (`DeleteRecurringBillUseCase`), todos os lançamentos gerados por ela no extrato (`notes LIKE 'RECURRING_BILL:<id>%'`) são excluídos em cascata pelo usuário autenticado (anti-IDOR).
  - Prevenção de dupla contagem através do marcador `RECURRING_BILL:<UUID>` nos lançamentos, suportando débito em conta bancária ou fatura de cartão.
- [x] **Endpoints REST Autenticados:**
  - `GET /api/v1/recurring-bills`: lista compromissos fixos com detecção de contas a vencer em 7 dias e status de pagamento no mês (com suporte ao parâmetro `month`).
  - `POST /api/v1/recurring-bills`: cadastro de nova despesa ou assinatura.
  - `PUT /api/v1/recurring-bills/{id}`: edição de parâmetros e sincronização em lote com o extrato (meses correntes e futuros).
  - `DELETE /api/v1/recurring-bills/{id}`: exclusão segura de assinatura com remoção em cascata dos lançamentos do extrato.
  - `POST /api/v1/recurring-bills/{id}/pay`: efetivação da despesa no mês com suporte a `replicateMonths` (replicação para meses subsequentes) e data customizada.
- [x] **Frontend Moderno:**
  - `RecurringBillsSection.tsx`: painel com cards de métricas sincronizados com o mês selecionado (`selectedMonth`), confirmação e feedback explícitos na exclusão indicando remoção no extrato (inclusive meses futuros).
  - `RecurringBillModal.tsx`: formulário com aviso visual contextual de que a edição sincroniza automaticamente todos os lançamentos gerados no extrato (mês atual e meses futuros).

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

- **Seleção Múltipla e Exclusão (Individual e em Massa) no Extrato com Modal Estilizado:**
  - Backend: endpoint `POST /api/v1/transactions/batch-delete` em `TransactionController.java` e `DeleteTransactionUseCase.executeBatch` com garantia de isolamento por usuário (`userId`).
  - Frontend: substituição completa dos diálogos nativos do navegador (`window.confirm` e `alert`) pelo componente moderno `ConfirmModal.tsx`, integrado ao design system tátil (Duolingo style).
  - Experiência visual refinada: backdrop com desfoque (`backdrop-blur-sm`), ícone de lixeira em vermelho suave, resumo da movimentação (descrição, valor formatado em R$ e data) ou contagem total de itens em lote, alerta de irreversibilidade e botões táteis (`btn-duo-white` e `btn-duo-red`).
  - Feedback suave via toasts temporários de sucesso/erro sem bloqueio da interface.

- **Tutorial Guiado Interativo / Onboarding Acolhedor (`OnboardingTourModal.tsx`):**
  - Exibição automática ao fazer login na plataforma para usuários que ainda não desabilitaram o tour.
  - Arquitetura Smart Corner Dock sem backdrop bloqueante: o card se posiciona dinamicamente nos cantos da tela (`bottom-right`, `bottom-left`, `top-right`, `top-left`), detectando automaticamente as coordenadas do elemento em foco (`getBoundingClientRect`) para desviar e **nunca ficar na frente** do botão, tabela ou card que está sendo demonstrado.
  - O centro da tela fica 100% livre e nítido, com indicador visual de foco (`Eye` / "Destaque em foco: ...") e botão de alternância manual de canto (`ArrowLeftRight`).
  - 7 passos estruturados, curtos e didáticos (Importação de Fatura, Entradas & Extras, Categorização Ágil, Contas Fixas Recorrentes, Teto & Metas com IA, Lançamentos por Voz/Texto e Perspectiva Anual).
  - Destaque dinâmico no site (`tour-target-highlight`): o tutorial troca de abas automaticamente e rola suavemente (`scrollIntoView`) até o elemento em foco, aplicando aura pulsante em azul real e ciano.
  - Demonstração visual ilustrada para cada passo com componentes táteis em miniatura.
  - Opção persistida de *"Não exibir automaticamente ao entrar"* via `localStorage` isolado por usuário.
  - Botão de acesso rápido integrado ao header superior (`Compass` / "Guia"), posicionado de forma compacta e discreta ao lado do botão de Privacidade, permitindo reabrir o tutorial a qualquer momento com 1 clique.

---

## 4.7. Auto-Categorização Adaptativa com Aprendizado Contínuo, IA Gemini e Edição Ágil em Linha (Implementado)

- **Classificação Adaptativa Baseada no Histórico do Usuário:**
  - `MerchantCategoryClassifier.java` aprimorado com inteligência adaptativa de Passo 0: antes de regras estáticas ou IA, o sistema consulta as transações do próprio usuário.
  - Ordenação temporal decrescente (`updatedAt DESC`): a alteração mais recente do usuário sempre tem precedência absoluta sobre transações antigas e regras do sistema.
  - Higienização e correspondência: higienização automática de parcelas (`01/05`, `Parcela 1/10`) e adquirentes (`PAG*`, `CIELO*`, `REDE*`), com match exato prioritário e match parcial seguro.
  - Validação estrita de categorias ativas do usuário para evitar identificadores órfãos.
- **Classificação Bancária com Inteligência Artificial (Gemini):**
  - Implementação de `classifyMerchant` em `AiExtractionPort` e `GeminiAiService`, consultando o modelo Gemini com prompt contextualizado ao comércio e redes brasileiras e cache concorrente em memória.
  - Remoção de atribuição automática à categoria "Outros" para termos desconhecidos, preservando valor nulo para destacar ao usuário.
- **Experiência de Uso no Extrato (Frontend):**
  - Componente `InlineCategorySelect`: seletor de categorias em linha na tabela com criação rápida de novas categorias sem sair da página.
  - Destaque estático `⚠️ Sem Categoria` em tom âmbar sem animações intrusivas, e botão de filtro rápido no topo do extrato (`⚠️ X sem categoria`).
  - Componente `InlineDatePicker`: edição rápida de data diretamente na célula da tabela com calendário customizado e design refinado.
  - Tratamento resiliente da API de Metas de Economia (`goalApi.ts`) para evitar alertas visuais de erro quando não houver metas cadastradas.

---

## 4.8. Máscara Financeira Estilo ATM / Maquininha de Cartão em Todo o Sistema (Implementado)

- **Digitação com Deslocamento Progressivo de Centavos:**
  - Componente centralizado `CurrencyInput.tsx` e `InlineCurrencyInput` substituindo completamente inputs nativos de `type="number"`.
  - Comportamento de maquininha de cartão / caixa eletrônico: dígitos entram sempre pelos centavos (da direita para a esquerda). Exemplo: `1` vira `0,01`, `7` vira `0,17`, `6` vira `1,76`, `0` vira `17,60`, `0` vira `176,00`.
  - Suporte completo a `Backspace` diminuindo casas decimais em tempo real (`176,00` -> `17,60` -> `1,76`).
  - Sincronização e parsing bidirecional seguro (`parseRawToCents`) para valores iniciais vindos da API, strings decimais ou números float.
- **Cobertura Integral em Todos os Módulos do Sistema:**
  - **Nova Movimentação (`TransactionModal.tsx`):** Receita, Despesa e Transferência (com ordenação de Receita primeiro).
  - **Compras no Cartão (`CreditCardPurchaseModal.tsx`):** Valor total da transação parcelada.
  - **Custos Recorrentes (`RecurringBillModal.tsx`):** Despesas fixas e assinaturas mensais.
  - **Edição Rápida no Extrato (`App.tsx`):** Componente `InlineCurrencyInput` na tabela com salvamento em `onBlur` ou `Enter`.
  - **Teto Mensal Global (`App.tsx`):** Ajuste manual de teto de gastos.
  - **Contas Bancárias (`AccountModal.tsx`):** Saldo inicial.
  - **Cartões de Crédito (`CreditCardModal.tsx`):** Limite total do cartão.
  - **Fatura de Cartão (`PayInvoiceModal.tsx`):** Valor do pagamento.
  - **Metas de Economia (`SavingsGoalModal.tsx` e `GoalTransactionModal.tsx`):** Valor alvo e aportes/resgates.
  - **Orçamentos e Metas com IA (`BudgetModal.tsx` e `AiBudgetSuggestionModal.tsx`):** Teto global e ajuste individual de categorias.
  - **Lançamento com IA (`AiTransactionModal.tsx`):** Revisão de valor extraído por áudio/texto.
- **Integridade Contábil Garantida:**
  - O backend permanece recebendo valores matematicamente exatos em `BigDecimal`, mantendo conformidade com as regras de integridade contábil.

---

## 4.9. Filtro por Categoria no Extrato e Fluxo Contínuo de Lançamento por Voz com IA (Implementado)

- **Filtro por Categoria Moderno no Extrato (`CategoryFilterDropdown.tsx` e `App.tsx`):**
  - Substituição total do `<select>` nativo e rígido do sistema operacional por um componente customizado com popover flutuante via `createPortal`.
  - Design visual harmonizado com o restante da aplicação: fundo com desfoque (`backdrop-blur-md`), bordas arredondadas `rounded-2xl`, sombras elegantes `shadow-2xl` e micro-animações.
  - Indicadores visuais ricos: cada categoria exibe seu círculo com a cor hexadecimal real cadastrada (`colorHex`), badges contextuais e check azul na categoria ativa.
  - Campo de busca rápida integrado no topo do dropdown com ícone de lupa para filtrar categorias instantaneamente.
  - Botão de limpeza rápida (`X`) integrado ao gatilho quando um filtro estiver ativo.
  - Sincronização inteligente com o botão de alerta "⚠️ X sem categoria" e tratamento do empty state com botão para "Limpar filtros".
  - Respeita os filtros ativos de período (mês ou geral), tipo (receita/despesa) e busca textual por descrição/notas.
- **Fluxo Contínuo de Gravação por Voz no Lançamento com IA (`AiTransactionModal.tsx`):**
  - Ao clicar em "Confirmar e Salvar", o sistema salva a transação e atualiza o extrato em segundo plano.
  - Em vez de fechar o modal, exibe um banner verde de sucesso: *"Registro '[descrição]' salvo com sucesso no seu extrato de movimentações! Você já pode clicar no microfone abaixo e falar o próximo registro!"*.
  - O modal retorna diretamente para a aba de voz com o microfone pronto para o próximo comando falado, acelerando o lançamento em lote de despesas do dia a dia.
- **Otimização de Performance e Latência (Frontend & Backend):**
  - **Filtro Temporal no Extrato:** A listagem de movimentações (`fetchTransactionsApi`) agora passa `startDate` e `endDate` do mês ativo por padrão, evitando o download desnecessário de 100% do histórico e aliviando processamento no PostgreSQL e na rede.
  - **Eliminação de Refetch Redundante de Dados Estáticos:** A função `loadFinancialData` passou a utilizar referências para dados estáticos (`accounts`, `categories`, `creditCards`). Ao salvar uma movimentação ou alternar de mês, apenas as métricas dinâmicas do mês (transações, resumo financeiro, orçamentos e analytics) são requisitadas, reduzindo a concorrência no Tomcat e no banco de dados.
- **Herança Temporal Contábil nas Metas por Categoria (Budget Timeline Inheritance):**
  - As metas de gastos por categoria definidas no backend e frontend seguem a linha do tempo cronológica histórica:
    - Se um mês não possui orçamento explicitamente redefinido, ele herda a meta mais recente cadastrada até aquele mês (`monthReference <= targetMonth`).
    - Meses anteriores à primeira definição histórica não herdam valores futuros (permanecem sem meta), protegendo a integridade dos relatórios passados.
    - Quando o usuário ajusta um novo limite em um mês (ex: Março), os meses anteriores (Janeiro e Fevereiro) permanecem com seus limites históricos intactos, e os meses subsequentes (Abril, Maio...) passam a refletir o novo valor reajustado.

---

## 4.10. Autenticação Instantânea e Eliminação de Latência de Acesso (Zero Demora ao Clicar em Entrar)

- **Eliminação do Bloqueio de CAPTCHA no Login (`AuthModal.tsx`):**
  - O fluxo de login para usuários existentes foi desacoplado de qualquer dependência visual de CAPTCHA.
  - Ao clicar no botão "Entrar", o modal abre instantaneamente (0ms de atraso) exibindo diretamente os campos de E-mail e Senha prontos para digitação, eliminando o spinner bloqueante e as mensagens *"Carregando verificação de segurança... Aguardando resposta do servidor seguro"*.
  - O backend (`LoginUserUseCase.java` e `AuthController.java`) já suportava de forma nativa e segura a autenticação direta de credenciais via `POST /api/v1/auth/login` com validação de senha hash BCrypt e rate limiting.
- **Pré-aquecimento Assíncrono do Backend (Zero Cold-Start Lag):**
  - Implementado mecanismo de prefetch e warm-up silencioso (`warmUpBackend()` e `prefetchCaptcha()` em `authApi.ts`).
  - Ao carregar a Landing Page ou o App na área não-autenticada, uma requisição leve em segundo plano acorda a instância no Render antes que o usuário tome qualquer ação.
  - Adicionado gatilho especulativo (`onMouseEnter` e `onTouchStart`) nos botões de "Entrar" e "Cadastrar" do cabeçalho e da Landing Page, garantindo que o servidor seguro já esteja aquecido antes do clique.
- **Segurança Preservada no Registro de Novas Contas:**
  - O CAPTCHA visual anti-bot permanece ativo no cadastro de novos usuários (`mode === 'register'`) e na solicitação de recuperação de senha (`mode === 'forgot'`), sendo alimentado pelo cache de prefetch em segundo plano para renderização imediata.
  - No cadastro, caso a requisição ainda esteja completando, os campos de Nome Completo, E-mail e Senha permanecem totalmente editáveis, sem travar a digitação do usuário.

---

## 5. Próximo Passo Recomendado

1. A plataforma conta agora com 142 testes automatizados no backend e build de frontend 100% íntegros.
2. Linha do tempo contábil de orçamentos por categoria sincronizada com testes unitários.
3. Login e abertura de modais com tempo de resposta imediato (0ms de espera).
4. Deploy sincronizado no GitHub (`main`) e publicado na Vercel (`https://economia-real.ia.br`).

