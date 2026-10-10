# Requisitos de Produto (PRODUCT_REQUIREMENTS.md)

Este documento especifica a visão de produto, problemas a solucionar, público-alvo, personas, requisitos funcionais e não-funcionais, limites do MVP e critérios de aceitação.

---

## 1. Problema e Proposta de Valor

### 1.1. O Problema
A maioria das pessoas perde o controle financeiro devido a:
- Falta de visibilidade unificada entre contas bancárias correntes, cartões de crédito e despesas recorrentes.
- Dificuldade em controlar parcelamentos futuros, gerando surpresas no fechamento de faturas.
- Fricção e lentidão para registrar despesas cotidianas manuais.
- Ferramentas tradicionais que exigem preenchimento exaustivo e oferecem pouca inteligência prática de economia.
- Risco de alucinação e falta de precisão em assistentes de IA genéricos que tentam calcular orçamentos sem rigor determinístico.

### 1.2. A Proposta de Valor
Uma plataforma web SaaS de gestão financeira pessoal que alia:
- **Cálculos matemáticos exatos e determinísticos** para saldos, projeções, limites e parcelas.
- **Registro sem fricção via texto e áudio**, com extração estruturada de entidades e confirmação explícita do usuário.
- **Importação inteligente de extratos (CSV e OFX)** com deduplicação automatizada.
- **Visualização analítica moderna e ágil**, com tabela de transações editável sincronizada em tempo real com gráficos e metas.
- **Recomendações financeiras acionáveis geradas por IA**, contextualizadas com base nos dados reais do usuário e sem expor dados privados a modelos externos sem governança.

---

## 2. Público-Alvo e Personas

- **Profissionais e Estudantes Organizados:** Buscam centralizar receitas, controlar cartões e acompanhar metas de economia mensais.
- **Usuários com Alto Volume de Compras Parceladas:** Necessitam visualizar o comprometimento da renda para os próximos 6 a 12 meses antes de contrair novas despesas.
- **Usuários em Transição Financeira:** Precisam identificar categorias com ritmo de gastos desproporcional e receber sugestões práticas de corte de custos.

---

## 3. Delimitação do Escopo: MVP vs. Visão de Longo Prazo

| Funcionalidade | Escopo do MVP (Fases 1 a 6) | Visão de Longo Prazo (Fases 7+) |
| :--- | :--- | :--- |
| **Autenticação & Isolamento** | Cadastro e login local com JWT, isolamento estrito por usuário | Autenticação federada (OAuth2 / Google / Apple), 2FA |
| **Contas e Cartões** | Múltiplas contas correntes e cartões de crédito manuais | Open Finance / Conexões bancárias automáticas |
| **Transações** | Cadastro manual de receitas, despesas, transferências e estornos | Regras avançadas de split e conciliação multiusuário |
| **Recorrências & Parcelas** | Despesas fixas recorrentes e compras parceladas em faturas | Simulações complexas de amortização de financiamentos |
| **Importação de Extratos** | Arquivos CSV e OFX com preview e deduplicação | Importação de faturas em PDF via OCR / LLM |
| **Orçamentos & Metas** | Limites mensais por categoria e metas de poupança | Orçamento preditivo dinâmico baseado em sazonalidade |
| **Dashboard** | Visão mensal, saldo, categorias e gráficos sincronizados | Comparativos multianuais avançados e relatórios fiscais |
| **Inteligência Artificial** | Resumo contextual e categorização assistida | Assistente proativo conversacional com alertas inteligentes |
| **Entrada por Áudio** | Mock/Pipeline preparado para captura, transcrição e extração | Reconhecimento de voz em tempo real offline / WebAssembly |

---

## 4. Requisitos Funcionais (RF)

### 4.1. Módulo de Contas e Transações
- **RF01:** O sistema deve permitir criar, editar e desativar contas financeiras (carteira, conta corrente, poupança, investimento) e cartões de crédito.
- **RF02:** O sistema deve registrar transações financeiras com valor (`BigDecimal`), data de competência, data de liquidação, categoria, tipo (Receita, Despesa, Transferência), conta/cartão de origem e descrição.
- **RF03:** O sistema deve permitir a categorização hierárquica (ex.: Moradia > Aluguel, Alimentação > Supermercado).
- **RF04:** O sistema deve manter o histórico completo de transações e suportar filtros por período, categoria, conta, tipo e busca textual.
- **RF05:** O sistema deve identificar e alertar sobre transações potencialmente duplicadas (mesmo valor, mesma data ou próxima, mesma descrição).
- **RF06:** O sistema deve registrar a origem de cada transação (Manual, Importação CSV/OFX, Extração IA por Texto ou Áudio).

### 4.2. Módulo de Cartões, Parcelas e Recorrências
- **RF07:** O sistema deve gerenciar compras parceladas, gerando as parcelas individuais vinculadas às respectivas faturas mensais conforme data de fechamento e vencimento.
- **RF08:** O sistema deve distinguir categoricamente a compra no cartão de crédito da liquidação da fatura, impedindo a dupla contagem no fluxo de caixa e no orçamento.
- **RF09:** O sistema deve permitir cadastrar despesas recorrentes/fixas (aluguel, condomínio, assinaturas) e projetar seus vencimentos futuros.
- **RF10:** O sistema deve permitir registrar estornos e reembolsos com vínculo à transação original.

### 4.3. Módulo de Importação de Extratos
- **RF11:** O sistema deve importar extratos bancários nos formatos CSV e OFX.
- **RF12:** O sistema deve exibir tela de pré-visualização (preview) antes de persistir as transações importadas, permitindo ao usuário revisar categorias e desmarcar registros.
- **RF13:** O sistema nunca deve importar silenciosamente transações duplicadas ou incertas.

### 4.4. Módulo de Orçamentos e Metas
- **RF14:** O sistema deve permitir definir limites de gastos mensais por categoria e acompanhar o ritmo de consumo semanal.
- **RF15:** O sistema deve emitir alertas visuais de aproximação (80%) e extrapolação (100%+) do orçamento.
- **RF16:** O sistema deve gerenciar metas de economia com saldo acumulado e data-alvo.

### 4.5. Módulo de Inteligência Artificial e Entrada por Áudio
- **RF17:** O sistema deve permitir que o usuário digite ou fale um comando em linguagem natural (ex.: *"Gastei 25 reais no almoço no cartão Nubank"*).
- **RF18:** O sistema deve transcrever o áudio e extrair uma proposta de transação estruturada (tipo, valor, categoria sugerida, meio de pagamento, data).
- **RF19:** O sistema deve sempre solicitar a confirmação ou edição do usuário antes de registrar a transação gerada por IA.
- **RF20:** A IA pode fornecer explicações contextuais e insights sobre tendências de gastos, mas todo cálculo de saldo e totalização deve ser provido diretamente pelo backend determinístico.

---

## 5. Requisitos Não-Funcionais (RNF)

- **RNF01 (Precisão Numérica):** Nenhum valor monetário pode sofrer imprecisão de ponto flutuante. O backend deve utilizar `BigDecimal` com escala e arredondamento explícito (`RoundingMode.HALF_EVEN`).
- **RNF02 (Segurança & Isolamento):** Nenhuma informação de um usuário pode ser acessível a outro. Toda requisição autenticada deve validar a posse do recurso (`tenant/user isolation`).
- **RNF03 (Privacidade & LGPD):** Dados pessoais sensíveis e transações financeiras não devem ser compartilhados com provedores externos de IA sem anonimização prévia ou consentimento explícito. Chaves de API nunca devem ser expostas no cliente.
- **RNF04 (Performance da Interface):** A sincronização entre tabela editável e gráficos no frontend deve ocorrer em menos de 100ms em operações locais e o carregamento do dashboard não deve exceder 1.5s sob condições normais de rede.
- **RNF05 (Compatibilidade & Responsividade):** A interface deve funcionar perfeitamente em navegadores modernos (Chrome, Firefox, Safari, Edge) em resoluções mobile (a partir de 375px) e desktop (até 4K).
- **RNF06 (Testabilidade e Confiabilidade):** Módulos críticos de domínio financeiro devem possuir cobertura de testes unitários abrangente cobrindo casos de borda (divisão de parcelas com dízimas, anos bissextos, viradas de fatura).

---

## 6. Critérios de Aceitação Gerais

1. Todos os cálculos matemáticos batem centavo a centavo com os extratos consolidados.
2. Nenhuma transação é duplicada no fechamento de fatura de cartão.
3. Importações exigem confirmação do preview pelo usuário.
4. Qualquer sugestão de IA exige revisão explícita antes da gravação.
5. Todos os testes automatizados do pipeline executam com sucesso.
