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

@DisplayName("Testes de Domínio: CsvParser (Extratos Bancários)")
class CsvParserTest {

    private final CsvParser parser = new CsvParser();

    @Test
    @DisplayName("Deve realizar parse de CSV padrão brasileiro com ponto-e-vírgula e moeda em reais")
    void shouldParseBrazilianCsvFormat() throws IOException {
        String csv = """
                Data;Descrição;Valor
                05/10/2026;Padaria Bella;-25,50
                06/10/2026;Pix Recebido;1500,00
                """;

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(2);

        var item1 = items.get(0);
        assertThat(item1.date()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(item1.description()).isEqualTo("Padaria Bella");
        assertThat(item1.amount()).isEqualByComparingTo(new BigDecimal("25.50"));
        assertThat(item1.isExpense()).isTrue();

        var item2 = items.get(1);
        assertThat(item2.date()).isEqualTo(LocalDate.of(2026, 10, 6));
        assertThat(item2.description()).isEqualTo("Pix Recebido");
        assertThat(item2.amount()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(item2.isExpense()).isFalse();
    }

    @Test
    @DisplayName("Deve realizar parse de CSV com separador vírgula e formato internacional")
    void shouldParseInternationalCsvFormat() throws IOException {
        String csv = """
                Date,Description,Amount
                2026-10-07,"Amazon Prime",-14.90
                2026-10-08,"Dividend Yield",42.15
                """;

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(2);
        assertThat(items.get(0).amount()).isEqualByComparingTo(new BigDecimal("14.90"));
        assertThat(items.get(0).description()).isEqualTo("Amazon Prime");
        assertThat(items.get(0).isExpense()).isTrue();

        assertThat(items.get(1).amount()).isEqualByComparingTo(new BigDecimal("42.15"));
        assertThat(items.get(1).isExpense()).isFalse();
    }

    @Test
    @DisplayName("Deve realizar parse de CSV de fatura de cartão tratando compras com valores positivos como despesas")
    void shouldParseCreditCardCsvWithPositiveAmountsAsExpenses() throws IOException {
        String csv = """
                date,category,title,amount
                2026-10-01,alimentacao,Restaurante Paris,120.50
                2026-10-02,transporte,Uber,35.20
                2026-10-05,,Pagamento de fatura,-155.70
                """;

        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)), true);

        assertThat(items).hasSize(3);

        // Compra 1: Deve ser despesa
        assertThat(items.get(0).description()).isEqualTo("Restaurante Paris");
        assertThat(items.get(0).amount()).isEqualByComparingTo(new BigDecimal("120.50"));
        assertThat(items.get(0).isExpense()).isTrue();

        // Compra 2: Deve ser despesa
        assertThat(items.get(1).description()).isEqualTo("Uber");
        assertThat(items.get(1).amount()).isEqualByComparingTo(new BigDecimal("35.20"));
        assertThat(items.get(1).isExpense()).isTrue();

        // Pagamento de fatura: Não é despesa de consumo
        assertThat(items.get(2).description()).isEqualTo("Pagamento de fatura");
        assertThat(items.get(2).amount()).isEqualByComparingTo(new BigDecimal("155.70"));
        assertThat(items.get(2).isExpense()).isFalse();
    }

    @Test
    @DisplayName("Deve auto-detectar fatura de cartão pelo cabeçalho (category, title, amount)")
    void shouldAutoDetectCreditCardCsvByHeaders() throws IOException {
        String csv = """
                date,category,title,amount
                2026-10-03,servicos,Netflix,55.90
                """;

        // Chamada sem flag explícita (auto-detecção)
        List<ParsedTransactionItem> items = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));

        assertThat(items).hasSize(1);
        assertThat(items.get(0).description()).isEqualTo("Netflix");
        assertThat(items.get(0).amount()).isEqualByComparingTo(new BigDecimal("55.90"));
        assertThat(items.get(0).isExpense()).isTrue();
    }
}
