package com.finance.ai.infrastructure.persistence.financial.importer;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "import_batches")
public class ImportBatchJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 10)
    private String fileType;

    @Column(name = "imported_count", nullable = false)
    private int importedCount;

    @Column(name = "skipped_count", nullable = false)
    private int skippedCount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ImportBatchJpaEntity() {}

    public ImportBatchJpaEntity(UUID id, UUID userId, UUID accountId, String fileName,
                                String fileType, int importedCount, int skippedCount,
                                String status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.accountId = accountId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.importedCount = importedCount;
        this.skippedCount = skippedCount;
        this.status = status;
        this.createdAt = createdAt;
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
