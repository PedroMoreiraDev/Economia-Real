import { AnalyticsOverview } from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function fetchAnalyticsOverviewApi(token: string, month?: string): Promise<AnalyticsOverview> {
  const url = month 
    ? `${API_BASE_URL}/analytics/overview?month=${month}`
    : `${API_BASE_URL}/analytics/overview`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar métricas analíticas.');
  }

  return res.json() as Promise<AnalyticsOverview>;
}
