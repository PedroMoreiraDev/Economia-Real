import { BudgetProgressDto, CreateBudgetPayload } from '../types/budget';

import { API_BASE_URL } from './apiConfig';

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
    if (res.status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Sua sessão expirou. Por favor, entre na sua conta novamente.');
    }
    let errMessage = 'Falha ao gerar sugestões com inteligência artificial.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
      else if (data.error) errMessage = data.error;
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
    if (res.status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Sua sessão expirou. Por favor, entre na sua conta novamente.');
    }
    let errMessage = 'Erro ao salvar metas em lote.';
    try {
      const data = await res.json();
      if (data.message) {
        errMessage = data.message;
      } else if (data.details && typeof data.details === 'object') {
        const detailValues = Object.values(data.details).join(', ');
        if (detailValues) errMessage = `Erro de validação: ${detailValues}`;
      } else if (data.error) {
        errMessage = data.error;
      }
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export async function updateGlobalAlertThresholdApi(
  token: string,
  alertThresholdPercentage: number,
  monthReference?: string
): Promise<BudgetProgressDto[]> {
  const res = await fetch(`${API_BASE_URL}/budgets/alert-threshold`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      alertThresholdPercentage,
      monthReference,
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
      throw new Error('Sua sessão expirou. Por favor, entre na sua conta novamente.');
    }
    let errMessage = 'Erro ao atualizar alerta global de consumo.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
      else if (data.error) errMessage = data.error;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export function getStoredGlobalAlertThreshold(userId?: string): number {
  try {
    const val = localStorage.getItem(`finance_global_alert_threshold_${userId || 'default'}`);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) return parsed;
    }
  } catch {
    // ignora
  }
  return 80;
}

export function setStoredGlobalAlertThreshold(userId: string | undefined, percentage: number): void {
  try {
    localStorage.setItem(`finance_global_alert_threshold_${userId || 'default'}`, percentage.toString());
  } catch {
    // ignora
  }
}

/**
 * Busca a timeline canônica de tetos de gastos globais persistida no banco de dados.
 */
export async function fetchSpendingLimitsTimelineApi(token: string): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE_URL}/budgets/spending-limits`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar timeline de tetos de gastos.');
  }

  return res.json();
}

/**
 * Salva ou atualiza o teto global de gastos para um determinado mês no banco de dados.
 */
export async function saveSpendingLimitApi(
  token: string,
  month: string,
  amount: number
): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE_URL}/budgets/spending-limits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ month, amount }),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao salvar teto de gastos.';
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

/**
 * Remove o teto global de gastos de um determinado mês no banco de dados (marca como 0 para interromper herança).
 */
export async function removeSpendingLimitApi(
  token: string,
  month: string
): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE_URL}/budgets/spending-limits/${month}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao remover teto de gastos.');
  }

  return res.json();
}

/**
 * Sincroniza a timeline local do dispositivo (ex: salva no celular) com o banco de dados.
 */
export async function syncSpendingLimitsTimelineApi(
  token: string,
  timeline: Record<string, number>
): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE_URL}/budgets/spending-limits/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ timeline }),
  });

  if (!res.ok) {
    throw new Error('Falha ao sincronizar tetos de gastos com o servidor.');
  }

  return res.json();
}



