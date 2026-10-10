package com.finance.ai.domain.financial.importer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Parser determinístico para arquivos CSV de extratos bancários.
 * Suporta separadores de coluna vírgula (,) e ponto-e-vírgula (;),
 * além de formatos de data e moeda brasileiros e internacionais.
 */
public class CsvParser {

    public List<ParsedTransactionItem> parse(InputStream inputStream) throws IOException {
        return parse(inputStream, false);
    }

    public List<ParsedTransactionItem> parse(InputStream inputStream, boolean isCreditCard) throws IOException {
        List<ParsedTransactionItem> items = new ArrayList<>();

        try (var reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return items;

            char separator = detectSeparator(headerLine);
            String[] headers = splitLine(headerLine, separator);

            boolean isCard = isCreditCard || detectCreditCardHeaders(headers);

            int dateCol = findColumnIndex(headers, "data", "date", "dt");
            int amountCol = findColumnIndex(headers, "valor", "amount", "valor (r$)", "valor r$");
            int descCol = findColumnIndex(headers, "descricao", "descrição", "description", "memo", "historico", "histórico", "estabelecimento", "title");
            int idCol = findColumnIndex(headers, "id", "identificador", "fitid", "external_id");

            if (dateCol == -1 || amountCol == -1 || descCol == -1) {
                // Tenta fallback com colunas padrão 0: Data, 1: Descrição, 2: Valor
                if (headers.length >= 3) {
                    dateCol = 0;
                    descCol = 1;
                    amountCol = 2;
                } else {
                    return items;
                }
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] cols = splitLine(line, separator);
                if (cols.length <= Math.max(dateCol, Math.max(amountCol, descCol))) continue;

                LocalDate date = parseDate(cols[dateCol]);
                BigDecimal amount = parseAmount(cols[amountCol]);
                String description = cols[descCol].trim().replaceAll("^\"|\"$", "");
                String extId = (idCol != -1 && idCol < cols.length) ? cols[idCol].trim() : null;

                if (date != null && amount != null && !description.isBlank()) {
                    boolean isExpense;
                    if (isCard) {
                        // Em faturas de cartão de crédito, compras são listadas com valor positivo e representam despesas.
                        // Pagamentos de fatura ou estornos são créditos/liquidação de saldo.
                        if (isPaymentOrCredit(description)) {
                            isExpense = false;
                        } else {
                            isExpense = true;
                        }
                    } else {
                        // Extrato bancário de conta corrente tradicional:
                        // Valores negativos são despesas/débitos e positivos são receitas/depósitos.
                        isExpense = amount.compareTo(BigDecimal.ZERO) < 0;
                    }

                    BigDecimal absoluteAmount = amount.abs().setScale(2, RoundingMode.HALF_EVEN);
                    items.add(new ParsedTransactionItem(extId, date, absoluteAmount, description, isExpense));
                }
            }
        }

        return items;
    }

    private boolean detectCreditCardHeaders(String[] headers) {
        boolean hasTitle = false;
        boolean hasAmount = false;
        for (String h : headers) {
            String clean = h.toLowerCase().trim().replaceAll("^\"|\"$", "");
            if (clean.equals("title") || clean.equals("estabelecimento")) hasTitle = true;
            if (clean.equals("amount") || clean.contains("valor")) hasAmount = true;
            if (clean.contains("fatura") || clean.contains("cartao") || clean.contains("cartão") || clean.contains("card")) return true;
        }
        return hasTitle && hasAmount;
    }

    private boolean isPaymentOrCredit(String description) {
        if (description == null) return false;
        String lower = description.toLowerCase();
        return lower.contains("pagamento de fatura")
                || lower.contains("pagamento recebido")
                || lower.contains("pagamento efetuado")
                || lower.contains("pgto fatura")
                || lower.contains("fatura paga")
                || lower.contains("estorno")
                || lower.contains("crédito em fatura")
                || lower.contains("credito em fatura");
    }

    private char detectSeparator(String headerLine) {
        int commas = countOccurrences(headerLine, ',');
        int semicolons = countOccurrences(headerLine, ';');
        return semicolons > commas ? ';' : ',';
    }

    private int countOccurrences(String str, char ch) {
        int count = 0;
        for (char c : str.toCharArray()) {
            if (c == ch) count++;
        }
        return count;
    }

    private String[] splitLine(String line, char separator) {
        // Separação simples respeitando aspas
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (char c : line.toCharArray()) {
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == separator && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private int findColumnIndex(String[] headers, String... candidates) {
        for (int i = 0; i < headers.length; i++) {
            String h = headers[i].toLowerCase().trim().replaceAll("^\"|\"$", "");
            for (String cand : candidates) {
                if (h.equalsIgnoreCase(cand) || h.contains(cand)) {
                    return i;
                }
            }
        }
        return -1;
    }

    private LocalDate parseDate(String rawDate) {
        if (rawDate == null) return null;
        String clean = rawDate.trim().replaceAll("^\"|\"$", "");

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );

        for (var f : formatters) {
            try {
                return LocalDate.parse(clean, f);
            } catch (DateTimeParseException ignored) {}
        }
        return null;
    }

    private BigDecimal parseAmount(String rawAmount) {
        if (rawAmount == null) return null;
        String clean = rawAmount.trim()
                .replaceAll("^\"|\"$", "")
                .replace("R$", "")
                .replace("r$", "")
                .trim();

        if (clean.isBlank()) return null;

        // Trata formato brasileiro: "1.250,50" -> "1250.50"
        if (clean.contains(",") && clean.contains(".")) {
            clean = clean.replace(".", "").replace(",", ".");
        } else if (clean.contains(",")) {
            clean = clean.replace(",", ".");
        }

        try {
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
