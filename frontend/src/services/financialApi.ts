import { 
  Account, 
  CreateAccountPayload, 
  Category, 
  CreateCategoryPayload, 
  Transaction, 
  CreateTransactionPayload, 
  UpdateTransactionPayload,
  FinancialSummary 
} from '../types/financial';

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
      // Ignora erro de parse
    }
    throw new Error(errMessage);
  }
  return res.json() as Promise<T>;
}

// Contas
export async function fetchAccountsApi(token: string): Promise<Account[]> {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    headers: authHeaders(token),
  });
  return handleResponse<Account[]>(res);
}

export async function createAccountApi(token: string, payload: CreateAccountPayload): Promise<Account> {
  const res = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Account>(res);
}

// Categorias
export async function fetchCategoriesApi(token: string): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    headers: authHeaders(token),
  });
  return handleResponse<Category[]>(res);
}

export async function createCategoryApi(token: string, payload: CreateCategoryPayload): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Category>(res);
}

// Transações
export async function fetchTransactionsApi(token: string, startDate?: string, endDate?: string): Promise<Transaction[]> {
  let url = `${API_BASE_URL}/transactions`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    headers: authHeaders(token),
  });
  return handleResponse<Transaction[]>(res);
}

export async function createTransactionApi(token: string, payload: CreateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Transaction>(res);
}

export async function updateTransactionApi(token: string, id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<Transaction>(res);
}

export async function deleteTransactionApi(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
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
}

// Resumo Financeiro
export async function fetchSummaryApi(token: string, startDate?: string, endDate?: string): Promise<FinancialSummary> {
  let url = `${API_BASE_URL}/transactions/summary`;
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    headers: authHeaders(token),
  });
  return handleResponse<FinancialSummary>(res);
}

// Exclusão de movimentações em lote
export async function deleteBatchTransactionsApi(token: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const res = await fetch(`${API_BASE_URL}/transactions/batch-delete`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ids),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao excluir movimentações em lote.';
    try {
      const body = await res.json();
      if (body.message) errMessage = body.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }
}

