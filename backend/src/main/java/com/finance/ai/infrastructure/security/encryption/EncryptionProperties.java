package com.finance.ai.infrastructure.security.encryption;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.security.encryption")
public class EncryptionProperties {

    /**
     * Chave mestra de criptografia AES-256 (mínimo 32 caracteres).
     * Pode ser definida via variável de ambiente ENCRYPTION_MASTER_KEY.
     */
    private String masterKey = "default-master-key-change-in-prod-32bytes!";

    public String getMasterKey() {
        return masterKey;
    }

    public void setMasterKey(String masterKey) {
        this.masterKey = masterKey;
    }
}
