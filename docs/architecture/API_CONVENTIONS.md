# Convenções de API REST (API_CONVENTIONS.md)

Este documento define os padrões de design, contratos, protocolos de comunicação, tratamento de erros e convenções de nomenclatura para as APIs RESTful do backend.

---

## 1. Princípios Gerais e Nomenclatura de Recursos

1. **Substantivos no Plural:** Endpoints utilizam substantivos em minúsculas e no plural para representar coleções (ex.: `/api/v1/transactions`, `/api/v1/accounts`, `/api/v1/categories`).
2. **Sub-recursos Hierárquicos:** Relações diretas são aninhadas quando o sub-recurso não existe fora do contexto do pai (ex.: `/api/v1/credit-cards/{cardId}/invoices`).
3. **Verbos HTTP Padrão:**
   - `GET`: Leitura segura e idempotente de recursos.
   - `POST`: Criação de novo recurso ou operação não-idempotente.
   - `PUT`: Substituição completa de um recurso existente.
   - `PATCH`: Atualização parcial de campos específicos.
   - `DELETE`: Remoção lógica ou física do recurso.
4. **Versionamento na URL:** Todas as rotas de negócio incluem o prefixo `/api/v1/`.
5. **Formato de Dados:** Requisições e respostas utilizam estritamente `application/json` codificado em UTF-8.

---

## 2. Tipagem de Valores e Datas

- **Valores Monetários:** Serializados como strings ou números decimais com exatamente duas casas (ex.: `"149.90"` ou `149.90`). No JSON Schema/OpenAPI são descritos como `number(double)` ou `string(decimal)`.
- **Datas:**
  - Datas de competência / calendário: Formato ISO-8601 `YYYY-MM-DD` (ex.: `"2026-10-09"`).
  - Momentos de auditoria / eventos: Formato ISO-8601 UTC com sufixo `Z` (ex.: `"2026-10-09T14:30:00Z"`).
- **Identificadores:** UUID v4 em minúsculas com hifens (ex.: `"550e8400-e29b-41d4-a716-446655440000"`).

---

## 3. Padrão de Resposta de Sucesso

### 3.1. Criação de Recurso (`POST`)
- Status HTTP `201 Created`.
- Header `Location: /api/v1/transactions/{id}`.
- Payload com o recurso criado:
```json
{
  "id": "c1f7b029-798c-4f12-a7d0-1090fceb9821",
  "type": "EXPENSE",
  "amount": "149.90",
  "accrualDate": "2026-10-09",
  "description": "Supermercado Mensal",
  "categoryId": "2f49c58e-0129-4591-91a5-812ea21d96b1",
  "accountId": "a3b98721-e018-4721-9988-cb91280a821e",
  "status": "COMPLETED",
  "createdAt": "2026-10-09T12:00:00Z"
}
```

### 3.2. Consulta Paginada (`GET`)
Consultas com paginação utilizam os query parameters `page` (0-indexed), `size` (padrão 20, máximo 100) e `sort` (ex.: `accrualDate,desc`).
```json
{
  "content": [
    {
      "id": "c1f7b029-798c-4f12-a7d0-1090fceb9821",
      "type": "EXPENSE",
      "amount": "149.90",
      "accrualDate": "2026-10-09",
      "description": "Supermercado Mensal"
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

## 4. Tratamento de Erros Padronizado (RFC 7807 - Problem Details)

Em caso de erro, a API nunca expõe stack traces ou estruturas ad-hoc. Retorna o padrão RFC 7807 `application/problem+json`:

```json
{
  "type": "https://api.finance.local/errors/validation-failed",
  "title": "Erro de Validação",
  "status": 400,
  "detail": "Um ou mais campos da requisição possuem valores inválidos.",
  "instance": "/api/v1/transactions",
  "timestamp": "2026-10-09T12:05:30Z",
  "correlationId": "8f9021a9-b3a1-43ef-b921-912a78129034",
  "invalidParams": [
    {
      "name": "amount",
      "reason": "O valor da transação deve ser estritamente positivo."
    },
    {
      "name": "accrualDate",
      "reason": "A data de competência é obrigatória."
    }
  ]
}
```

### Principais Códigos de Status HTTP Utilizados
- `200 OK`: Consulta ou atualização bem-sucedida.
- `201 Created`: Criação de entidade bem-sucedida.
- `204 No Content`: Remoção bem-sucedida sem corpo de resposta.
- `400 Bad Request`: Payload com erro sintático ou validação de negócio reprovada.
- `401 Unauthorized`: Token JWT ausente, expirado ou inválido.
- `403 Forbidden`: Usuário autenticado tentando acessar recurso pertencente a outro usuário (`tenant isolation`).
- `404 Not Found`: Recurso não localizado para o usuário autenticado.
- `409 Conflict`: Conflito de integridade (ex.: transação duplicada confirmada, e-mail já cadastrado).
- `422 Unprocessable Entity`: Violação de invariante de negócio (ex.: divisão de parcelas inconsistente).
- `500 Internal Server Error`: Erro inesperado não capturado no servidor (logado com correlation ID).

---

## 5. Autenticação e Contexto de Segurança

1. **Header Obrigatório:** Requisições protegidas devem enviar o cabeçalho:
   ```http
   Authorization: Bearer <jwt_token>
   ```
2. **Correlation ID:** Toda requisição pode enviar (ou o servidor gera se ausente) o header:
   ```http
   X-Correlation-ID: <uuid>
   ```
   Esse identificador é propagado para todos os logs estruturados no backend e devolvido na resposta HTTP para facilitar auditoria.

---

## 6. Documentação OpenAPI 3.0 / Swagger

- Toda rota REST deve conter anotações SpringDoc OpenAPI (`@Operation`, `@ApiResponse`, `@Parameter`).
- A documentação interativa é disponibilizada localmente em:
  - JSON OpenAPI: `/v3/api-docs`
  - Swagger UI: `/swagger-ui.html`
