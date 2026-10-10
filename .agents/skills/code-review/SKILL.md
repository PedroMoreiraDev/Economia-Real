---
name: code-review
description: >-
  Orienta a revisão crítica e independente de código: segurança, complexidade desnecessária,
  integridade financeira, performance, ausência de regressões e legibilidade.
  Use antes de finalizar qualquer implementação para auditar a própria entrega.
---

# Skill: Independent Code Review

Esta skill estabelece a postura crítica e a metodologia de revisão técnica independente para avaliar o código antes de qualquer entrega ou consolidação.

## 1. Objetivo
Identificar precocemente defeitos ocultos, vulnerabilidades de segurança, complexidade acidental, violações de integridade financeira e regressões antes que cheguem a ambientes superiores.

## 2. Quando Utilizar Esta Skill
- Imediatamente após a implementação e validação de testes (Etapa E do ciclo de engenharia).
- Antes de submeter o relatório final de uma tarefa ao usuário.
- Ao auditar contribuições ou refatorações de código.

## 3. Checklist de Revisão Técnica (Os 7 Pilares)

1. **Correção Funcional e Regras de Negócio:**
   - O código resolve exatamente o que foi solicitado nos requisitos sem introduzir comportamentos indesejados?
2. **Integridade Financeira:**
   - Algum valor monetário utilizou `float` ou `double`?
   - O pagamento de fatura corre risco de causar dupla contagem nas despesas?
   - A divisão de parcelas garante a soma exata dos centavos na primeira parcela?
3. **Segurança e Isolamento de Usuário:**
   - Há possibilidade de vazamento de dados entre usuários (IDOR / BOLA)? Todas as queries filtram pelo `user_id` autenticado?
   - Há dados sensíveis expostos em logs?
   - Uploads de arquivos e entradas de IA foram sanitizados?
4. **Arquitetura e Limites de Módulos:**
   - O código do domínio permanece puro, sem referências a frameworks de apresentação ou banco?
   - Foi evitado o vazamento de detalhes de persistência para a API?
5. **Simplicidade e Legibilidade (KISS, YAGNI, DRY):**
   - Foi criada alguma abstração prematura (fábrica sem necessidade, interface com única implementação trivial)?
   - O código é autoexplicativo, com nomes claros e métodos pequenos?
6. **Qualidade dos Testes Automatizados:**
   - Os testes cobrem cenários de erro e casos de borda reais?
   - Existem testes desabilitados ou que passam sem testar nada (falsos positivos)?
7. **Performance e Banco de Dados:**
   - Existe risco de consultas N+1 no Hibernate?
   - As queries mais frequentes utilizam índices adequados definidos em [DATA_MODEL.md](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/DATA_MODEL.md)?

## 4. Postura do Revisor
- Não seja condescendente com a própria solução. Procure ativamente falhas, premissas frágeis e simplificações indevidas.
- Se um defeito for encontrado, corrija-o antes de declarar a tarefa como concluída.

## 5. Referências
- [Fluxo Permanente de Trabalho](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/development/DEVELOPMENT_WORKFLOW.md)
- [Estratégia de Testes](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/quality/TEST_STRATEGY.md)
