package com.finance.ai.infrastructure.security.encryption;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Serviço de Criptografia Simétrica em Repouso (Field-Level Encryption)
 * Utiliza o algoritmo padrão da indústria AES-256-GCM com IVs aleatórios de 12 bytes
 * e autenticação de integridade de 128 bits.
 */
@Service
public class EncryptionService {

    private static final Logger log = LoggerFactory.getLogger(EncryptionService.class);

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    public static final String PREFIX_V1 = "enc:v1:";

    private static EncryptionService instance;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionService(EncryptionProperties properties) {
        this.secretKey = deriveKey(properties.getMasterKey());
        this.secureRandom = new SecureRandom();
        setGlobalInstance(this);
    }

    // Construtor auxiliar para testes unitários isolados
    public EncryptionService(String masterKey) {
        this.secretKey = deriveKey(masterKey);
        this.secureRandom = new SecureRandom();
        setGlobalInstance(this);
    }

    private static synchronized void setGlobalInstance(EncryptionService s) {
        instance = s;
    }

    public static EncryptionService getInstance() {
        if (instance == null) {
            // Instância fallback para ambientes de contexto leve ou testes
            synchronized (EncryptionService.class) {
                if (instance == null) {
                    instance = new EncryptionService(new EncryptionProperties());
                }
            }
        }
        return instance;
    }

    /**
     * Criptografa o texto claro utilizando AES-256-GCM.
     * Retorna enc:v1:<base64(iv)>:<base64(ciphertext+tag)>
     */
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        if (plainText.isEmpty()) {
            return plainText;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            String ivBase64 = Base64.getEncoder().encodeToString(iv);
            String cipherBase64 = Base64.getEncoder().encodeToString(cipherBytes);

            return PREFIX_V1 + ivBase64 + ":" + cipherBase64;
        } catch (Exception e) {
            log.error("Erro ao criptografar campo sensível: {}", e.getMessage());
            throw new IllegalStateException("Falha de segurança na cifragem de dados", e);
        }
    }

    /**
     * Decifra o texto criptografado.
     * Se o texto não possuir o prefixo de versão (enc:v1:), retorna o texto original como fallback retrocompatível.
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null) {
            return null;
        }
        if (!encryptedText.startsWith(PREFIX_V1)) {
            // Dado legado ainda não criptografado - retorna sem alteração
            return encryptedText;
        }

        try {
            String payload = encryptedText.substring(PREFIX_V1.length());
            String[] parts = payload.split(":", 2);
            if (parts.length != 2) {
                log.warn("Formato de campo criptografado inválido");
                return encryptedText;
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] cipherBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Aviso ao decifrar campo sensível (possível chave divergente ou dado ilegível): {}", e.getMessage());
            return "[Dado Protegido]";
        }
    }

    private SecretKey deriveKey(String masterKey) {
        try {
            byte[] keyBytes = masterKey != null ? masterKey.getBytes(StandardCharsets.UTF_8) : new byte[32];
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] derivedKey = sha256.digest(keyBytes);
            return new SecretKeySpec(derivedKey, ALGORITHM);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível na JVM", e);
        }
    }
}

