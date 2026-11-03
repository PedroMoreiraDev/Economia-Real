---
tokens:
  colors:
    primary-dark: "#102D25"
    primary: "#1C4939"
    primary-hover: "#163B2E"
    canvas-light: "#E8E4D9"
    surface-light: "#F7F5F0"
    surface-elevated-light: "#FFFFFF"
    canvas-dark: "#0A1D17"
    surface-dark: "#102D25"
    surface-elevated-dark: "#16382E"
    accent-gold: "#D4A94F"
    accent-gold-hover: "#C3963B"
    accent-gold-soft: "#F7EFE0"
    text-primary-light: "#102D25"
    text-secondary-light: "#3D5A50"
    text-muted-light: "#647D74"
    text-primary-dark: "#E8E4D9"
    text-secondary-dark: "#B7C6BE"
    text-muted-dark: "#829B90"
    border-light: "#D5CFC0"
    border-subtle-light: "#E2DDD0"
    border-dark: "#214E3E"
    success: "#237B53"
    warning: "#D4A94F"
    danger: "#C94A4A"
  typography:
    font-family-sans: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    font-family-serif: "'Instrument Serif', Georgia, serif"
    font-family-mono: "'JetBrains Mono', monospace"
    h1:
      size: "2.5rem"
      line-height: "1.15"
      weight: "800"
      tracking: "-0.025em"
    h2:
      size: "1.75rem"
      line-height: "1.2"
      weight: "700"
      tracking: "-0.02em"
    body:
      size: "0.9375rem"
      line-height: "1.55"
      weight: "500"
    numeric-kpi:
      size: "1.75rem"
      line-height: "1.1"
      weight: "800"
      tracking: "-0.03em"
  spacing:
    xs: "0.25rem"
    sm: "0.5rem"
    md: "1rem"
    lg: "1.5rem"
    xl: "2rem"
    2xl: "3rem"
  rounded:
    sm: "0.5rem"
    md: "0.75rem"
    lg: "1rem"
    xl: "1.25rem"
    2xl: "1.5rem"
    full: "9999px"
  components:
    button-primary:
      bg: "{colors.primary}"
      bg-hover: "{colors.primary-dark}"
      text: "{colors.canvas-light}"
      border: "{colors.primary-dark}"
      radius: "{rounded.xl}"
    button-gold:
      bg: "{colors.accent-gold}"
      bg-hover: "{colors.accent-gold-hover}"
      text: "{colors.primary-dark}"
      border: "{colors.accent-gold-hover}"
      radius: "{rounded.xl}"
    card-surface:
      bg-light: "{colors.surface-light}"
      bg-dark: "{colors.surface-dark}"
      border-light: "{colors.border-light}"
      border-dark: "{colors.border-dark}"
      radius: "{rounded.xl}"
---

# Overview

O sistema de design do **Economia Real** adota uma estética de **Fintech Moderna e Gestão Financeira Pessoal Moderna**. Em vez de elementos gamificados infantis ou azuis corporativos genéricos, a marca transmite solidez institucional, clareza contábil e sofisticação silenciosa.

A direção visual combina a profundidade orgânica do **Verde Escuro (`#102D25`)** e do **Verde Institucional (`#1C4939`)** com o calor tátil do **Off-white (`#E8E4D9`)** e a precisão de prestígio do **Dourado (`#D4A94F`)**.

# Colors

- **Verde Escuro (`#102D25`)**: Cor de autoridade máxima. Utilizada na tipografia principal no modo claro, cabeçalhos executivos, barras de navegação de destaque e superfície primária no modo escuro.
- **Verde (`#1C4939`)**: Cor de ação primária da marca, botões principais, indicadores de saúde financeira pessoal e blocos estruturais.
- **Off-white (`#E8E4D9`)**: Fundo base (canvas) do aplicativo no modo claro e cor tipográfica principal sobre fundos verde-escuros. Proporciona conforto ocular superior ao branco puro (`#FFFFFF`), reduzindo a fadiga visual em análises financeiras prolongadas. Superfícies de cartões utilizam um tom levemente mais claro (`#F7F5F0` / `#FAF8F4`) para criar hierarquia de camadas limpa.
- **Dourado (`#D4A94F`)**: Cor de destaque nobre, reservada para recursos de Inteligência Artificial, indicadores de economia líquida (patrimônio acumulado), selos de destaque, estados ativos selecionados e chamadas para ação de alto valor.

# Typography

- **Sans-serif Primária (`Plus Jakarta Sans` / `Inter`)**: Geométrica, altamente legível em densidades variadas de tabelas e painéis executivos.
- **Display Editorial (`Instrument Serif`)**: Usada pontualmente em palavras-chave de destaque na Landing Page para conferir assinatura de Private Banking.
- **Monospace / Tabular (`JetBrains Mono` + `tabular-nums`)**: Obrigatória para cifras monetárias, percentuais, datas de extrato e contadores regressivos, garantindo alinhamento vertical perfeito nas colunas.

# Layout

- **Hierarquia de Superfícies**:
  - **Modo Claro**: Canvas em `#E8E4D9` → Seções agrupadoras em `#EFECE3` → Cartões em `#F7F5F0` / `#FFFFFF` com bordas arquitetônicas de `1px solid #D5CFC0`.
  - **Modo Escuro**: Canvas em `#0A1D17` → Cartões em `#102D25` → Elementos elevados em `#16382E` / `#1C4939` com bordas sutis em `#214E3E`.
- **Respiro e Alinhamento**: Grid máximo de `1600px` no dashboard com espaçamento consistente e separação clara entre regime de caixa, competência e metas.

# Elevation & Depth

- Substituição de bordas inferiores grossas estilo cartoon (`border-b-4`) por **elevação arquitetônica de fintech**: bordas precisas de `1px`, sombras difusas suaves (`0 4px 20px -2px rgba(16, 45, 37, 0.06)`) e micro-transições de `150ms–200ms` com leve brilho superior interno (`inset 0 1px 0 rgba(255, 255, 255, 0.12)`).

# Shapes

- **Cartões e Painéis**: `rounded-2xl` (`1rem` a `1.25rem`) para um equilíbrio moderno entre seriedade bancária e fluidez digital.
- **Botões e Inputs**: `rounded-xl` (`0.75rem`) com foco nítido em `#D4A94F` / `#1C4939`.
- **Badges e Pílulas**: `rounded-lg` ou `rounded-full` com fundo translúcido e borda fina de `1px`.

# Components

- **Botão Primário (`.btn-duo-blue`, `.btn-real-blue`, `.btn-duo-green`)**: Fundo `#1C4939`, hover `#102D25`, texto `#E8E4D9`, borda sutil `#102D25`.
- **Botão Prestige / IA (`.btn-duo-purple`, `.btn-duo-yellow`)**: Fundo `#D4A94F`, hover `#C3963B`, texto `#102D25` em negrito, transmitindo exclusividade e inteligência.
- **Cartão Executivo (`.card-duo`)**: Superfície `#F7F5F0` (claro) / `#102D25` (escuro), borda fina `#D5CFC0` / `#214E3E`, sem peso caricatural.
- **Hero Banner & Navegação**: Estética de terminal de gestão financeira pessoal com fundo `#102D25` / `#1C4939`, acentos em `#D4A94F` e tipografia em `#E8E4D9`.

# Do's and Don'ts

- **DO**: Usar sempre `tabular-nums` em qualquer valor em Reais (`R$`) ou porcentagem (`%`).
- **DO**: Preservar contraste WCAG AA/AAA entre `#102D25` e `#E8E4D9`, e usar `#102D25` como cor de texto sobre botões dourados (`#D4A94F`).
- **DON'T**: Nunca usar roxo neon, azul elétrico ou verde limão saturado.
- **DON'T**: Nunca usar sombras 3D infantis ou emojis caricatos (como cartolas) na interface executiva.

