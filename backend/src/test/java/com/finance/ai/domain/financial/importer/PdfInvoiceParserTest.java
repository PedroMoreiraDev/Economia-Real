package com.finance.ai.domain.financial.importer;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes Unitários do Parser de Faturas em PDF")
class PdfInvoiceParserTest {

    private final PdfInvoiceParser parser = new PdfInvoiceParser();

    @Test
    @DisplayName("Deve extrair transações de fatura PDF brasileira com sucesso")
    void shouldParseTransactionsFromPdf() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(doc, page)) {
                content.beginText();
                content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                content.setLeading(14.5f);
                content.newLineAtOffset(50, 700);

                content.showText("Fatura de Cartao de Credito - 2026");
                content.newLine();
                content.showText("Vencimento: 10/11/2026");
                content.newLine();
                content.showText("14 OUT Uber *Uber Trip R$ 34,90");
                content.newLine();
                content.showText("15 OUT Ifood *Restaurante 89,50");
                content.newLine();
                content.showText("20/10/2026 Supermercado Pao de Acucar 254,10");
                content.newLine();
                content.showText("Pagamento de fatura -378,50");
                content.newLine();
                content.showText("Total da fatura R$ 378,50");
                content.newLine();

                content.endText();
            }

            doc.save(baos);
        }

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(baos.toByteArray()), true);

        assertThat(items).hasSize(3);

        assertThat(items.get(0).description()).contains("Uber");
        assertThat(items.get(0).amount()).isEqualByComparingTo(new BigDecimal("34.90"));
        assertThat(items.get(0).date().getDayOfMonth()).isEqualTo(14);
        assertThat(items.get(0).date().getMonthValue()).isEqualTo(10);

        assertThat(items.get(1).description()).contains("Ifood");
        assertThat(items.get(1).amount()).isEqualByComparingTo(new BigDecimal("89.50"));

        assertThat(items.get(2).description()).contains("Supermercado Pao de Acucar");
        assertThat(items.get(2).amount()).isEqualByComparingTo(new BigDecimal("254.10"));
        assertThat(items.get(2).date().getDayOfMonth()).isEqualTo(20);
        assertThat(items.get(2).date().getMonthValue()).isEqualTo(10);
        assertThat(items.get(2).date().getYear()).isEqualTo(2026);
    }
}

