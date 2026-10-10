---
name: security-and-privacy
description: >-
  Orienta as práticas de segurança da informação, autorização por usuário,
  proteção contra IDOR/BOLA, sanitização de uploads, gestão de segredos e conformidade com a LGPD.
  Use ao implementar autenticação, filtros de segurança, uploads ou envio de dados para serviços externos.
---

# Skill: Security & Privacy (LGPD)

Esta skill define as diretrizes obrigatórias para proteção de dados financeiros sensíveis, isolamento lógico de usuários e conformidade com a LGPD.

## 1. Objetivo
Garantir que nenhum dado de usuário seja exposto indevidamente, que os endpoints sejam estritamente protegidos contra vulnerabilidades comuns (OWASP Top 10) e que as exigências de privacidade da LGPD sejam cumpridas por design.

## 2. Quando Utilizar Esta Skill
- Ao implementar ou modificar endpoints e filtros de segurança no Spring Security.
- Ao construir consultas ao banco para assegurar a cláusula de isolamento de usuário.
- Ao implementar o fluxo de upload e parsing de arquivos bancários (CSV e OFX).
- Ao desenhar integrações externas com provedores de IA ou transcrição de áudio.

## 3. Checklist de Segurança Obrigatório
1. **Isolamento de Tenant / Usuário (Prevenção de IDOR):**
   - O backend extrai o `userId` autenticado a partir do token JWT e o injeta como filtro em **todas** as queries de leitura, atualização ou exclusão.
   - Proibido confiar em `userId` recebido no corpo da requisição ou na URL.
2. **Proteção de Uploads:**
   - Limite de tamanho máximo de 10 MB configurado no Spring Boot.
   - Validação de conteúdo em memória (parsers XML configurados contra XXE).
3. **Gestão de Segredos:**
   - Proibição absoluta de hardcoding de chaves de API, senhas ou tokens no código-fonte.
   - Segredos devem ser injetados exclusivamente via variáveis de ambiente (`ENVIRONMENT_VARIABLES`).
4. **Política de Logs Limpos:**
   - Proibido registrar senhas, tokens completos, áudios ou números de documentos em logs.
5. **Conformidade LGPD:**
   - Permitir a exclusão completa da conta do usuário com limpeza relacional (`DELETE CASCADE`).
   - Dados financeiros anonimizados antes do tráfego para qualquer modelo externo de IA.

## 4. Referências
- [Segurança e Privacidade (LGPD)](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/security/SECURITY_AND_PRIVACY.md)
- [Convenções de API REST](file:///c:/Users/Pedro/OneDrive/Área%20de%20Trabalho/desenvolvimento/docs/architecture/API_CONVENTIONS.md)
