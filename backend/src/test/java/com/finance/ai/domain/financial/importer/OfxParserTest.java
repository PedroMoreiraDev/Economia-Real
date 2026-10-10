package com.finance.ai.domain.financial.importer;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes de Domínio: OfxParser (Extratos Bancários)")
class OfxParserTest {

    private final OfxParser parser = new OfxParser();

    @Test
    @DisplayName("Deve realizar parse de arquivo OFX com débitos e créditos com precisão")
    void shouldParseOfxTransactions() throws IOException {
        String ofxContent = """
                OFXHEADER:100
                DATA:OFXSGML
                VERSION:102
                <OFX>
                <BANKMSGSRSV1>
                <STMTTRNRS>
                <STMTRS>
                <BANKTRANLIST>
                <STMTTRN>
                <TRNTYPE>DEBIT
                <DTPOSTED>20261005120000[-03:EST]
                <TRNAMT>-85.50
                <FITID>20261005001
                <MEMO>SUPERMERCADO DIA
                </STMTTRN>
                <STMTTRN>
                <TRNTYPE>CREDIT
                <DTPOSTED>20261006120000[-03:EST]
                <TRNAMT>3200.00
                <FITID>20261006002
                <MEMO>SALARIO MENSAL
                </STMTTRN>
                </BANKTRANLIST>
                </STMTRS>
                </STMTTRNRS>
                </BANKMSGSRSV1>
                </OFX>
                """;

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(ofxContent.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(2);

        // Item 1: Débito
        var item1 = items.get(0);
        assertThat(item1.externalId()).isEqualTo("20261005001");
        assertThat(item1.date()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(item1.amount()).isEqualByComparingTo(new BigDecimal("85.50"));
        assertThat(item1.description()).isEqualTo("SUPERMERCADO DIA");
        assertThat(item1.isExpense()).isTrue();

        // Item 2: Crédito
        var item2 = items.get(1);
        assertThat(item2.externalId()).isEqualTo("20261006002");
        assertThat(item2.date()).isEqualTo(LocalDate.of(2026, 10, 6));
        assertThat(item2.amount()).isEqualByComparingTo(new BigDecimal("3200.00"));
        assertThat(item2.description()).isEqualTo("SALARIO MENSAL");
        assertThat(item2.isExpense()).isFalse();
    }

    @Test
    @DisplayName("Deve realizar parse de OFX de cartão de crédito (<CREDITCARDMSGSRSV1>) tratando compras como despesas")
    void shouldParseCreditCardOfxTransactions() throws IOException {
        String ofxContent = """
                OFXHEADER:100
                DATA:OFXSGML
                VERSION:102
                <OFX>
                <CREDITCARDMSGSRSV1>
                <CCSTMTTRNRS>
                <CCSTMTRS>
                <BANKTRANLIST>
                <STMTTRN>
                <TRNTYPE>POS
                <DTPOSTED>20261005120000[-03:EST]
                <TRNAMT>85.50
                <FITID>CC001
                <MEMO>FARMACIA POPULAR
                </STMTTRN>
                <STMTTRN>
                <TRNTYPE>CREDIT
                <DTPOSTED>20261006120000[-03:EST]
                <TRNAMT>-85.50
                <FITID>CC002
                <MEMO>PAGAMENTO DE FATURA
                </STMTTRN>
                </BANKTRANLIST>
                </CCSTMTRS>
                </CCSTMTTRNRS>
                </CREDITCARDMSGSRSV1>
                </OFX>
                """;

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(ofxContent.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(2);

        // Compra no cartão (TRNTYPE POS, TRNAMT positivo): Deve ser despesa
        var item1 = items.get(0);
        assertThat(item1.description()).isEqualTo("FARMACIA POPULAR");
        assertThat(item1.amount()).isEqualByComparingTo(new BigDecimal("85.50"));
        assertThat(item1.isExpense()).isTrue();

        // Pagamento de fatura (TRNTYPE CREDIT): Não é despesa
        var item2 = items.get(1);
        assertThat(item2.description()).isEqualTo("PAGAMENTO DE FATURA");
        assertThat(item2.amount()).isEqualByComparingTo(new BigDecimal("85.50"));
        assertThat(item2.isExpense()).isFalse();
    }
}
