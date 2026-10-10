package com.finance.ai.application.financial.importer;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.financial.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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
        // Compras (incluindo Havan, Pet shops, Cosméticos, Moda e Eletrônicos)
        assertThat(classifier.classifyCategoryName("Magalu*Magalu - Parcela 9/10")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("MERCADOLIVRE*COMPRA")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("AMAZON MARKETPLACE")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("HAVAN LOJAS DE DEPART")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("CIELO*HAVAN 01/05")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("HAVAN BRUSQUE SC")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("PETZ MORUMBI SP")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("O BOTICARIO SHOPPING")).isEqualTo("Compras");
        assertThat(classifier.classifyCategoryName("ZARA BRASIL ROUPAS")).isEqualTo("Compras");

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

        // Alimentação (restaurantes, mercados e atacados)
        assertThat(classifier.classifyCategoryName("CARREFOUR HIPER")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("ATACADAO LOJA 14")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("ASSAI ATACADISTA")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("Amigao Umuarama Ii")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("SUPERMERCADO AMIGAO")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("SWIFT CARNES")).isEqualTo("Alimentação");
        assertThat(classifier.classifyCategoryName("PADARIA E CONFEITARIA REAL")).isEqualTo("Alimentação");

        // Transporte geral (combustível, passagens, pedágio)
        assertThat(classifier.classifyCategoryName("POSTO IPIRANGA")).isEqualTo("Transporte");
        assertThat(classifier.classifyCategoryName("AUTO POSTO SHELL")).isEqualTo("Transporte");

        // Outros segmentos
        assertThat(classifier.classifyCategoryName("DROGASIL FILIAL 042")).isEqualTo("Saúde");
        assertThat(classifier.classifyCategoryName("FARMACIA SAO JOAO")).isEqualTo("Saúde");
        assertThat(classifier.classifyCategoryName("NETFLIX.COM MENSAL")).isEqualTo("Lazer");
        assertThat(classifier.classifyCategoryName("ENEL DISTRIBUICAO SP")).isEqualTo("Serviços & Contas");
    }

    @Test
    @DisplayName("Deve retornar null para estabelecimentos não identificados ou ambíguos")
    void shouldReturnNullForUnrecognizedMerchants() {
        assertThat(classifier.classifyCategoryName("EMPRESA_DESCONHECIDA_XYZ")).isNull();
        assertThat(classifier.classifyCategoryName("")).isNull();
        assertThat(classifier.classifyCategoryName(null)).isNull();
    }

    @Test
    @DisplayName("Deve resolver UUID da categoria correspondente do usuário ou retornar null se desconhecido")
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
        UUID resolvedLog = classifier.resolveCategoryId(userId, "LOG Urbano Corridas");
        assertThat(resolvedLog).isEqualTo(appTransporteCatId);

        // Desconhecido -> null (não preenche automaticamente com Outros)
        UUID resolvedDesconhecido = classifier.resolveCategoryId(userId, "LOJA_MISTERIOSA_ABC");
        assertThat(resolvedDesconhecido).isNull();
    }

    @Test
    @DisplayName("Deve consultar a IA quando a regra local não conhecer o estabelecimento e atribuir categoria sugerida")
    void shouldQueryAiWhenLocalRulesDoNotMatch() {
        com.finance.ai.domain.ai.AiExtractionPort mockAi = mock(com.finance.ai.domain.ai.AiExtractionPort.class);
        var classifierWithAi = new MerchantCategoryClassifier(categoryRepository, categorySeeder, mockAi);

        UUID lazerCatId = UUID.randomUUID();
        var catLazer = new Category(lazerCatId, userId, null, "Lazer", "gamepad", "#8B5CF6", true, java.time.Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId)).thenReturn(List.of(catLazer));
        when(mockAi.classifyMerchant(eq("arena gamer vr"), any())).thenReturn("Lazer");

        UUID resolved = classifierWithAi.resolveCategoryId(userId, "ARENA GAMER VR");
        assertThat(resolved).isEqualTo(lazerCatId);
    }

    @Test
    @DisplayName("Deve priorizar a categoria ajustada manualmente pelo usuário sobre o catálogo estático e sobre a IA")
    void shouldPrioritizeUserAdjustedCategoryOverCatalogAndAi() {
        TransactionRepository mockTxRepo = mock(TransactionRepository.class);
        var classifierWithHistory = new MerchantCategoryClassifier(categoryRepository, categorySeeder, mockTxRepo);

        UUID educacaoCatId = UUID.randomUUID();
        var catCompras = new Category(comprasCatId, userId, null, "Compras", "shopping-bag", "#F97316", true, Instant.now(), null);
        var catEducacao = new Category(educacaoCatId, userId, null, "Educação", "graduation-cap", "#3B82F6", true, Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId))
                .thenReturn(List.of(catCompras, catEducacao));

        // Usuário na fatura passada ajustou uma compra recorrente/parcelada na Magalu para a categoria "Educação"
        var pastAdjustedTx = new Transaction(
                UUID.randomUUID(),
                userId,
                TransactionType.EXPENSE,
                BigDecimal.valueOf(150.00),
                LocalDate.now().minusDays(30),
                LocalDate.now().minusDays(30),
                "Magalu*Magalu - Parcela 1/10",
                UUID.randomUUID(),
                null,
                educacaoCatId,
                TransactionStatus.COMPLETED,
                TransactionOrigin.CSV_IMPORT,
                "Ajustado pelo usuário",
                Instant.now().minusSeconds(3600),
                Instant.now()
        );

        when(mockTxRepo.findAllByUserId(userId)).thenReturn(List.of(pastAdjustedTx));

        // Na próxima importação de fatura (Parcela 2/10), mesmo a Magalu sendo padrão 'Compras', o sistema deve honrar o ajuste do usuário
        UUID resolved = classifierWithHistory.resolveCategoryId(userId, "Magalu*Magalu - Parcela 2/10");
        assertThat(resolved).isEqualTo(educacaoCatId);
    }

    @Test
    @DisplayName("Deve priorizar a alteração mais recente quando existirem múltiplos lançamentos passados do mesmo estabelecimento")
    void shouldPrioritizeMostRecentUserAdjustment() {
        TransactionRepository mockTxRepo = mock(TransactionRepository.class);
        var classifierWithHistory = new MerchantCategoryClassifier(categoryRepository, categorySeeder, mockTxRepo);

        UUID mercadoLocalCatId = UUID.randomUUID();
        var catOutros = new Category(outrosCatId, userId, null, "Outros", "tag", "#64748B", true, Instant.now(), null);
        var catMercado = new Category(mercadoLocalCatId, userId, null, "Alimentação", "utensils", "#10B981", true, Instant.now(), null);

        when(categoryRepository.findAllByUserIdOrSystemDefault(userId))
                .thenReturn(List.of(catOutros, catMercado));

        // Transação antiga de 30 dias atrás que estava com "Outros"
        var oldTx = new Transaction(
                UUID.randomUUID(),
                userId,
                TransactionType.EXPENSE,
                BigDecimal.valueOf(80.00),
                LocalDate.now().minusDays(30),
                LocalDate.now().minusDays(30),
                "PAG*MERCADO CENTRAL 01/02",
                UUID.randomUUID(),
                null,
                outrosCatId,
                TransactionStatus.COMPLETED,
                TransactionOrigin.CSV_IMPORT,
                null,
                Instant.now().minusSeconds(86400 * 30),
                Instant.now().minusSeconds(86400 * 30)
        );

        // Transação recente que o usuário alterou para "Alimentação"
        var recentUpdatedTx = new Transaction(
                UUID.randomUUID(),
                userId,
                TransactionType.EXPENSE,
                BigDecimal.valueOf(110.00),
                LocalDate.now().minusDays(2),
                LocalDate.now().minusDays(2),
                "PAG*MERCADO CENTRAL 02/02",
                UUID.randomUUID(),
                null,
                mercadoLocalCatId,
                TransactionStatus.COMPLETED,
                TransactionOrigin.CSV_IMPORT,
                "Ajustado",
                Instant.now().minusSeconds(86400 * 2),
                Instant.now() // updatedAt mais recente
        );

        // Simulamos o repositório retornando a lista fora de ordem
        when(mockTxRepo.findAllByUserId(userId)).thenReturn(List.of(oldTx, recentUpdatedTx));

        // Nova importação no mês seguinte com a mesma loja
        UUID resolved = classifierWithHistory.resolveCategoryId(userId, "PAG*MERCADO CENTRAL 03/03");
        assertThat(resolved).isEqualTo(mercadoLocalCatId);
    }
}
