package com.finance.ai.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Serviço de envio de e-mails de validação e confirmação com template HTML.
 * Suporta provedores gratuitos via HTTPS porta 443 (Brevo, Resend) e SMTP (Gmail).
 * O envio via HTTPS contorna o bloqueio de portas SMTP (25, 465, 587) no plano gratuito do Render.
 */
@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final JavaMailSender mailSender;
    private final String host;
    private final String username;
    private final String password;
    private final String fromEmail;
    private final String appName;
    private final String brevoApiKey;
    private final String resendApiKey;

    @Autowired
    public EmailSenderService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password,
            @Value("${spring.application.name:Economia Real}") String appName,
            @Value("${app.email.brevo-api-key:}") String brevoApiKey,
            @Value("${app.email.resend-api-key:}") String resendApiKey) {
        this.mailSender = mailSender;
        this.host = host;
        this.username = username;
        this.password = password;
        this.fromEmail = (username != null && !username.isBlank()) ? username : "economiareal.ia@gmail.com";
        this.appName = appName;
        this.brevoApiKey = (brevoApiKey != null) ? brevoApiKey.trim() : "";
        this.resendApiKey = (resendApiKey != null) ? resendApiKey.trim() : "";
    }

    public EmailSenderService(
            String host,
            String username,
            String password,
            String appName,
            String brevoApiKey,
            String resendApiKey) {
        this(null, host, username, password, appName, brevoApiKey, resendApiKey);
    }

    public boolean isConfigured() {
        return isHttpConfigured() || isSmtpConfigured();
    }

    public boolean isSmtpConfigured() {
        return this.mailSender != null
                && this.host != null && !this.host.isBlank()
                && this.username != null && !this.username.isBlank()
                && this.password != null && !this.password.isBlank();
    }

    public boolean isHttpConfigured() {
        return !this.brevoApiKey.isBlank() || !this.resendApiKey.isBlank();
    }

    @Async
    public CompletableFuture<Void> sendVerificationCode(String toEmail, String fullName, String code) {
        log.info("=================================================================");
        log.info("📧 [CÓDIGO DE ATIVAÇÃO] E-mail: {} | Código: {}", toEmail, code);
        log.info("=================================================================");

        String subject = "Seu código de ativação na Economia Real: " + code;
        String html = buildEmailTemplate(fullName, code);
        dispatchEmail(toEmail, fullName, subject, html);

        return CompletableFuture.completedFuture(null);
    }

    @Async
    public CompletableFuture<Void> sendPasswordResetCode(String toEmail, String fullName, String code) {
        log.info("=================================================================");
        log.info("🔑 [RECUPERAÇÃO DE SENHA] E-mail: {} | Código: {}", toEmail, code);
        log.info("=================================================================");

        String subject = "Código para redefinição de senha: " + code;
        String html = buildResetPasswordEmailTemplate(fullName, code);
        dispatchEmail(toEmail, fullName, subject, html);

        return CompletableFuture.completedFuture(null);
    }

    private void dispatchEmail(String toEmail, String fullName, String subject, String htmlContent) {
        // 1. Tenta Brevo API (HTTPS porta 443 - compatível com Render Free)
        if (!brevoApiKey.isBlank()) {
            try {
                sendViaBrevoHttp(toEmail, fullName, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail via Brevo HTTPS API: {}. Tentando próximo provedor...", e.getMessage());
            }
        }

        // 2. Tenta Resend API (HTTPS porta 443 - compatível com Render Free)
        if (!resendApiKey.isBlank()) {
            try {
                sendViaResendHttp(toEmail, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail via Resend HTTPS API: {}. Tentando próximo provedor...", e.getMessage());
            }
        }

        // 3. Tenta SMTP padrão (porta 587/465)
        if (isSmtpConfigured()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail, appName);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("E-mail enviado com sucesso via SMTP para: {}", toEmail);
                return;
            } catch (Exception e) {
                log.error("Não foi possível enviar e-mail via SMTP para {}: {}. "
                        + "(Nota: O plano gratuito do Render bloqueia tráfego nas portas SMTP 25, 465 e 587. "
                        + "Configure a variável BREVO_API_KEY no painel do Render para envio gratuito via HTTPS porta 443).",
                        toEmail, e.getMessage());
            }
        } else {
            log.warn("Nenhum provedor de e-mail configurado (SMTP ou API HTTP). O código foi registrado nos logs do servidor.");
        }
    }

    private void sendViaBrevoHttp(String toEmail, String fullName, String subject, String htmlContent) throws Exception {
        Map<String, Object> bodyMap = new HashMap<>();
        Map<String, String> sender = new HashMap<>();
        sender.put("name", appName);
        sender.put("email", fromEmail);
        bodyMap.put("sender", sender);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", toEmail);
        if (fullName != null && !fullName.isBlank()) {
            recipient.put("name", fullName);
        }
        bodyMap.put("to", List.of(recipient));
        bodyMap.put("subject", subject);
        bodyMap.put("htmlContent", htmlContent);

        String jsonPayload = OBJECT_MAPPER.writeValueAsString(bodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("Content-Type", "application/json")
                .header("api-key", brevoApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("E-mail enviado com sucesso via Brevo HTTPS API para: {}", toEmail);
        } else {
            throw new RuntimeException("Brevo API HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaResendHttp(String toEmail, String subject, String htmlContent) throws Exception {
        Map<String, Object> bodyMap = new HashMap<>();
        String sender = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.endsWith("@gmail.com"))
                ? appName + " <" + fromEmail + ">"
                : "Economia Real <onboarding@resend.dev>";
        bodyMap.put("from", sender);
        bodyMap.put("to", List.of(toEmail));
        bodyMap.put("subject", subject);
        bodyMap.put("html", htmlContent);

        String jsonPayload = OBJECT_MAPPER.writeValueAsString(bodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + resendApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(8))
                .build();

        HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("E-mail enviado com sucesso via Resend HTTPS API para: {}", toEmail);
        } else {
            throw new RuntimeException("Resend API HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private String buildEmailTemplate(String fullName, String code) {
        return """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 2px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
            .header { background: #026CD6; padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
            .content { padding: 32px 28px; text-align: center; }
            .greeting { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 12px; }
            .text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
            .code-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 16px; padding: 20px; margin: 0 auto 28px auto; display: inline-block; }
            .code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #15803d; margin: 0; }
            .notice { font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 0; }
            .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Economia Real</h1>
            </div>
            <div class="content">
              <div class="greeting">Olá, %s! 👋</div>
              <p class="text">Para ativar a sua conta e começar a gerenciar suas finanças com inteligência, utilize o código de verificação abaixo:</p>
              
              <div class="code-box">
                <div class="code">%s</div>
              </div>
              
              <p class="notice">⏰ Este código é válido por <strong>15 minutos</strong>.<br>Se você não solicitou este cadastro, desconsidere este e-mail.</p>
            </div>
            <div class="footer">
              Economia Real © 2026 — Inteligência Financeira e Clareza
            </div>
          </div>
        </body>
        </html>
        """.formatted(fullName, code);
    }

    private String buildResetPasswordEmailTemplate(String fullName, String code) {
        return """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 2px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
            .header { background: #026CD6; padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
            .content { padding: 32px 28px; text-align: center; }
            .greeting { font-size: 16px; font-weight: 700; color: #334155; margin-bottom: 12px; }
            .text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
            .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 20px; margin: 0 auto 28px auto; display: inline-block; }
            .code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; margin: 0; }
            .notice { font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 0; }
            .footer { background: #f1f5f9; padding: 18px; text-align: center; font-size: 11px; color: #94a3b8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Economia Real</h1>
            </div>
            <div class="content">
              <div class="greeting">Olá, %s! 🔒</div>
              <p class="text">Recebemos uma solicitação para redefinir a sua senha de acesso. Utilize o código de 6 dígitos abaixo para criar uma nova senha:</p>
              
              <div class="code-box">
                <div class="code">%s</div>
              </div>
              
              <p class="notice">⏰ Este código é válido por <strong>15 minutos</strong>.<br>Se você não fez essa solicitação, sua conta continua segura e você pode ignorar esta mensagem.</p>
            </div>
            <div class="footer">
              Economia Real © 2026 — Inteligência Financeira e Clareza
            </div>
          </div>
        </body>
        </html>
        """.formatted(fullName, code);
    }
}
