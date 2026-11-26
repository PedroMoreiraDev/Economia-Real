package com.finance.ai.infrastructure.security;

import com.finance.ai.infrastructure.security.encryption.EncryptedStringConverter;
import com.finance.ai.infrastructure.security.encryption.EncryptionProperties;
import com.finance.ai.infrastructure.security.encryption.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EncryptedStringConverterTest {

    private EncryptedStringConverter converter;

    @BeforeEach
    void setUp() {
        var properties = new EncryptionProperties();
        properties.setMasterKey("test-converter-key-for-jpa-32-chars!!");
        new EncryptionService(properties); // inicializa singleton
        converter = new EncryptedStringConverter();
    }

    @Test
    @DisplayName("Deve converter entidade para coluna do banco de dados com formato cifrado")
    void shouldConvertEntityAttributeToDatabaseColumn() {
        String original = "Cinema IMAX Shopping Morumbi";

        String dbColumn = converter.convertToDatabaseColumn(original);

        assertThat(dbColumn).isNotNull();
        assertThat(dbColumn).startsWith("enc:v1:");
        assertThat(dbColumn).isNotEqualTo(original);

        String entityAttr = converter.convertToEntityAttribute(dbColumn);
        assertThat(entityAttr).isEqualTo(original);
    }

    @Test
    @DisplayName("Deve manter nulos preservados em ambas as direções")
    void shouldPreserveNulls() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }
}

