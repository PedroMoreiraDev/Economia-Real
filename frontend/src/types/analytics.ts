export interface MonthlyEvolutionItem {
  monthLabel: string;
  monthIso: string;
  income: number;
  expense: number;
  netSavings: number;
}

export interface CategoryDistributionItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  colorHex: string;
  totalAmount: number;
  percentage: number;
}

export interface BurnRateData {
  spentSoFar: number;
  dailyAverage: number;
  projectedMonthEnd: number;
  monthlyBudgetTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  burnStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface AnalyticsOverview {
  monthlyEvolution: MonthlyEvolutionItem[];
  categoryDistribution: CategoryDistributionItem[];
  burnRate: BurnRateData;
}
