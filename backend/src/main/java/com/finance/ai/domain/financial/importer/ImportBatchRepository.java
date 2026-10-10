package com.finance.ai.domain.financial.importer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ImportBatchRepository {
    List<ImportBatch> findAllByUserId(UUID userId);
    Optional<ImportBatch> findByIdAndUserId(UUID id, UUID userId);
    ImportBatch save(ImportBatch batch);
}
