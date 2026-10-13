import { RecurringBill, CreateRecurringBillPayload, UpdateRecurringBillPayload, PayRecurringBillPayload } from '../types/recurring';

import { API_BASE_URL } from './apiConfig';

export async function fetchRecurringBillsApi(token: string, month?: string): Promise<RecurringBill[]> {
  const url = month 
    ? `${API_BASE_URL}/recurring-bills?month=${month}`
    : `${API_BASE_URL}/recurring-bills`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar despesas recorrentes.');
  }

  return res.json() as Promise<RecurringBill[]>;
}

export async function createRecurringBillApi(token: string, payload: CreateRecurringBillPayload): Promise<RecurringBill> {
  const res = await fetch(`${API_BASE_URL}/recurring-bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao cadastrar despesa recorrente.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<RecurringBill>;
}

export async function updateRecurringBillApi(token: string, id: string, payload: UpdateRecurringBillPayload): Promise<RecurringBill> {
  const res = await fetch(`${API_BASE_URL}/recurring-bills/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao atualizar despesa recorrente.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<RecurringBill>;
}

export async function deleteRecurringBillApi(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/recurring-bills/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao excluir despesa recorrente.');
  }
}

export async function payRecurringBillApi(token: string, id: string, payload?: PayRecurringBillPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/recurring-bills/${id}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao registrar pagamento da despesa recorrente.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }
}
