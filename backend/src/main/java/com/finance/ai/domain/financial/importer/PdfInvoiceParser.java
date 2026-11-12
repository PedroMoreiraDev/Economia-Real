package com.finance.ai.domain.financial.importer;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parser determinístico para faturas de cartão de crédito e extratos em formato PDF
 * emitidos por bancos e fintechs brasileiras (Nubank, Inter, Itaú, Bradesco, Santander, C6, etc.).
 */
public class PdfInvoiceParser {

    private static final Map<String, Integer> MONTH_NAMES = new HashMap<>();
    static {
        MONTH_NAMES.put("jan", 1); MONTH_NAMES.put("fev", 2); MONTH_NAMES.put("mar", 3);
        MONTH_NAMES.put("abr", 4); MONTH_NAMES.put("mai", 5); MONTH_NAMES.put("jun", 6);
        MONTH_NAMES.put("jul", 7); MONTH_NAMES.put("ago", 8); MONTH_NAMES.put("set", 9);
        MONTH_NAMES.put("out", 10); MONTH_NAMES.put("nov", 11); MONTH_NAMES.put("dez", 12);
    }

    // Padrão 1: "DD/MM/YYYY Descrição R$ 123,45" ou "DD/MM Descrição 123,45"
    private static final Pattern PATTERN_DATE_NUMERIC = Pattern.compile(
            "^\\s*(\\d{2}/\\d{2}(?:/\\d{2,4})?)\\s+(.+?)\\s+(?:R\\$\\s*)?(-?\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    // Padrão 2: "DD MMM Descrição R$ 123,45" (estilo Nubank/Inter: "14 OUT Uber *Trip 45,90")
    private static final Pattern PATTERN_DATE_TEXTUAL = Pattern.compile(
            "^\\s*(\\d{2})\\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\\.?\\s+(.+?)\\s+(?:R\\$\\s*)?(-?\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    // Padrão 3: "Descrição DD/MM R$ 123,45"
    private static final Pattern PATTERN_DESC_FIRST = Pattern.compile(
            "^\\s*(.+?)\\s+(\\d{2}/\\d{2}(?:/\\d{2,4})?)\\s+(?:R\\$\\s*)?(-?\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    private static final Set<String> IGNORED_KEYWORDS = Set.of(
            "total", "fatura", "subtotal", "pagamento", "vencimento", "limite",
            "juros", "iof", "cet", "saldo", "rotativo", "multa", "encargos",
            "lançamentos", "lancamentos", "transações", "transacoes", "comprovante"
    );

    public List<ParsedTransactionItem> parse(InputStream inputStream) throws IOException {
        return parse(inputStream, true);
    }

    public List<ParsedTransactionItem> parse(InputStream inputStream, boolean isCreditCard) throws IOException {
        List<ParsedTransactionItem> items = new ArrayList<>();

        byte[] bytes = inputStream.readAllBytes();
        if (bytes.length == 0) return items;

        String fullText;
        try (PDDocument document = Loader.loadPDF(new RandomAccessReadBuffer(bytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            fullText = stripper.getText(document);
        }

        if (fullText == null || fullText.isBlank()) {
            return items;
        }

        int invoiceYear = detectInvoiceYear(fullText);
        String[] lines = fullText.split("\\r?\\n");

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isBlank() || isNoiseLine(line)) continue;

            ParsedTransactionItem item = tryParseLine(line, invoiceYear, isCreditCard);
            if (item != null) {
                items.add(item);
            }
        }

        return items;
    }

    private ParsedTransactionItem tryParseLine(String line, int defaultYear, boolean isCreditCard) {
        // Tentativa 1: "DD MMM Descrição Valor" (Nubank, Inter)
        Matcher mTextual = PATTERN_DATE_TEXTUAL.matcher(line);
        if (mTextual.matches()) {
            int day = Integer.parseInt(mTextual.group(1));
            String monthStr = mTextual.group(2).toLowerCase();
            int month = MONTH_NAMES.getOrDefault(monthStr, 1);
            LocalDate date = LocalDate.of(defaultYear, month, day);

            String desc = mTextual.group(3).trim();
            BigDecimal amount = parseAmount(mTextual.group(4));

            if (amount.compareTo(BigDecimal.ZERO) == 0 || isNoiseDescription(desc)) return null;

            boolean isExpense = amount.compareTo(BigDecimal.ZERO) > 0 || isCreditCard;
            String id = generateExternalId(date, desc, amount);

            return new ParsedTransactionItem(id, date, amount.abs(), desc, isExpense);
        }

        // Tentativa 2: "DD/MM[/YYYY] Descrição Valor"
        Matcher mNumeric = PATTERN_DATE_NUMERIC.matcher(line);
        if (mNumeric.matches()) {
            LocalDate date = parseDate(mNumeric.group(1), defaultYear);
            String desc = mNumeric.group(2).trim();
            BigDecimal amount = parseAmount(mNumeric.group(3));

            if (date == null || amount.compareTo(BigDecimal.ZERO) == 0 || isNoiseDescription(desc)) return null;

            boolean isExpense = amount.compareTo(BigDecimal.ZERO) > 0 || isCreditCard;
            String id = generateExternalId(date, desc, amount);

            return new ParsedTransactionItem(id, date, amount.abs(), desc, isExpense);
        }

        // Tentativa 3: "Descrição DD/MM[/YYYY] Valor"
        Matcher mDescFirst = PATTERN_DESC_FIRST.matcher(line);
        if (mDescFirst.matches()) {
            String desc = mDescFirst.group(1).trim();
            LocalDate date = parseDate(mDescFirst.group(2), defaultYear);
            BigDecimal amount = parseAmount(mDescFirst.group(3));

            if (date == null || amount.compareTo(BigDecimal.ZERO) == 0 || isNoiseDescription(desc)) return null;

            boolean isExpense = amount.compareTo(BigDecimal.ZERO) > 0 || isCreditCard;
            String id = generateExternalId(date, desc, amount);

            return new ParsedTransactionItem(id, date, amount.abs(), desc, isExpense);
        }

        return null;
    }

    private int detectInvoiceYear(String fullText) {
        // Procura por anos de 4 dígitos como 2024, 2025, 2026, 2027
        Pattern yearPattern = Pattern.compile("\\b(202[4-9])\\b");
        Matcher m = yearPattern.matcher(fullText);
        if (m.find()) {
            return Integer.parseInt(m.group(1));
        }
        return LocalDate.now().getYear();
    }

    private LocalDate parseDate(String raw, int defaultYear) {
        try {
            String[] parts = raw.split("/");
            int day = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            int year = parts.length > 2 ? parseYear(parts[2], defaultYear) : defaultYear;
            return LocalDate.of(year, month, day);
        } catch (Exception e) {
            return null;
        }
    }

    private int parseYear(String rawYear, int defaultYear) {
        if (rawYear.length() == 4) return Integer.parseInt(rawYear);
        if (rawYear.length() == 2) return 2000 + Integer.parseInt(rawYear);
        return defaultYear;
    }

    private BigDecimal parseAmount(String raw) {
        try {
            String cleaned = raw.replace(".", "").replace(",", ".");
            return new BigDecimal(cleaned).setScale(2, RoundingMode.HALF_EVEN);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private boolean isNoiseLine(String line) {
        String lower = line.toLowerCase();
        if (lower.startsWith("página") || lower.startsWith("pagina") || lower.startsWith("folha")) return true;
        for (String ignored : IGNORED_KEYWORDS) {
            if (lower.equals(ignored) || lower.startsWith(ignored + ":") || lower.startsWith(ignored + " ")) {
                if (lower.contains("pagamento de fatura") || lower.contains("pagamento recebido")) {
                    return true;
                }
                if (lower.contains("total da fatura") || lower.contains("saldo anterior")) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isNoiseDescription(String desc) {
        String lower = desc.toLowerCase();
        return lower.contains("pagamento recebido") ||
               lower.contains("pagamento de fatura") ||
               lower.contains("total da fatura") ||
               lower.contains("saldo anterior") ||
               lower.contains("limite de credito") ||
               lower.length() < 2;
    }

    private String generateExternalId(LocalDate date, String desc, BigDecimal amount) {
        String raw = date.toString() + "|" + desc.toLowerCase().trim() + "|" + amount.toPlainString();
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(raw.getBytes());
            StringBuilder sb = new StringBuilder("pdf-");
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return "pdf-" + Math.abs(raw.hashCode());
        }
    }
}

