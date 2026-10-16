package com.finance.ai.infrastructure.ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PiiSanitizerTest {

    private final PiiSanitizer sanitizer = new PiiSanitizer();

    @Test
    @DisplayName("Deve mascarar CPF com e sem pontuação preservando dados monetários")
    void shouldSanitizeCpf() {
        String input1 = "Gastei 50 no almoço com o cpf 123.456.789-00 no restaurante";
        String output1 = sanitizer.sanitize(input1);
        assertThat(output1).contains("[CPF_REMOVIDO]");
        assertThat(output1).doesNotContain("123.456.789-00");
        assertThat(output1).contains("50");

        String input2 = "Meu cpf é 12345678900 transferi 100 reais";
        String output2 = sanitizer.sanitize(input2);
        assertThat(output2).contains("[CPF_REMOVIDO]");
        assertThat(output2).doesNotContain("12345678900");
    }

    @Test
    @DisplayName("Deve mascarar números de cartão de crédito e e-mails")
    void shouldSanitizeCreditCardAndEmail() {
        String input = "Paguei 120 reais no cartão 4111 2222 3333 4444 do email joao@email.com";
        String output = sanitizer.sanitize(input);

        assertThat(output).contains("[CARTAO_REMOVIDO]");
        assertThat(output).contains("[EMAIL_REMOVIDO]");
        assertThat(output).doesNotContain("4111 2222 3333 4444");
        assertThat(output).doesNotContain("joao@email.com");
        assertThat(output).contains("120");
    }

    @Test
    @DisplayName("Deve mascarar números de telefone preservando texto financeiro normal")
    void shouldSanitizePhoneNumber() {
        String input1 = "Fiz pix para o telefone (11) 98765-4321 no valor de 80 reais";
        String output1 = sanitizer.sanitize(input1);
        assertThat(output1).contains("[TELEFONE_REMOVIDO]");
        assertThat(output1).doesNotContain("98765-4321");
        assertThat(output1).contains("80");

        String input2 = "Contato 9988-7766 pagamento de 250";
        String output2 = sanitizer.sanitize(input2);
        assertThat(output2).contains("[TELEFONE_REMOVIDO]");
        assertThat(output2).doesNotContain("9988-7766");
        assertThat(output2).contains("250");
    }

    @Test
    @DisplayName("Deve manter texto puro inalterado quando não há dados sensíveis")
    void shouldKeepNormalTextIntact() {
        String input = "Almoço executivo 45 reais hoje no débito";
        String output = sanitizer.sanitize(input);
        assertThat(output).isEqualTo(input);
    }

    @Test
    @DisplayName("Deve mascarar chaves PIX aleatórias (UUID) e dados de agência/conta")
    void shouldSanitizePixRandomKeyAndBankDetails() {
        String input = "Fiz pix de 350 para chave a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d na agencia 1234 conta 98765-4";
        String output = sanitizer.sanitize(input);

        assertThat(output).contains("[PIX_CHAVE_REMOVIDA]");
        assertThat(output).contains("[AGENCIA_REMOVIDA]");
        assertThat(output).contains("[CONTA_REMOVIDA]");
        assertThat(output).doesNotContain("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d");
        assertThat(output).doesNotContain("1234");
        assertThat(output).doesNotContain("98765-4");
        assertThat(output).contains("350");
    }
}
