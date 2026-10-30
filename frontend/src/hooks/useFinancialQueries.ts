import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccountsApi,
  fetchCategoriesApi,
  fetchTransactionsApi,
  fetchSummaryApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  createCategoryApi,
  createAccountApi,
} from '../services/financialApi';
import {
  CreateTransactionPayload,
  UpdateTransactionPayload,
  CreateCategoryPayload,
  CreateAccountPayload,
} from '../types/financial';

export const queryKeys = {
  accounts: (token: string) => ['accounts', token] as const,
  categories: (token: string) => ['categories', token] as const,
  transactions: (token: string, startDate?: string, endDate?: string) =>
    ['transactions', token, startDate, endDate] as const,
  summary: (token: string, startDate?: string, endDate?: string) =>
    ['summary', token, startDate, endDate] as const,
};

export function useAccounts(token: string | null) {
  return useQuery({
    queryKey: queryKeys.accounts(token || ''),
    queryFn: () => fetchAccountsApi(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache em memória
  });
}

export function useCategories(token: string | null) {
  return useQuery({
    queryKey: queryKeys.categories(token || ''),
    queryFn: () => fetchCategoriesApi(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutos (dados estáticos)
  });
}

export function useTransactions(token: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.transactions(token || '', startDate, endDate),
    queryFn: () => fetchTransactionsApi(token!, startDate, endDate),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useFinancialSummary(token: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.summary(token || '', startDate, endDate),
    queryFn: () => fetchSummaryApi(token!, startDate, endDate),
    enabled: !!token,
    staleTime: 1000 * 30,
  });
}

export function useTransactionMutations(token: string | null) {
  const queryClient = useQueryClient();

  const invalidateFinancials = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['summary'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const createTransaction = useMutation({
    mutationFn: (payload: CreateTransactionPayload) => createTransactionApi(token!, payload),
    onSuccess: () => invalidateFinancials(),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) =>
      updateTransactionApi(token!, id, payload),
    onSuccess: () => invalidateFinancials(),
  });

  const deleteTransaction = useMutation({
    mutationFn: ({ id, deleteFuture }: { id: string; deleteFuture?: boolean }) =>
      deleteTransactionApi(token!, id, deleteFuture),
    onSuccess: () => invalidateFinancials(),
  });

  const createCategory = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategoryApi(token!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const createAccount = useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccountApi(token!, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    createAccount,
  };
}
