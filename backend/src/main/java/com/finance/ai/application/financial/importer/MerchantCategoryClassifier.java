package com.finance.ai.application.financial.importer;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Classificador inteligente de estabelecimentos comerciais a partir de faturas de cartão e extratos.
 * Utiliza limpeza de padrões bancários (parcelas, prefixos de adquirentes), catálogo rico de marcas
 * e comércios brasileiros, fallback para IA e resolução determinística para categoria "Outros".
 */
@Component
public class MerchantCategoryClassifier {

    private static final Logger log = LoggerFactory.getLogger(MerchantCategoryClassifier.class);

    private final CategoryRepository categoryRepository;
    private final DefaultCategorySeeder categorySeeder;
    private final String geminiApiKey;

    // Regras determinísticas de mapeamento de palavras-chave/marcas para categorias padrão
    private static final Map<String, List<String>> MERCHANT_RULES = new LinkedHashMap<>();

    static {
        MERCHANT_RULES.put("Compras", List.of(
                "magalu", "magazine luiza", "casas bahia", "americanas", "mercado livre", "mercadolivre",
                "amazon", "shopee", "shein", "aliexpress", "ali express", "zara", "renner", "riachuelo",
                "c&a", "cea", "dafiti", "centauro", "decathlon", "netshoes", "leroy merlin", "telhanorte",
                "tok&stok", "tokstok", "mobly", "fast shop", "kabum", "pichau", "terabyte", "kalunga",
                "apple store", "samsung", "polishop", "ponto frio", "pontofrio", "marabraz", "etna"
        ));

        MERCHANT_RULES.put("Delivery", List.of(
                "ifood", "rappi", "ze delivery", "zedelivery", "ai que fome", "aiquefome",
                "deliway", "delivery direct", "ubereats", "uber eats", "delivery"
        ));

        MERCHANT_RULES.put("Aplicativo de Transporte", List.of(
                "uber", "99app", "99 app", "99pop", "99 pop", "99 corrida", "99 taxi", "99 táxi", "99",
                "log urbano", "logurbano", "rapidocar", "rapido car", "rapido-car", "cabify",
                "indrive", "in drive", "maxim", "buser", "vou de taxi"
        ));

        MERCHANT_RULES.put("Alimentação", List.of(
                "mcdonald", "mc donald", "burger king", "subway",
                "habib", "outback", "madero", "coco bambu", "starbucks", "cacau show", "kopenhagen",
                "bacio di latte", "spoleto", "giraffas", "ragazzo", "sodie", "carrefour", "pao de acucar",
                "extra", "assai", "atacadao", "supermercado", "mercado", "hipermercado", "hortifruti",
                "sacolao", "padaria", "panificadora", "restaurante", "pizzaria", "lanchonete", "bar",
                "boteco", "churrascaria", "cantina", "bistro", "acougue", "carnes", "sorveteria", "cafe"
        ));

        MERCHANT_RULES.put("Transporte", List.of(
                "taxi", "posto", "shell", "ipiranga",
                "petrobras", "br distribuidora", "ale", "graal", "sem parar", "veloe", "conectcar",
                "pedagio", "auto pista", "bilhete unico", "metro", "cptm", "azul linhas", "gol linhas",
                "latam", "decolar", "booking", "clickbus", "localiza", "movida", "unidas", "estapar",
                "estacionamento", "combustivel", "gasolina", "etanol"
        ));

        MERCHANT_RULES.put("Saúde", List.of(
                "droga raia", "drogasil", "pague menos", "panvel", "pacheco", "drogaria sao paulo",
                "ultrafarma", "farmacia", "drogaria", "unimed", "notre dame", "notredame", "amil",
                "sulamerica", "bradesco saude", "fleury", "lavoisier", "dasa", "laboratorio",
                "hospital", "clinica", "medico", "dentista", "odonto", "oftalmo", "terapia", "psicologia"
        ));

        MERCHANT_RULES.put("Lazer", List.of(
                "netflix", "spotify", "amazon prime", "disney", "star+", "star plus", "max", "hbo",
                "globoplay", "premiere", "telecine", "youtube", "deezer", "apple music", "steam",
                "playstation", "sony", "xbox", "nintendo", "twitch", "riot games", "blizzard", "epic games",
                "cinema", "cinemark", "cinepolis", "uci", "ingresso.com", "sympla", "eventim", "show", "teatro"
        ));

        MERCHANT_RULES.put("Serviços & Contas", List.of(
                "enel", "cpfl", "light", "cemig", "copel", "equatorial", "sabesp", "sanepar", "copasa",
                "comgas", "naturgy", "claro", "vivo", "tim", "oi", "algar", "internet", "banda larga",
                "telefone", "condominio", "iptu", "ipva", "cartorio", "gas", "energia", "luz", "agua"
        ));

        MERCHANT_RULES.put("Educação", List.of(
                "udemy", "coursera", "alura", "rocketseat", "hotmart", "eduzz", "kiwify", "estacio",
                "anhanguera", "fgv", "puc", "usp", "unip", "anhembi", "escola", "colegio", "faculdade",
                "livraria", "saraiva", "leitura", "curso"
        ));

        MERCHANT_RULES.put("Investimentos", List.of(
                "nuinvest", "rico", "xp investimentos", "clear", "btg pactual", "inter invest", "agora",
                "binance", "mercado bitcoin", "foxbit", "tesouro direto"
        ));
    }

    public MerchantCategoryClassifier(
            CategoryRepository categoryRepository,
            DefaultCategorySeeder categorySeeder,
            @Value("${ai.gemini.api-key:}") String geminiApiKey
    ) {
        this.categoryRepository = categoryRepository;
        this.categorySeeder = categorySeeder;
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
    }

    /**
     * Identifica a categoria da transação a partir da descrição e vincula ao ID da categoria do usuário.
     * Retorna a categoria identificada ou "Outros" se duvidoso/não encontrado.
     */
    public UUID resolveCategoryId(UUID userId, String rawDescription) {
        List<Category> userCategories = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        if (userCategories.isEmpty()) {
            userCategories = categorySeeder.seedDefaultsForUser(userId);
        }

        String suggestedCategoryName = classifyCategoryName(rawDescription);

        // 1. Tenta achar categoria pelo nome sugerido
        for (Category cat : userCategories) {
            if (normalize(cat.getName()).equalsIgnoreCase(normalize(suggestedCategoryName))) {
                return cat.getId();
            }
        }

        // Se a categoria sugerida não for "Outros", assegura que as categorias padrão estão completas para o usuário
        if (!suggestedCategoryName.equalsIgnoreCase("Outros")) {
            userCategories = categorySeeder.seedDefaultsForUser(userId);
            for (Category cat : userCategories) {
                if (normalize(cat.getName()).equalsIgnoreCase(normalize(suggestedCategoryName))) {
                    return cat.getId();
                }
            }
        }

        // 2. Se não encontrou a categoria sugerida, busca a categoria "Outros"
        for (Category cat : userCategories) {
            if (normalize(cat.getName()).equalsIgnoreCase("outros")) {
                return cat.getId();
            }
        }

        // 3. Fallback: primeira categoria ou nulo se não houver nenhuma
        return userCategories.isEmpty() ? null : userCategories.get(0).getId();
    }

    /**
     * Classifica o nome da categoria mais provável para a descrição do lançamento.
     */
    public String classifyCategoryName(String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            return "Outros";
        }

        String cleaned = cleanMerchantName(rawDescription);
        String normalizedCleaned = normalize(cleaned);

        for (Map.Entry<String, List<String>> entry : MERCHANT_RULES.entrySet()) {
            String category = entry.getKey();
            for (String keyword : entry.getValue()) {
                String normKeyword = normalize(keyword);
                // Busca por correspondência exata ou substring no nome limpo
                if (normalizedCleaned.contains(normKeyword)) {
                    return category;
                }
            }
        }

        // Se tiver chave Gemini disponível e o termo tiver tamanho razoável, poderia consultar IA.
        // Se não encontrar ou não tiver certeza absoluta, retorna "Outros".
        return "Outros";
    }

    /**
     * Limpa prefixos de adquirentes e sufixos de parcelas bancárias.
     * Exemplo: 'Magalu*Magalu - Parcela 9/10' -> 'Magalu Magalu'
     * Exemplo: 'PAG*PadariaReal' -> 'PadariaReal'
     */
    public static String cleanMerchantName(String raw) {
        if (raw == null) return "";
        String s = raw.trim();

        // 1. Remover padrões de parcelas: 'Parcela 9/10', 'Parc 01/02', '(01/10)', '09/10'
        s = s.replaceAll("(?i)\\b(?:parcela|parc|par)\\s*\\d{1,2}\\s*[/|-]\\s*\\d{1,2}\\b", " ");
        s = s.replaceAll("\\(\\s*\\d{1,2}\\s*[/|-]\\s*\\d{1,2}\\s*\\)", " ");
        s = s.replaceAll("\\b\\d{1,2}/\\d{1,2}\\b", " ");

        // 2. Remover prefixos de maquininhas/adquirentes
        s = s.replaceAll("(?i)^(?:pag\\*|mp\\*|cielo\\*|rede\\*|stone\\*|sumup\\*|pg\\*|ifd\\*|ebn\\*|dl\\*|paypal\\*|mercpag\\*)", " ");

        // 3. Substituir asteriscos e hífens por espaços
        s = s.replaceAll("[*_\\-#]", " ");

        // 4. Remover espaços múltiplos
        s = s.replaceAll("\\s+", " ").trim();

        return s.isBlank() ? raw.trim() : s;
    }

    private static String normalize(String input) {
        if (input == null) return "";
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
