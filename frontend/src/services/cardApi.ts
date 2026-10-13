import { 
  CreditCard, 
  CreateCardPayload, 
  CreditCardInvoice, 
  CreatePurchasePayload, 
  PurchaseResult, 
  PayInvoicePayload 
} from '../types/card';

import { API_BASE_URL } from './apiConfig';

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMessage = `Erro na API: ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) errMessage = body.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

export async function fetchCreditCardsApi(token: string): Promise<CreditCard[]> {
  const res = await fetch(`${API_BASE_URL}/credit-cards`, {
    headers: authHeaders(token),
  });
  return handleResponse<CreditCard[]>(res);
}

export async function createCreditCardApi(token: string, payload: CreateCardPayload): Promise<CreditCard> {
  const res = await fetch(`${API_BASE_URL}/credit-cards`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<CreditCard>(res);
}

export async function createPurchaseApi(token: string, cardId: string, payload: CreatePurchasePayload): Promise<PurchaseResult> {
  const res = await fetch(`${API_BASE_URL}/credit-cards/${cardId}/purchases`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<PurchaseResult>(res);
}

export async function fetchInvoicesApi(token: string, cardId: string): Promise<CreditCardInvoice[]> {
  const res = await fetch(`${API_BASE_URL}/credit-cards/${cardId}/invoices`, {
    headers: authHeaders(token),
  });
  return handleResponse<CreditCardInvoice[]>(res);
}

export async function payInvoiceApi(token: string, invoiceId: string, payload: PayInvoicePayload): Promise<CreditCardInvoice> {
  const res = await fetch(`${API_BASE_URL}/credit-cards/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<CreditCardInvoice>(res);
}
