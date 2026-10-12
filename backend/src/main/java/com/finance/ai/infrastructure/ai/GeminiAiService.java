package com.finance.ai.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.ai.domain.ai.AiExtractionPort;
import com.finance.ai.domain.ai.AudioTranscriptionPort;
import com.finance.ai.domain.ai.ExtractedTransaction;
import com.finance.ai.domain.financial.TransactionOrigin;
import com.finance.ai.domain.financial.TransactionType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;

/**
 * Adaptador de infraestrutura para integração com a API Google Gemini (ou fallback determinístico).
 * Implementa AiExtractionPort e AudioTranscriptionPort com circuit breaker e timeout estrito (ADR-007).
 */
@Service
public class GeminiAiService implements AiExtractionPort, AudioTranscriptionPort {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

    private final String apiKey;
    private final String modelName;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final NaturalLanguageRuleParser ruleParser;
    private final PiiSanitizer piiSanitizer;

    public GeminiAiService(
            @Value("${ai.gemini.api-key:}") String apiKey,
            @Value("${ai.gemini.model:gemini-1.5-flash}") String modelName,
            ObjectMapper objectMapper,
            NaturalLanguageRuleParser ruleParser,
            PiiSanitizer piiSanitizer
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.modelName = (modelName != null && !modelName.isBlank()) ? modelName.trim() : "gemini-1.5-flash";
        this.objectMapper = objectMapper;
        this.ruleParser = ruleParser;
        this.piiSanitizer = piiSanitizer;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(4));
        requestFactory.setReadTimeout(Duration.ofSeconds(8));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public ExtractedTransaction extractFromText(String naturalText, List<String> availableCategories) {
        String sanitizedText = piiSanitizer.sanitize(naturalText);

        if (apiKey.isBlank()) {
            log.debug("GEMINI_API_KEY não configurada. Utilizando motor determinístico de regras de linguagem natural.");
            return ruleParser.parse(sanitizedText, availableCategories, TransactionOrigin.AI_TEXT);
        }

        try {
            return callGeminiApiForText(sanitizedText, availableCategories);
        } catch (Exception ex) {
            log.warn("Falha ou indisponibilidade na chamada da API Gemini ({}). Acionando fallback determinístico seguro.", ex.getMessage());
            return ruleParser.parse(sanitizedText, availableCategories, TransactionOrigin.AI_TEXT);
        }
    }

    @Override
    public String transcribeAudio(byte[] audioBytes, String contentType) {
        if (audioBytes == null || audioBytes.length == 0) {
            return "";
        }

        if (apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY não configurada para transcrição de áudio.");
            throw new IllegalStateException("Para transcrição de arquivos de áudio via servidor, a variável GEMINI_API_KEY deve estar configurada.");
        }

        try {
            return callGeminiApiForAudioTranscription(audioBytes, contentType);
        } catch (Exception ex) {
            log.warn("Falha na transcrição de áudio via API Gemini ({}).", ex.getMessage());
            throw new RuntimeException("Não foi possível transcrever o áudio: " + ex.getMessage(), ex);
        }
    }

    @Override
    public String classifyMerchant(String rawDescription, List<String> availableCategories) {
        if (rawDescription == null || rawDescription.isBlank() || availableCategories == null || availableCategories.isEmpty()) {
            return null;
        }

        if (apiKey.isBlank()) {
            log.debug("GEMINI_API_KEY não configurada. Classificação de estabelecimento via IA ignorada.");
            return null;
        }

        try {
            return callGeminiApiForMerchant(rawDescription, availableCategories);
        } catch (Exception ex) {
            log.warn("Falha ao consultar IA Gemini para classificar estabelecimento '{}': {}", rawDescription, ex.getMessage());
            return null;
        }
    }

    private String callGeminiApiForMerchant(String rawDescription, List<String> availableCategories) throws Exception {
        String categoriesList = String.join(", ", availableCategories);

        String prompt = """
                Você é um classificador financeiro de estabelecimentos e faturas bancárias brasileiras.
                Sua tarefa é analisar o nome do estabelecimento comercial ou lançamento e determinar a categoria mais apropriada dentre as categorias permitidas.

                Descrição da transação: "%s"
                Categorias permitidas: [%s]

                Regras:
                1. Analise o nome da empresa ou serviço (exemplo: "Amigao Umuarama" ou "Supermercados Amigão" é um supermercado -> Alimentação; "Droga Raia" é farmácia -> Saúde; "Posto Shell" -> Transporte; "Havan" -> Compras; "Steam" -> Lazer).
                2. Se identificar o ramo de atividade e ele corresponder a uma das categorias permitidas, retorne EXATAMENTE o nome da categoria correspondente.
                3. Se o estabelecimento for desconhecido, genérico (ex: códigos ilegíveis, nomes de pessoas sem contexto) ou você tiver dúvidas, retorne null no campo "category". NUNCA invente categorias e NUNCA retorne "Outros" se você não tiver certeza absoluta.
                4. Responda EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown ```json).

                Estrutura exigida:
                {
                  "category": string ou null,
                  "confidence": number,
                  "reason": string
                }
                """.formatted(rawDescription, categoriesList);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "responseMimeType", "application/json"
                )
        );

        String responseJson = restClient.post()
                .uri(GEMINI_API_URL, modelName, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            String rawText = textNode.asText("{}").trim();
            if (rawText.startsWith("```json")) rawText = rawText.substring(7);
            if (rawText.startsWith("```")) rawText = rawText.substring(3);
            if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length() - 3);
            rawText = rawText.trim();

            JsonNode parsed = objectMapper.readTree(rawText);
            String category = parsed.hasNonNull("category") ? parsed.get("category").asText() : null;
            double confidence = parsed.path("confidence").asDouble(0.0);

            if (category != null && !category.isBlank() && confidence >= 0.6) {
                for (String available : availableCategories) {
                    if (available.equalsIgnoreCase(category.trim())) {
                        return available;
                    }
                }
            }
        }

        return null;
    }

    private ExtractedTransaction callGeminiApiForText(String text, List<String> categories) throws Exception {
        String categoriesHint = (categories != null && !categories.isEmpty())
                ? "Categorias existentes do usuário: " + String.join(", ", categories) + "."
                : "Sugira uma categoria genérica em português.";

        String systemInstruction = """
                Você é um assistente financeiro estrito. Extraia as informações financeiras do texto do usuário.
                Responda EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown ```json).
                Estrutura exigida:
                {
                  "description": string (descrição concisa da compra ou receita),
                  "amount": number (valor monetário com ponto decimal, nunca negativo),
                  "type": "EXPENSE" ou "INCOME" ou "TRANSFER",
                  "accrualDate": "YYYY-MM-DD" (se não especificado, use a data de hoje: %s),
                  "suggestedCategoryName": string ou null,
                  "suggestedPaymentMethod": "CREDIT_CARD", "DEBIT_CARD", "PIX", "CASH" ou null,
                  "confidenceScore": number (de 0.0 a 1.0),
                  "ambiguities": [string]
                }
                %s
                """.formatted(LocalDate.now(), categoriesHint);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("text", systemInstruction + "\nTexto do usuário: " + text)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.1,
                        "responseMimeType", "application/json"
                )
        );

        String responseJson = restClient.post()
                .uri(GEMINI_API_URL, modelName, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseGeminiResponse(responseJson, text, TransactionOrigin.AI_TEXT);
    }

    private String callGeminiApiForAudioTranscription(byte[] audioBytes, String contentType) throws Exception {
        String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
        String mime = (contentType != null && !contentType.isBlank()) ? contentType : "audio/webm";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("inline_data", Map.of("mime_type", mime, "data", base64Audio)),
                                Map.of("text", "Transcreva EXATAMENTE em português o áudio fornecido. Retorne apenas o texto transcrito, sem aspas e sem comentários.")
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.0
                )
        );

        String responseJson = restClient.post()
                .uri(GEMINI_API_URL, modelName, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        return textNode.asText("").trim();
    }

    private ExtractedTransaction parseGeminiResponse(String responseJson, String originalText, TransactionOrigin origin) throws Exception {
        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        String jsonContent = textNode.asText("{}").trim();

        // Limpeza de potenciais markdown fences
        if (jsonContent.startsWith("```json")) {
            jsonContent = jsonContent.substring(7);
        }
        if (jsonContent.startsWith("```")) {
            jsonContent = jsonContent.substring(3);
        }
        if (jsonContent.endsWith("```")) {
            jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
        }
        jsonContent = jsonContent.trim();

        JsonNode parsed = objectMapper.readTree(jsonContent);

        String description = parsed.path("description").asText("Lançamento");
        BigDecimal amount = BigDecimal.valueOf(parsed.path("amount").asDouble(0.0)).setScale(2, RoundingMode.HALF_EVEN);
        String typeStr = parsed.path("type").asText("EXPENSE");
        TransactionType type = "INCOME".equalsIgnoreCase(typeStr) ? TransactionType.INCOME :
                "TRANSFER".equalsIgnoreCase(typeStr) ? TransactionType.TRANSFER : TransactionType.EXPENSE;

        String dateStr = parsed.path("accrualDate").asText(LocalDate.now().toString());
        LocalDate accrualDate;
        try {
            accrualDate = LocalDate.parse(dateStr);
        } catch (Exception ex) {
            accrualDate = LocalDate.now();
        }

        String categoryName = parsed.hasNonNull("suggestedCategoryName") ? parsed.get("suggestedCategoryName").asText() : null;
        String paymentMethod = parsed.hasNonNull("suggestedPaymentMethod") ? parsed.get("suggestedPaymentMethod").asText() : null;
        double confidence = parsed.path("confidenceScore").asDouble(0.85);

        List<String> ambiguities = new ArrayList<>();
        if (parsed.has("ambiguities") && parsed.get("ambiguities").isArray()) {
            for (JsonNode amb : parsed.get("ambiguities")) {
                ambiguities.add(amb.asText());
            }
        }

        return new ExtractedTransaction(
                description,
                amount,
                type,
                accrualDate,
                categoryName,
                null,
                paymentMethod,
                confidence,
                ambiguities,
                origin,
                originalText
        );
    }
}
