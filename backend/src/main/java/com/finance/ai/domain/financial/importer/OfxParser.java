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
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parser determinístico para arquivos bancários no padrão OFX (Open Financial Exchange).
 * Suporta formatos OFX 1.x (SGML) e OFX 2.x (XML).
 */
public class OfxParser {

    private static final Pattern STMTTRN_PATTERN = Pattern.compile("<STMTTRN>(.*?)</STMTTRN>", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    private static final Pattern TRNTYPE_PATTERN = Pattern.compile("<TRNTYPE>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern DTPOSTED_PATTERN = Pattern.compile("<DTPOSTED>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRNAMT_PATTERN = Pattern.compile("<TRNAMT>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern FITID_PATTERN = Pattern.compile("<FITID>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern MEMO_PATTERN = Pattern.compile("<MEMO>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern NAME_PATTERN = Pattern.compile("<NAME>([^<\\r\\n]+)", Pattern.CASE_INSENSITIVE);

    public List<ParsedTransactionItem> parse(InputStream inputStream) throws IOException {
        return parse(inputStream, false);
    }

    public List<ParsedTransactionItem> parse(InputStream inputStream, boolean isCreditCard) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (var reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }

        String content = sb.toString();
        List<ParsedTransactionItem> items = new ArrayList<>();

        boolean isCard = isCreditCard
                || content.toLowerCase().contains("<ccstmttrnrs>")
                || content.toLowerCase().contains("<ccstmtrs>")
                || content.toLowerCase().contains("<creditcardmsgsrsv1>");

        // Se contiver fechamento </STMTTRN>, usa o padrão de bloco
        if (content.contains("</STMTTRN>") || content.contains("</stmttrn>")) {
            Matcher m = STMTTRN_PATTERN.matcher(content);
            while (m.find()) {
                String block = m.group(1);
                var item = parseBlock(block, isCard);
                if (item != null) items.add(item);
            }
        } else {
            // Em formato SGML puro sem </STMTTRN>, quebra por <STMTTRN>
            String[] blocks = content.split("(?i)<STMTTRN>");
            for (int i = 1; i < blocks.length; i++) {
                var item = parseBlock(blocks[i], isCard);
                if (item != null) items.add(item);
            }
        }

        return items;
    }

    private ParsedTransactionItem parseBlock(String block, boolean isCard) {
        String dtPosted = extractTag(DTPOSTED_PATTERN, block);
        String trnAmt = extractTag(TRNAMT_PATTERN, block);
        if (dtPosted == null || trnAmt == null) return null;

        LocalDate date = parseOfxDate(dtPosted);
        BigDecimal rawAmount;
        try {
            rawAmount = new BigDecimal(trnAmt.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }

        String trnType = extractTag(TRNTYPE_PATTERN, block);
        String fitId = extractTag(FITID_PATTERN, block);
        String memo = extractTag(MEMO_PATTERN, block);
        String name = extractTag(NAME_PATTERN, block);

        String description = (memo != null && !memo.isBlank()) ? memo.trim() : (name != null ? name.trim() : "Lançamento OFX");
        String typeUpper = trnType != null ? trnType.toUpperCase().trim() : "";

        boolean isExpense;
        if (isCard) {
            // Em fatura de cartão:
            // Pagamentos de fatura ou estornos/créditos não são despesas
            if (isPaymentOrCredit(description) || "CREDIT".equals(typeUpper) || "DEP".equals(typeUpper)) {
                isExpense = false;
            } else {
                // Compras (mesmo com valor positivo ou negativo no OFX) são despesas
                isExpense = true;
            }
        } else {
            // Extrato de conta bancária padrão:
            if ("DEBIT".equals(typeUpper) || "POS".equals(typeUpper) || "CHECK".equals(typeUpper) || "FEE".equals(typeUpper) || "SRVCHG".equals(typeUpper)) {
                isExpense = true;
            } else if ("CREDIT".equals(typeUpper) || "DEP".equals(typeUpper) || "DIRECTDEP".equals(typeUpper)) {
                isExpense = false;
            } else {
                isExpense = rawAmount.compareTo(BigDecimal.ZERO) < 0;
            }
        }

        BigDecimal absoluteAmount = rawAmount.abs().setScale(2, RoundingMode.HALF_EVEN);

        return new ParsedTransactionItem(
                fitId != null ? fitId.trim() : null,
                date,
                absoluteAmount,
                description,
                isExpense
        );
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

    private String extractTag(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private LocalDate parseOfxDate(String rawDate) {
        // Datas no OFX costumam ser YYYYMMDD ou YYYYMMDDHHMMSS[tz]
        String clean = rawDate.replaceAll("\\[.*?\\]", "").trim();
        if (clean.length() >= 8) {
            String ymd = clean.substring(0, 8);
            return LocalDate.parse(ymd, DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
        return LocalDate.now();
    }
}
