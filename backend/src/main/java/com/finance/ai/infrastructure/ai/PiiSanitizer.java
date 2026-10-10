package com.finance.ai.infrastructure.ai;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Componente responsável pela higienização e ofuscação de PII (Personally Identifiable Information)
 * antes do envio de texto a modelos externos de IA, em conformidade com a LGPD e ADR-007.
 */
@Component
public class PiiSanitizer {

    // Expressão regular para CPFs com ou sem pontuação
    private static final Pattern CPF_PATTERN = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");

    // Expressão regular para números de cartões (13 a 16 dígitos com ou sem espaços/hífens)
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile("\\b(?:\\d[ -]?){13,16}\\b");

    // Expressão regular para emails
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");

    // Expressão regular para telefones com DDD brasileiro (ex: (11) 98765-4321 ou 11987654321)
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\(?\\d{2}\\)?\\s?)?(?:9\\d{4}|[2-8]\\d{3})[- ]?\\d{4}");

    public String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String result = input;
        result = EMAIL_PATTERN.matcher(result).replaceAll("[EMAIL_REMOVIDO]");
        result = CPF_PATTERN.matcher(result).replaceAll("[CPF_REMOVIDO]");
        result = CREDIT_CARD_PATTERN.matcher(result).replaceAll("[CARTAO_REMOVIDO]");

        return result.trim();
    }
}
