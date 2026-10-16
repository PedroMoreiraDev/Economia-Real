package com.finance.ai.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtro de proteção contra ataques de força bruta e negação de serviço (DoS/DDoS) em endpoints de autenticação.
 * Implementa Sliding Window Rate Limiting por endereço IP com resposta HTTP 429 Too Many Requests.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    // Limite: 30 requisições por minuto para endpoints de autenticação e 20 para IA
    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 30;
    private static final int MAX_AI_REQUESTS_PER_MINUTE = 20;
    private static final long WINDOW_SECONDS = 60L;
    private static final int MAX_TRACKED_ENTRIES = 5000;

    private static final java.util.regex.Pattern IP_PATTERN =
            java.util.regex.Pattern.compile("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-fA-F0-9:]+$");

    private final Map<String, Deque<Long>> requestCounts = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Aplica rate limiting em endpoints de autenticação e de IA
        return !path.startsWith("/api/v1/auth/") && !path.startsWith("/api/v1/ai/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Não aplica rate limit em requisições de preflight OPTIONS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);
        long now = Instant.now().getEpochSecond();

        int maxAllowed = path.startsWith("/api/v1/ai/") ? MAX_AI_REQUESTS_PER_MINUTE : MAX_AUTH_REQUESTS_PER_MINUTE;
        String trackingKey = (path.startsWith("/api/v1/ai/") ? "ai:" : "auth:") + clientIp;

        boolean allowed = checkRateLimit(trackingKey, now, maxAllowed);

        if (!allowed) {
            log.warn("Rate limit excedido para IP: {} no caminho: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

            Map<String, Object> errorBody = Map.of(
                    "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                    "error", "Too Many Requests",
                    "message", "Muitas tentativas em um curto intervalo. Por favor, aguarde 1 minuto antes de tentar novamente."
            );

            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private synchronized boolean checkRateLimit(String trackingKey, long now, int maxAllowed) {
        cleanupExpiredIps(now);

        Deque<Long> timestamps = requestCounts.computeIfAbsent(trackingKey, k -> new ArrayDeque<>());
        long windowStart = now - WINDOW_SECONDS;

        while (!timestamps.isEmpty() && timestamps.peekFirst() <= windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxAllowed) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    private void cleanupExpiredIps(long now) {
        if (requestCounts.size() > 500) {
            long windowStart = now - WINDOW_SECONDS;
            requestCounts.entrySet().removeIf(entry -> {
                Deque<Long> queue = entry.getValue();
                return queue.isEmpty() || queue.peekLast() <= windowStart;
            });

            // Evita estouro de memória sem resetar bloqueios de atacantes (remove os mais antigos sem zerar tudo)
            if (requestCounts.size() > MAX_TRACKED_ENTRIES) {
                var iterator = requestCounts.entrySet().iterator();
                int toRemove = MAX_TRACKED_ENTRIES / 5; // Remove 20% das entradas
                while (iterator.hasNext() && toRemove > 0) {
                    iterator.next();
                    iterator.remove();
                    toRemove--;
                }
            }
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        String cleanRemote = (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr.trim() : "unknown";

        // Só confia nos cabeçalhos X-Forwarded-For e X-Real-IP se a requisição provier de um proxy confiável
        // (localhost / loopback ou rede local privada de container Docker)
        boolean isFromTrustedProxy = isTrustedProxy(cleanRemote);

        if (isFromTrustedProxy) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                String firstIp = xForwardedFor.split(",")[0].trim();
                if (firstIp.length() <= 45 && IP_PATTERN.matcher(firstIp).matches()) {
                    return firstIp;
                }
            }
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isBlank()) {
                String clean = xRealIp.trim();
                if (clean.length() <= 45 && IP_PATTERN.matcher(clean).matches()) {
                    return clean;
                }
            }
        }

        return cleanRemote;
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            return false;
        }
        // Loopback IPv4 e IPv6
        if ("127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return true;
        }
        // Redes privadas locais comuns para Docker/Kubernetes e Proxies reversos Nginx
        return ip.startsWith("10.") || ip.startsWith("172.") || ip.startsWith("192.168.");
    }
}
