package com.finance.ai.application.financial.importer;

import com.finance.ai.domain.financial.importer.ImportBatch;
import com.finance.ai.domain.financial.importer.ImportBatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ListImportBatchesUseCase {

    private final ImportBatchRepository importBatchRepository;

    public ListImportBatchesUseCase(ImportBatchRepository importBatchRepository) {
        this.importBatchRepository = importBatchRepository;
    }

    @Transactional(readOnly = true)
    public List<ImportBatch> execute(UUID userId) {
        return importBatchRepository.findAllByUserId(userId);
    }
}
