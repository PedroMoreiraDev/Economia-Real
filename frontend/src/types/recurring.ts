export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringBill {
  id: string;
  userId: string;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  categoryId?: string | null;
  categoryName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  creditCardId?: string | null;
  creditCardName?: string | null;
  active: boolean;
  nextDueDate: string;
  isDueSoon: boolean;
  isPaidThisMonth: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringBillPayload {
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  categoryId?: string | null;
  accountId?: string | null;
  creditCardId?: string | null;
}

export interface UpdateRecurringBillPayload {
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  categoryId?: string | null;
  accountId?: string | null;
  creditCardId?: string | null;
  active: boolean;
}

export interface PayRecurringBillPayload {
  paymentDate?: string;
  accountId?: string | null;
  creditCardId?: string | null;
  replicateMonths?: number;
}
