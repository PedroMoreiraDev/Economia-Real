export interface BudgetProgressDto {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColorHex: string;
  monthReference: string;
  monthlyLimit: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  alertThresholdPercentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface CreateBudgetPayload {
  categoryId: string;
  monthReference?: string;
  monthlyLimit: number;
  alertThresholdPercentage?: number;
}

export interface CategoryBudgetSuggestion {
  categoryId: string;
  categoryName: string;
  icon: string;
  colorHex: string;
  suggestedLimit: number;
  currentExpense: number;
  percentageOfTotal: number;
  recommendationReason: string;
}

export interface AiBudgetSuggestionResponse {
  globalLimit: number;
  suggestions: CategoryBudgetSuggestion[];
  aiInsight: string;
}

