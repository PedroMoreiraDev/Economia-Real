# Registro de Decisões Arquiteturais (ADRs) (ARCHITECTURE_DECISION_RECORDS.md)

Este documento registra o histórico formal de decisões arquiteturais do projeto, detalhando o contexto, alternativas consideradas, decisão aprovada, justificativa técnica, consequências e critérios de reavaliação.

---

## Índice de ADRs

| ID | Título | Status | Data |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Adoção de Monólito Modular em vez de Microsserviços | **Aprovado** | 2026-10-09 |
| **ADR-002** | Java 21 LTS e Spring Boot 3.3.x para o Backend | **Aprovado** | 2026-10-09 |
| **ADR-003** | PostgreSQL 16+ com Flyway para Persistência Relacional | **Aprovado** | 2026-10-09 |
| **ADR-004** | React 18+ com TypeScript Estrito e Tailwind CSS no Frontend | **Aprovado** | 2026-10-09 |
| **ADR-005** | Precisão Monetária Obrigatória com `BigDecimal` e Arredondamento Bancário | **Aprovado** | 2026-10-09 |
| **ADR-006** | Prevenção de Dupla Contagem em Faturas de Cartão de Crédito | **Aprovado** | 2026-10-09 |
| **ADR-007** | Arquitetura de IA com Provedores Intercambiáveis e Validação de Saída | **Aprovado** | 2026-10-09 |

---

## ADR-001: Adoção de Monólito Modular em vez de Microsserviços

### Contexto
O projeto é uma plataforma de gestão financeira pessoal que demanda consistência transacional estrita (ACID), integridade referencial forte entre transações, categorias, parcelas e orçamentos, além de agilidade inicial de desenvolvimento.

### Alternativas Consideradas
1. **Microsserviços distribuídos:** Dividir contas, transações e IA em serviços autônomos com mensageria.
2. **Monólito Modular:** Estruturar um único artefato backend em módulos bem delimitados com fronteiras em código.

### Decisão
Adotou-se o **Monólito Modular**. As fronteiras entre módulos (contas, transações, faturas, orçamentos, IA) serão mantidas via pacotes e interfaces no mesmo projeto Spring Boot.

### Consequências
- **Positivas:** Transações ACID locais nativas sem protocolo de duas fases (2PC/Saga); facilidade extrema de deploy e testes locais com Testcontainers; zero latência de rede entre módulos.
- **Negativas:** Requer disciplina rígida de arquitetura para impedir que módulos acessem diretamente repositórios internos uns dos outros.
- **Critério de Reavaliação:** Volume de tráfego que justifique escalonamento independente de módulos específicos ou equipe com mais de 30 desenvolvedores divididos por domínios.

---

## ADR-002: Java 21 LTS e Spring Boot 3.3.x para o Backend

### Contexto
Necessidade de uma base backend madura, fortemente tipada, com suporte a concorrência moderna, ecossistema corporativo estável e excelente suporte a testes de integração.

### Alternativas Consideradas
1. **Node.js (NestJS / TypeScript):** Ótimo compartilhamento de tipos com frontend, porém histórico menos padronizado para cálculos bancários complexos e suporte transacional corporativo.
2. **Go:** Alto desempenho e baixo footprint de memória, mas ausência de frameworks maduros de produtividade relacional como Spring Data/Flyway.
3. **Java 21 LTS + Spring Boot 3.3.x:** Suporte a Virtual Threads (Project Loom), Records, Pattern Matching, ecossistema maduro de segurança, persistência e testes.

### Decisão
Adotou-se **Java 21 LTS** e **Spring Boot 3.3.x** utilizando Apache Maven como gerenciador de dependências.

### Consequências
- **Positivas:** Robusto controle de tipos, bibliotecas ricas de finanças e parsing (OFX), suporte total ao Testcontainers e Spring Security consolidado.
- **Negativas:** Maior consumo inicial de memória que Go.

---

## ADR-003: PostgreSQL 16+ com Flyway para Persistência Relacional

### Contexto
O domínio financeiro exige integridade referencial rigorosa (Foreign Keys, Unique Constraints, Checks), suporte a transações ACID e consultas analíticas consolidadas de histórico e agregações.

### Alternativas Consideradas
1. **Bancos NoSQL (MongoDB):** Flexibilidade de schema, mas perda de integridade referencial nativa e complexidade para garantir consistência em faturas e saldos.
2. **PostgreSQL com Flyway:** Banco relacional líder, suporte nativo a tipos numéricos exatos (`NUMERIC`), índices parciais e migrações versionadas determinísticas.

### Decisão
Adotou-se o **PostgreSQL 16+** com **Flyway** gerenciando todas as alterações de esquema através de scripts SQL versionados.

### Consequências
- **Positivas:** Integridade matemática garantida no nível do banco; impossibilidade de migrações manuais silenciosas; rollback e auditoria total do schema.
- **Regra:** É estritamente proibido alterar o banco sem script Flyway correspondente (`V1__...sql`).

---

## ADR-004: React 18+ com TypeScript Estrito e Tailwind CSS no Frontend

### Contexto
A aplicação necessita de interface SaaS moderna, rica em microinterações, tabela de transações editável sincronizada em tempo real com gráficos e suporte responsivo a mobile e desktop.

### Alternativas Consideradas
1. **Next.js:** Excelente framework para SSR/SEO público, mas adiciona complexidade de runtime server-side desnecessária para uma aplicação autenticada (Single Page Application - SPA).
2. **React + TypeScript + Vite + Tailwind CSS:** Setup leve, rápido, alta velocidade de desenvolvimento (HMR), controle visual absoluto e ecossistema abundante de componentes acessíveis (Radix UI / shadcn/ui).

### Decisão
Adotou-se **React** com **TypeScript em modo estrito**, compilado via **Vite**, estilizado com **Tailwind CSS**.

### Consequências
- **Positivas:** Separação clara entre cliente SPA e API REST backend; alta flexibilidade para manipulação de gráficos e tabelas reativas locais.

---

## ADR-005: Precisão Monetária Obrigatória com `BigDecimal` e Arredondamento Bancário

### Contexto
O uso de tipos de ponto flutuante binário (`float` ou `double`) causa erros cumulativos graves de arredondamento em cálculos monetários (ex.: `0.1 + 0.2 = 0.30000000000000004`).

### Decisão
Todos os valores monetários no backend devem obrigatoriamente utilizar `java.math.BigDecimal` com escala 2 e arredondamento explícito (`RoundingMode.HALF_EVEN` / Banker's Rounding). No banco de dados, a representação deve ser `NUMERIC(15, 2)`.

### Consequências
- **Positivas:** Elimina qualquer discrepância de centavos em balanços e relatórios.
- **Regra:** Nenhum construtor de `BigDecimal(double)` é permitido; deve-se usar `BigDecimal.valueOf(long)` ou `new BigDecimal(String)`.

---

## ADR-006: Prevenção de Dupla Contagem em Faturas de Cartão de Crédito

### Contexto
Ao registrar despesas no cartão de crédito categorizadas (ex.: Restaurante R$ 100) e posteriormente debitar o pagamento da fatura da conta corrente (R$ 100), se o pagamento for classificado como despesa, o gasto total será reportado como R$ 200, distorcendo o orçamento.

### Decisão
O pagamento de fatura é formalmente classificado como **Operação de Liquidação de Passivo / Transferência**, debitando a conta bancária e creditando a fatura do cartão, sem gerar novo lançamento no somatório de despesas de consumo do usuário.

---

## ADR-007: Arquitetura de IA com Provedores Intercambiáveis, Sanitização LGPD e Validação de Saída

### Contexto
Modelos de inteligência artificial e serviços de transcrição evoluem rapidamente e possuem riscos de indisponibilidade, latência, alucinação numérica e vazamento de dados pessoais (PII).

### Decisão
Implementaram-se portas puras de domínio (`AiExtractionPort` e `AudioTranscriptionPort`) isolando qualquer SDK externo na camada de infraestrutura.
1. **Governança e LGPD:** Todos os textos passam por sanitização prévia (`PiiSanitizer`) antes do envio a provedores externos, mascarando CPFs, dados de cartão de crédito e e-mails.
2. **Resiliência e Zero Downtime:** O adaptador `GeminiAiService` implementa timeout rígido (8s) e aciona automaticamente o `NaturalLanguageRuleParser` determinístico em caso de ausência de credencial, falha de rede ou timeout.
3. **Zero Alucinação:** A IA nunca insere transações diretamente no banco nem calcula saldos; toda proposta é apresentada em interface para revisão e confirmação humana obrigatória antes da persistência.
- **Status:** **Aprovado e Implementado** na Fase 6.

---

## ADR-008: Gestão de Despesas Recorrentes, Ciclo de Vencimento e Prevenção de Duplicidade

### Contexto
Assinaturas de serviços e despesas fixas (Netflix, Internet, Aluguel) representam grande parte dos custos previsíveis do usuário. Se forem lançadas indiscriminadamente sem amarração temporal, geram duplicidade nos extratos contábeis.

### Decisão
1. **Modelagem de Domínio Pura (`RecurringBill`):**
   - Valores monetários estritamente em `BigDecimal` escala 2.
   - Vencimento parametrizado por `dayOfMonth` com ajuste determinístico para meses mais curtos (ex: dia 31 em fevereiro ajusta para dia 28/29).
2. **Prevenção de Dupla Contagem e Rastreabilidade:**
   - A efetivação do pagamento no mês gera uma transação com marcador explícito `RECURRING_BILL:<UUID>` no campo `notes`.
   - Se vinculada a cartão de crédito, gera compra de 1 parcela na fatura; se vinculada a conta bancária, debita a conta e gera despesa primária.
   - A listagem mensal computa `isPaidThisMonth` verificando a presença do marcador no mês corrente, impedindo lançamentos acidentais repetidos.
- **Status:** **Aprovado e Implementado** na Fase 8.

---

## ADR-009: Metas de Economia com Aporte Contábil Integrado e Exportação CSV em UTF-8 BOM

### Contexto
Usuários precisam poupar para reservas de emergência e metas de médio/longo prazo. Se os aportes forem meramente descritivos sem conexão com os saldos das contas bancárias, há descasamento patrimonial. Além disso, a exportação de dados contábeis para planilhas frequentemente falha no Excel com caracteres especiais do português.

### Decisão
1. **Domínio de Metas (`SavingsGoal`):**
   - Precisão estrita em `BigDecimal` escala 2 e arredondamento bancário `HALF_EVEN`.
   - Métodos de aporte (`deposit`) e resgate (`withdraw`) garantem que o saldo acumulado nunca seja negativo.
   - Cálculo determinístico de percentual de progresso e saldo restante.
2. **Integração Contábil Opcional com Contas Correntes:**
   - O usuário pode optar por movimentar a conta bancária no ato do aporte (gerando despesa contábil de reserva) ou no resgate (gerando receita de liquidação de reserva), com nota auditável `SAVINGS_GOAL_DEPOSIT:<UUID>`.
3. **Compatibilidade Universal de Exportação CSV:**
   - O extrato é gerado em UTF-8 com Byte Order Mark (`\uFEFF`) inicial e separador `;`, garantindo que o Microsoft Excel no Windows e outros visualizadores abram imediatamente com formatação perfeita e acentuação correta.
- **Status:** **Aprovado e Implementado** na Fase 9.

---

## ADR-010: Containerização de Produção Multi-Stage, Proxy Reverso Nginx e Pipeline CI/CD Automatizado

### Contexto
Para implantação em produção e ambientes de alta disponibilidade, a aplicação precisa ser empacotada de forma enxuta, segura (princípio de menor privilégio) e sem dependências do ambiente host do desenvolvedor. O frontend SPA deve ser servido com cache de ativos de alto desempenho e sem expor problemas de CORS, e o backend Java 21 deve ser configurado com restrições de memória containerizada (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`).

### Decisão
1. **Containerização Multi-Stage para Backend (Spring Boot / Java 21):**
   - Estágio de build com `maven:3.9.6-eclipse-temurin-21-alpine` com cache de dependências offline.
   - Estágio de runtime com `eclipse-temurin:21-jre-alpine`, criação de usuário de sistema não privilegiado (`appuser:appgroup`), eliminação de compiladores e SDKs na imagem final e healthcheck com `wget` em `/actuator/health`.
2. **Containerização Multi-Stage para Frontend (React / Nginx):**
   - Estágio de build com `node:20-alpine` (`npm ci` e `npm run build`).
   - Estágio de runtime com `nginx:1.25-alpine`, servindo o bundle estático com compressão gzip, cache de 1 ano para arquivos imutáveis com hash e proxy reverso para `/api/` e `/actuator/` apontando para o backend.
3. **Hardening de Segurança e Conformidade LGPD:**
   - Adição de `CorrelationIdFilter` (`X-Correlation-ID`) no MDC do Logback para rastreamento distribuído de requisições.
   - Endpoint `DELETE /api/v1/auth/me` (`DeleteAccountUseCase`) garantindo a exclusão total da conta do usuário e cascata relacional em todas as tabelas em estrita observância à LGPD.
4. **Pipeline de Integração Contínua (GitHub Actions):**
   - Workflow `.github/workflows/ci.yml` cobrindo validação de testes unitários/integração do backend (`mvn test`), checagem rigorosa de tipos TypeScript (`tsc --noEmit`), build Vite e lint de composição do Docker Compose.
- **Status:** **Aprovado e Implementado** na Fase 10.
