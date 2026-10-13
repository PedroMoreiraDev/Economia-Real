package com.finance.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@SpringBootApplication
public class FinanceApplication {

    public static void main(String[] args) {
        loadDotEnvIfPresent();
        SpringApplication.run(FinanceApplication.class, args);
    }

    private static void loadDotEnvIfPresent() {
        File[] candidatePaths = {
                new File(".env"),
                new File("../.env"),
                new File(System.getProperty("user.dir"), ".env"),
                new File(System.getProperty("user.dir"), "../.env")
        };

        for (File candidate : candidatePaths) {
            if (candidate.exists() && candidate.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(candidate.toPath());
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                            continue;
                        }
                        int eqIdx = trimmed.indexOf('=');
                        String key = trimmed.substring(0, eqIdx).trim();
                        String value = trimmed.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
