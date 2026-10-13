package com.finance.ai.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Serviço de validação rigorosa de e-mail em profundidade:
 * 1. Formato e sintaxe RFC 5322.
 * 2. Bloqueio de provedores de e-mail temporários e descartáveis.
 * 3. Validação DNS MX em tempo real (verifica se o domínio realmente existe e recebe e-mails).
 */
@Service
public class EmailValidationService {

    private static final Logger log = LoggerFactory.getLogger(EmailValidationService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // Lista abrangente de provedores de e-mails descartáveis/temporários
    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
            "tempmail.com", "10minutemail.com", "guerrillamail.com", "guerrillamail.net",
            "guerrillamail.biz", "guerrillamail.org", "yopmail.com", "yopmail.fr", "yopmail.net",
            "mailinator.com", "trashmail.com", "trashmail.net", "sharklasers.com", "getairmail.com",
            "dispostable.com", "temp-mail.org", "fakeinbox.com", "mohmal.com", "burnermail.io",
            "crazymailing.com", "dropmail.me", "nada.ltd", "tempmailo.com", "generator.email",
            "inboxbear.com", "fakemailgenerator.com", "throwawaymail.com", "emailondeck.com",
            "minutemailbox.com", "tmailor.com", "mytemp.email", "internxt.com/temporary-email"
    );

    // Domínios legítimos ultra-populares com existência garantida (zero latência e imunes a falhas transitórias de DNS)
    private static final Set<String> COMMON_TRUSTED_DOMAINS = Set.of(
            "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com",
            "yahoo.com", "yahoo.com.br", "icloud.com", "me.com", "proton.me", "protonmail.com",
            "uol.com.br", "bol.com.br", "terra.com.br", "globo.com", "ig.com.br"
    );

    public void validate(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail não pode ser vazio.");
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);

        // 1. Validação Sintática
        if (!EMAIL_PATTERN.matcher(normalized).matches() || normalized.length() > 254) {
            throw new IllegalArgumentException("Formato de e-mail inválido. Digite um e-mail válido (exemplo: usuario@provedor.com).");
        }

        String[] parts = normalized.split("@", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("E-mail inválido.");
        }

        String domain = parts[1];

        // 2. Bloqueio de Domínios Descartáveis
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException("E-mails descartáveis e temporários não são permitidos. Por favor, utilize um e-mail pessoal ou corporativo real.");
        }

        // 3. Validação de Registros DNS MX (Verifica se o domínio existe e aceita e-mails)
        validateDomainHasMxRecords(domain);
    }

    private void validateDomainHasMxRecords(String domain) {
        // Ignora checagem de DNS para domínios de teste locais comuns ou comprovadamente confiáveis
        if (domain.endsWith(".localhost") || domain.endsWith(".local") || domain.equals("example.com")) {
            return;
        }

        if (COMMON_TRUSTED_DOMAINS.contains(domain.toLowerCase(Locale.ROOT))) {
            return;
        }

        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("java.naming.provider.url", "dns:");
        env.put("com.sun.jndi.dns.timeout.initial", "1500"); // 1.5s timeout
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        try {
            DirContext ictx = new InitialDirContext(env);
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX", "A"});
            Attribute attr = attrs.get("MX");

            if (attr == null || attr.size() == 0) {
                // Se não tem MX, verifica se ao menos possui registro A
                Attribute aAttr = attrs.get("A");
                if (aAttr == null || aAttr.size() == 0) {
                    throw new IllegalArgumentException("O domínio @" + domain + " não existe na internet ou não está configurado para receber e-mails.");
                }
            }
        } catch (NamingException e) {
            log.warn("Falha na consulta DNS MX para o domínio {}: {}", domain, e.getMessage());
            // Se o domínio for explicitamente desconhecido (NameNotFoundException)
            if (e.getClass().getSimpleName().contains("NameNotFoundException") || e.getMessage().contains("DNS name not found")) {
                throw new IllegalArgumentException("O domínio @" + domain + " não existe. Verifique se digitou o e-mail corretamente.");
            }
            // Em caso de timeout de rede do provedor de DNS local, permitimos para não bloquear usuários em falhas transitórias
        }
    }
}
