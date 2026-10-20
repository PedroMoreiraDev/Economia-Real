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

    private final String apiKey;
    private final String modelName;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final NaturalLanguageRuleParser ruleParser;
    private final PiiSanitizer piiSanitizer;

    public GeminiAiService(
            @Value("${ai.gemini.api-key:}") String apiKey,
            @Value("${ai.gemini.model:gemini-2.5-flash}") String modelName,
            ObjectMapper objectMapper,
            NaturalLanguageRuleParser ruleParser,
            PiiSanitizer piiSanitizer
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.modelName = (modelName != null && !modelName.isBlank()) ? modelName.trim() : "gemini-2.5-flash";
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
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String responseErr = ex.getResponseBodyAsString();
            log.warn("Erro retornado pela API do Gemini ({}) ao transcrever áudio: {}", ex.getStatusCode(), responseErr);
            if (responseErr.contains("API_KEY_INVALID") || responseErr.contains("key is invalid")) {
                throw new IllegalStateException("A chave GEMINI_API_KEY informada é inválida. Verifique a chave no Google AI Studio.");
            }
            if (responseErr.contains("RESOURCE_EXHAUSTED") || ex.getStatusCode().value() == 429) {
                throw new IllegalStateException("Limite de requisições temporariamente excedido na API Gemini. Tente novamente em instantes.");
            }
            if (ex.getStatusCode().value() == 503) {
                throw new IllegalStateException("Os servidores da IA Gemini estão temporariamente sobrecarregados. Por favor, tente novamente em alguns segundos.");
            }
            throw new IllegalStateException("Erro ao processar áudio na API Gemini (" + ex.getStatusCode() + "): " + responseErr);
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

        String responseJson = executePostWithModelFallback(requestBody);

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

        String responseJson = executePostWithModelFallback(requestBody);
        return parseGeminiResponse(responseJson, text, TransactionOrigin.AI_TEXT);
    private String detectAudioMimeType(byte[] bytes, String declaredMime) {
        if (bytes != null && bytes.length >= 4) {
            // WebM / Matroska (1A 45 DF A3)
            if ((bytes[0] & 0xFF) == 0x1A && (bytes[1] & 0xFF) == 0x45 && (bytes[2] & 0xFF) == 0xDF && (bytes[3] & 0xFF) == 0xA3) {
                return "audio/webm";
            }
            // WAV (RIFF....WAVE)
            if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F') {
                return "audio/wav";
            }
            // MP4 / M4A (offset 4 'ftyp')
            if (bytes.length >= 8 && bytes[4] == 'f' && bytes[5] == 't' && bytes[6] == 'y' && bytes[7] == 'p') {
                return "audio/mp4";
            }
            // Ogg (OggS)
            if (bytes[0] == 'O' && bytes[1] == 'g' && bytes[2] == 'g' && bytes[3] == 'S') {
                return "audio/ogg";
            }
            // MP3 (ID3 ou frame sync 0xFF 0xFB/0xF3)
            if ((bytes[0] == 'I' && bytes[1] == 'D' && bytes[2] == '3') ||
                    ((bytes[0] & 0xFF) == 0xFF && ((bytes[1] & 0xFF) & 0xE0) == 0xE0)) {
                return "audio/mp3";
            }
            // FLAC
            if (bytes[0] == 'f' && bytes[1] == 'L' && bytes[2] == 'a' && bytes[3] == 'C') {
                return "audio/flac";
            }
            // AAC ADTS (0xFF 0xF1 ou 0xFF 0xF9)
            if ((bytes[0] & 0xFF) == 0xFF && ((bytes[1] & 0xF6) == 0xF0)) {
                return "audio/aac";
            }
        }
        if (declaredMime != null && !declaredMime.isBlank()) {
            String clean = declaredMime.split(";")[0].trim().toLowerCase();
            if (clean.equals("audio/m4a") || clean.equals("audio/x-m4a")) return "audio/mp4";
            if (clean.startsWith("audio/")) return clean;
        }
        return "audio/webm";
    }

    private String extractTextFromGeminiResponse(String responseJson) {
        if (responseJson == null || responseJson.isBlank()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(responseJson);

            // 1. Itera por candidates -> content -> parts
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                for (JsonNode candidate : candidates) {
                    JsonNode parts = candidate.path("content").path("parts");
                    if (parts.isArray()) {
                        StringBuilder sb = new StringBuilder();
                        for (JsonNode part : parts) {
                            // Ignora partes de pensamento/reasoning interno (thought: true)
                            if (part.has("thought") && part.get("thought").asBoolean()) {
                                continue;
                            }
                            if (part.has("text")) {
                                String t = part.get("text").asText("").trim();
                                if (!t.isBlank()) {
                                    if (!sb.isEmpty()) sb.append(" ");
                                    sb.append(t);
                                }
                            }
                        }
                        String candidateText = sb.toString().trim();
                        if (!candidateText.isBlank()) {
                            return candidateText;
                        }
                    }

                    if (candidate.has("text") && !candidate.get("text").asText("").isBlank()) {
                        return candidate.get("text").asText("").trim();
                    }
                }
            }

            // 2. Caso a resposta tenha "text" na raiz
            if (root.has("text") && !root.get("text").asText("").isBlank()) {
                return root.get("text").asText("").trim();
            }
        } catch (Exception ex) {
            log.warn("Erro ao fazer parse da resposta do Gemini: {}", ex.getMessage());
        }
        return "";
    }

    private String callGeminiApiForAudioTranscription(byte[] audioBytes, String contentType) throws Exception {
        String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
        String detectedMime = detectAudioMimeType(audioBytes, contentType);
        log.info("Iniciando transcrição de áudio: tamanho={} bytes, mimeDeclarado='{}', mimeDetectado='{}'",
                audioBytes.length, contentType, detectedMime);

        String prompt = "Transcreva EXATAMENTE em português o que foi dito no áudio gravado. Retorne estritamente o texto falado, sem aspas, sem introdução e sem explicações.";

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(
                                Map.of("inlineData", Map.of("mimeType", detectedMime, "data", base64Audio)),
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.0
                )
        );

        List<String> discovered = getAvailableModels();
        List<String> modelsToTry = new ArrayList<>();

        // Lista ordenada por robustez comprovada para áudio multimodal na API Gemini
        List<String> preferredAudioModels = List.of(
                "gemini-flash-latest",
                "gemini-3.5-flash",
                "gemini-3.8-flash",
                "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-3.5-transcribe",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite",
                "gemini-omni-flash-preview",
                "gemini-omni-1.1-flash",
                "gemini-pro-latest",
                "gemini-3.1-pro-preview",
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash-002",
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-2.5-flash"
        );

        if (!discovered.isEmpty()) {
            for (String pref : preferredAudioModels) {
                if (discovered.contains(pref)) {
                    modelsToTry.add(pref);
                }
            }
            for (String disc : discovered) {
                if (!modelsToTry.contains(disc)) {
                    modelsToTry.add(disc);
                }
            }
        }

        if (modelsToTry.isEmpty()) {
            for (String fallback : preferredAudioModels) {
                if (!modelsToTry.contains(fallback)) {
                    modelsToTry.add(fallback);
                }
            }
        }

        log.info("Modelos candidatos para transcrição de áudio Gemini: {}", modelsToTry);

        org.springframework.web.client.HttpStatusCodeException lastHttpException = null;

        for (String apiVersion : List.of("v1beta", "v1")) {
            for (String model : modelsToTry) {
                try {
                    String urlString = "https://generativelanguage.googleapis.com/" + apiVersion + "/models/" + model + ":generateContent?key=" + apiKey;
                    java.net.URI targetUri = java.net.URI.create(urlString);

                    String responseJson = restClient.post()
                            .uri(targetUri)
                            .header("x-goog-api-key", apiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestBody)
                            .retrieve()
                            .body(String.class);

                    String transcription = extractTextFromGeminiResponse(responseJson);

                    if (!transcription.isBlank()) {
                        log.info("Transcrição de áudio concluída com sucesso pelo modelo '{}' ({}): \"{}\"",
                                model, apiVersion, transcription);
                        return transcription;
                    }

                    log.warn("Modelo '{}' ({}) respondeu status 200, mas a transcrição veio vazia. Tentando próximo modelo...",
                            model, apiVersion);

                } catch (org.springframework.web.client.HttpStatusCodeException ex) {
                    lastHttpException = ex;
                    int statusCode = ex.getStatusCode().value();
                    String respBody = ex.getResponseBodyAsString();

                    boolean shouldRetryNextModel = statusCode == 404 ||
                            statusCode == 503 ||
                            statusCode == 429 ||
                            statusCode == 500 ||
                            (statusCode == 400 && (respBody.toLowerCase().contains("modality") || respBody.toLowerCase().contains("not supported") || respBody.toLowerCase().contains("audio")));

                    if (shouldRetryNextModel) {
                        log.warn("Modelo '{}' ({}) retornou status {}. Tentando próximo modelo...", model, apiVersion, statusCode);
                        continue;
                    }
                    throw ex;
                }
            }
        }

        if (lastHttpException != null) {
            throw lastHttpException;
        }
        return "";
    }

    private ExtractedTransaction parseGeminiResponse(String responseJson, String originalText, TransactionOrigin origin) throws Exception {
        String jsonContent = extractTextFromGeminiResponse(responseJson);
        if (jsonContent.isBlank()) {
            jsonContent = "{}";
        }

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

    private volatile List<String> cachedAvailableModels = null;

    public List<String> getAvailableModels() {
        if (cachedAvailableModels != null && !cachedAvailableModels.isEmpty()) {
            return cachedAvailableModels;
        }
        cachedAvailableModels = fetchAvailableModelsFromGoogle();
        return cachedAvailableModels;
    }

    private List<String> fetchAvailableModelsFromGoogle() {
        if (apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY não configurada. Não é possível listar modelos disponíveis.");
            return Collections.emptyList();
        }

        for (String apiVersion : List.of("v1beta", "v1")) {
            try {
                String listUrl = "https://generativelanguage.googleapis.com/" + apiVersion + "/models?key=" + apiKey;
                java.net.URI uri = java.net.URI.create(listUrl);

                String response = restClient.get()
                        .uri(uri)
                        .header("x-goog-api-key", apiKey)
                        .retrieve()
                        .body(String.class);

                if (response != null && !response.isBlank()) {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode modelsNode = root.path("models");
                    if (modelsNode.isArray() && !modelsNode.isEmpty()) {
                        List<String> validModels = new ArrayList<>();
                        for (JsonNode m : modelsNode) {
                            String name = m.path("name").asText("");
                            JsonNode methods = m.path("supportedGenerationMethods");
                            boolean canGenerate = false;
                            if (methods.isArray()) {
                                for (JsonNode method : methods) {
                                    if ("generateContent".equalsIgnoreCase(method.asText())) {
                                        canGenerate = true;
                                        break;
                                    }
                                }
                            }
                            if (canGenerate && !name.isBlank()) {
                                String cleanName = name.startsWith("models/") ? name.substring(7) : name;
                                String lower = cleanName.toLowerCase();
                                // Filtra modelos especializados que não aceitam entrada de áudio
                                boolean isAudioCandidate = !lower.contains("tts") &&
                                        !lower.contains("embed") &&
                                        !lower.contains("imagen") &&
                                        !lower.contains("aqa") &&
                                        !lower.contains("gemma") &&
                                        !lower.contains("image") &&
                                        !lower.contains("clip") &&
                                        !lower.contains("lyria") &&
                                        !lower.contains("robotics") &&
                                        !lower.contains("computer-use") &&
                                        !lower.contains("deep-research") &&
                                        !lower.contains("antigravity");

                                if (isAudioCandidate) {
                                    validModels.add(cleanName);
                                }
                            }
                        }
                        log.info("Modelos Google AI descobertos dinamicamente ({}) com suporte a áudio/generateContent: {}", apiVersion, validModels);
                        if (!validModels.isEmpty()) {
                            return validModels;
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Tentativa de consultar ModelService.ListModels ({}) falhou: {}", apiVersion, ex.getMessage());
            }
        }
        return Collections.emptyList();
    }

    private String executePostWithModelFallback(Map<String, Object> requestBody) {
        List<String> discovered = getAvailableModels();

        List<String> modelsToTry = new ArrayList<>();

        // Lista de modelos multimodais de áudio e fala ordenados por especialidade e estabilidade
        List<String> preferredAudioModels = List.of(
                "gemini-flash-latest",
                "gemini-3.5-flash",
                "gemini-3.8-flash",
                "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-3.5-transcribe",
                "gemini-flash-lite-latest",
                "gemini-3.1-flash-lite",
                "gemini-omni-flash-preview",
                "gemini-omni-1.1-flash",
                "gemini-pro-latest",
                "gemini-3.1-pro-preview",
                "gemini-2.0-flash",
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash-002",
                "gemini-1.5-flash",
                "gemini-1.5-flash-latest",
                "gemini-2.5-flash"
        );

        // Se descobriu modelos reais da chave da conta, prioriza os modelos de áudio comprovados
        if (!discovered.isEmpty()) {
            for (String pref : preferredAudioModels) {
                if (discovered.contains(pref)) {
                    modelsToTry.add(pref);
                }
            }
            for (String disc : discovered) {
                if (!modelsToTry.contains(disc)) {
                    modelsToTry.add(disc);
                }
            }
        }

        // Se não conseguiu descobrir ou a lista veio vazia, usa lista manual
        if (modelsToTry.isEmpty()) {
            for (String fallback : preferredAudioModels) {
                if (!modelsToTry.contains(fallback)) {
                    modelsToTry.add(fallback);
                }
            }
        }

        log.info("Modelos candidatos para requisição Gemini: {}", modelsToTry);

        org.springframework.web.client.HttpStatusCodeException lastHttpException = null;

        // Testa em v1beta e fallback em v1 caso a versão da API seja estrita
        for (String apiVersion : List.of("v1beta", "v1")) {
            for (String model : modelsToTry) {
                try {
                    String urlString = "https://generativelanguage.googleapis.com/" + apiVersion + "/models/" + model + ":generateContent?key=" + apiKey;
                    java.net.URI targetUri = java.net.URI.create(urlString);

                    return restClient.post()
                            .uri(targetUri)
                            .header("x-goog-api-key", apiKey)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(requestBody)
                            .retrieve()
                            .body(String.class);
                } catch (org.springframework.web.client.HttpStatusCodeException ex) {
                    lastHttpException = ex;
                    int statusCode = ex.getStatusCode().value();
                    String respBody = ex.getResponseBodyAsString();

                    // Se o modelo estiver sobrecarregado (503), não encontrado (404), sem cota (429) ou modalidade não habilitada (400), tenta o próximo!
                    boolean shouldRetryNextModel = statusCode == 404 ||
                            statusCode == 503 ||
                            statusCode == 429 ||
                            statusCode == 500 ||
                            (statusCode == 400 && (respBody.toLowerCase().contains("modality") || respBody.toLowerCase().contains("not supported") || respBody.toLowerCase().contains("audio")));

                    if (shouldRetryNextModel) {
                        log.warn("Modelo '{}' na versão '{}' retornou status {}. Tentando próximo modelo...", model, apiVersion, statusCode);
                        continue;
                    }
                    throw ex;
                }
            }
        }

        if (lastHttpException != null) {
            throw lastHttpException;
        }
        throw new IllegalStateException("Nenhum modelo Gemini compatível encontrado.");
    }
}
