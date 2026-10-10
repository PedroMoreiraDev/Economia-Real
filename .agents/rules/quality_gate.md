---
trigger: always_on
description: Proíbe mascaramento de testes e exige evidência empírica de validação.
---

# Regra: Padrão Rígido de Qualidade e Validação

1. **Evidência Obrigatória:** Nunca declare que um teste, compilação ou validação passou sem ter executado o comando correspondente e analisado a saída real.
2. **Proibição de Desabilitar Testes:** É expressamente proibido utilizar `@Disabled`, comentar testes ou afrouxar asserções para mascarar falhas.
3. **Casos de Borda:** Toda alteração em regras financeiras deve conter testes cobrindo valores limítrofes, arredondamentos e cenários de erro.
