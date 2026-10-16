package com.finance.ai.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@DisplayName("Testes Unitários: RateLimitingFilter (Sliding Window & Anti-Spoofing)")
class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("Deve permitir requisição comum dentro do limite de requisições")
    void shouldAllowRequestWithinLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr("200.100.50.10");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    @DisplayName("Deve bloquear com HTTP 429 quando limite for excedido")
    void shouldBlockWhenRateLimitExceeded() throws ServletException, IOException {
        String clientIp = "187.50.20.10";

        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(clientIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, filterChain);
            assertThat(res.getStatus()).isEqualTo(200);
        }

        // 31ª requisição deve ser bloqueada
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        filter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
        assertThat(blockedRes.getHeader("Retry-After")).isEqualTo("60");
        assertThat(blockedRes.getContentAsString()).contains("Too Many Requests");
        verify(filterChain, times(30)).doFilter(any(), any());
    }

    @Test
    @DisplayName("Anti-Spoofing: IP público não confiável não pode forjar X-Forwarded-For")
    void shouldIgnoreXForwardedForFromUntrustedRemote() throws ServletException, IOException {
        String attackerRealIp = "203.0.113.195";

        for (int i = 0; i < 30; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
            req.setRemoteAddr(attackerRealIp); // Remote addr público não confiável
            req.addHeader("X-Forwarded-For", "1.1.1." + i); // Tentativa de spoofing com IPs falsos
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilter(req, res, filterChain);
        }

        // A próxima requisição deve ser bloqueada pelo remoteAddr real
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        blockedReq.setRemoteAddr(attackerRealIp);
        blockedReq.addHeader("X-Forwarded-For", "8.8.8.8");
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        filter.doFilter(blockedReq, blockedRes, filterChain);

        assertThat(blockedRes.getStatus()).isEqualTo(429);
    }

    @Test
    @DisplayName("Deve confiar no X-Forwarded-For quando vindo de proxy reverso local confiável (127.0.0.1)")
    void shouldTrustXForwardedForFromTrustedProxy() throws ServletException, IOException {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        req.setRemoteAddr("127.0.0.1"); // Localhost / Nginx reverso confiável
        req.addHeader("X-Forwarded-For", "201.55.10.25");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilter(req, res, filterChain);

        assertThat(res.getStatus()).isEqualTo(200);
        verify(filterChain, times(1)).doFilter(req, res);
    }

    @Test
    @DisplayName("Deve ignorar requisições OPTIONS e endpoints não monitorados")
    void shouldIgnoreOptionsAndNonMonitoredEndpoints() throws ServletException, IOException {
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/v1/auth/login");
        MockHttpServletResponse optionsRes = new MockHttpServletResponse();
        filter.doFilter(optionsReq, optionsRes, filterChain);
        verify(filterChain, times(1)).doFilter(optionsReq, optionsRes);

        MockHttpServletRequest transactionsReq = new MockHttpServletRequest("GET", "/api/v1/transactions");
        MockHttpServletResponse transactionsRes = new MockHttpServletResponse();
        filter.doFilter(transactionsReq, transactionsRes, filterChain);
        verify(filterChain, times(2)).doFilter(any(), any());
    }
}
