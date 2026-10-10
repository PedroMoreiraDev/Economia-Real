import { HealthStatus } from '../types/health';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchHealth(): Promise<HealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      status: 'DOWN',
      service: 'finance-backend',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
