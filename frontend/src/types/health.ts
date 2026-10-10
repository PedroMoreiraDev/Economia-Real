export interface HealthStatus {
  status: 'UP' | 'DOWN' | 'PENDING';
  service: string;
  version: string;
  timestamp: string;
}

export interface SystemMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}
