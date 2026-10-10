import { AuthResponse, LoginPayload, RegisterPayload, User, ApiError } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class AuthApiException extends Error {
  constructor(public apiError: ApiError) {
    super(apiError.message || 'Erro na requisição');
    this.name = 'AuthApiException';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: ApiError;
    try {
      errBody = await res.json();
    } catch {
      errBody = {
        status: res.status,
        error: res.statusText,
        message: `Falha na requisição (HTTP ${res.status})`,
      };
    }
    throw new AuthApiException(errBody);
  }
  return res.json() as Promise<T>;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getMeApi(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse<User>(res);
}
