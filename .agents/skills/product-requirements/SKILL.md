---
name: product-requirements
description: >-
  Orienta a análise de requisitos de produto, escopo do MVP, histórias de usuário,
  critérios de aceitação e identificação de lacunas funcionais.
  Use ao analisar novas demandas, refinar funcionalidades ou validar critérios de entrega.
---

# Skill: Product Requirements

Esta skill define os métodos para transformar ideias e intenções em requisitos de produto claros, delimitados e verificáveis.

## 1. Objetivo
Garantir que as funcionalidades implementadas resolvam os problemas reais do usuário final, respeitem o escopo delimitado do MVP e contenham critérios de aceitação objetivos.

## 2. Quando Utilizar Esta Skill
- Antes de iniciar o design ou código de qualquer funcionalidade.
- Ao identificar requisitos implícitos ou lacunas de especificação na solicitação do usuário.
- Para verificar se uma funcionalidade pertence ao MVP ou deve ser postergada para fases futuras.
- Para redigir ou validar critérios de aceitação com base em [PRODUCT_REQUIREMENTS.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/PRODUCT_REQUIREMENTS.md).

## 3. Procedimento de Refinamento de Requisitos
1. **Identificação da Dor Real:** Qual problema financeiro esta funcionalidade resolve?
2. **Checagem de Escopo (MVP vs. Futuro):** A funcionalidade é estritamente necessária no MVP ou é um incremento de longo prazo?
3. **Mapeamento de Casos de Borda:** Como o sistema se comporta em cenários atípicos (ex.: divisão com dízima, ausência de categoria, áudio inaudível, saldo insuficiente)?
4. **Definição de Critérios de Aceitação no Formato BDD (Given-When-Then):**
   - *Dado que* o usuário possui compras no cartão de crédito...
   - *Quando* ele realiza a quitação da fatura...
   - *Então* o saldo bancário é debitado, mas o montante de despesas mensais não é duplicado.

## 4. Regras Obrigatórias
- **Sem Suposições Ocultas:** Se faltar uma definição de negócio crítica (ex.: cálculo de juros de mora ou política de estorno), registre a dúvida formalmente.
- **Fidelidade ao MVP:** Não expandir o escopo da tarefa sem aprovação do Tech Lead.
- **Centrado no Usuário:** Todas as mensagens de erro ou validações voltadas ao usuário devem ser claras, orientadas à ação e em Português Brasil.

## 5. Referências
- [Requisitos de Produto](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/PRODUCT_REQUIREMENTS.md)
- [Glossário de Domínio Financeiro](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/product/DOMAIN_GLOSSARY.md)
