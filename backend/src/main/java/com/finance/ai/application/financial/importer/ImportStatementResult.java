package com.finance.ai.application.financial.importer;

import java.util.UUID;

public record ImportStatementResult(
        UUID batchId,
        String fileName,
        String fileType,
        int importedCount,
        int skippedCount,
        String message
) {}
