package com.finance.ai.application.financial.importer;

import java.util.UUID;

public record ImportStatementResult(
        UUID batchId,
        String fileName,
        String fileType,
        int importedCount,
        int skippedCount,
        String message,
        String referenceMonth,
        String referenceMonthDisplay
) {
    public ImportStatementResult(
            UUID batchId,
            String fileName,
            String fileType,
            int importedCount,
            int skippedCount,
            String message
    ) {
        this(batchId, fileName, fileType, importedCount, skippedCount, message, null, null);
    }
}
