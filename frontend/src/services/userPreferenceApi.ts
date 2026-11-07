import { API_BASE_URL } from './apiConfig';

export interface UserPreferencesDto {
  onboardingCompleted: boolean;
}

export async function getUserPreferencesApi(token: string): Promise<UserPreferencesDto> {
  const res = await fetch(`${API_BASE_URL}/users/preferences`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao obter preferências do usuário.');
  }

  return res.json();
}

export async function updateUserPreferencesApi(
  token: string,
  data: Partial<UserPreferencesDto>
): Promise<UserPreferencesDto> {
  const res = await fetch(`${API_BASE_URL}/users/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Falha ao atualizar preferências do usuário.');
  }

  return res.json();
}
