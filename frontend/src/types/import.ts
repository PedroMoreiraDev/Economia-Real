export interface ImportStatementResult {
  batchId: string;
  fileName: string;
  fileType: string;
  importedCount: number;
  skippedCount: number;
  message: string;
  referenceMonth?: string;
  referenceMonthDisplay?: string;
}

export interface ImportBatch {
  id: string;
  accountId: string;
  fileName: string;
  fileType: string;
  importedCount: number;
  skippedCount: number;
  status: string;
  createdAt: string;
}
