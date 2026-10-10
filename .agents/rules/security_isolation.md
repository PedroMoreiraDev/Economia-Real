---
trigger: always_on
description: Garante isolamento estrito de usuários, proteção contra vazamentos e privacidade.
---

# Regra: Segurança e Isolamento de Usuários

1. **Isolamento de Dados (Anti-IDOR):** Todas as consultas no banco de dados e regras de negócio devem validar que os dados pertencem ao usuário autenticado (`WHERE user_id = :authenticatedUserId`).
2. **Proteção de Segredos:** Proibição de comitar senhas, chaves de API, tokens JWT ou credenciais no repositório Git. Use sempre variáveis de ambiente.
3. **Logs Seguros:** Proibido registrar senhas, tokens completos, dados de cartão ou áudios nos logs da aplicação.
4. **Governança de IA:** Dados pessoais identificáveis (PII) e identificadores bancários sensíveis não devem ser enviados a provedores externos de IA.
