package com.finance.ai.domain.financial.importer;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes Unitários: ExcelParser (.xlsx e .xls) com Precisão Monetária e Segurança")
class ExcelParserTest {

    private ExcelParser parser;

    @BeforeEach
    void setUp() {
        parser = new ExcelParser();
    }

    @Test
    @DisplayName("Deve extrair transações de arquivo .xlsx com tipos nativos de data e valor")
    void shouldParseModernXlsxFileWithNativeTypes() throws IOException {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Extrato");

            // Cria estilo de data
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper createHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(createHelper.createDataFormat().getFormat("yyyy-MM-dd"));

            // Linha 0: Cabeçalhos
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Data");
            header.createCell(1).setCellValue("Descrição");
            header.createCell(2).setCellValue("Valor");
            header.createCell(3).setCellValue("ID");

            // Linha 1: Salário (Receita / Positivo)
            Row row1 = sheet.createRow(1);
            Cell dateCell1 = row1.createCell(0);
            dateCell1.setCellValue(Date.from(LocalDate.of(2026, 10, 5).atStartOfDay(ZoneId.systemDefault()).toInstant()));
            dateCell1.setCellStyle(dateStyle);
            row1.createCell(1).setCellValue("Salário Empresa XPTO");
            row1.createCell(2).setCellValue(5000.00);
            row1.createCell(3).setCellValue("DOC-1001");

            // Linha 2: Supermercado (Despesa / Negativo)
            Row row2 = sheet.createRow(2);
            Cell dateCell2 = row2.createCell(0);
            dateCell2.setCellValue(Date.from(LocalDate.of(2026, 10, 6).atStartOfDay(ZoneId.systemDefault()).toInstant()));
            dateCell2.setCellStyle(dateStyle);
            row2.createCell(1).setCellValue("Supermercado Central");
            row2.createCell(2).setCellValue(-450.75);
            row2.createCell(3).setCellValue("DOC-1002");

            workbook.write(out);
            bytes = out.toByteArray();
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(bytes));

        assertThat(items).hasSize(2);

        ParsedTransactionItem item1 = items.get(0);
        assertThat(item1.date()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(item1.description()).isEqualTo("Salário Empresa XPTO");
        assertThat(item1.amount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(item1.isExpense()).isFalse();
        assertThat(item1.externalId()).isEqualTo("DOC-1001");

        ParsedTransactionItem item2 = items.get(1);
        assertThat(item2.date()).isEqualTo(LocalDate.of(2026, 10, 6));
        assertThat(item2.description()).isEqualTo("Supermercado Central");
        assertThat(item2.amount()).isEqualByComparingTo(new BigDecimal("450.75"));
        assertThat(item2.isExpense()).isTrue();
        assertThat(item2.externalId()).isEqualTo("DOC-1002");
    }

    @Test
    @DisplayName("Deve extrair transações de arquivo legado .xls (Excel 97-2003)")
    void shouldParseLegacyXlsFile() throws IOException {
        byte[] bytes;
        try (Workbook workbook = new HSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Extrato");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Data Movimento");
            header.createCell(1).setCellValue("Histórico");
            header.createCell(2).setCellValue("Valor (R$)");

            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("10/10/2026");
            row1.createCell(1).setCellValue("Transferência Recebida Pix");
            row1.createCell(2).setCellValue("150,00");

            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("11/10/2026");
            row2.createCell(1).setCellValue("Farmácia Popular");
            row2.createCell(2).setCellValue("-85,90");

            workbook.write(out);
            bytes = out.toByteArray();
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(bytes));

        assertThat(items).hasSize(2);
        assertThat(items.get(0).amount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(items.get(0).isExpense()).isFalse();
        assertThat(items.get(1).amount()).isEqualByComparingTo(new BigDecimal("85.90"));
        assertThat(items.get(1).isExpense()).isTrue();
    }

    @Test
    @DisplayName("Deve tratar fatura de cartão de crédito no Excel com compras positivas como despesa")
    void shouldHandleCreditCardInvoiceInExcel() throws IOException {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Fatura Cartao");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("date");
            header.createCell(1).setCellValue("title");
            header.createCell(2).setCellValue("amount");

            // Compra de restaurante listada com valor positivo -> deve ser DESPESA
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("2026-10-01");
            row1.createCell(1).setCellValue("Restaurante Italiano");
            row1.createCell(2).setCellValue(120.00);

            // Pagamento de fatura listado com valor positivo ou negativo -> NÃO deve ser despesa
            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("2026-10-05");
            row2.createCell(1).setCellValue("Pagamento de fatura");
            row2.createCell(2).setCellValue(-120.00);

            workbook.write(out);
            bytes = out.toByteArray();
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(bytes), true);

        assertThat(items).hasSize(2);

        ParsedTransactionItem purchase = items.get(0);
        assertThat(purchase.description()).isEqualTo("Restaurante Italiano");
        assertThat(purchase.amount()).isEqualByComparingTo(new BigDecimal("120.00"));
        assertThat(purchase.isExpense()).isTrue();

        ParsedTransactionItem payment = items.get(1);
        assertThat(payment.description()).isEqualTo("Pagamento de fatura");
        assertThat(payment.amount()).isEqualByComparingTo(new BigDecimal("120.00"));
        assertThat(payment.isExpense()).isFalse();
    }

    @Test
    @DisplayName("Deve sanitizar descrições contra Excel Formula Injection (=, +, -, @)")
    void shouldSanitizeFormulaInjectionPrefixes() throws IOException {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Extrato");

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Data");
            header.createCell(1).setCellValue("Descrição");
            header.createCell(2).setCellValue("Valor");

            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("2026-10-12");
            row1.createCell(1).setCellValue("=SUM(A1:B10)");
            row1.createCell(2).setCellValue(50.00);

            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("2026-10-12");
            row2.createCell(1).setCellValue("@cmd|' /C calc'!A0");
            row2.createCell(2).setCellValue(20.00);

            workbook.write(out);
            bytes = out.toByteArray();
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(bytes));

        assertThat(items).hasSize(2);
        assertThat(items.get(0).description()).isEqualTo("SUM(A1:B10)");
        assertThat(items.get(1).description()).isEqualTo("cmd|' /C calc'!A0");
    }

    @Test
    @DisplayName("Deve retornar lista vazia se planilha estiver vazia")
    void shouldReturnEmptyListForEmptyWorkbook() throws IOException {
        byte[] bytes;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            workbook.createSheet("Vazio");
            workbook.write(out);
            bytes = out.toByteArray();
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(bytes));
        assertThat(items).isEmpty();
    }
}
