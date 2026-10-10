import { 
  SavingsGoal, 
  CreateSavingsGoalPayload, 
  UpdateSavingsGoalPayload, 
  DepositGoalPayload, 
  WithdrawGoalPayload 
} from '../types/goal';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchSavingsGoalsApi(token: string): Promise<SavingsGoal[]> {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar metas de economia.');
  }

  return res.json() as Promise<SavingsGoal[]>;
}

export async function createSavingsGoalApi(token: string, payload: CreateSavingsGoalPayload): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao cadastrar meta de economia.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<SavingsGoal>;
}

export async function updateSavingsGoalApi(token: string, id: string, payload: UpdateSavingsGoalPayload): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao atualizar meta de economia.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<SavingsGoal>;
}

export async function deleteSavingsGoalApi(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao excluir meta de economia.');
  }
}

export async function depositToSavingsGoalApi(token: string, id: string, payload: DepositGoalPayload): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao realizar aporte na meta.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<SavingsGoal>;
}

export async function withdrawFromSavingsGoalApi(token: string, id: string, payload: WithdrawGoalPayload): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE_URL}/savings-goals/${id}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMessage = 'Erro ao realizar resgate da meta.';
    try {
      const data = await res.json();
      if (data.message) errMessage = data.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<SavingsGoal>;
}

export async function exportTransactionsCsvApi(token: string, startDate?: string, endDate?: string): Promise<void> {
  let url = `${API_BASE_URL}/transactions/export/csv`;
  const params: string[] = [];
  if (startDate) params.push(`startDate=${startDate}`);
  if (endDate) params.push(`endDate=${endDate}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao exportar extrato em CSV.');
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `extrato-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
