package com.finance.ai.infrastructure.security;

import com.finance.ai.infrastructure.security.encryption.EncryptionProperties;
import com.finance.ai.infrastructure.security.encryption.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EncryptionServiceTest {

    private EncryptionService encryptionService;

    @BeforeEach
    void setUp() {
        var properties = new EncryptionProperties();
        properties.setMasterKey("test-aes-key-for-unit-testing-32-chars!");
        encryptionService = new EncryptionService(properties);
    }

    @Test
    @DisplayName("Deve criptografar e decifrar com sucesso mantendo integridade dos dados")
    void shouldEncryptAndDecryptSuccessfully() {
        String original = "Supermercado Pão de Açúcar - Compras da Semana R$ 450,20";

        String encrypted = encryptionService.encrypt(original);

        assertThat(encrypted).isNotNull();
        assertThat(encrypted).startsWith(EncryptionService.PREFIX_V1);
        assertThat(encrypted).isNotEqualTo(original);

        String decrypted = encryptionService.decrypt(encrypted);

        assertThat(decrypted).isEqualTo(original);
    }

    @Test
    @DisplayName("Deve gerar cifras diferentes para o mesmo texto claro devido ao IV aleatório")
    void shouldProduceDifferentCiphertextForSamePlaintextDueToRandomIv() {
        String text = "Farmácia Raia";

        String cipher1 = encryptionService.encrypt(text);
        String cipher2 = encryptionService.encrypt(text);

        assertThat(cipher1).isNotEqualTo(cipher2);
        assertThat(encryptionService.decrypt(cipher1)).isEqualTo(text);
        assertThat(encryptionService.decrypt(cipher2)).isEqualTo(text);
    }

    @Test
    @DisplayName("Deve retornar texto inalterado se for legado (sem prefixo enc:v1:)")
    void shouldReturnLegacyPlainTextAsIsForBackwardCompatibility() {
        String legacyText = "Aluguel Apartamento 102";

        String result = encryptionService.decrypt(legacyText);

        assertThat(result).isEqualTo(legacyText);
    }

    @Test
    @DisplayName("Deve tratar valores nulos e vazios sem falhas")
    void shouldHandleNullAndEmptyGracefully() {
        assertThat(encryptionService.encrypt(null)).isNull();
        assertThat(encryptionService.decrypt(null)).isNull();
        assertThat(encryptionService.encrypt("")).isEmpty();
    }

    @Test
    @DisplayName("Deve falhar ao decifrar texto adulterado (GCM authentication failure)")
    void shouldFailWhenCiphertextIsTampered() {
        String original = "Segredo Financeiro";
        String encrypted = encryptionService.encrypt(original);

        // Adultera o payload cifrado
        String tampered = encrypted.substring(0, encrypted.length() - 4) + "AAAA";

        assertThatThrownBy(() -> encryptionService.decrypt(tampered))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Falha de segurança na decifragem");
    }
}
