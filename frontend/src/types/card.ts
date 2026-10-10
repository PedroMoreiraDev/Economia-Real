export interface CreditCard {
  id: string;
  name: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
  createdAt: string;
}

export interface CreateCardPayload {
  name: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
}

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';

export interface CreditCardInvoice {
  id: string;
  creditCardId: string;
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAmount: number;
  paidAt?: string;
}

export interface CreatePurchasePayload {
  description: string;
  totalAmount: number;
  installments?: number;
  purchaseDate?: string;
  categoryId?: string;
  notes?: string;
}

export interface InstallmentInfo {
  installmentNumber: number;
  amount: number;
  invoiceMonth: string;
  invoiceId: string;
}

export interface PurchaseResult {
  purchaseId: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  installments: InstallmentInfo[];
}

export interface PayInvoicePayload {
  accountId: string;
  paymentAmount: number;
  paymentDate?: string;
}
