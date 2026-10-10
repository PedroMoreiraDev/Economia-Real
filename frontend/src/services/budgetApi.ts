import { BudgetProgressDto, CreateBudgetPayload } from '../types/budget';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchBudgetsApi(token: string, month?: string): Promise<BudgetProgressDto[]> {
  const url = month 
    ? `${API_BASE_URL}/budgets?month=${month}`
    : `${API_BASE_URL}/budgets`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar orçamentos.');
  }

  return res.json() as Promise<BudgetProgressDto[]>;
}

export async function createOrUpdateBudgetApi(token: string, payload: CreateBudgetPayload): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao definir orçamento.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export async function deleteBudgetApi(token: string, budgetId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao excluir orçamento.');
  }
}

export async function getAiBudgetSuggestionsApi(
  token: string,
  globalLimit: number,
  monthReference?: string
): Promise<import('../types/budget').AiBudgetSuggestionResponse> {
  const res = await fetch(`${API_BASE_URL}/budgets/ai-suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ globalLimit, monthReference }),
  });

  if (!res.ok) {
    let errMessage = 'Falha ao gerar sugestões com inteligência artificial.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export async function saveBatchBudgetsApi(
  token: string,
  requests: CreateBudgetPayload[]
): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/budgets/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requests),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao salvar metas em lote.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json();
}

