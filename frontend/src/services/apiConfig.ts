/**
 * Normaliza e resolve a URL base da API REST em qualquer ambiente (local ou nuvem).
 * Garante automaticamente o sufixo '/api/v1', mesmo que a variável de ambiente
 * na Vercel tenha sido informada sem '/api/v1' ou com barras extras no final.
 */
function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!envUrl) {
    return '/api/v1';
  }
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();
