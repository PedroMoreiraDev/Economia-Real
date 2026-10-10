export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isReached: boolean;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsGoalPayload {
  title: string;
  targetAmount: number;
  targetDate?: string | null;
}

export interface UpdateSavingsGoalPayload {
  title: string;
  targetAmount: number;
  targetDate?: string | null;
}

export interface DepositGoalPayload {
  amount: number;
  sourceAccountId?: string | null;
}

export interface WithdrawGoalPayload {
  amount: number;
  destinationAccountId?: string | null;
}
