package com.finance.ai.infrastructure.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Configuração resiliente de DataSource para ambientes PaaS e Nuvem (Render, Neon, Supabase, Heroku).
 * Normaliza automaticamente URLs de conexão que contenham os esquemas postgresql:// ou postgres://
 * e extrai credenciais embutidas na URI (user:password@host/db) para o formato padrão do driver JDBC.
 */
@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String rawUrl = properties.getUrl();
        String username = properties.getUsername();
        String password = properties.getPassword();

        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://") || rawUrl.startsWith("jdbc:postgresql://"))) {
            try {
                String parseTarget = rawUrl;
                if (parseTarget.startsWith("jdbc:")) {
                    parseTarget = parseTarget.substring(5);
                }
                String cleanUriStr = parseTarget.replaceFirst("^postgres(ql)?://", "http://");
                URI uri = URI.create(cleanUriStr);

                // Se a URL contiver usuário e senha embutidos (ex: user:pass@host/db), eles têm prioridade máxima
                if (uri.getUserInfo() != null) {
                    String[] parts = uri.getUserInfo().split(":", 2);
                    if (parts.length > 0 && !parts[0].isEmpty()) {
                        username = parts[0];
                        log.info("Usuário do banco de dados extraído diretamente da URL: {}", username);
                    }
                    if (parts.length > 1 && !parts[1].isEmpty()) {
                        password = parts[1];
                    }
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath() != null && uri.getPath().startsWith("/") ? uri.getPath().substring(1) : uri.getPath();
                String query = uri.getQuery();

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append("/")
                        .append(path);

                if (query != null && !query.isEmpty()) {
                    jdbcUrl.append("?").append(query);
                }

                rawUrl = jdbcUrl.toString();
                log.info("URL de banco de dados normalizada com sucesso para formato JDBC: jdbc:postgresql://{}:{}/{}", host, port, path);
            } catch (Exception ex) {
                log.warn("Falha ao analisar URI de conexão complexa. Erro: {}", ex.getMessage());
                if (!rawUrl.startsWith("jdbc:")) {
                    rawUrl = "jdbc:" + rawUrl;
                }
            }
        }

        HikariDataSource ds = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();

        ds.setJdbcUrl(rawUrl);
        if (username != null && !username.isEmpty()) {
            ds.setUsername(username);
        }
        if (password != null && !password.isEmpty()) {
            ds.setPassword(password);
        }
        if (properties.getDriverClassName() != null && !properties.getDriverClassName().isBlank()) {
            ds.setDriverClassName(properties.getDriverClassName());
        } else if (rawUrl != null && rawUrl.contains("postgresql")) {
            ds.setDriverClassName("org.postgresql.Driver");
        }

        return ds;
    }
}
