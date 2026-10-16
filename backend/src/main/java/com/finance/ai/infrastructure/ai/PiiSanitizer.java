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

    // Expressão regular para telefones fixos e celulares brasileiros (com ou sem DDD)
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\(\\d{2}\\)\\s*(?:9\\d{4}|[2-9]\\d{3})[- ]?\\d{4}|\\b\\d{2}\\s+(?:9\\d{4}|[2-9]\\d{3})[- ]\\d{4}\\b|\\b(?:9\\d{4}|[2-9]\\d{3})[- ]\\d{4}\\b)");

    // Expressão regular para chaves PIX aleatórias (UUID v4)
    private static final Pattern PIX_RANDOM_KEY_PATTERN = Pattern.compile("\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\\b");

    // Expressão regular para menções a agência e conta bancária
    private static final Pattern BANK_AGENCY_PATTERN = Pattern.compile("(?i)\\b(?:ag[êe]ncia|ag\\.?)\\s*[:.]?\\s*\\d{1,5}\\b");
    private static final Pattern BANK_ACCOUNT_PATTERN = Pattern.compile("(?i)\\b(?:conta(?:\\s*corrente)?|c/?c\\.?)\\s*[:.]?\\s*\\d{1,12}-?[\\dxX]\\b");

    public String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String result = input;
        result = EMAIL_PATTERN.matcher(result).replaceAll("[EMAIL_REMOVIDO]");
        result = CPF_PATTERN.matcher(result).replaceAll("[CPF_REMOVIDO]");
        result = CREDIT_CARD_PATTERN.matcher(result).replaceAll("[CARTAO_REMOVIDO]");
        result = PHONE_PATTERN.matcher(result).replaceAll("[TELEFONE_REMOVIDO]");
        result = PIX_RANDOM_KEY_PATTERN.matcher(result).replaceAll("[PIX_CHAVE_REMOVIDA]");
        result = BANK_AGENCY_PATTERN.matcher(result).replaceAll("[AGENCIA_REMOVIDA]");
        result = BANK_ACCOUNT_PATTERN.matcher(result).replaceAll("[CONTA_REMOVIDA]");

        return result.trim();
    }
}
