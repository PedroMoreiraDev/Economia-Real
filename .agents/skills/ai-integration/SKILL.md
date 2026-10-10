---
name: ai-integration
description: >-
  Orienta a integração de IA generativa, extração estruturada de dados,
  transcrição de áudio, proteção contra alucinação numérica e governança de custos e prompts.
  Use ao implementar recursos de IA, processamento de linguagem natural ou transcrição de voz.
---

# Skill: AI Integration & Engineering

Esta skill define as regras de governança, arquitetura e segurança para integração de Inteligência Artificial generativa e serviços de transcrição na plataforma.

## 1. Objetivo
Permitir recursos inteligentes de categorização assistida, respostas contextuais e registro por áudio/texto de forma segura, com zero alucinação numérica e total proteção da privacidade do usuário.

## 2. Quando Utilizar Esta Skill
- Ao implementar portas e adaptadores para modelos de linguagem (LLMs) ou transcrição (Whisper/Speech-to-Text).
- Ao desenhar prompts versionados para extração de entidades financeiras.
- Ao definir schemas JSON para saídas estruturadas de IA.
- Ao tratar falhas, timeouts, limites de orçamento e prompt injections.

## 3. Os 5 Mandamentos da IA Financeira
1. **A IA Nunca Calcula Números:** Saldos, parcelas, percentuais de orçamento e projeções são calculados pelo código determinístico Java. A IA apenas recebe esses valores pré-computados para formular explicações textuais.
2. **Entrada Não-Confiável:** Toda resposta gerada por um modelo de IA é considerada não-confiável e deve ser validada contra um JSON Schema estrito antes de qualquer uso.
3. **Confirmação Humana Obrigatória:** Qualquer transação proposta por IA (seja por áudio ou texto) exige revisão e confirmação explícita do usuário na interface antes de ser persistida.
4. **Proteção Contra Alucinações:** A IA é instruída estritamente a não inferir informações ausentes (se o usuário não informou o meio de pagamento, a IA deve marcar como nulo para o usuário escolher).
5. **Privacidade e Isolamento:** Nenhum dado pessoal identificável (PII como CPF, nome completo ou número de conta) pode ser transmitido a provedores externos sem anonimização prévia.

## 4. Padrão Estrutural de Extração (JSON Schema)
Exemplo de contrato esperado para a proposta de transação gerada pela IA:
```json
{
  "description": "Almoço Executivo",
  "amount": 35.50,
  "suggestedCategoryName": "Alimentação",
  "accrualDate": "2026-10-09",
  "suggestedPaymentMethod": "CREDIT_CARD",
  "confidenceScore": 0.95,
  "ambiguities": []
}
```

## 5. Resiliência Operacional
- **Timeouts Rígidos:** Chamadas de IA devem expirar em no máximo 10 segundos.
- **Circuit Breaker & Fallback:** Se o provedor de IA falhar ou estiver indisponível, o sistema deve apresentar uma mensagem amigável e permitir o preenchimento manual da transação sem bloquear o usuário.

## 6. Referências
- [Segurança e Privacidade](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/security/SECURITY_AND_PRIVACY.md)
- [ADR-007: Arquitetura de IA](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/ARCHITECTURE_DECISION_RECORDS.md)
