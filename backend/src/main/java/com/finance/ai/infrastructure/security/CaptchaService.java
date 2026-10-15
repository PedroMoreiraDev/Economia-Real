package com.finance.ai.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/**
 * Serviço de proteção CAPTCHA visual com distorção gráfica e assinatura HMAC-SHA256.
 * Gera desafios em imagem PNG (Base64) com ruído, rotação e linhas de distorção para impedir
 * robôs e OCRs automatizados, sem custos com provedores externos pagos.
 */
@Service
public class CaptchaService {

    private static final Logger log = LoggerFactory.getLogger(CaptchaService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    // Conjunto de caracteres legíveis para humanos sem ambiguidade visual (sem 0, O, 1, I, l)
    private static final char[] CHAR_POOL = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".toCharArray();
    private static final int CODE_LENGTH = 5;
    private static final int IMG_WIDTH = 150;
    private static final int IMG_HEIGHT = 46;

    static {
        System.setProperty("java.awt.headless", "true");
    }

    private final String hmacSecret;
    private final String turnstileSecret;

    public CaptchaService() {
        this("default-captcha-secret-key-finance-2026-minimum-32-chars", "");
    }
    @Autowired
    public CaptchaService(@Value("${app.security.jwt-secret:default-captcha-secret-key-finance-2026-minimum-32-chars}") String hmacSecret,
            @Value("${app.security.turnstile-secret:}") String turnstileSecret) {
        this.hmacSecret = hmacSecret;
        this.turnstileSecret = turnstileSecret;
    }

    public record CaptchaChallenge(String challengeId, String imageBase64, String token) {}

    /**
     * Gera um novo desafio visual com imagem distorcida e token criptográfico.
     */
    public CaptchaChallenge generateChallenge() {
        String challengeId = UUID.randomUUID().toString();
        long expiresAtEpochSec = Instant.now().plusSeconds(180).getEpochSecond(); // 3 minutos

        // 1. Gera código aleatório
        char[] chars = new char[CODE_LENGTH];
        for (int i = 0; i < CODE_LENGTH; i++) {
            chars[i] = CHAR_POOL[RANDOM.nextInt(CHAR_POOL.length)];
        }
        String secretCode = new String(chars);

        // 2. Renderiza a imagem distorcida em memória
        String imageBase64 = renderCaptchaImage(secretCode);

        // 3. Hash da resposta normalizada (o texto nunca é enviado no token ou no JSON)
        String answerHash = hashAnswer(challengeId, secretCode);

        // 4. Token assinado: challengeId:answerHash:expiresAt:signature
        String rawPayload = challengeId + ":" + answerHash + ":" + expiresAtEpochSec;
        String signature = sign(rawPayload);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(
                (rawPayload + ":" + signature).getBytes(StandardCharsets.UTF_8)
        );

        return new CaptchaChallenge(challengeId, imageBase64, token);
    }

    private final java.util.concurrent.ConcurrentHashMap<String, Long> consumedChallengeIds = new java.util.concurrent.ConcurrentHashMap<>();

    public static final String INSTANT_SALT = "economia-real-anti-bot-2026";

    /**
     * Valida a resposta do usuário contra o token criptográfico.
     * Suporta tokens assinados pelo backend e tokens instantâneos para exibição imediata em 0ms no frontend.
     * Implementa proteção anti-replay (queima de token de uso único) e comparação em tempo constante.
     */
    public void validateCaptcha(String token, String userAnswer) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Validação de segurança (CAPTCHA) é obrigatória.");
        }

        if (userAnswer == null || userAnswer.isBlank()) {
            throw new IllegalArgumentException("Digite o código exibido na imagem de segurança.");
        }

        try {
            byte[] decoded = Base64.getUrlDecoder().decode(token);
            String payloadStr = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = payloadStr.split(":");

            long nowEpochSec = Instant.now().getEpochSecond();
            String cleanInput = userAnswer.trim().replaceAll("\\s+", "").toUpperCase();

            // 1. Suporte a Desafio Instantâneo (Exibição imediata em 0ms no cliente)
            if (parts.length == 4 && "instant".equals(parts[0])) {
                String challengeId = parts[1];
                String expectedAnswerHash = parts[2];
                long expiresAt = Long.parseLong(parts[3]);

                if (nowEpochSec > expiresAt) {
                    throw new IllegalArgumentException("O código da imagem expirou. Clique para gerar uma nova imagem.");
                }

                cleanupExpiredChallenges(nowEpochSec);
                Long previouslyConsumed = consumedChallengeIds.putIfAbsent(challengeId, expiresAt);
                if (previouslyConsumed != null) {
                    throw new IllegalArgumentException("Este código de verificação já foi utilizado. Solicite uma nova imagem de segurança.");
                }

                String computedAnswerHash = hashInstantAnswer(challengeId, cleanInput);
                if (!MessageDigest.isEqual(expectedAnswerHash.getBytes(StandardCharsets.UTF_8), computedAnswerHash.getBytes(StandardCharsets.UTF_8))) {
                    throw new IllegalArgumentException("Código de segurança incorreto. Observe a imagem e tente novamente.");
                }
                return;
            }

            // 2. Desafio emitido pelo endpoint /auth/captcha do backend
            if (parts.length != 4) {
                throw new IllegalArgumentException("Token de verificação inválido.");
            }

            String challengeId = parts[0];
            String expectedAnswerHash = parts[1];
            long expiresAt = Long.parseLong(parts[2]);
            String providedSignature = parts[3];

            if (nowEpochSec > expiresAt) {
                throw new IllegalArgumentException("O código da imagem expirou. Clique para gerar uma nova imagem.");
            }

            // Proteção Anti-Replay: cada challengeId só pode ser submetido uma única vez
            cleanupExpiredChallenges(nowEpochSec);
            Long previouslyConsumed = consumedChallengeIds.putIfAbsent(challengeId, expiresAt);
            if (previouslyConsumed != null) {
                throw new IllegalArgumentException("Este código de verificação já foi utilizado. Solicite uma nova imagem de segurança.");
            }

            String expectedPayload = challengeId + ":" + expectedAnswerHash + ":" + expiresAt;
            String computedSignature = sign(expectedPayload);

            if (!MessageDigest.isEqual(computedSignature.getBytes(StandardCharsets.UTF_8), providedSignature.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Token de verificação violado ou inválido.");
            }

            String computedAnswerHash = hashAnswer(challengeId, cleanInput);

            if (!MessageDigest.isEqual(expectedAnswerHash.getBytes(StandardCharsets.UTF_8), computedAnswerHash.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Código de segurança incorreto. Observe a imagem e tente novamente.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao validar token de CAPTCHA: {}", e.getMessage());
            throw new IllegalArgumentException("Falha ao validar código de segurança. Recarregue a imagem.");
        }
    }

    public String hashInstantAnswer(String challengeId, String answer) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String combined = challengeId + ":" + answer.trim().toUpperCase() + ":" + INSTANT_SALT;
            byte[] digest = md.digest(combined.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao calcular hash de CAPTCHA instantâneo", e);
        }
    }

    private void cleanupExpiredChallenges(long nowEpochSec) {
        if (consumedChallengeIds.size() > 200) {
            consumedChallengeIds.entrySet().removeIf(entry -> entry.getValue() < nowEpochSec);
        }
    }

    private String renderCaptchaImage(String code) {
        try {
            BufferedImage image = new BufferedImage(IMG_WIDTH, IMG_HEIGHT, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2d = image.createGraphics();

            // Configura antialiasing de alta qualidade para o render
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // Fundo com degradê suave azul-acinzentado moderno
            GradientPaint gp = new GradientPaint(
                    0, 0, new Color(240, 245, 255),
                    IMG_WIDTH, IMG_HEIGHT, new Color(225, 235, 250)
            );
            g2d.setPaint(gp);
            g2d.fillRect(0, 0, IMG_WIDTH, IMG_HEIGHT);

            // Borda suave
            g2d.setColor(new Color(203, 213, 225));
            g2d.drawRect(0, 0, IMG_WIDTH - 1, IMG_HEIGHT - 1);

            // Linhas de ruído de fundo cruzadas para impedir OCR simples
            for (int i = 0; i < 4; i++) {
                g2d.setColor(new Color(RANDOM.nextInt(120, 200), RANDOM.nextInt(120, 200), RANDOM.nextInt(180, 240)));
                g2d.setStroke(new BasicStroke(1.2f));
                int x1 = RANDOM.nextInt(IMG_WIDTH);
                int y1 = RANDOM.nextInt(IMG_HEIGHT);
                int x2 = RANDOM.nextInt(IMG_WIDTH);
                int y2 = RANDOM.nextInt(IMG_HEIGHT);
                g2d.drawLine(x1, y1, x2, y2);
            }

            // Renderiza cada caractere com rotação, fonte e cor aleatórias
            String[] fonts = {"SansSerif", "Dialog", "Monospaced"};
            int charSpacing = (IMG_WIDTH - 20) / code.length();

            for (int i = 0; i < code.length(); i++) {
                char c = code.charAt(i);

                String fontName = fonts[RANDOM.nextInt(fonts.length)];
                int fontSize = RANDOM.nextInt(23, 27);
                Font font = new Font(fontName, Font.BOLD, fontSize);

                // Cores com alto contraste em tons de azul escuro, ardósia e grafite
                Color charColor = new Color(RANDOM.nextInt(10, 60), RANDOM.nextInt(40, 100), RANDOM.nextInt(130, 200));
                g2d.setColor(charColor);

                // Ângulo de rotação entre -22° e +22°
                double angle = Math.toRadians(RANDOM.nextInt(-22, 23));
                int x = 12 + (i * charSpacing) + RANDOM.nextInt(-2, 3);
                int y = 32 + RANDOM.nextInt(-3, 3);

                AffineTransform orig = g2d.getTransform();
                AffineTransform transform = new AffineTransform();
                transform.rotate(angle, x + 8, y - 10);
                g2d.transform(transform);

                g2d.setFont(font);
                g2d.drawString(String.valueOf(c), x, y);
                g2d.setTransform(orig);
            }

            // Linha de sobreposição suave em curva
            g2d.setColor(new Color(2, 108, 214, 120));
            g2d.setStroke(new BasicStroke(1.5f));
            g2d.drawArc(RANDOM.nextInt(10), RANDOM.nextInt(10), IMG_WIDTH - 20, IMG_HEIGHT - 10, 0, 180);

            // Pontos de ruído
            for (int i = 0; i < 35; i++) {
                g2d.setColor(new Color(RANDOM.nextInt(100, 220), RANDOM.nextInt(100, 220), RANDOM.nextInt(100, 220)));
                int rx = RANDOM.nextInt(IMG_WIDTH);
                int ry = RANDOM.nextInt(IMG_HEIGHT);
                g2d.fillRect(rx, ry, 1, 1);
            }

            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            byte[] bytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Throwable t) {
            log.warn("Aviso: Falha ao renderizar CAPTCHA via AWT (possível container headless/sem fontes). Acionando gerador vetorial SVG resiliente: {}", t.getMessage());
            return renderFallbackSvg(code);
        }
    }

    /**
     * Fallback gráfico que gera imagem vetorial SVG com distorções, rotações e ruído,
     * 100% livre de dependências de fontes nativas de sistema operacional (C/X11/fontconfig).
     */
    private String renderFallbackSvg(String code) {
        StringBuilder svg = new StringBuilder(1500);
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"150\" height=\"46\" viewBox=\"0 0 150 46\">");
        svg.append("<defs><linearGradient id=\"bg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">");
        svg.append("<stop offset=\"0%\" stop-color=\"#f0f5ff\"/>");
        svg.append("<stop offset=\"100%\" stop-color=\"#e1ebfa\"/>");
        svg.append("</linearGradient></defs>");
        svg.append("<rect width=\"150\" height=\"46\" rx=\"10\" fill=\"url(#bg)\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>");

        // Linhas de ruído
        for (int i = 0; i < 4; i++) {
            int x1 = RANDOM.nextInt(150);
            int y1 = RANDOM.nextInt(46);
            int x2 = RANDOM.nextInt(150);
            int y2 = RANDOM.nextInt(46);
            svg.append("<line x1=\"").append(x1).append("\" y1=\"").append(y1)
               .append("\" x2=\"").append(x2).append("\" y2=\"").append(y2)
               .append("\" stroke=\"rgba(100,120,160,0.4)\" stroke-width=\"1.5\" stroke-dasharray=\"4,3\"/>");
        }

        // Curva suave de interferência
        svg.append("<path d=\"M ").append(RANDOM.nextInt(15)).append(" ").append(RANDOM.nextInt(20, 35))
           .append(" Q ").append(RANDOM.nextInt(50, 90)).append(" ").append(RANDOM.nextInt(10, 40))
           .append(" ").append(RANDOM.nextInt(130, 150)).append(" ").append(RANDOM.nextInt(20, 35))
           .append("\" stroke=\"rgba(2,108,214,0.45)\" stroke-width=\"2\" fill=\"none\"/>");

        // Caracteres com rotações e tons de alto contraste
        int charSpacing = 120 / code.length();
        String[] colors = {"#0a3d62", "#1e3799", "#2c3e50", "#192a56", "#026cd6"};

        for (int i = 0; i < code.length(); i++) {
            char c = code.charAt(i);
            int x = 16 + (i * charSpacing) + RANDOM.nextInt(-2, 3);
            int y = 32 + RANDOM.nextInt(-2, 3);
            int rot = RANDOM.nextInt(-20, 21);
            String color = colors[RANDOM.nextInt(colors.length)];

            svg.append("<text x=\"").append(x).append("\" y=\"").append(y)
               .append("\" transform=\"rotate(").append(rot).append(" ").append(x + 8).append(" ").append(y - 8).append(")\"")
               .append(" font-family=\"monospace, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif\"")
               .append(" font-size=\"24\" font-weight=\"900\" fill=\"").append(color).append("\">")
               .append(c).append("</text>");
        }

        svg.append("</svg>");
        return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svg.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String hashAnswer(String challengeId, String answer) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String combined = challengeId + ":" + answer + ":" + hmacSecret;
            byte[] digest = md.digest(combined.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao calcular hash de CAPTCHA", e);
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
