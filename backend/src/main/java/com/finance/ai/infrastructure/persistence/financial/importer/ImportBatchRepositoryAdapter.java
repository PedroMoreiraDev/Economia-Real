package com.finance.ai.infrastructure.persistence.financial.importer;

import com.finance.ai.domain.financial.importer.ImportBatch;
import com.finance.ai.domain.financial.importer.ImportBatchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
class ImportBatchRepositoryAdapter implements ImportBatchRepository {

    private final ImportBatchSpringDataRepository jpa;

    ImportBatchRepositoryAdapter(ImportBatchSpringDataRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public List<ImportBatch> findAllByUserId(UUID userId) {
        return jpa.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Optional<ImportBatch> findByIdAndUserId(UUID id, UUID userId) {
        return jpa.findByIdAndUserId(id, userId).map(this::toDomain);
    }

    @Override
    public ImportBatch save(ImportBatch batch) {
        var entity = toJpaEntity(batch);
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    private ImportBatch toDomain(ImportBatchJpaEntity e) {
        return new ImportBatch(
                e.getId(),
                e.getUserId(),
                e.getAccountId(),
                e.getFileName(),
                e.getFileType(),
                e.getImportedCount(),
                e.getSkippedCount(),
                e.getStatus(),
                e.getCreatedAt()
        );
    }

    private ImportBatchJpaEntity toJpaEntity(ImportBatch b) {
        return new ImportBatchJpaEntity(
                b.getId(),
                b.getUserId(),
                b.getAccountId(),
                b.getFileName(),
                b.getFileType(),
                b.getImportedCount(),
                b.getSkippedCount(),
                b.getStatus(),
                b.getCreatedAt()
        );
    }
}
