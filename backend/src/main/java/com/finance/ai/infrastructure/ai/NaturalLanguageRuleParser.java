package com.finance.ai.infrastructure.ai;

import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extrator determinístico de entidades financeiras a partir de linguagem natural em Português.
 * Atua como motor de regras semânticas e fallback resiliente (Circuit Breaker / Offline Engine).
 */
@Component
public class NaturalLanguageRuleParser {

    private static final Pattern MONEY_PATTERN = Pattern.compile(
            "(?:r\\$\\s*|reais\\s*|valor\\s*(?:de)?\\s*)?(\\d{1,6}(?:[.,]\\d{1,2})?)\\s*(?:reais|conto|pila|mangos)?",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern DATE_DAY_PATTERN = Pattern.compile(
            "\\bdia\\s+(\\d{1,2})(?:/(\\d{1,2}))?\\b",
            Pattern.CASE_INSENSITIVE
    );

    public ExtractedTransaction parse(String naturalText, List<String> availableCategories, TransactionOrigin origin) {
        if (naturalText == null || naturalText.isBlank()) {
            return new ExtractedTransaction(
                    "Lançamento não identificado",
                    BigDecimal.ZERO,
                    TransactionType.EXPENSE,
                    LocalDate.now(),
                    null,
                    null,
                    null,
                    0.0,
                    List.of("Texto de entrada vazio ou não compreendido"),
                    origin != null ? origin : TransactionOrigin.AI_TEXT,
                    ""
            );
        }

        String lower = naturalText.toLowerCase(Locale.ROOT).trim();
        List<String> ambiguities = new ArrayList<>();

        // 1. Detectar Tipo
        TransactionType type = TransactionType.EXPENSE;
        if (lower.contains("recebi") || lower.contains("salário") || lower.contains("salario") ||
                lower.contains("vendi") || lower.contains("rendimento") || lower.contains("depósito") ||
                lower.contains("deposito") || lower.contains("pix recebido") || lower.contains("entrada de")) {
            type = TransactionType.INCOME;
        } else if (lower.contains("transferi") || lower.contains("transferência") || lower.contains("transferencia")) {
            type = TransactionType.TRANSFER;
        }

        // 2. Extrair Valor Monetário
        BigDecimal amount = extractAmount(lower);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = BigDecimal.ZERO;
            ambiguities.add("Não foi possível identificar o valor da transação com certeza.");
        }

        // 3. Extrair Data
        LocalDate accrualDate = extractDate(lower);

        // 4. Extrair Método de Pagamento
        String paymentMethod = extractPaymentMethod(lower);

        // 5. Sugerir Categoria
        String suggestedCategory = suggestCategory(lower, availableCategories);

        // 6. Extrair Descrição Limpa
        String description = cleanDescription(naturalText, lower);

        // 7. Calcular Score de Confiança
        double confidence = 0.5;
        if (amount.compareTo(BigDecimal.ZERO) > 0) confidence += 0.3;
        if (!description.equalsIgnoreCase("Lançamento") && description.length() > 2) confidence += 0.1;
        if (suggestedCategory != null) confidence += 0.1;
        confidence = Math.min(1.0, confidence);

        return new ExtractedTransaction(
                description,
                amount,
                type,
                accrualDate,
                suggestedCategory,
                null,
                paymentMethod,
                confidence,
                ambiguities,
                origin != null ? origin : TransactionOrigin.AI_TEXT,
                naturalText
        );
    }

    private BigDecimal extractAmount(String text) {
        // Padrão específico para "X reais", "R$ X" ou apenas número decimal isolado
        Pattern pattern = Pattern.compile("(?:r\\$\\s*|\\b)(\\d{1,6}(?:[.,]\\d{1,2})?)\\s*(?:reais|conto|pila|mangos)?\\b");
        Matcher matcher = pattern.matcher(text);

        BigDecimal foundAmount = null;
        while (matcher.find()) {
            String rawVal = matcher.group(1);
            if (rawVal == null || rawVal.isBlank()) continue;

            // Se for dia do mês isolado (ex: "dia 15"), não confundir com valor caso haja contexto
            int start = matcher.start();
            if (start >= 4) {
                String prefix = text.substring(Math.max(0, start - 4), start).trim();
                if (prefix.equalsIgnoreCase("dia")) {
                    continue;
                }
            }

            try {
                String normalized = rawVal.replace(',', '.');
                BigDecimal candidate = new BigDecimal(normalized).setScale(2, RoundingMode.HALF_EVEN);
                if (candidate.compareTo(BigDecimal.ZERO) > 0) {
                    foundAmount = candidate;
                }
            } catch (Exception ignored) {
            }
        }
        return foundAmount;
    }

    private LocalDate extractDate(String text) {
        LocalDate today = LocalDate.now();
        if (text.contains("anteontem")) {
            return today.minusDays(2);
        }
        if (text.contains("ontem")) {
            return today.minusDays(1);
        }
        if (text.contains("hoje")) {
            return today;
        }

        Matcher dayMatcher = DATE_DAY_PATTERN.matcher(text);
        if (dayMatcher.find()) {
            try {
                int day = Integer.parseInt(dayMatcher.group(1));
                int month = today.getMonthValue();
                if (dayMatcher.group(2) != null) {
                    month = Integer.parseInt(dayMatcher.group(2));
                }
                int year = today.getYear();
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {
            }
        }

        return today;
    }

    private String extractPaymentMethod(String text) {
        if (text.contains("crédito") || text.contains("credito") || text.contains("cartão") || text.contains("cartao")) {
            return "CREDIT_CARD";
        }
        if (text.contains("débito") || text.contains("debito")) {
            return "DEBIT_CARD";
        }
        if (text.contains("pix")) {
            return "PIX";
        }
        if (text.contains("dinheiro") || text.contains("espécie") || text.contains("especie") || text.contains("saque")) {
            return "CASH";
        }
        return null;
    }

    private String suggestCategory(String text, List<String> availableCategories) {
        // LinkedHashMap para garantir ordem determinística de prioridade
        Map<String, List<String>> keywords = new LinkedHashMap<>();
        keywords.put("Alimentação", List.of("almoço", "almoco", "jantar", "lanche", "restaurante", "ifood", "comida", "mercado", "supermercado", "padaria", "pizza", "café", "cafe"));
        keywords.put("Transporte", List.of("uber", "99", "táxi", "taxi", "ônibus", "onibus", "metrô", "metro", "gasolina", "combustível", "estacionamento", "pedágio"));
        keywords.put("Saúde", List.of("farmácia", "farmacia", "médico", "medico", "consulta", "remédio", "remedio", "dentista", "exame"));
        keywords.put("Moradia", List.of("aluguel", "condomínio", "condominio", "luz", "energia", "água", "agua", "internet", "gás", "gas"));
        keywords.put("Lazer", List.of("cinema", "filme", "show", "viagem", "jogo", "bar", "cerveja", "festa"));
        keywords.put("Educação", List.of("curso", "livro", "faculdade", "escola", "mensalidade"));
        keywords.put("Salário", List.of("salário", "salario", "pagamento", "remuneração", "holerite"));

        for (Map.Entry<String, List<String>> entry : keywords.entrySet()) {
            for (String kw : entry.getValue()) {
                // Correspondência por limite de palavra (\b) para não casar "gas" em "gastei"
                Pattern p = Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE);
                if (p.matcher(text).find()) {
                    // Verificar se existe na lista do usuário ou retornar o grupo padrão
                    if (availableCategories != null) {
                        for (String cat : availableCategories) {
                            if (cat.equalsIgnoreCase(entry.getKey()) || cat.toLowerCase().contains(kw)) {
                                return cat;
                            }
                        }
                    }
                    return entry.getKey();
                }
            }
        }

        if (availableCategories != null && !availableCategories.isEmpty()) {
            for (String cat : availableCategories) {
                Pattern p = Pattern.compile("\\b" + Pattern.quote(cat.toLowerCase()) + "\\b", Pattern.CASE_INSENSITIVE);
                if (p.matcher(text).find()) {
                    return cat;
                }
            }
        }

        return null;
    }

    private String cleanDescription(String originalText, String lowerText) {
        String cleaned = originalText;

        // Remover stopwords e padrões comuns mantendo o termo central
        String[] stopPatterns = {
                "(?i)\\b(gastei|comprei|paguei|recebi|valor\\s+de|transferi)\\b",
                "(?i)\\b(hoje|ontem|anteontem)\\b",
                "(?i)\\b(no\\s+crédito|no\\s+credito|no\\s+débito|no\\s+debito|no\\s+pix|via\\s+pix|em\\s+dinheiro|no\\s+cartão)\\b",
                "(?i)\\b(r\\$\\s*\\d+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?\\s*(?:reais|conto|pila|mangos)?)\\b",
                "(?i)\\bdia\\s+\\d{1,2}(?:/\\d{1,2})?\\b"
        };

        for (String pattern : stopPatterns) {
            cleaned = cleaned.replaceAll(pattern, " ");
        }

        cleaned = cleaned.replaceAll("[,.;:!?]", " ").replaceAll("\\s+", " ").trim();

        if (cleaned.isBlank() || cleaned.length() < 2) {
            // Se limpou tudo, tenta inferir algo significativo do original
            if (lowerText.contains("almoço") || lowerText.contains("almoco")) return "Almoço";
            if (lowerText.contains("uber")) return "Uber";
            if (lowerText.contains("mercado")) return "Mercado";
            if (lowerText.contains("farmácia") || lowerText.contains("farmacia")) return "Farmácia";
            return "Lançamento Rápido";
        }

        // Capitalizar primeira letra
        return cleaned.substring(0, 1).toUpperCase(Locale.ROOT) + cleaned.substring(1);
    }
}
