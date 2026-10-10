export type AccountType = 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currency: string;
  active: boolean;
  createdAt: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
  initialBalance?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  colorHex?: string;
  systemDefault: boolean;
  createdAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  icon?: string;
  colorHex?: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'INVOICE_PAYMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED';
export type TransactionOrigin = 'MANUAL' | 'CSV_IMPORT' | 'OFX_IMPORT' | 'AI_TEXT' | 'AI_AUDIO';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accrualDate: string;
  settlementDate?: string;
  description: string;
  accountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  status: TransactionStatus;
  origin: TransactionOrigin;
  notes?: string;
  createdAt: string;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  accrualDate: string;
  settlementDate?: string;
  description: string;
  accountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  notes?: string;
}

export interface UpdateTransactionPayload {
  type: TransactionType;
  amount: number;
  accrualDate: string;
  settlementDate?: string;
  description: string;
  accountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  notes?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalAccountBalance: number;
  transactionCount: number;
}
