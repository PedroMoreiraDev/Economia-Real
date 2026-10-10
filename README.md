# Plataforma de Gestão Financeira Pessoal com Inteligência Artificial

Plataforma moderna, intuitiva e segura para controle orçamentário, gestão de receitas/despesas, compras parceladas, faturas de cartão de crédito, importação e conciliação bancária (CSV/OFX), despesas recorrentes, metas de economia com progresso visual, dashboard analítico e recomendações com suporte de Inteligência Artificial.

---

## 1. Visão Geral do Produto

O objetivo da plataforma é capacitar o usuário a obter clareza total sobre sua saúde financeira através de:
- **Gestão Determinística e Rigorosa:** Todos os cálculos de saldos, parcelas, juros, orçamentos e consolidações financeiras são executados exclusivamente por código determinístico backend (`BigDecimal` escala 2 e arredondamento `HALF_EVEN`), garantindo precisão matemática absoluta e prevenção contra dupla contagem.
- **Inteligência Artificial Auxiliar e Segura:** Recursos de transcrição por áudio (microfone do navegador via Web Audio API) e extração em linguagem natural com fallback offline determinístico, com confirmação humana obrigatória e sanitização de dados sensíveis (LGPD).
- **Interface SaaS Moderna:** Dashboard financeiro em tempo real, gráficos de barras reativos SVG, monitoramento de *Burn Rate*, cartões de metas com barras gradientes, e tabela de transações com exportação CSV compatível nativamente com Microsoft Excel (UTF-8 BOM).
- **Pronto para Produção:** Containerização multi-stage (Nginx Alpine e Eclipse Temurin 21 JRE com usuário não-root), orquestração via Docker Compose e pipeline de CI/CD automatizado via GitHub Actions.

---

## 2. Stack Tecnológica

### Backend
- **Linguagem & Plataforma:** Java 21 LTS (Oracle JDK 21.0.8).
- **Framework Principal:** Spring Boot 3.3.5.
- **Arquitetura:** Monólito Modular com Clean Architecture e DDD pragmático.
- **Gerenciador de Dependências:** Apache Maven 3.9 com wrapper executável `mvnw.cmd`.
- **Persistência & Banco:** PostgreSQL 16+ com migrações versionadas via Flyway (`V1__init_schema.sql`, `V2__add_refresh_tokens.sql`) e suporte a H2 em memória no perfil de desenvolvimento local.
- **Segurança:** Spring Security stateless com JWT (HMAC-SHA256), hashing BCrypt (custo 12), cabeçalhos de proteção (FrameOptions DENY, XSS, MIME nosniff) e conformidade LGPD (Direito ao Esquecimento).
- **Documentação de API:** OpenAPI 3.0 / SpringDoc Swagger UI (`/swagger-ui.html`).
- **Observabilidade:** Spring Boot Actuator (`/actuator/health`) e MDC com `X-Correlation-ID`.
- **Qualidade & Testes:** 85 testes automatizados (JUnit 5, Mockito, AssertJ, MockMvc).

### Frontend
- **Biblioteca Base:** React 18+ com TypeScript em modo estrito (`strict: true`).
- **Build & Dev Server:** Vite 5.
- **Estilização:** Tailwind CSS com tema moderno Dark Slate e detalhes esmeralda/brand.
- **Ícones:** Lucide React.
- **Áudio & Voz:** Web Audio API com gravação nativa no navegador.
- **Servidor de Produção:** Nginx 1.25 Alpine com proxy reverso e compressão Gzip.

### Infraestrutura & DevOps
- **Produção:** `docker-compose.prod.yml` orquestrando PostgreSQL 16 + Backend Spring Boot + Frontend Nginx.
- **CI/CD:** Pipeline automatizado no GitHub Actions (`.github/workflows/ci.yml`).

---

## 3. Como Executar o Projeto

### 3.1. Modo Produção com Docker (Recomendado para Deploy)

Para subir a stack inteira (PostgreSQL 16 + Backend + Frontend Nginx) com um único comando:

**No Windows:**
Dê dois cliques no script [iniciar-producao.bat](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/iniciar-producao.bat) ou execute no terminal:
```powershell
.\iniciar-producao.bat
```

**No Linux / macOS ou via Docker Compose diretamente:**
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

- **Frontend SPA (Nginx):** `http://localhost`
- **Backend REST API:** `http://localhost:8080/api/v1/health`
- **Documentação Swagger:** `http://localhost:8080/swagger-ui.html`
- **Banco PostgreSQL:** `localhost:5432`

---

### 3.2. Modo Desenvolvimento Local (Sem Necessidade de Docker)

O projeto possui o perfil `dev` com banco de dados relacional H2 em memória compatível com PostgreSQL, permitindo rodar e testar imediatamente sem qualquer dependência externa:

**1. Iniciar o Backend:**
Dê dois cliques no arquivo [iniciar-backend.bat](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/iniciar-backend.bat) ou execute:
```powershell
cd backend
cmd.exe /c "mvnw.cmd test"
& 'C:\Program Files\Java\jdk-21\bin\java.exe' "-Dspring.profiles.active=dev" -jar target\finance-backend-0.1.0-SNAPSHOT.jar
```

**2. Iniciar o Frontend:**
Dê dois cliques no arquivo [iniciar-frontend.bat](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/iniciar-frontend.bat) ou execute:
```powershell
cd frontend
npm run dev
```

- A aplicação estará acessível em: `http://localhost:5173` ou `http://localhost:3000`

---

## 4. Funcionalidades Entregues

1. **Gestão de Identidade e Autenticação:**
   - Cadastro, login, tokens JWT stateless e exclusão de conta em conformidade com a LGPD (`DELETE /api/v1/auth/me`).
2. **Contas, Categorias e Transações:**
   - Contas correntes, investimentos, poupança e dinheiro em espécie com isolamento por usuário (Anti-IDOR).
   - Transações com competência vs. caixa e consolidação determinística com `BigDecimal`.
3. **Cartões de Crédito e Parcelamento:**
   - Divisão de parcelas determinística com alocação de resíduo de centavo na 1ª parcela.
   - Liquidação de faturas com débito bancário sem dupla contagem contábil (`INVOICE_PAYMENT`).
4. **Importação e Conciliação Bancária:**
   - Parsers flexíveis para arquivos CSV e OFX com deduplicação por FITID e assinatura temporal.
5. **Inteligência Artificial (Texto e Voz):**
   - Transcrição de áudio via microfone e extração semântica com Google Gemini e fallback offline via regras.
6. **Dashboard Analítico e Orçamentos:**
   - Velocidade de queima diária (*Burn Rate*), projeção linear, gráficos de barras SVG dos últimos 6 meses e metas por categoria.
7. **Despesas Fixas e Recorrentes:**
   - Controle de assinaturas mensais, semanais e anuais com detecção de vencimento em 7 dias e lançamento com 1 clique.
8. **Metas de Economia e Exportação de Dados:**
   - Metas de poupança com barra gradiente de progresso e aportes/resgates integrados a contas bancárias.
   - Exportação contábil para CSV em UTF-8 com Byte Order Mark (`\uFEFF`) para compatibilidade perfeita com Microsoft Excel.
9. **Observabilidade e CI/CD:**
   - Correlation ID propagado no MDC, Actuator exposto, Docker multi-stage e pipeline GitHub Actions.

---

## 5. Estrutura do Repositório

```text
├── .agents/                               # Configurações do agente Antigravity (skills e regras)
│   ├── rules/                             # Regras operacionais permanentes (always_on)
│   └── skills/                            # 13 skills especializadas do projeto
├── .github/workflows/                     # Pipeline de CI/CD automatizado no GitHub Actions
│   └── ci.yml                             # Build, testes e validação Docker
├── backend/                               # Aplicação Spring Boot (Java 21 LTS)
│   ├── Dockerfile                         # Build multi-stage para produção (Eclipse Temurin JRE)
│   ├── src/main/java/                     # Código de aplicação, domínio e infraestrutura
│   ├── src/main/resources/db/migration/   # Migrações Flyway (PostgreSQL)
│   └── src/test/java/                     # 85 testes automatizados (JUnit 5 + MockMvc)
├── frontend/                              # Aplicação Single Page Application (React + Vite)
│   ├── Dockerfile                         # Build multi-stage para produção (Nginx Alpine)
│   ├── nginx.conf                         # Configuração SPA e proxy reverso para a API
│   └── src/                               # Componentes, hooks e contexto de autenticação
├── docs/                                  # Documentação permanente de engenharia
│   ├── architecture/                      # Arquitetura, ADRs (ADR-001 a ADR-010) e modelo de dados
│   ├── development/                       # Roadmap de implementação e status atualizado
│   ├── product/                           # Requisitos funcionais e glossário de domínio
│   └── security/                          # Privacidade (LGPD) e modelo de ameaças
├── docker-compose.prod.yml                # Orquestração completa para ambiente de produção
├── docker-compose.yml                     # Infraestrutura de banco de dados para dev
├── iniciar-producao.bat                   # Script de 1 clique para produção no Windows
├── iniciar-backend.bat                    # Script para rodar o backend localmente
└── README.md                              # Este documento
```

---

## 6. Documentação de Referência

- [Instruções Globais de Agentes (AGENTS.md)](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/AGENTS.md)
- [Status Atual do Projeto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/PROJECT_STATUS.md)
- [Registro de Decisões Arquiteturais (ADRs)](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
- [Arquitetura de Software](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE.md)
- [Requisitos de Produto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/PRODUCT_REQUIREMENTS.md)
- [Segurança e Privacidade](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/security/SECURITY_AND_PRIVACY.md)
