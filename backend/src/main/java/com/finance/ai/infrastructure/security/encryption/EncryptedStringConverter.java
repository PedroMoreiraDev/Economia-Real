package com.finance.ai.infrastructure.security.encryption;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Conversor JPA transparente para campos textuais sensíveis.
 * Antes de persistir no banco (INSERT / UPDATE), o valor é criptografado com AES-256-GCM.
 * Ao carregar da entidade (SELECT), o valor é decifrado em memória.
 */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return EncryptionService.getInstance().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return EncryptionService.getInstance().decrypt(dbData);
    }
}

