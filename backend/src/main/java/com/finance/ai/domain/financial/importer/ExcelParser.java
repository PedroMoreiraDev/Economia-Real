package com.finance.ai.domain.financial.importer;

import org.apache.poi.ss.usermodel.*;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Parser determinístico para planilhas Excel (.xlsx e .xls) de extratos bancários e faturas.
 * Suporta formatos do Excel 97-2003 (.xls) e Excel moderno OOXML (.xlsx) via Apache POI.
 * Preserva estritamente a precisão monetária (BigDecimal escala 2, RoundingMode.HALF_EVEN)
 * e implementa proteção contra fórmula injection e detecção automática de colunas.
 */
public class ExcelParser {

    private final DataFormatter dataFormatter = new DataFormatter();

    public List<ParsedTransactionItem> parse(InputStream inputStream) throws IOException {
        return parse(inputStream, false);
    }

    public List<ParsedTransactionItem> parse(InputStream inputStream, boolean isCreditCard) throws IOException {
        List<ParsedTransactionItem> items = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            if (workbook.getNumberOfSheets() == 0) {
                return items;
            }

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                return items;
            }

            // 1. Localiza a linha de cabeçalho nas primeiras linhas
            HeaderInfo headerInfo = findHeaderRow(sheet);
            if (headerInfo == null) {
                return items;
            }

            boolean isCard = isCreditCard || headerInfo.detectedCard;

            // 2. Itera sobre as linhas de dados
            int startRow = headerInfo.rowIndex + 1;
            int lastRow = sheet.getLastRowNum();

            for (int r = startRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                LocalDate date = parseCellDate(row.getCell(headerInfo.dateCol));
                BigDecimal amount = parseCellAmount(row.getCell(headerInfo.amountCol));
                String description = parseCellString(row.getCell(headerInfo.descCol));
                String extId = headerInfo.idCol != -1 ? parseCellString(row.getCell(headerInfo.idCol)) : null;

                if (date != null && amount != null && description != null && !description.isBlank()) {
                    // Sanitiza a descrição contra Formula Injection
                    description = sanitizeFormulaInjection(description);

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
                    items.add(new ParsedTransactionItem(
                            extId != null && !extId.isBlank() ? extId : null,
                            date,
                            absoluteAmount,
                            description,
                            isExpense
                    ));
                }
            }
        }

        return items;
    }

    private static class HeaderInfo {
        final int rowIndex;
        final int dateCol;
        final int amountCol;
        final int descCol;
        final int idCol;
        final boolean detectedCard;

        HeaderInfo(int rowIndex, int dateCol, int amountCol, int descCol, int idCol, boolean detectedCard) {
            this.rowIndex = rowIndex;
            this.dateCol = dateCol;
            this.amountCol = amountCol;
            this.descCol = descCol;
            this.idCol = idCol;
            this.detectedCard = detectedCard;
        }
    }

    private HeaderInfo findHeaderRow(Sheet sheet) {
        int maxScanRows = Math.min(sheet.getLastRowNum(), 25);

        for (int r = 0; r <= maxScanRows; r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;

            int dateCol = -1;
            int amountCol = -1;
            int descCol = -1;
            int idCol = -1;
            boolean cardDetected = false;

            int lastCell = row.getLastCellNum();
            for (int c = 0; c < lastCell; c++) {
                Cell cell = row.getCell(c);
                if (cell == null) continue;

                String text = getRawCellText(cell).toLowerCase().trim();
                if (text.isBlank()) continue;

                if (containsAny(text, "fatura", "cartao", "cartão", "card")) {
                    cardDetected = true;
                }

                if (dateCol == -1 && containsAny(text, "data", "date", "dt", "data lançamento", "data movimento")) {
                    dateCol = c;
                } else if (amountCol == -1 && containsAny(text, "valor", "amount", "valor (r$)", "valor r$", "lançamento", "debito/credito")) {
                    amountCol = c;
                } else if (descCol == -1 && containsAny(text, "descricao", "descrição", "description", "memo", "historico", "histórico", "estabelecimento", "title", "detalhe", "movimentacao")) {
                    descCol = c;
                } else if (idCol == -1 && containsAny(text, "id", "identificador", "fitid", "external_id", "documento", "doc")) {
                    idCol = c;
                }
            }

            if (dateCol != -1 && amountCol != -1 && descCol != -1) {
                return new HeaderInfo(r, dateCol, amountCol, descCol, idCol, cardDetected);
            }
        }

        // Fallback: se não encontrou cabeçalho explícito com as 3 palavras, tenta as 3 primeiras colunas na primeira linha não vazia
        for (int r = 0; r <= maxScanRows; r++) {
            Row row = sheet.getRow(r);
            if (row != null && row.getPhysicalNumberOfCells() >= 3) {
                // Verifica se a primeira linha já é dado (se a coluna 0 for data válida)
                LocalDate possibleDate = parseCellDate(row.getCell(0));
                if (possibleDate != null) {
                    // Os dados começam já na linha r, sem linha de cabeçalho
                    return new HeaderInfo(r - 1, 0, 2, 1, -1, false);
                } else {
                    // A linha r é cabeçalho genérico e os dados começam em r + 1
                    return new HeaderInfo(r, 0, 2, 1, -1, false);
                }
            }
        }

        return null;
    }

    private boolean containsAny(String text, String... candidates) {
        for (String c : candidates) {
            if (text.equals(c) || text.contains(c)) {
                return true;
            }
        }
        return false;
    }

    private LocalDate parseCellDate(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                try {
                    return cell.getLocalDateTimeCellValue().toLocalDate();
                } catch (Exception e) {
                    Date date = cell.getDateCellValue();
                    if (date != null) {
                        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                    }
                }
            }
            // Tenta converter se for número serial de data do Excel válido (ex: 45200)
            try {
                double val = cell.getNumericCellValue();
                if (DateUtil.isValidExcelDate(val) && val > 30000 && val < 60000) {
                    Date d = DateUtil.getJavaDate(val);
                    return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                }
            } catch (Exception ignored) {}
        }

        String raw = getRawCellText(cell);
        if (raw == null || raw.isBlank()) return null;

        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd")
        );

        for (var f : formatters) {
            try {
                return LocalDate.parse(raw.trim(), f);
            } catch (DateTimeParseException ignored) {}
        }

        return null;
    }

    private BigDecimal parseCellAmount(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_EVEN);
        }

        if (cell.getCellType() == CellType.FORMULA) {
            try {
                double val = cell.getNumericCellValue();
                return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_EVEN);
            } catch (Exception ignored) {
                // Se a fórmula gerou texto, tenta fazer o parse textual
            }
        }

        String raw = getRawCellText(cell);
        if (raw == null || raw.isBlank()) return null;

        String clean = raw.trim()
                .replaceAll("^\"|\"$", "")
                .replace("R$", "")
                .replace("r$", "")
                .trim();

        if (clean.isBlank()) return null;

        // Trata sufixos contábeis bancários como "100,50 D" (débito/negativo) ou "100,50 C" (crédito/positivo)
        boolean isNegativeBySuffix = clean.toUpperCase().endsWith("D");
        if (isNegativeBySuffix || clean.toUpperCase().endsWith("C")) {
            clean = clean.substring(0, clean.length() - 1).trim();
        }

        // Trata formato brasileiro: "1.250,50" -> "1250.50"
        if (clean.contains(",") && clean.contains(".")) {
            clean = clean.replace(".", "").replace(",", ".");
        } else if (clean.contains(",")) {
            clean = clean.replace(",", ".");
        }

        try {
            BigDecimal value = new BigDecimal(clean);
            if (isNegativeBySuffix && value.compareTo(BigDecimal.ZERO) > 0) {
                value = value.negate();
            }
            return value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String parseCellString(Cell cell) {
        if (cell == null) return "";
        return getRawCellText(cell).trim();
    }

    private String getRawCellText(Cell cell) {
        if (cell == null) return "";
        try {
            return dataFormatter.formatCellValue(cell);
        } catch (Exception e) {
            return switch (cell.getCellType()) {
                case STRING -> cell.getStringCellValue();
                case NUMERIC -> String.valueOf(cell.getNumericCellValue());
                case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
                case FORMULA -> {
                    try {
                        yield cell.getStringCellValue();
                    } catch (Exception ex) {
                        yield String.valueOf(cell.getNumericCellValue());
                    }
                }
                default -> "";
            };
        }
    }

    private String sanitizeFormulaInjection(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        // Remove prefixos perigosos de fórmula do Excel (=, +, -, @)
        while (trimmed.startsWith("=") || trimmed.startsWith("+") || trimmed.startsWith("-") || trimmed.startsWith("@")) {
            trimmed = trimmed.substring(1).trim();
        }
        return trimmed;
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
}
