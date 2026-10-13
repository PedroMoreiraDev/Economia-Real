package com.finance.ai.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.concurrent.CompletableFuture;

/**
 * Serviço de envio de e-mails de validação e confirmação com template HTML.
 * Suporta provedores gratuitos (Resend, Brevo, Gmail SMTP) e possui fallback resiliente
 * para logs locais quando o servidor de e-mail ainda não estiver configurado.
 */
@Service
public class EmailSenderService {

    private static final Logger log = LoggerFactory.getLogger(EmailSenderService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String appName;

    public EmailSenderService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.username:noreply@economiareal.com.br}") String fromEmail,
            @Value("${spring.application.name:Economia Real}") String appName) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.appName = appName;
    }

    @Async
    public CompletableFuture<Void> sendVerificationCode(String toEmail, String fullName, String code) {
        log.info("=================================================================");
        log.info("📧 [CÓDIGO DE ATIVAÇÃO] E-mail: {} | Código: {}", toEmail, code);
        log.info("=================================================================");

        if (mailSender == null) {
            log.warn("JavaMailSender não configurado. Código registrado no console para desenvolvimento.");
            return CompletableFuture.completedFuture(null);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, appName);
            helper.setTo(toEmail);
            helper.setSubject("Seu código de ativação na Economia Real: " + code);

            String html = buildEmailTemplate(fullName, code);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("E-mail de confirmação enviado com sucesso para: {}", toEmail);
        } catch (Exception e) {
            log.error("Não foi possível enviar e-mail via SMTP para {}: {}. O código permanece registrado nos logs.", toEmail, e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
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
}
