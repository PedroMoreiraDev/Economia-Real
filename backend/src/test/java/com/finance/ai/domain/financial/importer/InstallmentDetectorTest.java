package com.finance.ai.domain.financial.importer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes Unitários: InstallmentDetector (Identificação e Projeção de Parcelas)")
class InstallmentDetectorTest {

    private InstallmentDetector detector;

    @BeforeEach
    void setUp() {
        detector = new InstallmentDetector();
    }

    @Test
    @DisplayName("Deve detectar padrão simples Havan 3/5 e extrair informações")
    void shouldDetectSimpleSlashPattern() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Havan 3/5");

        assertThat(match).isPresent();
        assertThat(match.get().current()).isEqualTo(3);
        assertThat(match.get().total()).isEqualTo(5);
        assertThat(match.get().cleanMerchant()).isEqualTo("havan");
    }

    @Test
    @DisplayName("Deve detectar padrão com zero à esquerda HAVAN 03/05")
    void shouldDetectLeadingZeroPattern() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("HAVAN 03/05");

        assertThat(match).isPresent();
        assertThat(match.get().current()).isEqualTo(3);
        assertThat(match.get().total()).isEqualTo(5);
        assertThat(match.get().cleanMerchant()).isEqualTo("havan");
    }

    @Test
    @DisplayName("Deve detectar padrão entre parênteses Havan (3/5)")
    void shouldDetectParenthesesPattern() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Havan (3/5)");

        assertThat(match).isPresent();
        assertThat(match.get().current()).isEqualTo(3);
        assertThat(match.get().total()).isEqualTo(5);
        assertThat(match.get().cleanMerchant()).isEqualTo("havan");
    }

    @Test
    @DisplayName("Deve detectar padrão com 'de': Magalu 2 de 4")
    void shouldDetectDePattern() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Magalu 2 de 4");

        assertThat(match).isPresent();
        assertThat(match.get().current()).isEqualTo(2);
        assertThat(match.get().total()).isEqualTo(4);
        assertThat(match.get().cleanMerchant()).isEqualTo("magalu");
    }

    @Test
    @DisplayName("Deve detectar prefixo Parcela ou Parc: Lojas Renner - Parcela 2/4")
    void shouldDetectPrefixParcela() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Lojas Renner - Parcela 2/4");

        assertThat(match).isPresent();
        assertThat(match.get().current()).isEqualTo(2);
        assertThat(match.get().total()).isEqualTo(4);
        assertThat(match.get().cleanMerchant()).isEqualTo("lojas renner");
    }

    @Test
    @DisplayName("Deve gerar descrições seguintes respeitando a formatação original")
    void shouldGenerateNextInstallmentDescriptionsAccurately() {
        // Caso 1: 3/5 -> 4/5 e 5/5
        var match1 = detector.detect("Havan 3/5").orElseThrow();
        assertThat(detector.generateNextInstallmentDescription("Havan 3/5", match1, 4)).isEqualTo("Havan 4/5");
        assertThat(detector.generateNextInstallmentDescription("Havan 3/5", match1, 5)).isEqualTo("Havan 5/5");

        // Caso 2: HAVAN 03/05 -> HAVAN 04/05
        var match2 = detector.detect("HAVAN 03/05").orElseThrow();
        assertThat(detector.generateNextInstallmentDescription("HAVAN 03/05", match2, 4)).isEqualTo("HAVAN 04/05");
        assertThat(detector.generateNextInstallmentDescription("HAVAN 03/05", match2, 5)).isEqualTo("HAVAN 05/05");

        // Caso 3: Lojas Renner (02/04) -> Lojas Renner (03/04)
        var match3 = detector.detect("Lojas Renner (02/04)").orElseThrow();
        assertThat(detector.generateNextInstallmentDescription("Lojas Renner (02/04)", match3, 3)).isEqualTo("Lojas Renner (03/04)");

        // Caso 4: Magalu 2 de 4 -> Magalu 3 de 4
        var match4 = detector.detect("Magalu 2 de 4").orElseThrow();
        assertThat(detector.generateNextInstallmentDescription("Magalu 2 de 4", match4, 3)).isEqualTo("Magalu 3 de 4");
    }

    @Test
    @DisplayName("NÃO deve casar com datas com ano como 'Compra 15/10/2026'")
    void shouldNotMatchCompleteDatesWithYear() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Compra Supermercado 15/10/2026");
        assertThat(match).isEmpty();
    }

    @Test
    @DisplayName("NÃO deve casar com parcela única 1/1")
    void shouldNotMatchSingleInstallment() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Uber Trip 1/1");
        assertThat(match).isEmpty();
    }

    @Test
    @DisplayName("NÃO deve casar com padrões inválidos como 25/12 onde current > total")
    void shouldNotMatchWhenCurrentIsGreaterThanTotal() {
        Optional<InstallmentDetector.InstallmentMatch> match = detector.detect("Pagamento de Natal 25/12");
        assertThat(match).isEmpty();
    }
}
