---
name: frontend-engineering
description: >-
  Orienta o desenvolvimento de interface com React, TypeScript estrito, Tailwind CSS,
  componentes acessíveis (shadcn/ui), tabelas editáveis e gráficos reativos.
  Use ao criar componentes visuais, telas, hooks de estado e integração com a API REST.
---

# Skill: Frontend Engineering & UX

Esta skill orienta a construção de interfaces web SaaS modernas, responsivas, visualmente refinadas e acessíveis.

## 1. Objetivo
Garantir uma experiência de usuário fluida, com acabamento visual profissional, sincronização em tempo real entre tabelas e gráficos, feedback de carregamento/erro claro e tipagem estrita no TypeScript.

## 2. Quando Utilizar Esta Skill
- Ao desenvolver ou refatorar telas, componentes visuais e hooks customizados no React.
- Ao estilizar elementos com Tailwind CSS e componentes no padrão Radix UI / shadcn/ui.
- Ao implementar tabelas de transações editáveis e gráficos de dashboards financeiros.
- Ao integrar o frontend com a API REST utilizando TanStack Query.

## 3. Padrões de Engenharia Frontend
- **TypeScript Estrito:**
  - Código com `strict: true`. Proibido o uso de `any` sem justificativa e tipagem de escape.
  - Tipos e interfaces devem mapear exatamente os contratos DTO definidos na API REST.
- **Estrutura de Pastas Sugerida:**
  ```text
  src/
  ├── components/       # Componentes visuais atômicos e de design system (botões, modais)
  ├── features/         # Módulos por domínio (transactions, dashboard, cards, budgets)
  │   ├── components/   # Componentes específicos da feature
  │   ├── hooks/        # Hooks de estado e dados (TanStack Query)
  │   └── types/        # Tipos TypeScript locais
  ├── services/         # Clientes de API HTTP (Axios / Fetch tipado)
  └── lib/              # Utilitários de formatação de moeda (Intl), datas e classes
  ```
- **Sincronização entre Tabela e Gráficos:**
  - Tabelas e gráficos devem compartilhar a mesma consulta de dados do TanStack Query (`queryKey` consistente).
  - Atualizações otimistas ou invalidação de query após edição de transação para manter os gráficos sincronizados instantaneamente.
- **Formatação de Moeda e Datas na UI:**
  - Formatação monetária via API nativa do navegador: `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - Proibido implementar regras contábeis complexas no frontend; a UI apenas renderiza os dados formatados providos pelo backend.

## 4. Regras Obrigatórias
- **Design Rico e Moderno:** Utilize paleta de cores equilibrada, estados de hover, suporte a modo escuro/claro e microinterações polidas.
- **Tratamento de Estados:** Toda tela deve tratar explicitamente os 4 estados visuais:
  1. Carregando (`loading / skeleton`).
  2. Sucesso com dados (`data`).
  3. Estado vazio amigável (`empty state`).
  4. Erro com opção de tentar novamente (`error state`).

## 5. Referências
- [Requisitos de Produto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/PRODUCT_REQUIREMENTS.md)
- [Convenções de API REST](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/API_CONVENTIONS.md)
