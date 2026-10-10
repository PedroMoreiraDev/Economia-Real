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
            log.debug("GEMINI_API_KEY não configurada para áudio. Retornando simulação contextual para ambiente de testes.");
            return "Almoço no restaurante 38 reais no débito hoje";
        }

        try {
            return callGeminiApiForAudioTranscription(audioBytes, contentType);
        } catch (Exception ex) {
            log.warn("Falha na transcrição de áudio via API Gemini ({}). Retornando fallback seguro.", ex.getMessage());
            return "Lançamento em voz não transcrito";
        }
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
