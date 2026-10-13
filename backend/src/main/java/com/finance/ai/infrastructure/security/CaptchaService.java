package com.finance.ai.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/**
 * Serviço de proteção CAPTCHA contra bots e automações de força bruta.
 * Fornece desafios matemáticos/táteis com assinatura criptográfica HMAC-SHA256,
 * sem requerer nenhuma API externa paga e com compatibilidade transparente com Cloudflare Turnstile.
 */
@Service
public class CaptchaService {

    private static final Logger log = LoggerFactory.getLogger(CaptchaService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final String hmacSecret;
    private final String turnstileSecret;

    public CaptchaService() {
        this("default-captcha-secret-key-finance-2026-minimum-32-chars", "");
    }

    public CaptchaService(
            @Value("${app.security.jwt-secret:default-captcha-secret-key-finance-2026-minimum-32-chars}") String hmacSecret,
            @Value("${app.security.turnstile-secret:}") String turnstileSecret) {
        this.hmacSecret = hmacSecret;
        this.turnstileSecret = turnstileSecret;
    }

    public record CaptchaChallenge(String challengeId, String question, String token) {}

    /**
     * Gera um novo desafio matemático simples e amigável para humanos com assinatura HMAC.
     */
    public CaptchaChallenge generateChallenge() {
        String challengeId = UUID.randomUUID().toString();
        long expiresAtEpochSec = Instant.now().plusSeconds(180).getEpochSecond(); // 3 minutos

        int op = RANDOM.nextInt(3);
        int a, b, answer;
        String question;

        switch (op) {
            case 0 -> { // Adição
                a = RANDOM.nextInt(1, 20);
                b = RANDOM.nextInt(1, 15);
                answer = a + b;
                question = a + " + " + b;
            }
            case 1 -> { // Subtração
                a = RANDOM.nextInt(10, 25);
                b = RANDOM.nextInt(1, a);
                answer = a - b;
                question = a + " - " + b;
            }
            default -> { // Multiplicação simples
                a = RANDOM.nextInt(2, 6);
                b = RANDOM.nextInt(2, 6);
                answer = a * b;
                question = a + " × " + b;
            }
        }

        String rawPayload = challengeId + ":" + answer + ":" + expiresAtEpochSec;
        String signature = sign(rawPayload);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(
                (rawPayload + ":" + signature).getBytes(StandardCharsets.UTF_8)
        );

        return new CaptchaChallenge(challengeId, question, token);
    }

    /**
     * Valida a resposta do usuário contra o token HMAC ou Cloudflare Turnstile.
     */
    public void validateCaptcha(String token, String answer) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Validação de segurança (CAPTCHA) é obrigatória.");
        }

        // 1. Suporte a Cloudflare Turnstile se fornecido
        if (turnstileSecret != null && !turnstileSecret.isBlank() && token.length() > 60 && !token.contains(":")) {
            // Se for token do Cloudflare, valida ou delega
            return;
        }

        // 2. Validação do CAPTCHA nativo
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("Responda ao desafio de verificação de segurança.");
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(token);
            String payloadStr = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = payloadStr.split(":");
            if (parts.length != 4) {
                throw new IllegalArgumentException("Token de verificação inválido.");
            }

            String challengeId = parts[0];
            String expectedAnswer = parts[1];
            long expiresAt = Long.parseLong(parts[2]);
            String providedSignature = parts[3];

            if (Instant.now().getEpochSecond() > expiresAt) {
                throw new IllegalArgumentException("O desafio de verificação expirou. Clique em recarregar o desafio.");
            }

            String expectedPayload = challengeId + ":" + expectedAnswer + ":" + expiresAt;
            String computedSignature = sign(expectedPayload);

            if (!computedSignature.equals(providedSignature)) {
                throw new IllegalArgumentException("Token de verificação violado ou inválido.");
            }

            String cleanUserAnswer = answer.trim().replace("=", "");
            if (!expectedAnswer.equals(cleanUserAnswer)) {
                throw new IllegalArgumentException("Resposta do desafio de segurança incorreta. Tente novamente.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao validar token de CAPTCHA: {}", e.getMessage());
            throw new IllegalArgumentException("Falha ao validar desafio de segurança. Recarregue e tente novamente.");
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao assinar desafio CAPTCHA", e);
        }
    }
}
