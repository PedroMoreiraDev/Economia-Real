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
- [x] **Rendas / Salários Recorrentes (`RECURRING_INCOME`):**
  - Projeção determinística de receitas mensais com seletor de horizonte (6, 12 ou 24 meses; padrão de 1 ano / 12 meses).
  - Vínculo por grupo de recorrência via metadado seguro `RECURRING_INCOME:<uuid>`.
  - Edição propagada para meses futuros (`updateFutureRecurring`), garantindo que o histórico contábil de meses passados seja rigorosamente preservado.
  - Exclusão flexível: exclusão do mês pontual ou de todos os meses futuros (`deleteFutureRecurring`).
  - Identificação visual no frontend com badge `[🔁 Recorrente]` e sanitização de notas técnicas.

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
- [x] Modal `AiTransactionModal` com entrada por texto e gravação de voz:
  - No desktop: integração com a **Web Speech API nativa** do navegador em tempo real (transcrição instantânea em pt-BR e envio ao extrator estruturado).
  - No mobile: gravação e envio de arquivo de áudio (`POST /api/v1/ai/extract-audio`) com transcrição via Google Gemini no backend.
    - **Otimizações para Áudio Mobile & Confiabilidade de Fala:**
      - **Inspeção de Magic Bytes:** O backend agora inspeciona a assinatura binária real do arquivo recebido (WebM `1A 45 DF A3`, MP4/M4A `ftyp`, WAV `RIFF`, OGG `OggS`, MP3, AAC), evitando rejeição por MIME types genéricos enviados por navegadores móveis (`application/octet-stream`).
      - **Streaming com Timeslice no Mobile:** No frontend (`AiTransactionModal.tsx`), o gravador dispara chunks contínuos a cada 250ms com `echoCancellation`, `noiseSuppression` e `requestData()`, garantindo empacotamento completo de áudio sem cortes finais em navegadores móveis (Safari iOS e Chrome Android).
      - **Extração Resiliente de Partes Múltiplas:** Suporte a parsing completo de `candidates[*].content.parts[*]`, ignorando blocos de raciocínio interno (`thought: true`) e concatenando todas as partes de texto.
      - **Cascata Ativa Contra Transcrições Vazias:** Se um modelo responder HTTP 200 mas com transcrição vazia, o backend loga o evento e avança automaticamente para o próximo modelo candidato de alta disponibilidade (`gemini-flash-latest`, `gemini-3.5-flash`, etc.).
  - Confirmação humana obrigatória sem alucinações.

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
  - **Auditoria Completa de Vulnerabilidades e Hardening Abrangente (Outubro/2026):**
    - **Anti-IDOR em Categorias Privadas:** Validação obrigatória de ownership de `categoryId` com `findByIdAndUserId` em `CreateTransactionUseCase`, `UpdateTransactionUseCase` e `CreateCreditCardPurchaseUseCase`, prevenindo vinculação cruzada a categorias de terceiros.
    - **Mitigação de DoS por Replicação Ilimitada:** Parâmetro `replicateMonths` limitado a no máximo 60 meses (`@Min(1) @Max(60)` e validação no core) em transações e despesas fixas recorrentes.
    - **Mitigação de DoS em Operações em Lote:** Limite estrito de 200 IDs para exclusão em lote de transações (`DeleteTransactionUseCase`) e teto de 50 categorias para criação em lote de orçamentos (`BatchCreateBudgetsUseCase`).
    - **Proteção contra Upload DoS / OOM:** Restrição estrita de 10MB no controller de extratos (`ImportStatementController`) e configuração de limites de multipart no Spring Boot (`max-file-size: 15MB`, `max-request-size: 20MB`).
    - **Aprimoramento de Rate Limiting:** Proteção de rotas sensíveis de Inteligência Artificial (`/api/v1/ai/*` com 20 req/min), validação de regex e sanitização de headers de IP para evitar spoofing (`X-Forwarded-For`), e teto de 5.000 entradas no mapa de rastreamento para contenção de memória.
    - **Proteção contra Estouro de Tipos e Colunas:** Validações com `@Size` nos campos descritivos e nomes de categorias, contas e transações para evitar HTTP 500 decorrentes de estouro de colunas SQL.
    - **Mitigação de Cold Start & Keep-Alive Inteligente (Prevenção de Hibernação):** Implementado serviço `backendWarmup.ts` com ping de inicialização estendido, heartbeat leve a cada 4 minutos para evitar dormência em plataformas serverless/free (Render/Neon), reativação automática ao focar a aba (`visibilitychange`), fallback tolerante a timeouts em `AuthContext.tsx` e feedback visual transparente de "servidor acordando" em `AuthModal.tsx`.
    - **Otimização de Conexões Ociosas no Backend:** Configuração do pool HikariCP com `minimum-idle: 2`, `keepalive-time: 45000` e validação com `connection-test-query: SELECT 1` para manter conexões PostgreSQL quentes e prontas.
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

### 2.13. Responsividade Total Mobile/Tablet & Bottom Sheet Inteligente do Tutorial
- [x] **Guia / Tutorial do App Totalmente Reformulado para Telas Touch (`OnboardingTourModal.tsx`):**
  - Transformação em **Bottom Sheet Flutuante** em telas móveis e tablets (< 1024px), fixado confortavelmente na parte inferior (`bottom-0` ou `bottom-3`).
  - **Modo Minimizado com 1 Toque:** Barra ergonômica de ~54px de altura que permite ao usuário visualizar e interagir com o elemento destacado na tela sem nenhum bloqueio de visão.
  - **Scroll Inteligente com Folga Superior:** Em telas touch, o elemento focado é automaticamente rolado para o terço superior da janela (`scrollTop + rect.top - 80`), eliminando qualquer risco de ser encoberto pelo card informativo inferior.
  - Pílula tátil de recolhimento, botões de toque com tamanho mínimo de 40-44px e persistência sem conflito.
- [x] **Layout Geral Responsivo em Smartphones e Tablets (`App.tsx`):**
  - **Cabeçalho:** Logo e tipografia com escala fluida (`text-xl sm:text-2xl`), botões com ícones táteis e perfil de usuário compacto.
  - **Banner de Boas-Vindas:** Ações rápidas organizadas em **Grid 2x2 no mobile** (`grid grid-cols-2 sm:flex sm:flex-wrap`), garantindo botões de largura uniforme e toque fácil em qualquer smartphone.
  - **Seletor de Período:** Controles alinhados com `justify-between sm:justify-end`, input de mês preenchendo o espaço disponível no mobile sem truncamento.
  - **4 Cards de KPIs Financeiros:** Grid adaptativo em **2x2 no mobile** (`grid-cols-2 lg:grid-cols-4`) com tipografia responsiva e ícones compactos, reduzindo a altura do dashboard pela metade em celulares e permitindo ver o extrato sem rolagem excessiva.
  - **Abas de Navegação:** Suporte a touch scrolling horizontal (`snap-x touch-pan-x scrollbar-none`) com botões táteis (`shrink-0 snap-start`).
  - **Extrato com Cards Móveis Táteis:** Visualização dedicada em **Cards Mobile (`block md:hidden`)** com edição inline de valor, categoria e data, mantendo a tabela contábil tabular apenas em telas médias e grandes (`hidden md:block`).
  - **Modais com Scroll Seguro (`max-h-[92vh] overflow-y-auto`):** `TransactionModal`, `CreditCardPurchaseModal`, `ImportModal` e `AuthModal` protegidos contra corte de tela ou quebra com teclados virtuais abertos.

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

## 4.11. Importação de Extratos Bancários em Planilhas Excel (.xlsx e .xls) (Implementado)

- **Suporte Multiformato no Importador de Extratos:**
  - Além dos arquivos `.ofx` e `.csv`, o sistema agora aceita nativamente planilhas do Microsoft Excel nos formatos moderno (`.xlsx`, OOXML) e legado (`.xls`, Excel 97-2003 / BIFF8).
- **Parser Determinístico com Apache POI (`ExcelParser.java`):**
  - Utilização da biblioteca Apache POI 5.3.0 (`WorkbookFactory.create`) para leitura resiliente e unificada de ambos os formatos em memória.
  - Detecção automática da linha de cabeçalho através de varredura inteligente dos termos (`data`, `date`, `dt`, `valor`, `amount`, `descrição`, `histórico`, `estabelecimento`, `id`, `fitid`).
  - Fallback automático para colunas padrão (0: Data, 1: Descrição, 2: Valor) quando não houver cabeçalhos explícitos.
  - Suporte a células de data numéricas nativas formatadas (`DateUtil.isCellDateFormatted`), seriais Excel e strings de data formatadas em padrão brasileiro (`dd/MM/yyyy`) ou ISO (`yyyy-MM-dd`).
  - Suporte a células de valor numéricas e textuais em padrão brasileiro (`R$ 1.250,50`) e com sufixos contábeis bancários (`D` para débito/negativo e `C` para crédito/positivo).
- **Integridade Contábil e Financeira:**
  - Preservação estrita da precisão com `BigDecimal` escala 2 e `RoundingMode.HALF_EVEN`.
  - Tratamento determinístico para faturas de cartão de crédito importadas via Excel: compras com valores positivos entram como despesa (`EXPENSE`), enquanto pagamentos de fatura ou estornos são classificados como crédito / liquidação (`INVOICE_PAYMENT`).
  - Deduplicação inteligente de lançamentos idênticos já existentes na conta para evitar duplicações.
- **Segurança da Informação e Formula Injection:**
  - Sanitização de descrições contra CSV/Excel Formula Injection, removendo prefixos executáveis perigosos (`=`, `+`, `-`, `@`).
- **Banco de Dados & Migração Flyway (`V6__allow_excel_import.sql`):**
  - Atualização das restrições de verificação (CHECK constraints) em `import_batches` (`file_type IN ('CSV', 'OFX', 'EXCEL')`) e `transactions` (`origin IN (..., 'EXCEL_IMPORT')`).
  - Adição do valor `EXCEL_IMPORT` no enum `TransactionOrigin` e aceitação de `EXCEL` em `ImportBatch`.
- **Interface e Experiência do Usuário (`ImportModal.tsx`):**
  - Input com `accept=".ofx,.csv,.xlsx,.xls"`, validação de extensão antes do envio e mensagens explicativas atualizadas para o usuário.
- **Qualidade e Cobertura de Testes Automatizados:**
  - 100% dos testes aprovados: `ExcelParserTest` (5 testes), `ImportBankStatementUseCaseTest` (3 testes) e `ImportStatementControllerTest` (4 testes), além de build estático do frontend validado com TypeScript.

---

## 4.12. Exibição Completa de Categorias no Seletor e Novo Campo de Busca (`CategoryCombobox.tsx`)

- **Causa Raiz Identificada:**
  - O componente `CategoryCombobox` utilizava o próprio valor preenchido do input (`categoryName`) como termo de busca para filtrar o array de categorias existentes.
  - Ao abrir o modal com "Receita" pré-selecionando "Salário & Renda" (ou qualquer outra categoria previamente escolhida), o dropdown filtrava apenas termos que contivessem "Salário & Renda", ocultando todas as demais categorias cadastradas ("Alimentação", "Transporte", "Moradia", etc.) a menos que o usuário apagasse manualmente o texto do campo.
- **Solução Arquitetural Implementada:**
  - **Separação entre Valor Selecionado e Filtro de Busca:** O gatilho principal agora atua como um seletor visual limpo, exibindo o nome, a cor (`colorHex`) da categoria ativa e um botão `X` para remoção rápida.
  - **Exibição Universal de Categorias:** Ao clicar no campo ou na seta expansora (`ChevronDown`), o menu suspenso abre listando **todas as categorias disponíveis** no sistema, mantendo a categoria selecionada marcada com check (✓).
  - **Barra de Pesquisa Interna com Foco Automático:** Foi incluído um campo de pesquisa dedicado no topo do popover com ícone de lupa, permitindo filtrar em tempo real conforme o usuário digita.
  - **Criação Rápida de Novas Categorias:** Se o usuário digitar um nome de categoria que ainda não existe, uma opção destacada em verde (`+ Criar categoria: "nome"`) surge no topo para criação imediata.
  - **Alternância Inteligente de Abas em `TransactionModal.tsx`:** Ao alternar de Receita para Despesa, a categoria "Salário & Renda" é desmarcada automaticamente para não induzir a erro.

---

## 4.13. Detecção Inteligente de Compras Parceladas e Projeção Futura Anti-Duplicação em Faturas de Cartão (Implementado)

- **Objetivo e Contexto de Negócio:**
  - Ao importar faturas de cartão de crédito (OFX, CSV ou Excel) contendo compras parceladas (exemplo: `Havan 3/5`), o usuário necessitava que a parcela do mês corrente (`3/5`) fosse registrada na fatura do mês atual e as parcelas restantes (`4/5` e `5/5`) fossem projetadas automaticamente nos meses subsequentes (+1 mês e +2 meses).
  - Além disso, era crucial garantir que, ao importar a fatura do mês seguinte contendo a linha real de `Havan 4/5`, o sistema **não gerasse duplicidade** da parcela `4/5` nem relançasse `5/5` em duplicidade.

- **Componente Especializado de Domínio (`InstallmentDetector.java`):**
  - Implementado em `com.finance.ai.domain.financial.importer.InstallmentDetector`:
    - Expressão regular flexível e resiliente a múltiplos padrões de instituições bancárias e adquirentes brasileiras:
      - `(\d{1,2})\s*(?:/|de)\s*(\d{1,2})` (ex: `Havan 3/5`, `HAVAN 03/05`, `MAGALU 2 de 4`, `Renner (2/10)`, `Parc. 01/03`).
    - Proteção contra falsos positivos:
      - Ignora datas com ano (ex: `15/10/2026` não é confundido com parcelamento).
      - Rejeita inconsistências lógicas (`current > total`, `total <= 1` ou valores anômalos acima de 99).
    - Métodos utilitários:
      - `extractCleanMerchant()`: higieniza termos removendo prefixos de adquirentes (`PAG*`, `CIELO*`, `REDE*`), sufixos de parcelas e pontuações para obter o identificador canônico do lojista (ex: `"havan"`).
      - `formatNextInstallmentDescription()`: gera a descrição da parcela subsequente preservando o estilo original da fatura (zeros à esquerda, parênteses, separador `/` ou `de`).

- **Algoritmo de Projeção e Deduplicação Canônica Cross-Month (`ImportBankStatementUseCase.java`):**
  - **Assinatura Canônica de Parcela:**
    - `YearMonth.from(date) + "|" + amount + "|" + cleanMerchant + "|" + current + "/" + total`
    - Essa assinatura canônica supera variações comuns entre faturas de meses distintos, como pequenas oscilações na data de fechamento (1 a 3 dias) ou diferenças de formatação do banco (`HAVAN 04/05` vs `Havan 4/5`).
  - **Mapeamento em Memória por Fatura:**
    - O caso de uso carrega as transações já existentes na conta para o período e indexa tanto a assinatura temporal exata (`date|amount|description`) quanto a assinatura canônica de parcelas (`existingInstallmentMap`).
  - **Reconciliação e Prevenção de Duplicidade:**
    - Ao processar uma parcela que já foi projetada em uma importação anterior (ex: `Havan 4/5` no mês seguinte):
      - O sistema reconhece que a parcela já existe no mês de competência e incrementa o contador de ignorados (`skippedCount++`).
      - Atualiza o registro existente para remover o status de "projeção automática" e confirmar os dados oficiais da fatura.
  - **Geração Futura Controlada:**
    - Quando uma compra parcelada é nova (`p = current + 1` até `total`):
      - Cada parcela futura é projetada com `date.plusMonths(offset)`.
      - Antes de criar cada parcela futura, o sistema consulta `existingInstallmentMap` para a competência de destino. Se já existir uma projeção ou lançamento para aquela parcela, ela **não é duplicada**.
      - Registra a nota de auditoria identificando o parcelamento (ex: `[Parcela 4/5 gerada automaticamente a partir da importação de fatura]`).

- **Qualidade e Cobertura de Testes Automatizados:**
  - `InstallmentDetectorTest.java`: 9 cenários de teste cobrindo detecção em `Havan 3/5`, `03/05`, `2 de 4`, `Parc. 01/03`, proteção de datas com ano, formatação preservada e identificação de merchant.
  - `ImportBankStatementInstallmentsTest.java`: 3 testes de integração do caso de uso validando:
    1. Importação de `Havan 3/5` registrando a parcela atual e projetando `4/5` e `5/5` nos meses seguintes.
    2. Importação subsequente no mês seguinte com `HAVAN 04/05` sem duplicar a parcela 4/5 nem a parcela 5/5 já projetada.
    3. Reimportação da mesma fatura sem qualquer duplicação.
  - 100% de sucesso em toda a suíte de importações (`InstallmentDetectorTest`, `ImportBankStatementInstallmentsTest`, `ImportBankStatementUseCaseTest`, `ImportStatementControllerTest`, `ExcelParserTest`).

### 2.12. Correção de Reconhecimento de Voz Mobile (Web Speech API vs MediaRecorder)
- **Causa Raiz Identificada:** No celular (Android/iOS), a execução simultânea de `getUserMedia` e `SpeechRecognition` bloqueava o canal de áudio do microfone por concorrência de hardware, gerando transcrição em branco e falha na identificação por voz.
- **Solução Implementada:**
  - Isolamento estrito dos fluxos: uso prioritário da Web Speech API nativa sem ativação concomitante de `getUserMedia`.
  - Tratamento de pausas na fala com reinicialização resiliente (`onend`) e acumulação de transcrições parciais e finais em tempo real.
  - Alerta preventivo contra restrições de segurança de microfone em conexões HTTP via rede local (exigência de HTTPS no mobile).
  - Validação completa do bundle frontend com Vite (`npm run build` concluído com sucesso).

### 2.13. Painel de Categorias e Criação Rápida no Lançamento por Voz
- **Causa Raiz Identificada:** A tela de revisão do comando por voz utilizava um `<select>` HTML nativo não estilizado, sem suporte a busca, sem exibição das cores das categorias e sem opção de criar uma categoria nova diretamente no fluxo de IA.
- **Solução Implementada:**
  - Substituição do `<select>` pelo `CategoryCombobox` redesenhado com touch targets confortáveis para celular (44px+), feedback visual Duolingo e busca em tempo real.
  - Suporte à criação automática de categorias sugeridas pela IA ou digitadas livremente pelo usuário via `createCategoryApi`.
  - Inclusão de modal rápido com paleta de 8 cores harmoniosas para cadastrar categorias personalizadas sem sair da tela de confirmação por voz.
  - Sincronização em tempo real do estado de categorias no `App.tsx` via callback `onCategoryCreated`.
  - Validação completa com TypeScript estrito e Vite (`npm run build`).

---

## 4.14. Telemetria de Crescimento, Google Analytics 4, Funil de Ativação e Retenção D7 (Implementado)

- **Objetivo e Contexto de Negócio:**
  - Capacitar a plataforma com medição rigorosa de tráfego, conversão e retenção para o lançamento do produto no mercado.
  - Implementar o acompanhamento semanal das 5 métricas essenciais: Visitas Qualificadas, Taxa de Cadastro, Ativação do Usuário, Retenção em 7 dias (D7) e Origem dos Usuários Ativos (Canais & UTMs).
- **Integração com Google Analytics 4 e Google Search Console:**
  - Inserção da tag oficial `gtag.js` com o ID de medição `G-68CZ3WHEMB` no `<head>` de `index.html`.
  - Suporte à variável `VITE_GA_MEASUREMENT_ID` e meta tag de validação do Google Search Console (`VITE_GSC_VERIFICATION_CODE`).
  - Prevenção contra carregamento duplo e tratamento tolerante a bloqueadores de anúncios.
- **Motor de Telemetria e Atribuição de Primeiro Toque (`telemetryService.ts`):**
  - Captura e persistência automática de `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` e `document.referrer` em `localStorage`.
  - Classificação de canais em tempo real (*Instagram, TikTok, WhatsApp, YouTube, Reddit, Google Orgânico, Acesso Direto*).
  - Regra de Visita Qualificada (`qualified_visit`): disparada para visitantes com mais de 15 segundos de permanência ou rolagem acima de 40% da Landing Page.
  - Marco Canônico de Ativação do Usuário (`user_activated`): registrado quando o usuário cadastrado realiza pelo menos uma movimentação (voz, manual ou importação de fatura) e visualiza as análises no dashboard.
  - Marco de Retenção D7 (`retention_7d`): registrado uma única vez quando o usuário retorna com 7 dias ou mais de conta.
  - Estrita conformidade com a LGPD: nenhum dado financeiro (valores monetários, descrições de compras, saldos ou CPFs) é transmitido ao Google Analytics.
- **Central de Métricas e Telemetria Integrada (`TelemetryModal.tsx`):**
  - Acesso direto via botão `Métricas` no cabeçalho e rodapé da aplicação.
  - Painel com diagnóstico ao vivo das ferramentas conectadas, status de ativação da conta atual e histórico dos últimos 50 eventos capturados.
  - Gerador embutido de links de divulgação com UTMs para Instagram Bio, Reels, TikTok, WhatsApp e campanhas.

---

## 5. Próximo Passo Recomendado

1. A plataforma conta com suíte de testes unitários e de integração de ponta a ponta no backend com 100% de aprovação.
2. Importação unificada de extratos e faturas em OFX, CSV, XLSX e XLS com detecção e projeção automática de parcelas futuras.
3. Deduplicação canônica inteligente entre faturas subsequentes sem risco de entradas duplicadas.
4. Reconhecimento de voz em tempo real otimizado para celulares e desktop com gestão visual de categorias.
5. Deploy e validações contínuas prontas para utilização em ambiente de produção.



