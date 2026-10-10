export interface AiExtractionResponse {
  description: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  accrualDate: string;
  suggestedCategoryName: string | null;
  suggestedCategoryId: string | null;
  suggestedPaymentMethod: string | null;
  confidenceScore: number;
  ambiguities: string[];
  origin: string;
  rawInput: string;
  transcribedText?: string | null;
}
