package com.finance.ai.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

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
        return new ResilientDataSourceProperties();
    }

    public static class ResilientDataSourceProperties extends DataSourceProperties {

        @Override
        public void setUrl(String url) {
            if (url != null && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
                try {
                    // Substitui o esquema para http temporariamente para que o java.net.URI faça o parse correto
                    String cleanUriStr = url.replaceFirst("^postgres(ql)?://", "http://");
                    URI uri = URI.create(cleanUriStr);

                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }

                    // Se a connectionString contiver usuário e senha embutidos (ex: user:pass@host/db)
                    if (uri.getUserInfo() != null) {
                        String[] parts = uri.getUserInfo().split(":", 2);
                        if (parts.length > 0 && !parts[0].isEmpty() && (getUsername() == null || getUsername().isEmpty())) {
                            setUsername(parts[0]);
                        }
                        if (parts.length > 1 && !parts[1].isEmpty() && (getPassword() == null || getPassword().isEmpty())) {
                            setPassword(parts[1]);
                        }
                    }

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

                    String finalUrl = jdbcUrl.toString();
                    log.info("URL de banco de dados normalizada com sucesso para formato JDBC: jdbc:postgresql://{}:{}/{}", host, port, path);
                    super.setUrl(finalUrl);
                    return;
                } catch (Exception ex) {
                    log.warn("Falha ao analisar URI de conexão complexa. Aplicando prefixo jdbc: padrão. Erro: {}", ex.getMessage());
                    if (!url.startsWith("jdbc:")) {
                        super.setUrl("jdbc:" + url);
                        return;
                    }
                }
            }
            super.setUrl(url);
        }
    }
}
