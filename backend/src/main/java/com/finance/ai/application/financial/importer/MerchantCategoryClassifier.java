package com.finance.ai.application.financial.importer;

import com.finance.ai.application.financial.DefaultCategorySeeder;
import com.finance.ai.domain.ai.AiExtractionPort;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.domain.financial.CategoryRepository;
import com.finance.ai.domain.financial.Transaction;
import com.finance.ai.domain.financial.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Classificador inteligente de estabelecimentos comerciais a partir de faturas de cartão e extratos.
 * Utiliza limpeza de padrões bancários (parcelas, prefixos de adquirentes), catálogo rico de marcas
 * e comércios brasileiros, fallback para IA e resolução determinística para categoria "Outros".
 */
@Component
public class MerchantCategoryClassifier {

    private static final Logger log = LoggerFactory.getLogger(MerchantCategoryClassifier.class);

    // Regras determinísticas de mapeamento de palavras-chave/marcas para categorias padrão
    private static final Map<String, List<String>> MERCHANT_RULES = new LinkedHashMap<>();

    static {
        MERCHANT_RULES.put("Compras", List.of(
                "havan", "magalu", "magazine luiza", "casas bahia", "americanas", "lojas americanas",
                "mercado livre", "mercadolivre", "mercado pago", "amazon", "shopee", "shein",
                "aliexpress", "ali express", "zara", "renner", "lojas renner", "riachuelo",
                "c&a", "cea", "dafiti", "centauro", "decathlon", "netshoes", "nike", "adidas", "puma",
                "olympikus", "asics", "leroy merlin", "leroy", "telhanorte", "tok&stok", "tokstok",
                "mobly", "fast shop", "kabum", "pichau", "terabyte", "kalunga", "apple store",
                "samsung", "xiaomi", "dell", "polishop", "ponto frio", "pontofrio", "marabraz",
                "etna", "c&c", "cec", "sodimac", "camicado", "lojas cem", "pernambucanas",
                "marisa", "torra", "lojas torra", "besni", "tng", "hering", "youcom",
                "ri happy", "rihappy", "pbkids", "toy mania", "boticario", "o boticario",
                "natura", "sephora", "avon", "quem disse berenice", "loccitane", "belezanaweb",
                "beleza na web", "petz", "cobasi", "petlove", "pet shop", "agropecuaria",
                "oticas carol", "otica diniz", "oticas diniz", "chilli beans", "grandvision",
                "vivara", "pandora", "submarino", "shoptime"
        ));

        MERCHANT_RULES.put("Delivery", List.of(
                "ifood", "rappi", "ze delivery", "zedelivery", "ai que fome", "aiquefome",
                "deliway", "delivery direct", "ubereats", "uber eats", "delivery", "clube ifood"
        ));

        MERCHANT_RULES.put("Aplicativo de Transporte", List.of(
                "uber", "99app", "99 app", "99pop", "99 pop", "99 corrida", "99 taxi", "99 táxi", "99",
                "log urbano", "logurbano", "rapidocar", "rapido car", "rapido-car", "cabify",
                "indrive", "in drive", "maxim", "buser", "vou de taxi", "blablacar", "bla bla car"
        ));

        MERCHANT_RULES.put("Alimentação", List.of(
                "mcdonald", "mc donald", "burger king", "bk", "subway", "habib", "outback",
                "madero", "coco bambu", "starbucks", "cacau show", "kopenhagen", "brasil cacau",
                "dengo", "lindt", "bacio di latte", "spoleto", "giraffas", "ragazzo", "sodie", "sodiê",
                "amor aos pedacos", "bobs", "kfc", "popeyes", "pizza hut", "dominos", "jeronymo",
                "si senor", "carrefour", "pao de acucar", "extra", "assai", "atacadao",
                "supermercado", "supermercados", "mercado", "hipermercado", "hortifruti",
                "sacolao", "dia supermercado", "mambo", "st marche", "zaffari", "sams club",
                "sam's club", "roldao", "spani", "tenda atacado", "natural da terra", "oba hortifruti",
                "amigao", "supermercado amigao", "supermercados amigao", "muffato", "super muffato",
                "condor", "supermercado condor", "angeloni", "mart minas", "supernosso", "bretas",
                "savegnago", "tauste", "hirota", "guanabara", "mundial", "prezunic", "bahamas", "bh supermercados",
                "swift", "acougue", "carnes", "frigorifico", "varejao", "padaria", "panificadora",
                "panetteria", "confeitaria", "cafeteria", "rei do mate", "casa do pao de queijo",
                "the coffee", "nespresso", "restaurante", "pizzaria", "lanchonete", "bar",
                "boteco", "churrascaria", "cantina", "bistro", "sorveteria", "cafe", "hamburgueria",
                "choperia", "cervejaria", "espetinho"
        ));

        MERCHANT_RULES.put("Transporte", List.of(
                "taxi", "posto", "postos", "auto posto", "autoposto", "shell", "ipiranga",
                "petrobras", "br distribuidora", "ale", "graal", "sem parar", "semparar",
                "veloe", "conectcar", "move mais", "taggy", "pedagio", "auto pista", "ecovias",
                "ccr", "bilhete unico", "metro", "cptm", "supervia", "vlt", "azul linhas",
                "voeazul", "gol linhas", "voegol", "latam", "passaredo", "voepass", "decolar",
                "booking", "clickbus", "embarca.ai", "localiza", "movida", "unidas",
                "foco rent a car", "estapar", "estacionamento", "combustivel", "gasolina",
                "etanol", "gnv", "diesel"
        ));

        MERCHANT_RULES.put("Saúde", List.of(
                "droga raia", "drogasil", "pague menos", "panvel", "pacheco", "drogaria sao paulo",
                "ultrafarma", "drogaria araujo", "farmacia sao joao", "extrafarma", "belfarma",
                "drogal", "farmacia", "farmacias", "drogaria", "drogarias", "unimed", "notre dame",
                "notredame", "intermedica", "hapvida", "amil", "sulamerica", "bradesco saude",
                "prevent senior", "fleury", "lavoisier", "dasa", "delboni", "laboratorio",
                "hospital", "clinica", "pronto socorro", "medico", "dentista", "odonto",
                "odontoprev", "sorridents", "oftalmo", "terapia", "psicologia", "fisioterapia",
                "dr consulta", "doutor consulta"
        ));

        MERCHANT_RULES.put("Lazer", List.of(
                "netflix", "spotify", "amazon prime", "prime video", "disney", "disney+",
                "star+", "star plus", "max", "hbo", "globoplay", "premiere", "telecine",
                "youtube", "deezer", "apple music", "tidal", "crunchyroll", "steam",
                "playstation", "ps store", "psn", "sony", "xbox", "microsoft store",
                "nintendo", "twitch", "riot games", "blizzard", "epic games", "valve",
                "ea play", "cinema", "cinemark", "cinepolis", "uci", "kinoplex",
                "ingresso.com", "sympla", "eventim", "ticket360", "show", "teatro",
                "parque", "aquario", "zoologico", "beto carrero", "hot park", "hopi hari"
        ));

        MERCHANT_RULES.put("Serviços & Contas", List.of(
                "enel", "cpfl", "light", "cemig", "copel", "equatorial", "neoenergia",
                "energisa", "sabesp", "sanepar", "copasa", "embasa", "corsan", "cagece",
                "comgas", "naturgy", "claro", "vivo", "tim", "oi", "algar", "starlink",
                "desktop internet", "brisanet", "internet", "banda larga", "telefone",
                "condominio", "iptu", "ipva", "cartorio", "porto seguro", "tokio marine",
                "allianz", "gas", "energia", "luz", "agua"
        ));

        MERCHANT_RULES.put("Educação", List.of(
                "udemy", "coursera", "alura", "rocketseat", "hotmart", "eduzz", "kiwify",
                "ebac", "descomplica", "estacio", "anhanguera", "fgv", "puc", "usp", "unip",
                "anhembi", "mackenzie", "escola", "colegio", "faculdade", "universidade",
                "mensalidade escolar", "livraria", "saraiva", "leitura", "curitiba",
                "da vila", "travessa", "curso", "papelaria"
        ));

        MERCHANT_RULES.put("Investimentos", List.of(
                "nuinvest", "rico", "xp investimentos", "xp corretora", "clear", "btg pactual",
                "inter invest", "agora", "avenue", "nomad", "binance", "mercado bitcoin",
                "foxbit", "bitypreco", "tesouro direto"
        ));
    }

    private final CategoryRepository categoryRepository;
    private final DefaultCategorySeeder categorySeeder;
    private final TransactionRepository transactionRepository;
    private final AiExtractionPort aiExtractionPort;
    private final String geminiApiKey;
    private final Map<String, String> aiCategoryCache = new ConcurrentHashMap<>();

    @Autowired
    public MerchantCategoryClassifier(
            CategoryRepository categoryRepository,
            DefaultCategorySeeder categorySeeder,
            @Autowired(required = false) TransactionRepository transactionRepository,
            @Autowired(required = false) AiExtractionPort aiExtractionPort,
            @Value("${ai.gemini.api-key:}") String geminiApiKey
    ) {
        this.categoryRepository = categoryRepository;
        this.categorySeeder = categorySeeder;
        this.transactionRepository = transactionRepository;
        this.aiExtractionPort = aiExtractionPort;
        this.geminiApiKey = geminiApiKey != null ? geminiApiKey.trim() : "";
    }

    public MerchantCategoryClassifier(
            CategoryRepository categoryRepository,
            DefaultCategorySeeder categorySeeder,
            String geminiApiKey
    ) {
        this(categoryRepository, categorySeeder, null, null, geminiApiKey);
    }

    public MerchantCategoryClassifier(
            CategoryRepository categoryRepository,
            DefaultCategorySeeder categorySeeder,
            AiExtractionPort aiExtractionPort
    ) {
        this(categoryRepository, categorySeeder, null, aiExtractionPort, "");
    }

    public MerchantCategoryClassifier(
            CategoryRepository categoryRepository,
            DefaultCategorySeeder categorySeeder,
            TransactionRepository transactionRepository
    ) {
        this(categoryRepository, categorySeeder, transactionRepository, null, "");
    }

    /**
     * Identifica a categoria da transação a partir da descrição e vincula ao ID da categoria do usuário.
     * Retorna o UUID da categoria identificada ou null caso o estabelecimento seja desconhecido/não identificado.
     */
    public UUID resolveCategoryId(UUID userId, String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            return null;
        }

        List<Category> loadedCategories = categoryRepository.findAllByUserIdOrSystemDefault(userId);
        if (loadedCategories.isEmpty()) {
            loadedCategories = categorySeeder.seedDefaultsForUser(userId);
        }
        final List<Category> activeCategories = loadedCategories;
        final List<String> activeCategoryNames = activeCategories.stream().map(Category::getName).toList();

        // 0. Inteligência Adaptativa: Checa se o usuário já possui lançamentos anteriores com esse mesmo estabelecimento.
        // As preferências e ajustes manuais do usuário têm prioridade máxima sobre o catálogo padrão e sobre a IA.
        if (transactionRepository != null) {
            String currentClean = normalize(cleanMerchantName(rawDescription));
            if (!currentClean.isBlank() && currentClean.length() >= 3) {
                Set<UUID> validCategoryIds = activeCategories.stream()
                        .map(Category::getId)
                        .collect(Collectors.toSet());

                // Ordena histórico pelas movimentações mais recentemente atualizadas ou criadas
                List<Transaction> pastTxs = transactionRepository.findAllByUserId(userId).stream()
                        .filter(tx -> tx.getCategoryId() != null && tx.getDescription() != null)
                        .filter(tx -> validCategoryIds.contains(tx.getCategoryId()))
                        .sorted(Comparator.comparing(
                                (Transaction tx) -> tx.getUpdatedAt() != null ? tx.getUpdatedAt() : tx.getCreatedAt(),
                                Comparator.nullsLast(Comparator.reverseOrder())
                        ))
                        .toList();

                // 0.1 Correspondência Exata Prioritária (nome limpo e normalizado idêntico)
                for (var tx : pastTxs) {
                    String pastClean = normalize(cleanMerchantName(tx.getDescription()));
                    if (!pastClean.isBlank() && pastClean.equals(currentClean)) {
                        log.info("Categoria auto-resolvida por histórico exato do usuário (ajuste mais recente): '{}' -> categoria ID {}", rawDescription, tx.getCategoryId());
                        return tx.getCategoryId();
                    }
                }

                // 0.2 Correspondência Parcial Segura (comprimento mínimo de 4 letras para evitar falsos positivos)
                for (var tx : pastTxs) {
                    String pastClean = normalize(cleanMerchantName(tx.getDescription()));
                    if (!pastClean.isBlank() && pastClean.length() >= 4 && currentClean.length() >= 4) {
                        if (pastClean.contains(currentClean) || currentClean.contains(pastClean)) {
                            log.info("Categoria auto-resolvida por histórico parcial do usuário (ajuste mais recente): '{}' -> categoria ID {}", rawDescription, tx.getCategoryId());
                            return tx.getCategoryId();
                        }
                    }
                }
            }
        }

        // 1. Tenta classificar usando regras determinísticas locais rápidas (0ms de latência)
        String suggestedCategoryName = classifyCategoryName(rawDescription);

        // 2. Se não encontrou por regras determinísticas locais, consulta a IA especializada
        if (suggestedCategoryName == null && aiExtractionPort != null) {
            String cleanName = cleanMerchantName(rawDescription);
            if (!cleanName.isBlank()) {
                suggestedCategoryName = aiCategoryCache.computeIfAbsent(cleanName.toLowerCase(Locale.ROOT), term -> {
                    String aiCategory = aiExtractionPort.classifyMerchant(term, activeCategoryNames);
                    if (aiCategory != null && !aiCategory.isBlank()) {
                        log.info("Estabelecimento categorizado via IA: '{}' -> '{}'", rawDescription, aiCategory);
                        return aiCategory;
                    }
                    return "";
                });
                if (suggestedCategoryName.isBlank()) {
                    suggestedCategoryName = null;
                }
            }
        }

        if (suggestedCategoryName == null) {
            return null;
        }

        // 3. Tenta achar categoria pelo nome sugerido
        for (Category cat : activeCategories) {
            if (normalize(cat.getName()).equalsIgnoreCase(normalize(suggestedCategoryName))) {
                return cat.getId();
            }
        }

        // 4. Se a categoria sugerida foi identificada por regra ou IA mas ainda não está no banco do usuário
        List<Category> refreshedCategories = categorySeeder.seedDefaultsForUser(userId);
        for (Category cat : refreshedCategories) {
            if (normalize(cat.getName()).equalsIgnoreCase(normalize(suggestedCategoryName))) {
                return cat.getId();
            }
        }

        // Se não encontrou nem mapeou, não preenche automaticamente com categoria genérica
        return null;
    }

    /**
     * Classifica o nome da categoria mais provável para a descrição do lançamento.
     * Retorna o nome da categoria identificada ou null se desconhecido/não identificado.
     */
    public String classifyCategoryName(String rawDescription) {
        if (rawDescription == null || rawDescription.isBlank()) {
            return null;
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

        // Não força categoria "Outros" se não tiver certeza de quem é o estabelecimento
        return null;
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
        s = s.replaceAll("(?i)^(?:pag\\*|mp\\*|cielo\\*|rede\\*|stone\\*|sumup\\*|pg\\*|ifd\\*|ebn\\*|dl\\*|paypal\\*|mercpag\\*|getnet\\*|safra\\*|ton\\*|infinitepay\\*)", " ");

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
