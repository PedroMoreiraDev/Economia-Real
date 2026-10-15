import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  ApiError,
  CaptchaChallenge,
  RegistrationResultResponse,
  VerifyEmailPayload,
  ResendCodePayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth';

import { API_BASE_URL } from './apiConfig';

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

let prefetchPromise: Promise<CaptchaChallenge> | null = null;

/**
 * Pré-carrega o CAPTCHA em segundo plano de forma silenciosa e resiliente.
 * Não gera erro de console não tratado se o backend estiver em repouso.
 */
export function prefetchCaptcha(): Promise<CaptchaChallenge> {
  if (prefetchPromise) {
    return prefetchPromise;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  prefetchPromise = fetch(`${API_BASE_URL}/auth/captcha`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: controller.signal,
  })
    .then((res) => handleResponse<CaptchaChallenge>(res))
    .catch((err) => {
      prefetchPromise = null;
      throw err;
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });

  return prefetchPromise;
}

/**
 * Acorda o backend no Render silenciosamente enquanto o usuário navega na landing page,
 * eliminando a latência de cold start antes que o usuário decida fazer login ou cadastrar.
 */
export function warmUpBackend(): void {
  try {
    prefetchCaptcha().catch(() => {
      // Ignora erro silencioso no pre-warm
    });
  } catch {
    // Silencia qualquer exceção síncrona
  }
}

/**
 * Obtém o desafio CAPTCHA para formulários protegidos (como registro).
 * Se o prefetch já tiver sido iniciado ou finalizado, reutiliza a resposta em 0ms.
 */
export async function fetchCaptchaApi(forceRefresh = false): Promise<CaptchaChallenge> {
  if (!forceRefresh && prefetchPromise) {
    try {
      const challenge = await prefetchPromise;
      prefetchPromise = null; // Limpa para a próxima requisição ser fresca
      return challenge;
    } catch {
      prefetchPromise = null;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/captcha`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    return await handleResponse<CaptchaChallenge>(res);
  } finally {
    clearTimeout(timeoutId);
    prefetchPromise = null;
  }
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerApi(payload: RegisterPayload): Promise<RegistrationResultResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<RegistrationResultResponse>(res);
}

export async function verifyEmailApi(payload: VerifyEmailPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function resendVerificationCodeApi(payload: ResendCodePayload): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/resend-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
}

export async function forgotPasswordApi(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
}

export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
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
