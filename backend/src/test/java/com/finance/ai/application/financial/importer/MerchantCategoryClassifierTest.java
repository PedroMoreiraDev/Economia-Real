package com.finance.ai.application.financial.importer;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes do Classificador Inteligente de Estabelecimentos (MerchantCategoryClassifier)")
class MerchantCategoryClassifierTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DefaultCategorySeeder categorySeeder;

    private MerchantCategoryClassifier classifier;

    private final UUID userId = UUID.randomUUID();
    private final UUID comprasCatId = UUID.randomUUID();
    private final UUID alimentacaoCatId = UUID.randomUUID();
    private final UUID transporteCatId = UUID.randomUUID();
    private final UUID outrosCatId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        classifier = new MerchantCategoryClassifier(categoryRepository, categorySeeder, "");
    }

    @Test
    @DisplayName("Deve higienizar corretamente prefixos de adquirentes e sufixos de parcelas")
    void shouldCleanMerchantNameProperly() {
        assertThat(MerchantCategoryClassifier.cleanMerchantName("Magalu*Magalu - Parcela 9/10"))
                .isEqualTo("Magalu Magalu");

        assertThat(MerchantCategoryClassifier.cleanMerchantName("PAG*PadariaReal 01/05"))
                .isEqualTo("PadariaReal");

        assertThat(MerchantCategoryClassifier.cleanMerchantName("CIELO*POSTO SHELL (02/03)"))
                .isEqualTo("POSTO SHELL");

        assertThat(MerchantCategoryClassifier.cleanMerchantName("IFD*RESTAURANTE SABOR"))
                .isEqualTo("RESTAURANTE SABOR");
    }

    @Test
    @DisplayName("Deve classificar estabelecimentos conhecidos para a categoria adequada")
    void shouldClassifyKnownMerchantsAccurately() {
        assertThat(classifier.classifyCategoryName("Magalu*Magalu - Parcela 9/10")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("MERCADOLIVRE*COMPRA")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("AMAZON MARKETPLACE")).isEqualTo("Compras");

        // Delivery
        assertThat(classifier.classifyCategoryName("IFOOD *LANCHONETE")).isEqualTo("Delivery");
        assertThat(classifier.classifyCategoryName("Rappi Brasil")).isEqualTo("Delivery");
        assertThat(classifier.classifyCategoryName("ZE DELIVERY BEBIDAS")).isEqualTo("Delivery");
        assertThat(classifier.classifyCategoryName("AI QUE FOME*BURGER")).isEqualTo("Delivery");
        assertThat(classifier.classifyCategoryName("Uber Eats")).isEqualTo("Delivery");

        // Aplicativo de Transporte
        assertThat(classifier.classifyCategoryName("UBER *TRIP")).isEqualTo("Aplicativo de Transporte");
        assertThat(classifier.classifyCategoryName("99*99POP CORRIDA")).isEqualTo("Aplicativo de Transporte");
        assertThat(classifier.classifyCategoryName("LOG URBANO ENVIOS")).isEqualTo("Aplicativo de Transporte");
        assertThat(classifier.classifyCategoryName("RAPIDOCAR MOTORISTA")).isEqualTo("Aplicativo de Transporte");
        assertThat(classifier.classifyCategoryName("RAPIDO CAR VIAGENS")).isEqualTo("Aplicativo de Transporte");

        // Alimentação (restaurantes e mercados físicos)
        assertThat(classifier.classifyCategoryName("CARREFOUR HIPER")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("PADARIA E CONFEITARIA REAL")).isEqualTo("Alimentação");

        // Transporte geral (combustível, passagens, pedágio)
        assertThat(classifier.classifyCategoryName("POSTO IPIRANGA")).isEqualTo("Transporte");

        // Outros segmentos
        assertThat(classifier.classifyCategoryName("DROGASIL FILIAL 042")).isEqualTo("Saúde");
        assertThat(classifier.classifyCategoryName("NETFLIX.COM MENSAL")).isEqualTo("Lazer");
        assertThat(classifier.classifyCategoryName("ENEL DISTRIBUICAO SP")).isEqualTo("Serviços & Contas");
    }

    @Test
    @DisplayName("Deve retornar 'Outros' para estabelecimentos não identificados ou ambíguos")
    void shouldReturnOutrosForUnrecognizedMerchants() {
        assertThat(classifier.classifyCategoryName("EMPRESA_DESCONHECIDA_XYZ")).isEqualTo("Outros");
        assertThat(classifier.classifyCategoryName("")).isEqualTo("Outros");
        assertThat(classifier.classifyCategoryName(null)).isEqualTo("Outros");
    }

    @Test
    @DisplayName("Deve resolver UUID da categoria correspondente do usuário e fallback para 'Outros'")
    void shouldResolveCategoryIdFromUserCategories() {
        UUID deliveryCatId = UUID.randomUUID();
        UUID appTransporteCatId = UUID.randomUUID();

        var catCompras = new Category(comprasCatId, userId, null, "Compras", "shopping-bag", "#F97316", true, java.time.Instant.now(), null);
        var catDelivery = new Category(deliveryCatId, userId, null, "Delivery", "bike", "#EA1D2C", true, java.time.Instant.now(), null);
        var catAppTransporte = new Category(appTransporteCatId, userId, null, "Aplicativo de Transporte", "car-taxi-front", "#F59E0B", true, java.time.Instant.now(), null);
        var catOutros = new Category(outrosCatId, userId, null, "Outros", "tag", "#64748B", true, java.time.Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId))
                .thenReturn(List.of(catCompras, catDelivery, catAppTransporte, catOutros));

        // Magalu -> Compras
        UUID resolvedMagalu = classifier.resolveCategoryId(userId, "Magalu*Magalu - Parcela 9/10");
        assertThat(resolvedMagalu).isEqualTo(comprasCatId);

        // iFood -> Delivery
        UUID resolvedIfood = classifier.resolveCategoryId(userId, "IFOOD *LANCHONETE");
        assertThat(resolvedIfood).isEqualTo(deliveryCatId);

        // Uber -> Aplicativo de Transporte
        UUID resolvedUber = classifier.resolveCategoryId(userId, "UBER *TRIP BR");
        assertThat(resolvedUber).isEqualTo(appTransporteCatId);

        // Log Urbano -> Aplicativo de Transporte
        UUID resolvedLog = classifier.resolveCategoryId(userId, "LOG URBANO CORRIDAS");
        assertThat(resolvedLog).isEqualTo(appTransporteCatId);

        // Desconhecido -> Outros
        UUID resolvedOutros = classifier.resolveCategoryId(userId, "LOJA_MISTERIOSA_ABC");
        assertThat(resolvedOutros).isEqualTo(outrosCatId);
    }
}
