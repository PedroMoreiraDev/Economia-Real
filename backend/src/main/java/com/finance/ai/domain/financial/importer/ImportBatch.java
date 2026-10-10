package com.finance.ai.domain.financial.importer;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio representando um Lote de Importação de Extratos Bancários.
 */
public class ImportBatch {

    private final UUID id;
    private final UUID userId;
    private final UUID accountId;
    private final String fileName;
    private final String fileType; // 'CSV' ou 'OFX'
    private final int importedCount;
    private final int skippedCount;
    private final String status;
    private final Instant createdAt;

    public ImportBatch(UUID id, UUID userId, UUID accountId, String fileName,
                       String fileType, int importedCount, int skippedCount,
                       String status, Instant createdAt) {
        this.id = Objects.requireNonNull(id, "ID do lote é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.accountId = Objects.requireNonNull(accountId, "ID da conta é obrigatório.");
        this.fileName = validateFileName(fileName);
        this.fileType = validateFileType(fileType);
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.status = status != null ? status : "COMPLETED";
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
    }

    public static ImportBatch create(UUID userId, UUID accountId, String fileName,
                                     String fileType, int importedCount, int skippedCount) {
        return new ImportBatch(
                UUID.randomUUID(),
                userId,
                accountId,
                fileName,
                fileType,
                importedCount,
                skippedCount,
                "COMPLETED",
                Instant.now()
        );
    }

    private static String validateFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            throw new IllegalArgumentException("Nome do arquivo não pode ser vazio.");
        }
        // Sanitização básica de caminho
        return fileName.replace("\\", "/").replaceAll(".*/", "");
    }

    private static String validateFileType(String fileType) {
        if (fileType == null) throw new IllegalArgumentException("Tipo de arquivo é obrigatório.");
        var upper = fileType.toUpperCase().trim();
        if (!upper.equals("CSV") && !upper.equals("OFX")) {
            throw new IllegalArgumentException("Tipo de arquivo não suportado: " + fileType);
        }
        return upper;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getAccountId() { return accountId; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public int getImportedCount() { return importedCount; }
    public int getSkippedCount() { return skippedCount; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
