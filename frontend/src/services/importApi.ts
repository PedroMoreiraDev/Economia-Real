import { ImportStatementResult, ImportBatch } from '../types/import';

import { API_BASE_URL } from './apiConfig';

export async function uploadStatementApi(
  token: string,
  accountId: string | undefined | null,
  file: File,
  isCreditCard?: boolean
): Promise<ImportStatementResult> {
  const formData = new FormData();
  if (accountId) {
    formData.append('accountId', accountId);
  }
  formData.append('file', file);
  if (isCreditCard !== undefined) {
    formData.append('isCreditCard', String(isCreditCard));
  }

  const res = await fetch(`${API_BASE_URL}/imports/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Não passar Content-Type manual para o browser gerar o boundary correto
    },
    body: formData,
  });

  if (!res.ok) {
    let errMessage = `Erro na importação: ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) errMessage = body.message;
    } catch {
      // Ignora erro
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<ImportStatementResult>;
}

export async function fetchImportBatchesApi(token: string): Promise<ImportBatch[]> {
  const res = await fetch(`${API_BASE_URL}/imports`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar histórico de importações.');
  }

  return res.json() as Promise<ImportBatch[]>;
}
