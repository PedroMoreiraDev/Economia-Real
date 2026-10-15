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

const CHAR_POOL = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const INSTANT_SALT = 'economia-real-anti-bot-2026';

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

/**
 * Implementação pura e síncrona de SHA-256 (0 dependências, tempo de execução < 0.05ms)
 * para calcular a assinatura do desafio instantâneo em qualquer ambiente.
 */
function sha256Sync(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];

      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        ((w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0) |
          0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [
        (temp1 + temp2) | 0,
        a,
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  const bytes: number[] = [];
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      bytes.push((hash[i] >> (j * 8)) & 255);
    }
  }

  let binary = '';
  for (i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  let binary = '';
  for (let i = 0; i < str.length; i++) {
    binary += String.fromCharCode(str.charCodeAt(i));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Gera de forma imediata (0ms) um desafio visual de segurança no cliente,
 * eliminando completamente qualquer estado de 'carregando' ou espera de rede.
 */
export function generateInstantCaptcha(): CaptchaChallenge {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
  }

  const challengeId = 'inst_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const expiresAt = Math.floor(Date.now() / 1000) + 180;

  const colors = ['#0a3d62', '#1e3799', '#2c3e50', '#192a56', '#026cd6'];
  const charSpacing = Math.floor(100 / code.length);
  let charsSvg = '';

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const x = 16 + i * charSpacing + (Math.floor(Math.random() * 5) - 2);
    const y = 31 + (Math.floor(Math.random() * 5) - 2);
    const rot = Math.floor(Math.random() * 31) - 15;
    const color = colors[Math.floor(Math.random() * colors.length)];
    charsSvg += `<text x="${x}" y="${y}" transform="rotate(${rot} ${x + 8} ${y - 8})" font-family="monospace, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="24" font-weight="900" fill="${color}">${c}</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="44" viewBox="0 0 140 44">` +
    `<rect width="140" height="44" fill="#f8fafc" rx="10"/>` +
    `<path d="M 8 22 Q 40 8 75 22 T 132 22" stroke="rgba(2,108,214,0.35)" stroke-width="2" fill="none"/>` +
    `<path d="M 8 28 Q 50 38 90 18 T 132 28" stroke="rgba(100,116,139,0.25)" stroke-width="1.5" fill="none"/>` +
    charsSvg +
    `</svg>`;

  const imageBase64 = 'data:image/svg+xml;base64,' + btoa(svg);
  const expectedHash = sha256Sync(challengeId + ':' + code + ':' + INSTANT_SALT);
  const rawToken = `instant:${challengeId}:${expectedHash}:${expiresAt}`;
  const token = stringToBase64Url(rawToken);

  return { challengeId, imageBase64, token };
}

import { pingBackend } from './backendWarmup';

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
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  prefetchPromise = fetch(`${API_BASE_URL}/auth/captcha`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
    signal: controller.signal,
  })
    .then((res) => handleResponse<CaptchaChallenge>(res))
    .catch(() => {
      prefetchPromise = null;
      return generateInstantCaptcha();
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });

  return prefetchPromise;
}

/**
 * Acorda o backend silenciosamente enquanto o usuário navega na aplicação,
 * eliminando a latência de cold start antes que o usuário decida fazer login ou cadastrar.
 */
export function warmUpBackend(): void {
  try {
    pingBackend('manual');
    prefetchCaptcha().catch(() => {
      // Silencia prefetch de captcha se o backend estiver subindo
    });
  } catch {
    // Silencia qualquer exceção síncrona
  }
}

/**
 * Obtém o desafio CAPTCHA para formulários protegidos (como registro).
 * Se o prefetch já tiver sido iniciado ou finalizado, reutiliza a resposta em 0ms.
 * Se o backend demorar ou estiver dormindo, entrega o desafio instantâneo sem travar o usuário.
 */
export async function fetchCaptchaApi(forceRefresh = false): Promise<CaptchaChallenge> {
  if (!forceRefresh && prefetchPromise) {
    try {
      const challenge = await prefetchPromise;
      prefetchPromise = null;
      return challenge;
    } catch {
      prefetchPromise = null;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/captcha`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    return await handleResponse<CaptchaChallenge>(res);
  } catch {
    // Resiliente: se a rede ou o servidor remoto falhar/demorar, entrega o desafio instantâneo em 0ms
    return generateInstantCaptcha();
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

export async function getMeApi(token: string, timeoutMs = 12000): Promise<User> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    return await handleResponse<User>(res);
  } finally {
    clearTimeout(timeoutId);
  }
}
