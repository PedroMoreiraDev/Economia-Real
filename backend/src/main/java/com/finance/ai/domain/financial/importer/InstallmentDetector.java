package com.finance.ai.domain.financial.importer;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detector e formatador determinístico para compras parceladas em extratos e faturas de cartão.
 * Identifica padrões como "Havan 3/5", "HAVAN 03/05", "Renner (2/10)", "Magalu 2 de 4" e "Parc. 01/03".
 * Permite projetar parcelas restantes para meses futuros e prevenir duplicações nas importações posteriores.
 */
public class InstallmentDetector {

    public record InstallmentMatch(
            int current,
            int total,
            String rawCurrent,
            String rawTotal,
            String cleanMerchant,
            int start,
            int end
    ) {}

    // Padrão que detecta "3/5", "03/05", "(3/5)", "3 de 5", "parc 3/5", "parcela 3/5"
    private static final Pattern PATTERN = Pattern.compile(
            "(?i)(?:\\b(?:parcela|parc\\.?)\\s*)?\\(?(\\d{1,2})\\s*(?:/|\\s+de\\s+)\\s*(\\d{1,2})\\)?",
            Pattern.CASE_INSENSITIVE
    );

    // Padrão para evitar casar com datas com ano (ex: 15/10/2026 ou 15/10/26)
    private static final Pattern DATE_WITH_YEAR_PATTERN = Pattern.compile(
            "\\d{1,2}/\\d{1,2}/\\d{2,4}"
    );

    public Optional<InstallmentMatch> detect(String description) {
        if (description == null || description.isBlank()) {
            return Optional.empty();
        }

        // Se a descrição contém uma data completa dd/mm/aaaa ou dd/mm/aa, precisamos ter cuidado
        // para não casar a data como se fosse parcela
        Matcher dateMatcher = DATE_WITH_YEAR_PATTERN.matcher(description);
        int dateStart = -1;
        int dateEnd = -1;
        if (dateMatcher.find()) {
            dateStart = dateMatcher.start();
            dateEnd = dateMatcher.end();
        }

        Matcher matcher = PATTERN.matcher(description);
        while (matcher.find()) {
            int matchStart = matcher.start();
            int matchEnd = matcher.end();

            // Se o match estiver dentro de uma data completa com ano (ex: 15/10/2026), ignore
            if (dateStart != -1 && matchStart >= dateStart && matchEnd <= dateEnd) {
                continue;
            }

            // Verifica se logo após o match vem uma barra com mais dígitos (ex: "15/10/24")
            if (matchEnd < description.length() && description.charAt(matchEnd) == '/') {
                continue;
            }

            String currentStr = matcher.group(1);
            String totalStr = matcher.group(2);

            try {
                int current = Integer.parseInt(currentStr);
                int total = Integer.parseInt(totalStr);

                // Validações de integridade de parcela:
                // 1. Total deve ser no mínimo 2 (se total for 1, é parcela única / à vista)
                // 2. Parcela atual deve ser >= 1 e <= total
                // 3. Total não deve ser excessivo (ex: até 99 parcelas)
                if (current >= 1 && total >= 2 && current <= total && total <= 99) {
                    String cleanMerchant = extractCleanMerchant(description, matchStart, matchEnd);
                    if (!cleanMerchant.isBlank()) {
                        return Optional.of(new InstallmentMatch(
                                current,
                                total,
                                currentStr,
                                totalStr,
                                cleanMerchant,
                                matchStart,
                                matchEnd
                        ));
                    }
                }
            } catch (NumberFormatException ignored) {}
        }

        return Optional.empty();
    }

    public String generateNextInstallmentDescription(String originalDescription, InstallmentMatch match, int nextInstallment) {
        if (originalDescription == null || match == null || nextInstallment < 1 || nextInstallment > match.total()) {
            return originalDescription;
        }

        String matchedSnippet = originalDescription.substring(match.start(), match.end());
        boolean hasLeadingZero = match.rawCurrent().startsWith("0") && match.rawCurrent().length() == 2;
        boolean usesDe = matchedSnippet.toLowerCase().contains(" de ");
        boolean hasParentheses = matchedSnippet.contains("(") && matchedSnippet.contains(")");

        String formattedNumbers;
        if (usesDe) {
            formattedNumbers = hasLeadingZero
                    ? String.format("%02d de %02d", nextInstallment, match.total())
                    : String.format("%d de %d", nextInstallment, match.total());
        } else {
            formattedNumbers = hasLeadingZero
                    ? String.format("%02d/%02d", nextInstallment, match.total())
                    : String.format("%d/%d", nextInstallment, match.total());
        }

        if (hasParentheses && !formattedNumbers.startsWith("(")) {
            formattedNumbers = "(" + formattedNumbers + ")";
        }

        String newSnippet;
        String lowerSnippet = matchedSnippet.toLowerCase();
        if (lowerSnippet.startsWith("parcela ")) {
            newSnippet = "Parcela " + formattedNumbers;
        } else if (lowerSnippet.startsWith("parc. ")) {
            newSnippet = "Parc. " + formattedNumbers;
        } else if (lowerSnippet.startsWith("parc ")) {
            newSnippet = "Parc " + formattedNumbers;
        } else {
            newSnippet = formattedNumbers;
        }

        return originalDescription.substring(0, match.start()) + newSnippet + originalDescription.substring(match.end());
    }

    public String extractCleanMerchant(String description, int matchStart, int matchEnd) {
        String before = description.substring(0, matchStart);
        String after = description.substring(matchEnd);
        String rawMerchant = (before + " " + after).trim();

        return rawMerchant.toLowerCase()
                .replaceAll("(?i)\\b(parcela|parc|parc\\.)\\b", "")
                .replaceAll("[^a-zA-Z0-9áéíóúâêîôûãõç]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
