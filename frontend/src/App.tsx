import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Plus,
  ArrowUpRight,
  Receipt,
  PieChart,
  CalendarDays,
  Target,
  ShieldCheck,
  Pencil,
  Trash2,
  Tag,
  AlertCircle,
  X,
  Repeat,
  Activity,
  PiggyBank,
  ArrowLeftRight,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import { TransactionModal } from './components/TransactionModal';
import { CreditCardModal } from './components/CreditCardModal';
import { CreditCardPurchaseModal } from './components/CreditCardPurchaseModal';
import { ImportModal } from './components/ImportModal';
import { AiTransactionModal } from './components/AiTransactionModal';
import { AnalyticsSection } from './components/AnalyticsSection';
import { BudgetModal } from './components/BudgetModal';
import { AiBudgetSuggestionModal } from './components/AiBudgetSuggestionModal';
import { RecurringBillsSection } from './components/RecurringBillsSection';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { WhatIfSimulatorModal } from './components/WhatIfSimulatorModal';
import { MonthlyWrappedModal } from './components/MonthlyWrappedModal';
import { fetchRecurringBillsApi } from './services/recurringApi';
import { fetchSavingsGoalsApi } from './services/goalApi';
import { RecurringBill } from './types/recurring';
import { SavingsGoal } from './types/goal';
import { LandingPage } from './components/LandingPage';
import { ConfirmModal } from './components/ConfirmModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { CurrencyInput, parseRawToCents } from './components/CurrencyInput';
import { TelemetryModal } from './components/TelemetryModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { useTheme } from './context/ThemeContext';
import {
  KpiSummaryCards,
  TopNavigation,
  DashboardHeroBanner,
  MonthSelector,
  StatementTable,
} from './components/dashboard';
import { exportTransactionsCsvApi } from './services/goalApi';
import { warmUpBackend } from './services/authApi';
import {
  trackTransactionCreated,
  trackStatementImported,
  trackUserActivation,
  checkAndTrackRetention7d
} from './services/telemetryService';
import {
  Account,
  Category,
  Transaction,
  TransactionType,
  FinancialSummary
} from './types/financial';
import {
  CreditCard
} from './types/card';
import { BudgetProgressDto } from './types/budget';
import { AnalyticsOverview } from './types/analytics';
import {
  fetchAccountsApi,
  fetchCategoriesApi,
  fetchTransactionsApi,
  fetchSummaryApi,
  deleteTransactionApi,
  deleteBatchTransactionsApi,
  updateBatchTransactionCategoryApi,
  updateTransactionApi,
  createCategoryApi
} from './services/financialApi';
import {
  fetchCreditCardsApi
} from './services/cardApi';
import {
  getUserPreferencesApi,
  updateUserPreferencesApi,
} from './services/userPreferenceApi';
import {
  fetchBudgetsApi,
  deleteBudgetApi,
  fetchSpendingLimitsTimelineApi,
  saveSpendingLimitApi,
  removeSpendingLimitApi,
  syncSpendingLimitsTimelineApi,
} from './services/budgetApi';
import { fetchAnalyticsOverviewApi } from './services/analyticsApi';
import {
  resolveTimelineLimit,
  getSpendingLimitsTimeline,
  saveSpendingLimitForMonth,
  removeSpendingLimitForMonth,
  cacheSpendingLimitsTimeline,
  SpendingLimitResolution,
} from './utils/spendingLimitTimeline';

function formatBRL(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function getMonthRange(monthStr: string): { startDate: string; endDate: string } {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);
  const startDate = `${yearStr}-${monthNumStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearStr}-${monthNumStr}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function formatMonthLabel(monthStr: string): string {
  if (!monthStr) return '';
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1;
  const date = new Date(year, month, 1);
  const raw = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function getCurrentMonthStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}


const CATEGORY_COLORS = [
  '#1C4939', // Verde Institucional
  '#D4A94F', // Dourado Prestígio
  '#102D25', // Verde Escuro Profundo
  '#2D6F57', // Esmeralda Médio
  '#A67E26', // Ouro Envelhecido
  '#B93838', // Carmesim Financeiro
  '#3A5A4E', // Sálvia Escuro
  '#5A6B63', // Neutro Floresta
];

type TabType = 'overview' | 'analytics' | 'recurring' | 'goals';

const MainDashboard: React.FC = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const firstName = user?.fullName?.trim().split(' ')[0] || '';
  const isAdminUser = Boolean(user?.email && user.email.toLowerCase().trim() === 'pedrodev2020@gmail.com');

  // Atalho de teclado secreto para Telemetria (Ctrl + Shift + T) exclusivo para a conta admin
  useEffect(() => {
    if (!isAdminUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        setTelemetryModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminUser]);

  // Abas de navegação estilo Duolingo sincronizadas com a URL (Deep-linking)
  const getInitialTab = (): TabType => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'analytics' || hash === 'recurring' || hash === 'goals') {
      return hash as TabType;
    }
    return 'overview';
  };

  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    window.location.hash = tab === 'overview' ? '' : tab;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'analytics' || hash === 'recurring' || hash === 'goals') {
        setActiveTabState(hash as TabType);
      } else {
        setActiveTabState('overview');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navegação de Mês e Filtros Temporais Globais
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthStr());
  const [txFilterMode, setTxFilterMode] = useState<'month' | 'all'>('month');

  // Modo Escuro (Dark Mode) centralizado via ThemeContext
  const { isDarkMode } = useTheme();
  const darkMode = isDarkMode;

  // Modo Privacidade (ocultar valores na tela)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('economia_real_privacy_mode') === 'true';
  });

  const togglePrivacyMode = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('economia_real_privacy_mode', String(next));
      return next;
    });
  };

  // Filtros Avançados de Busca, Categoria e Tipo no Extrato
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(false);

  // Modais
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState<boolean>(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState<boolean>(false);
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>('INCOME');
  const [aiBudgetModalOpen, setAiBudgetModalOpen] = useState<boolean>(false);
  const [telemetryModalOpen, setTelemetryModalOpen] = useState<boolean>(false);
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState<boolean>(false);
  const [isMonthlyWrappedOpen, setIsMonthlyWrappedOpen] = useState<boolean>(false);

  // Tutorial Guiado / Onboarding Interativo
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Exibe o tutorial automaticamente ao entrar na área logada (se o usuário não tiver desabilitado)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const isTourDisabledLocal = localStorage.getItem(`economia_real_tutorial_disabled_${user.id}`) === 'true';

      if (token) {
        getUserPreferencesApi(token)
          .then((pref) => {
            if (pref.onboardingCompleted) {
              localStorage.setItem(`economia_real_tutorial_disabled_${user.id}`, 'true');
              setIsTourOpen(false);
            } else if (isTourDisabledLocal) {
              // Migração do local para nuvem: se o usuário já desabilitou no dispositivo, envia pro servidor
              updateUserPreferencesApi(token, { onboardingCompleted: true }).catch(() => {});
              setIsTourOpen(false);
            } else {
              const timer = setTimeout(() => {
                setIsTourOpen(true);
              }, 600);
              return () => clearTimeout(timer);
            }
          })
          .catch(() => {
            if (!isTourDisabledLocal) {
              const timer = setTimeout(() => {
                setIsTourOpen(true);
              }, 600);
              return () => clearTimeout(timer);
            }
          });
      } else if (!isTourDisabledLocal) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } else {
      setIsTourOpen(false);
    }
  }, [isAuthenticated, user?.id, token]);

  // Pré-aquecimento silencioso do backend em segundo plano para acordar a instância no Render
  // antes mesmo do usuário interagir, eliminando qualquer espera de inicialização do servidor
  useEffect(() => {
    if (!isAuthenticated) {
      warmUpBackend();
    }
  }, [isAuthenticated]);

  // Meta global de gastos (Teto Mensal) - Linha do tempo histórica contábil por usuário
  const [, setSpendingTimeline] = useState<Record<string, number>>({});
  const [spendingResolution, setSpendingResolution] = useState<SpendingLimitResolution>({
    limit: 0,
    isInherited: false,
    isExplicitZero: false,
  });
  const [isEditingLimit, setIsEditingLimit] = useState<boolean>(false);
  const [tempLimitInput, setTempLimitInput] = useState<string>('');
  const [tempSavingsInput, setTempSavingsInput] = useState<string>('');

  // Seleção múltipla para exclusão em massa de transações
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState<boolean>(false);

  // Modal de confirmação estilizado para exclusão de movimentações
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'single' | 'batch';
    targetId?: string;
    loading: boolean;
    deleteFutureRecurring?: boolean;
  }>({
    isOpen: false,
    type: 'single',
    loading: false,
    deleteFutureRecurring: false,
  });

  // Sincroniza a linha do tempo histórica do teto de gastos para o usuário e mês ativo
  useEffect(() => {
    // Remove chave legada global se existir no navegador para evitar vazamento
    if (localStorage.getItem('economia_real_spending_limit')) {
      localStorage.removeItem('economia_real_spending_limit');
    }

    if (user?.id) {
      // 1. Carrega imediatamente do cache local para renderização instantânea (sem flicker)
      const localTimeline = getSpendingLimitsTimeline(user.id);
      setSpendingTimeline(localTimeline);
      setSpendingResolution(resolveTimelineLimit(localTimeline, selectedMonth));

      // 2. Se autenticado, sincroniza com o banco de dados na nuvem (bidirecional)
      if (token) {
        (async () => {
          try {
            let remoteTimeline: Record<string, number>;
            if (localTimeline && Object.keys(localTimeline).length > 0) {
              remoteTimeline = await syncSpendingLimitsTimelineApi(token, localTimeline);
            } else {
              remoteTimeline = await fetchSpendingLimitsTimelineApi(token);
            }
            cacheSpendingLimitsTimeline(user.id, remoteTimeline);
            setSpendingTimeline(remoteTimeline);
            setSpendingResolution(resolveTimelineLimit(remoteTimeline, selectedMonth));
          } catch (err) {
            console.warn('Falha ao sincronizar tetos de gastos na nuvem:', err);
          }
        })();
      }
    } else {
      setSpendingTimeline({});
      setSpendingResolution({ limit: 0, isInherited: false, isExplicitZero: false });
      setSelectedTxIds(new Set());
    }
  }, [user?.id, token, selectedMonth]);

  // Dados financeiros
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [budgets, setBudgets] = useState<BudgetProgressDto[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netSavings: 0,
    totalAccountBalance: 0,
    transactionCount: 0,
  });
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Referências para evitar refetch desnecessário de dados estáticos
  const accountsRef = useRef<Account[]>([]);
  accountsRef.current = accounts;
  const categoriesRef = useRef<Category[]>([]);
  categoriesRef.current = categories;
  const creditCardsRef = useRef<CreditCard[]>([]);
  creditCardsRef.current = creditCards;

  const loadFinancialData = useCallback(async (options?: { reloadStatic?: boolean; loadAllTransactions?: boolean }) => {
    if (!token) return;
    setLoadingData(true);
    try {
      const { startDate, endDate } = getMonthRange(selectedMonth);
      const monthParam = `${selectedMonth}-01`;
      const isAllTx = options?.loadAllTransactions ?? (txFilterMode === 'all');

      // Só recarrega contas, categorias e cartões se for solicitado ou se a lista estiver vazia
      const shouldLoadStatic = options?.reloadStatic ||
                               accountsRef.current.length === 0 ||
                               categoriesRef.current.length === 0 ||
                               creditCardsRef.current.length === 0;

      const dynamicPromises = [
        fetchTransactionsApi(token, isAllTx ? undefined : startDate, isAllTx ? undefined : endDate),
        fetchSummaryApi(token, startDate, endDate),
        fetchBudgetsApi(token, monthParam),
        fetchAnalyticsOverviewApi(token, monthParam),
      ] as const;

      if (shouldLoadStatic) {
        const [txs, sum, bgs, anls, accs, cats, cards] = await Promise.all([
          ...dynamicPromises,
          fetchAccountsApi(token),
          fetchCategoriesApi(token),
          fetchCreditCardsApi(token),
        ]);
        setTransactions(txs);
        setSummary(sum);
        setBudgets(bgs);
        setAnalytics(anls);
        setAccounts(accs);
        setCategories(cats);
        setCreditCards(cards);
      } else {
        const [txs, sum, bgs, anls] = await Promise.all(dynamicPromises);
        setTransactions(txs);
        setSummary(sum);
        setBudgets(bgs);
        setAnalytics(anls);
      }

      // Carrega despesas fixas e metas em segundo plano para alimentar os motores de inteligência
      Promise.all([
        fetchRecurringBillsApi(token, selectedMonth).catch(() => []),
        fetchSavingsGoalsApi(token).catch(() => []),
      ]).then(([bills, goals]) => {
        setRecurringBills(bills);
        setSavingsGoals(goals);
      });

      // Rastreamento de Crescimento: Retenção em 7 dias e Ativação do Usuário
      if (user?.id) {
        checkAndTrackRetention7d(user.id, (user as any).createdAt);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token, selectedMonth, txFilterMode]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(getCurrentMonthStr());
  };

  const handleSelectMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedMonth(e.target.value);
    }
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthStr();

  useEffect(() => {
    if (isAuthenticated && token) {
      loadFinancialData();
    } else {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setCreditCards([]);

      setBudgets([]);
      setAnalytics(null);
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        totalAccountBalance: 0,
        transactionCount: 0,
      });
    }
  }, [isAuthenticated, token, loadFinancialData]);

  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportCsv = async () => {
    if (!token) return;
    try {
      setExportingCsv(true);
      await exportTransactionsCsvApi(token);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar CSV.');
    } finally {
      setExportingCsv(false);
    }
  };



  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  const handleRequestDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    const isRecurring = !!(tx?.notes && (tx.notes.includes('RECURRING_INCOME:') || tx.notes.includes('RECURRING_EXPENSE:') || tx.notes.includes('RECURRING_BILL:')));
    setDeleteConfirmState({
      isOpen: true,
      type: 'single',
      targetId: id,
      loading: false,
      deleteFutureRecurring: isRecurring,
    });
  };

  // Funções de Seleção Múltipla e Exclusão em Massa
  const handleToggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatValue = (amount: number | undefined) => {
    if (privacyMode) return '••••••';
    return formatBRL(amount);
  };

  // Base de transações de acordo com o filtro de período (mês selecionado ou todas)
  const baseTransactions = txFilterMode === 'month'
    ? transactions.filter((t) => t.accrualDate && t.accrualDate.startsWith(selectedMonth))
    : transactions;

  const monthTransactionsCount = transactions.filter(
    (t) => t.accrualDate && t.accrualDate.startsWith(selectedMonth)
  ).length;

  const uncategorizedCount = baseTransactions.filter(
    (t) => !t.categoryId && t.type !== 'TRANSFER' && t.type !== 'INVOICE_PAYMENT'
  ).length;

  // Filtragem avançada com busca textual, categoria e tipo de movimentação
  const displayedTransactions = baseTransactions.filter((t) => {
    if (showOnlyUncategorized && (t.categoryId || t.type === 'TRANSFER' || t.type === 'INVOICE_PAYMENT')) {
      return false;
    }
    if (typeFilter === 'INCOME' && t.type !== 'INCOME') return false;
    if (typeFilter === 'EXPENSE' && t.type !== 'EXPENSE') return false;

    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'NONE') {
        if (t.categoryId || t.type === 'TRANSFER' || t.type === 'INVOICE_PAYMENT') return false;
      } else if (t.categoryId !== categoryFilter) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cat = categories.find((c) => c.id === t.categoryId);
      const descMatch = t.description.toLowerCase().includes(q);
      const catMatch = cat?.name.toLowerCase().includes(q);
      const notesMatch = t.notes?.toLowerCase().includes(q);
      return Boolean(descMatch || catMatch || notesMatch);
    }
    return true;
  });

  const handleToggleSelectAll = () => {
    if (selectedTxIds.size === displayedTransactions.length && displayedTransactions.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(displayedTransactions.map((t) => t.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedTxIds(new Set());
  };

  const handleRequestDeleteSelected = () => {
    if (selectedTxIds.size === 0) return;
    setDeleteConfirmState({
      isOpen: true,
      type: 'batch',
      loading: false,
    });
  };

  const [batchUpdatingCategory, setBatchUpdatingCategory] = useState<boolean>(false);

  const handleBatchChangeCategory = async (newCategoryId: string) => {
    if (!token || !newCategoryId || selectedTxIds.size === 0) return;
    try {
      setBatchUpdatingCategory(true);
      const ids = Array.from(selectedTxIds);
      const catObj = categories.find((c) => c.id === newCategoryId);
      const catName = catObj?.name || 'categoria selecionada';

      // Atualização otimista
      setTransactions((prev) =>
        prev.map((item) => (selectedTxIds.has(item.id) ? { ...item, categoryId: newCategoryId } : item))
      );

      await updateBatchTransactionCategoryApi(token, ids, newCategoryId);
      showToast(`${ids.length} movimentação(ões) categorizada(s) como "${catName}".`);
      setSelectedTxIds(new Set());
      await loadFinancialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar categorias em lote.';
      showToast(msg);
      await loadFinancialData();
    } finally {
      setBatchUpdatingCategory(false);
    }
  };

  // Estados para atualização inline e feedback na tabela
  const [inlineUpdatingTxId, setInlineUpdatingTxId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleConfirmDelete = async () => {
    if (!token) return;
    setDeleteConfirmState((prev) => ({ ...prev, loading: true }));

    try {
      if (deleteConfirmState.type === 'single' && deleteConfirmState.targetId) {
        const id = deleteConfirmState.targetId;
        const deleteFuture = !!deleteConfirmState.deleteFutureRecurring;
        await deleteTransactionApi(token, id, deleteFuture);
        setSelectedTxIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast(deleteFuture ? 'Movimentações recorrentes excluídas com sucesso.' : 'Movimentação excluída com sucesso.');
      } else if (deleteConfirmState.type === 'batch') {
        const ids = Array.from(selectedTxIds);
        setDeletingBatch(true);
        await deleteBatchTransactionsApi(token, ids);
        setSelectedTxIds(new Set());
        showToast(`${ids.length} movimentação(ões) excluída(s) com sucesso.`);
      }
      setDeleteConfirmState({ isOpen: false, type: 'single', loading: false });
      await loadFinancialData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir movimentação(ões).';
      showToast(msg);
      setDeleteConfirmState((prev) => ({ ...prev, loading: false }));
    } finally {
      setDeletingBatch(false);
    }
  };

  const handleInlineUpdateCategory = async (tx: Transaction, newCategoryId: string) => {
    if (!token || !newCategoryId || newCategoryId === tx.categoryId) return;
    try {
      setInlineUpdatingTxId(tx.id);
      const catObj = categories.find((c) => c.id === newCategoryId);
      const catName = catObj?.name || 'categoria';

      // Atualização otimista imediata para resposta instantânea
      setTransactions((prev) =>
        prev.map((item) => (item.id === tx.id ? { ...item, categoryId: newCategoryId } : item))
      );

      const payload = {
        type: tx.type,
        amount: tx.amount,
        accrualDate: tx.accrualDate,
        settlementDate: tx.settlementDate,
        description: tx.description,
        accountId: tx.accountId,
        destinationAccountId: tx.destinationAccountId,
        categoryId: newCategoryId,
        notes: tx.notes,
      };

      await updateTransactionApi(token, tx.id, payload);
      showToast(`Categoria alterada para "${catName}"!`);
      await loadFinancialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar categoria da movimentação.');
      await loadFinancialData();
    } finally {
      setInlineUpdatingTxId(null);
    }
  };

  const handleInlineUpdateDate = async (tx: Transaction, newDate: string) => {
    if (!token || !newDate || newDate === tx.accrualDate) return;
    try {
      setInlineUpdatingTxId(tx.id);

      // Atualização otimista imediata
      setTransactions((prev) =>
        prev.map((item) => (item.id === tx.id ? { ...item, accrualDate: newDate } : item))
      );

      const payload = {
        type: tx.type,
        amount: tx.amount,
        accrualDate: newDate,
        settlementDate: tx.settlementDate,
        description: tx.description,
        accountId: tx.accountId,
        destinationAccountId: tx.destinationAccountId,
        categoryId: tx.categoryId,
        notes: tx.notes,
      };

      await updateTransactionApi(token, tx.id, payload);
      const formattedDate = newDate.split('-').reverse().join('/');
      showToast(`Data alterada para ${formattedDate}!`);
      await loadFinancialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar data da movimentação.');
      await loadFinancialData();
    } finally {
      setInlineUpdatingTxId(null);
    }
  };

  const handleInlineUpdateAmount = async (tx: Transaction, newAmount: number) => {
    if (!token || isNaN(newAmount) || newAmount <= 0 || Math.abs(newAmount - tx.amount) < 0.001) return;
    try {
      setInlineUpdatingTxId(tx.id);

      // Atualização otimista imediata
      setTransactions((prev) =>
        prev.map((item) => (item.id === tx.id ? { ...item, amount: newAmount } : item))
      );

      const payload = {
        type: tx.type,
        amount: newAmount,
        accrualDate: tx.accrualDate,
        settlementDate: tx.settlementDate,
        description: tx.description,
        accountId: tx.accountId,
        destinationAccountId: tx.destinationAccountId,
        categoryId: tx.categoryId,
        notes: tx.notes,
      };

      await updateTransactionApi(token, tx.id, payload);
      showToast(`Valor atualizado para ${formatBRL(newAmount)}!`);
      await loadFinancialData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar valor da movimentação.');
      await loadFinancialData();
    } finally {
      setInlineUpdatingTxId(null);
    }
  };

  // Modal para criação rápida de categoria inline
  const [quickCategoryModal, setQuickCategoryModal] = useState<{ isOpen: boolean; targetTx?: Transaction } | null>(null);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>(CATEGORY_COLORS[0]);
  const [creatingCat, setCreatingCat] = useState<boolean>(false);

  const handleCreateQuickCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !newCatName.trim()) return;

    try {
      setCreatingCat(true);
      const created = await createCategoryApi(token, {
        name: newCatName.trim(),
        icon: 'tag',
        colorHex: newCatColor,
      });

      // Adiciona na lista de categorias do estado
      setCategories((prev) => [...prev, created]);

      // Se havia uma transação associada, atualiza imediatamente a categoria dela
      if (quickCategoryModal?.targetTx) {
        await handleInlineUpdateCategory(quickCategoryModal.targetTx, created.id);
      } else {
        showToast(`Categoria "${created.name}" criada com sucesso!`);
      }

      setQuickCategoryModal(null);
      setNewCatName('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cadastrar categoria.');
    } finally {
      setCreatingCat(false);
    }
  };

  // Limite global efetivo (teto na linha do tempo ou soma das metas por categoria)
  const totalBudgetFromCategories = budgets.reduce((acc, b) => acc + (b.monthlyLimit || 0), 0);
  const effectiveGlobalLimit = spendingResolution.isExplicitZero
    ? 0
    : spendingResolution.limit > 0
      ? spendingResolution.limit
      : totalBudgetFromCategories;

  const handleSaveGlobalLimit = async () => {
    const parsed = parseRawToCents(tempLimitInput) / 100;
    if (!isNaN(parsed) && parsed > 0) {
      if (user?.id) {
        // Atualiza cache local imediatamente para feedback visual instantâneo
        const localUpdated = saveSpendingLimitForMonth(user.id, selectedMonth, parsed);
        setSpendingTimeline(localUpdated);
        setSpendingResolution(resolveTimelineLimit(localUpdated, selectedMonth));

        // Persiste no banco de dados na nuvem para sincronização multi-dispositivo (celular <-> web)
        if (token) {
          try {
            const remoteUpdated = await saveSpendingLimitApi(token, selectedMonth, parsed);
            cacheSpendingLimitsTimeline(user.id, remoteUpdated);
            setSpendingTimeline(remoteUpdated);
            setSpendingResolution(resolveTimelineLimit(remoteUpdated, selectedMonth));
          } catch (err) {
            console.error('Erro ao salvar teto na nuvem:', err);
          }
        }
      }
      setIsEditingLimit(false);
    } else {
      await handleRemoveGlobalLimit();
    }
  };

  const handleRemoveGlobalLimit = async () => {
    if (user?.id) {
      // Atualiza localmente
      const localUpdated = removeSpendingLimitForMonth(user.id, selectedMonth);
      setSpendingTimeline(localUpdated);
      setSpendingResolution(resolveTimelineLimit(localUpdated, selectedMonth));

      // Persiste remoção na nuvem
      if (token) {
        try {
          const remoteUpdated = await removeSpendingLimitApi(token, selectedMonth);
          cacheSpendingLimitsTimeline(user.id, remoteUpdated);
          setSpendingTimeline(remoteUpdated);
          setSpendingResolution(resolveTimelineLimit(remoteUpdated, selectedMonth));
        } catch (err) {
          console.error('Erro ao remover teto na nuvem:', err);
        }
      }
    }

    // Se houver metas cadastradas especificamente para o mês selecionado no backend, remove-as
    if (token && budgets.length > 0) {
      try {
        const toDelete = budgets.filter((b) => !!b.id && b.monthReference && b.monthReference.startsWith(selectedMonth));
        if (toDelete.length > 0) {
          await Promise.all(toDelete.map((b) => deleteBudgetApi(token, b.id!)));
          await loadFinancialData();
        }
      } catch (err) {
        console.warn('Erro ao remover orçamentos cadastrados:', err);
      }
    }
    setIsEditingLimit(false);
  };

  const handleStartEditLimit = () => {
    const limit = effectiveGlobalLimit > 0 ? effectiveGlobalLimit : 0;
    setTempLimitInput(limit > 0 ? limit.toString() : '');
    if (summary.totalIncome > 0 && limit > 0) {
      const savings = Math.max(0, summary.totalIncome - limit);
      setTempSavingsInput(savings > 0 ? savings.toFixed(2) : '0');
    } else {
      setTempSavingsInput('');
    }
    setIsEditingLimit(true);
  };

  const handleLimitChange = (val: number) => {
    setTempLimitInput(val > 0 ? val.toString() : '');
    if (summary.totalIncome > 0) {
      const savings = Math.max(0, summary.totalIncome - val);
      setTempSavingsInput(savings > 0 ? savings.toFixed(2) : '0');
    }
  };

  const handleSavingsChange = (val: number) => {
    setTempSavingsInput(val > 0 ? val.toString() : '');
    if (summary.totalIncome > 0) {
      const limit = Math.max(0, summary.totalIncome - val);
      setTempLimitInput(limit > 0 ? limit.toFixed(2) : '0');
    }
  };

  const applySavingsPercentage = (pct: number) => {
    if (summary.totalIncome <= 0) return;
    const savings = Math.round(summary.totalIncome * (pct / 100));
    const limit = Math.max(0, summary.totalIncome - savings);
    setTempSavingsInput(savings > 0 ? savings.toFixed(2) : '0');
    setTempLimitInput(limit > 0 ? limit.toFixed(2) : '0');
  };

  const handleOpenNewIncome = () => {
    setEditingTransaction(null);
    setInitialTransactionType('INCOME');
    setTransactionModalOpen(true);
  };

  const incomeTransactions = displayedTransactions.filter((t) => t.type === 'INCOME');

  const defaultTxDate = selectedMonth === getCurrentMonthStr()
    ? new Date().toISOString().split('T')[0]
    : `${selectedMonth}-01`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? 'bg-[#0A1D17] text-[#E8E4D9] dark' : 'bg-[#E8E4D9] text-[#102D25]'}`}>

      {/* Top Header Modularizado */}
      <TopNavigation
        user={user}
        isAuthenticated={isAuthenticated}
        privacyMode={privacyMode}
        togglePrivacyMode={togglePrivacyMode}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onWarmUpBackend={warmUpBackend}
        onLogout={logout}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">

        {isAuthenticated && user ? (
          <>
            {/* Banner Destaque Economia Real Modularizado */}
            <DashboardHeroBanner
              firstName={firstName}
              onOpenTransactionModal={() => setTransactionModalOpen(true)}
              onOpenAiModal={() => setAiModalOpen(true)}
              onOpenImportModal={() => setImportModalOpen(true)}
              onExportCsv={handleExportCsv}
              hasTransactions={transactions.length > 0}
              exportingCsv={exportingCsv}
            />

            <div className="space-y-5 sm:space-y-8">

            {/* Seletor Global de Mês Modularizado */}
            <MonthSelector
              selectedMonth={selectedMonth}
              isCurrentMonth={isCurrentMonth}
              formatMonthLabel={formatMonthLabel}
              getCurrentMonthStr={getCurrentMonthStr}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onCurrentMonth={handleCurrentMonth}
              onSelectMonthInput={handleSelectMonthInput}
            />

            {/* 4 Cards de Métricas Principais (Modularizado) */}
            <KpiSummaryCards
              summary={summary}
              incomeCount={incomeTransactions.length}
              effectiveGlobalLimit={effectiveGlobalLimit}
              formatValue={formatValue}
            />

            {/* Abas de Navegação Estilo Duolingo (Pílulas Táteis 3D com Rolagem Fluida) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
              <button
                onClick={() => setActiveTab('overview')}
                className={`btn-duo text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 shrink-0 snap-start ${activeTab === 'overview'
                  ? 'btn-duo-green'
                  : 'btn-duo-white'
                  }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Extrato & Contas</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`btn-duo text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 shrink-0 snap-start ${activeTab === 'analytics'
                  ? 'btn-duo-green'
                  : 'btn-duo-white'
                  }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Gráficos & Orçamento</span>
              </button>

              <button
                onClick={() => setActiveTab('recurring')}
                className={`btn-duo text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 shrink-0 snap-start ${activeTab === 'recurring'
                  ? 'btn-duo-green'
                  : 'btn-duo-white'
                  }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Despesas Fixas</span>
              </button>

              <button
                onClick={() => setActiveTab('goals')}
                className={`btn-duo text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 shrink-0 snap-start ${activeTab === 'goals'
                  ? 'btn-duo-green'
                  : 'btn-duo-white'
                  }`}
              >
                <Target className="w-4 h-4" />
                <span>Metas de Economia</span>
              </button>
            </div>

            {/* CONTEÚDO DA ABA SELECIONADA */}

            {/* ABA 1: VISÃO GERAL (Extrato e Contas Bancárias) */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna 1: Minhas Entradas & Meta Máxima de Gastos (substitui Contas Bancárias) */}
                <div className="lg:col-span-1 space-y-6">

                  {/* Bloco 1: Minhas Entradas / Receitas */}
                  <div className="card-duo p-6 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                      <div>
                        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
                          <ArrowUpRight className="h-5 w-5 text-[#10B981] stroke-[3]" />
                          Minhas Entradas
                        </h2>
                        <span className="text-xs font-bold text-slate-400">
                          <strong className="text-emerald-700 font-numeric">{formatValue(summary.totalIncome)}</strong> recebidos no mês
                        </span>
                      </div>
                      <button
                        onClick={handleOpenNewIncome}
                        className="btn-duo btn-emerald text-xs px-3 py-1.5 flex items-center gap-1 shadow-sm"
                        title="Registrar nova entrada ou salário"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[3]" />
                        Nova Entrada
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {incomeTransactions.length === 0 ? (
                        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#0A1D17] text-center space-y-2">
                          <p className="text-xs font-bold text-slate-400 dark:!text-slate-300">Nenhuma entrada registrada este mês.</p>
                          <button
                            onClick={handleOpenNewIncome}
                            className="btn-duo btn-emerald text-xs px-3 py-1.5"
                          >
                            Registrar Primeiro Salário/Renda
                          </button>
                        </div>
                      ) : (
                        incomeTransactions.slice(0, 5).map((tx) => {
                          const cat = categories.find((c) => c.id === tx.categoryId);
                          return (
                            <div
                              key={tx.id}
                              className="p-3 rounded-2xl bg-slate-50 dark:!bg-[#16382E] border-2 border-slate-100 dark:!border-[#214E3E] hover:border-emerald-200 dark:hover:border-emerald-600 transition-all flex items-center justify-between group"
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <p className="font-black text-xs text-slate-800 dark:!text-[#E8E4D9] truncate">{tx.description}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                                    {tx.accrualDate}
                                  </span>
                                  {cat && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 truncate">
                                      {cat.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-black text-[#10B981] font-numeric">
                                  + {formatValue(tx.amount)}
                                </span>
                                <div className="flex items-center opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTransaction(tx)}
                                    className="p-1 text-slate-400 hover:text-[#1C4939] rounded-lg transition"
                                    title="Editar entrada"
                                  >
                                    <Pencil className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestDeleteTransaction(tx.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                    title="Excluir entrada"
                                  >
                                    <Trash2 className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {incomeTransactions.length > 5 && (
                        <p className="text-[11px] font-bold text-slate-400 text-center pt-1">
                          + {incomeTransactions.length - 5} outras entradas listadas no extrato
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bloco 2: Meta Máxima de Gastos (Teto Mensal & IA) */}
                  <div id="tour-spending-limit-card" className="card-duo p-6 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-[#214E3E] pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#1C4939] dark:text-[#D4A94F] stroke-[2.5]" />
                        <div>
                          <h2 className="text-base font-black text-slate-800 dark:text-[#E8E4D9]">
                            Teto de Gastos & Economia
                          </h2>
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            {spendingResolution.isInherited ? (
                              <span className="text-[#1C4939] dark:text-[#D4A94F] flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#1C4939] dark:bg-[#D4A94F] animate-pulse" />
                                Herdado de {spendingResolution.inheritedFromMonth?.split('-').reverse().join('/')}
                              </span>
                            ) : spendingResolution.limit > 0 ? (
                              <span className="text-emerald-600 dark:text-[#78C6A3] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                Definido neste mês
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-[#9AB3A8]">
                                Meta global para este mês
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {!isEditingLimit && (
                        <div className="flex items-center gap-1.5">
                          {effectiveGlobalLimit > 0 && (
                            <button
                              onClick={handleRemoveGlobalLimit}
                              className="btn-duo btn-duo-white text-xs px-2.5 py-1.5 flex items-center gap-1 text-rose-600 hover:text-rose-700 border-rose-200"
                              title="Remover teto e metas"
                            >
                              <Trash2 className="h-3 w-3 stroke-[2.5]" />
                              <span>Remover</span>
                            </button>
                          )}
                          <button
                            onClick={handleStartEditLimit}
                            className="btn-duo btn-duo-white text-xs px-2.5 py-1.5 flex items-center gap-1"
                            title="Ajustar teto global"
                          >
                            <Pencil className="h-3 w-3 stroke-[2.5]" />
                            <span>Ajustar</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingLimit ? (
                      <div className="space-y-3.5 bg-slate-50 dark:!bg-[#16382E] p-4 rounded-2xl border-2 border-slate-200/80 dark:!border-[#214E3E]">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-[#214E3E]">
                          <span className="text-xs font-bold text-[#1C4939] dark:text-[#D4A94F] flex items-center gap-1.5">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            Planejamento Sincronizado
                          </span>
                          {summary.totalIncome > 0 ? (
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9AB3A8]">
                              Renda do mês: <strong className="text-slate-800 dark:text-[#E8E4D9] font-numeric">{formatValue(summary.totalIncome)}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Nenhuma receita cadastrada neste mês
                            </span>
                          )}
                        </div>

                        {/* Grid dos 2 campos conectados */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Campo 1: Teto de Gastos */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-600 dark:text-[#9AB3A8] uppercase tracking-wider flex items-center justify-between">
                              <span>Teto de Gastos (R$)</span>
                              <Target className="w-3.5 h-3.5 text-[#1C4939] dark:text-[#D4A94F]" />
                            </label>
                            <CurrencyInput
                              value={tempLimitInput}
                              onChangeValue={handleLimitChange}
                              placeholder="Ex: 3.500,00"
                              className="bg-white dark:!bg-[#102D25] border-2 border-slate-200 dark:!border-[#214E3E] rounded-xl text-base font-black text-slate-800 dark:!text-[#E8E4D9] focus:outline-none focus:border-[#1C4939] dark:focus:border-[#D4A94F] py-2 w-full"
                              autoFocus
                            />
                            <span className="text-[10px] text-slate-400 dark:text-[#9AB3A8] block">
                              Quanto você quer gastar no máximo
                            </span>
                          </div>

                          {/* Campo 2: Meta de Economia */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-600 dark:text-[#9AB3A8] uppercase tracking-wider flex items-center justify-between">
                              <span>Quero Economizar (R$)</span>
                              <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-[#78C6A3]" />
                            </label>
                            <CurrencyInput
                              value={tempSavingsInput}
                              onChangeValue={handleSavingsChange}
                              placeholder={summary.totalIncome > 0 ? "Ex: 1.500,00" : "Cadastre receitas primeiro"}
                              disabled={summary.totalIncome <= 0}
                              className={`border-2 rounded-xl text-base font-black focus:outline-none py-2 w-full ${
                                summary.totalIncome > 0
                                  ? 'bg-white dark:!bg-[#102D25] border-slate-200 dark:!border-[#214E3E] text-slate-800 dark:!text-[#E8E4D9] focus:border-emerald-600 dark:focus:border-[#78C6A3]'
                                  : 'bg-slate-100 dark:!bg-[#0A1D17] border-dashed border-slate-200 dark:!border-[#214E3E] text-slate-400 cursor-not-allowed'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 dark:text-[#9AB3A8] block">
                              {summary.totalIncome > 0
                                ? 'Quanto quer poupar da sua renda'
                                : 'Requer receita cadastrada para calcular'}
                            </span>
                          </div>
                        </div>

                        {/* Atalhos rápidos de % de economia */}
                        {summary.totalIncome > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#9AB3A8] tracking-wider block">
                              Atalhos rápidos para poupar da renda:
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[10, 20, 30, 50].map((pct) => {
                                const savingsVal = Math.round(summary.totalIncome * (pct / 100));
                                return (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => applySavingsPercentage(pct)}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-[#102D25] hover:bg-[#E6EFEA] dark:hover:bg-[#1C4939] border border-slate-200 dark:border-[#214E3E] text-slate-700 dark:text-[#E8E4D9] transition-colors"
                                  >
                                    Guardar {pct}% ({formatValue(savingsVal)})
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* MINI-PROJEÇÃO DO POTENCIAL DA ECONOMIA INTEGRADA AO TETO */}
                        {(() => {
                          const savingsVal = parseRawToCents(tempSavingsInput) / 100;
                          if (savingsVal <= 0) return null;

                          const monthlyRate = Math.pow(1 + 0.105, 1 / 12) - 1; // 10.5% a.a. (~100% CDI)
                          const fiveYears = Math.round(savingsVal * ((Math.pow(1 + monthlyRate, 60) - 1) / monthlyRate));
                          const passiveMonthly = Math.round(fiveYears * monthlyRate);

                          return (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#FAF8F4] border border-[#D4A94F]/40 shadow-sm space-y-2 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#D4A94F] flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Potencial dessa Economia (Juros Compostos):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsWhatIfModalOpen(true)}
                                  className="text-[10px] font-black text-[#D4A94F] hover:underline flex items-center gap-1"
                                >
                                  <span>Simulador Completo (1 a 30 anos)</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                                  <span className="text-[10px] text-[#9AB3A8] block">Em 5 Anos (10,5% a.a.):</span>
                                  <strong className="text-sm font-black text-white font-mono tabular-nums block">
                                    {formatValue(fiveYears)}
                                  </strong>
                                </div>
                                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                                  <span className="text-[10px] text-[#9AB3A8] block">Renda Passiva Estimada:</span>
                                  <strong className="text-sm font-black text-[#78C6A3] font-mono tabular-nums block">
                                    +{formatValue(passiveMonthly)}/mês
                                  </strong>
                                </div>
                              </div>

                              <p className="text-[10px] text-[#9AB3A8] font-medium leading-tight">
                                💡 Essa economia mensal de <strong>{formatValue(savingsVal)}</strong> gera um salário passivo sem você mexer no valor principal!
                              </p>
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-[#214E3E]">
                          {effectiveGlobalLimit > 0 ? (
                            <button
                              type="button"
                              onClick={handleRemoveGlobalLimit}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
                              title="Remover teto e voltar para modo Economia"
                            >
                              Remover Teto
                            </button>
                          ) : (
                            <div />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingLimit(false)}
                              className="btn-duo btn-duo-white text-xs px-3 py-1.5"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveGlobalLimit}
                              className="btn-duo btn-duo-green text-xs px-4 py-1.5"
                            >
                              Salvar Planejamento
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : effectiveGlobalLimit > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 dark:text-[#9AB3A8] block uppercase">Teto de Gastos</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-[#E8E4D9] font-numeric">
                              {formatValue(effectiveGlobalLimit)}
                            </span>
                            {summary.totalIncome > 0 && (
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-[#78C6A3]">
                                  Meta de Economia: {formatValue(Math.max(0, summary.totalIncome - effectiveGlobalLimit))} ({Math.max(0, Math.round(((summary.totalIncome - effectiveGlobalLimit) / summary.totalIncome) * 100))}% da renda)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsWhatIfModalOpen(true)}
                                  className="text-[10px] font-black text-[#1C4939] dark:text-[#D4A94F] hover:underline flex items-center gap-1"
                                  title="Ver potencial dessa economia acumulada em 1, 3, 5 e 10 anos"
                                >
                                  <Sparkles className="w-3 h-3 text-[#D4A94F]" />
                                  <span>Simular Futuro</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-[#9AB3A8] block uppercase">Gasto Atual</span>
                            <span className={`text-base font-black font-numeric ${summary.totalExpense > effectiveGlobalLimit ? 'text-[#EA2B2B]' : 'text-slate-800 dark:text-[#E8E4D9]'
                              }`}>
                              {formatValue(summary.totalExpense)}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso Gamificada */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-black">
                            <span className="text-slate-500">Consumo da Meta</span>
                            <span className={summary.totalExpense > effectiveGlobalLimit ? 'text-[#EA2B2B]' : 'text-slate-800'}>
                              {Math.round((summary.totalExpense / effectiveGlobalLimit) * 100)}%
                            </span>
                          </div>
                          <div className="progress-duo-track">
                            <div
                              className={`progress-duo-fill ${summary.totalExpense >= effectiveGlobalLimit
                                ? 'bg-[#FF4B4B]'
                                : summary.totalExpense >= effectiveGlobalLimit * 0.85
                                  ? 'bg-[#FF9600]'
                                  : 'bg-[#10B981]'
                                }`}
                              style={{
                                width: `${Math.min(100, (summary.totalExpense / effectiveGlobalLimit) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[11px] font-black pt-1">
                            {effectiveGlobalLimit - summary.totalExpense >= 0 ? (
                              <span className="text-[#059669] flex items-center gap-1 font-numeric">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                                Restam {formatValue(effectiveGlobalLimit - summary.totalExpense)} para gastar este mês
                              </span>
                            ) : (
                              <span className="text-[#EA2B2B] flex items-center gap-1 font-numeric">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                Teto estourado em {formatValue(Math.abs(effectiveGlobalLimit - summary.totalExpense))}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Botão de Sugestão de Tetos por Categoria com IA */}
                        <button
                          type="button"
                          onClick={() => setAiBudgetModalOpen(true)}
                          className="w-full btn-duo btn-duo-blue text-xs py-2.5 flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>Distribuir Tetos com I.A ✨</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#0A1D17] text-center space-y-2.5">
                        <p className="text-xs font-bold text-slate-400 dark:!text-slate-300">
                          Nenhum teto de gastos configurado para este mês.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleStartEditLimit}
                            className="btn-duo btn-emerald text-xs px-3 py-1.5 w-full sm:w-auto"
                          >
                            Definir Teto
                          </button>
                          <button
                            type="button"
                            onClick={() => setAiBudgetModalOpen(true)}
                            className="btn-duo btn-duo-blue text-xs px-3 py-1.5 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Sugerir com I.A</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna 2 e 3: Extrato de Transações (Modularizado em StatementTable) */}
                <StatementTable
                  transactions={transactions}
                  displayedTransactions={displayedTransactions}
                  categories={categories}
                  selectedMonth={selectedMonth}
                  monthTransactionsCount={monthTransactionsCount}
                  loadingData={loadingData}
                  privacyMode={privacyMode}
                  formatMonthLabel={formatMonthLabel}
                  txFilterMode={txFilterMode}
                  onTxFilterModeChange={(mode: 'month' | 'all') => {
                    setTxFilterMode(mode);
                    loadFinancialData({ loadAllTransactions: mode === 'all' });
                  }}
                  onRefreshData={() => loadFinancialData({ reloadStatic: true })}
                  onAddNewTransaction={() => {
                    setEditingTransaction(null);
                    setTransactionModalOpen(true);
                  }}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  showOnlyUncategorized={showOnlyUncategorized}
                  onShowOnlyUncategorizedChange={setShowOnlyUncategorized}
                  uncategorizedCount={uncategorizedCount}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  selectedTxIds={selectedTxIds}
                  onToggleSelectAll={handleToggleSelectAll}
                  onToggleSelectTx={handleToggleSelectTx}
                  onClearSelection={handleClearSelection}
                  onBatchChangeCategory={handleBatchChangeCategory}
                  batchUpdatingCategory={batchUpdatingCategory}
                  onRequestDeleteSelected={handleRequestDeleteSelected}
                  deletingBatch={deletingBatch}
                  inlineUpdatingTxId={inlineUpdatingTxId}
                  onInlineUpdateDate={handleInlineUpdateDate}
                  onInlineUpdateCategory={handleInlineUpdateCategory}
                  onInlineUpdateAmount={handleInlineUpdateAmount}
                  onEditTransaction={handleEditTransaction}
                  onRequestDeleteTransaction={handleRequestDeleteTransaction}
                  onOpenCreateCategory={(tx: Transaction) => setQuickCategoryModal({ isOpen: true, targetTx: tx })}
                />
              </div>
            )}

            {/* ABA 2: ANÁLISE & ORÇAMENTOS */}
            {activeTab === 'analytics' && (
              <div id="tour-analytics-tab-content">
                <AnalyticsSection
                  analytics={analytics}
                  budgets={budgets}
                  transactions={transactions}
                  recurringBills={recurringBills}
                  onOpenBudgetModal={() => setBudgetModalOpen(true)}
                  onOpenAiBudgetModal={() => setAiBudgetModalOpen(true)}
                  onOpenWhatIfSimulator={() => setIsWhatIfModalOpen(true)}
                  onOpenMonthlyWrapped={() => setIsMonthlyWrappedOpen(true)}
                  globalLimit={effectiveGlobalLimit}
                  privacyMode={privacyMode}
                />
              </div>
            )}

            {/* ABA 3: DESPESAS RECORRENTES */}
            {activeTab === 'recurring' && (
              <div id="tour-recurring-tab-content">
                <RecurringBillsSection
                  categories={categories}
                  accounts={accounts}
                  creditCards={creditCards}
                  selectedMonth={selectedMonth}
                  onDataChanged={loadFinancialData}
                  privacyMode={privacyMode}
                />
              </div>
            )}

            {/* ABA 4: METAS DE ECONOMIA */}
            {activeTab === 'goals' && (
              <SavingsGoalsSection
                accounts={accounts}
                onDataChanged={loadFinancialData}
                privacyMode={privacyMode}
              />
            )}

          </div>

          {/* Pilares de Valor do Produto (Área Logada) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="card-duo p-6 space-y-3 dark:!bg-[#102D25] dark:!border-[#214E3E]">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:!bg-[#16382E] border-2 border-emerald-200 dark:!border-emerald-600/40 flex items-center justify-center text-emerald-600 dark:!text-emerald-400 shadow-sm">
                <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:!text-[#E8E4D9]">Precisão ao Centavo</h3>
              <p className="text-xs font-bold text-slate-500 dark:!text-[#B7C6BE] leading-relaxed">
                Controle faturas de cartão, parcelas futuras e saldos bancários com exatidão matemática. Saiba exatamente onde cada real está, sem surpresas no fim do mês.
              </p>
            </div>

            <div className="card-duo p-6 space-y-3 dark:!bg-[#102D25] dark:!border-[#214E3E]">
              <div className="h-12 w-12 rounded-2xl bg-[#E8E4D9] dark:!bg-[#16382E] border-2 border-[#D5CFC0] dark:!border-[#214E3E] flex items-center justify-center text-[#1C4939] dark:!text-[#E8E4D9] shadow-sm">
                <Layers className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:!text-[#E8E4D9]">Visão Real dos Seus Gastos</h3>
              <p className="text-xs font-bold text-slate-500 dark:!text-[#B7C6BE] leading-relaxed">
                Pagamentos de faturas e transferências não distorcem seu orçamento. Você enxerga seu consumo real de despesas sem duplicidades nem confusão contábil.
              </p>
            </div>

            <div className="card-duo p-6 space-y-3 dark:!bg-[#102D25] dark:!border-[#214E3E]">
              <div className="h-12 w-12 rounded-2xl bg-[#FAF5E8] dark:!bg-[#16382E] border-2 border-[#D4A94F]/40 dark:!border-[#D4A94F]/50 flex items-center justify-center text-[#D4A94F] dark:!text-[#D4A94F] shadow-sm">
                <Sparkles className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:!text-[#E8E4D9]">Lançamento Ágil com I.A</h3>
              <p className="text-xs font-bold text-slate-500 dark:!text-[#B7C6BE] leading-relaxed">
                Fale por voz ou digite livremente — como <em>"ifood 49,19"</em> ou <em>"uber 25"</em> — e a inteligência artificial categoriza, data e organiza tudo em segundos.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* Landing Page Completa de Alta Conversão para Área Deslogada */
        <LandingPage
          onOpenLogin={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
          onOpenRegister={() => {
            setAuthModalMode('register');
            setAuthModalOpen(true);
          }}
          onOpenPrivacy={() => {
            setLegalModalTab('privacy');
            setLegalModalOpen(true);
          }}
          onOpenTerms={() => {
            setLegalModalTab('terms');
            setLegalModalOpen(true);
          }}
          onOpenSecurity={() => {
            setLegalModalTab('security');
            setLegalModalOpen(true);
          }}
        />
      )}
      </main>

      {/* Footer Limpo e Amigável */}
      <footer className="border-t-2 border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <p className="flex items-center gap-1.5 text-slate-500">
            <span className="text-slate-800 font-black">💼 Economia Real</span> • <span>© 2026 Economia Real. Todos os direitos reservados.</span>
          </p>

          <div className="flex items-center gap-3 text-slate-500">
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setLegalModalOpen(true);
              }}
              className="hover:text-[#1C4939] transition-colors"
            >
              Privacidade (LGPD)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setLegalModalOpen(true);
              }}
              className="hover:text-[#1C4939] transition-colors"
            >
              Termos de Uso
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('security');
                setLegalModalOpen(true);
              }}
              className="hover:text-[#1C4939] transition-colors"
            >
              Segurança
            </button>
          </div>

          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1 text-slate-500">
              <span>Dev:</span>
              <a
                href="https://www.linkedin.com/in/moreirapedroh/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1C4939] hover:text-[#0A7DEF] hover:underline font-black transition-colors"
              >
                Pedro Moreira
              </a>
            </p>
            {isAdminUser && (
              <button
                type="button"
                onClick={() => setTelemetryModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors py-1 px-2.5 rounded-lg font-bold shadow-xs"
                title="Painel Interno de Métricas e Telemetria (Acesso restrito: pedrodev2020@gmail.com • Atalho: Ctrl+Shift+T)"
              >
                <Activity className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">Telemetria (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modais */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onAccountCreated={() => loadFinancialData({ reloadStatic: true })}
      />

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        accounts={accounts}
        categories={categories}
        onTransactionCreated={() => {
          if (user?.id) {
            trackTransactionCreated({ type: 'EXPENSE', inputMethod: 'MANUAL' });
            trackUserActivation(user.id, 'TRANSACTION');
          }
          loadFinancialData();
        }}
        transactionToEdit={editingTransaction}
        initialType={initialTransactionType}
        defaultDate={defaultTxDate}
      />

      <CreditCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onCardCreated={() => loadFinancialData({ reloadStatic: true })}
      />

      <CreditCardPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        cards={creditCards}
        categories={categories}
        onPurchaseCreated={() => {
          if (user?.id) {
            trackTransactionCreated({ type: 'EXPENSE', inputMethod: 'MANUAL' });
            trackUserActivation(user.id, 'TRANSACTION');
          }
          loadFinancialData();
        }}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        accounts={accounts}
        onImportCompleted={(importedMonth?: string) => {
          if (importedMonth) {
            setSelectedMonth(importedMonth);
          }
          if (user?.id) {
            trackStatementImported('EXCEL', 1);
            trackUserActivation(user.id, 'STATEMENT_IMPORT');
          }
          loadFinancialData({ reloadStatic: true });
        }}
      />

      <AiTransactionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onTransactionCreated={() => {
          if (user?.id) {
            trackTransactionCreated({ type: 'EXPENSE', inputMethod: 'VOICE_AI' });
            trackUserActivation(user.id, 'TRANSACTION');
          }
          loadFinancialData();
        }}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        categories={categories}
        existingBudgets={budgets}
        onBudgetUpdated={loadFinancialData}
        monthReference={`${selectedMonth}-01`}
      />

      <AiBudgetSuggestionModal
        isOpen={aiBudgetModalOpen}
        onClose={() => setAiBudgetModalOpen(false)}
        initialGlobalLimit={effectiveGlobalLimit > 0 ? effectiveGlobalLimit : 3000}
        existingBudgets={budgets}
        onApplied={async (appliedGlobalLimit) => {
          if (user?.id && appliedGlobalLimit && appliedGlobalLimit > 0) {
            const localUpdated = saveSpendingLimitForMonth(user.id, selectedMonth, appliedGlobalLimit);
            setSpendingTimeline(localUpdated);
            setSpendingResolution(resolveTimelineLimit(localUpdated, selectedMonth));

            if (token) {
              try {
                const remoteUpdated = await saveSpendingLimitApi(token, selectedMonth, appliedGlobalLimit);
                cacheSpendingLimitsTimeline(user.id, remoteUpdated);
                setSpendingTimeline(remoteUpdated);
                setSpendingResolution(resolveTimelineLimit(remoteUpdated, selectedMonth));
              } catch (err) {
                console.error('Erro ao persistir teto na nuvem:', err);
              }
            }
          }
          loadFinancialData();
        }}
        monthReference={`${selectedMonth}-01`}
      />

      {/* Modal de Criação Rápida de Nova Categoria Inline */}
      {quickCategoryModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm card-duo p-6 space-y-4 shadow-2xl border-2 border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-[#1C4939] border border-blue-200 shadow-xs">
                  <Tag className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Nova Categoria</h3>
                  <p className="text-xs font-bold text-slate-400">
                    {quickCategoryModal.targetTx
                      ? `Aplicar em "${quickCategoryModal.targetTx.description}"`
                      : 'Cadastre e use em qualquer movimentação'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickCategoryModal(null);
                  setNewCatName('');
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Pet Shop, Cinema, Farmácia..."
                  autoFocus
                  required
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1C4939] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                  Cor da Categoria
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${newCatColor === color ? 'scale-115 ring-2 ring-offset-2 ring-slate-800 shadow-sm' : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setQuickCategoryModal(null);
                    setNewCatName('');
                  }}
                  className="btn-duo btn-duo-white text-xs px-3.5 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingCat || !newCatName.trim()}
                  className="btn-duo btn-duo-blue text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{creatingCat ? 'Criando...' : 'Criar e Aplicar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Estilizado para Exclusão */}
      {(() => {
        const isBatch = deleteConfirmState.type === 'batch';
        const singleTx = !isBatch && deleteConfirmState.targetId
          ? displayedTransactions.find((t) => t.id === deleteConfirmState.targetId) ||
            transactions.find((t) => t.id === deleteConfirmState.targetId)
          : null;

        const title = isBatch
          ? `Excluir ${selectedTxIds.size} movimentação(ões)?`
          : 'Excluir movimentação?';

        const description = isBatch ? (
          <div className="space-y-2">
            <p>
              Tem certeza que deseja excluir permanentemente as{' '}
              <strong className="text-slate-800">{selectedTxIds.size} movimentações</strong> selecionadas?
            </p>
            <p className="text-[11px] font-bold text-rose-500">
              Essa ação não poderá ser desfeita.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p>Tem certeza que deseja excluir esta movimentação?</p>
            {singleTx && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-slate-800 text-xs sm:text-sm truncate">
                    {singleTx.description}
                  </span>
                  <span
                    className={`font-black font-numeric text-xs sm:text-sm whitespace-nowrap ${
                      singleTx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {singleTx.type === 'EXPENSE' ? '- ' : '+ '}
                    {formatBRL(singleTx.amount)}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  {singleTx.accrualDate}
                </div>
              </div>
            )}

            {singleTx && singleTx.notes && (singleTx.notes.includes('RECURRING_INCOME:') || singleTx.notes.includes('RECURRING_EXPENSE:') || singleTx.notes.includes('RECURRING_BILL:')) && (
              <div className="p-3.5 bg-amber-50/90 dark:!bg-[#1E293B] border-2 border-amber-300 dark:!border-amber-900/80 rounded-2xl space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 text-amber-900 dark:!text-amber-300 text-xs font-black">
                  <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {singleTx.notes.includes('RECURRING_INCOME:') ? 'Renda Recorrente Detectada' : (singleTx.notes.includes('RECURRING_BILL:') ? 'Custo Fixo Recorrente Detectado' : 'Despesa Recorrente Detectada')}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-slate-700 dark:!text-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white/60 dark:!bg-[#16382E] hover:bg-white dark:hover:!bg-[#1C4939] border border-amber-200/70 dark:!border-[#214E3E] transition-colors">
                    <input
                      type="radio"
                      name="deleteScope"
                      checked={!deleteConfirmState.deleteFutureRecurring}
                      onChange={() => setDeleteConfirmState((prev) => ({ ...prev, deleteFutureRecurring: false }))}
                      className="text-[#1C4939] focus:ring-[#1C4939] accent-[#1C4939]"
                    />
                    <span>Excluir apenas o lançamento deste mês</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white/60 dark:!bg-[#16382E] hover:bg-white dark:hover:!bg-[#1C4939] border border-amber-200/70 dark:!border-[#214E3E] transition-colors">
                    <input
                      type="radio"
                      name="deleteScope"
                      checked={!!deleteConfirmState.deleteFutureRecurring}
                      onChange={() => setDeleteConfirmState((prev) => ({ ...prev, deleteFutureRecurring: true }))}
                      className="text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <span className="text-rose-700 dark:!text-rose-400 font-extrabold">Excluir este e todos os meses futuros</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Os lançamentos de meses passados serão preservados no histórico contábil.
                </p>
              </div>
            )}

            <p className="text-[11px] font-bold text-rose-500">
              Essa ação não poderá ser desfeita.
            </p>
          </div>
        );

        return (
          <ConfirmModal
            isOpen={deleteConfirmState.isOpen}
            onClose={() => {
              if (!deleteConfirmState.loading) {
                setDeleteConfirmState({ isOpen: false, type: 'single', loading: false });
              }
            }}
            onConfirm={handleConfirmDelete}
            title={title}
            description={description}
            confirmText={isBatch ? `Excluir (${selectedTxIds.size})` : 'Sim, Excluir'}
            cancelText="Cancelar"
            isDanger={true}
            loading={deleteConfirmState.loading}
          />
        );
      })()}

      {/* Tutorial Guiado Interativo (Onboarding) */}
      <OnboardingTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        userId={user?.id}
        onOpenImportModal={() => setImportModalOpen(true)}
        onOpenTransactionModal={() => {
          setEditingTransaction(null);
          setTransactionModalOpen(true);
        }}
        onOpenAiModal={() => setAiModalOpen(true)}
        onOpenAiBudgetModal={() => setAiBudgetModalOpen(true)}
      />

      {/* Central de Métricas, Funil e Telemetria (Exclusivo Administrador: pedrodev2020@gmail.com) */}
      {isAdminUser && (
        <TelemetryModal
          isOpen={telemetryModalOpen}
          onClose={() => setTelemetryModalOpen(false)}
        />
      )}

      {/* Modal Institucional de Privacidade, LGPD e Termos de Uso */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Simulador de "E se...?" */}
      <WhatIfSimulatorModal
        isOpen={isWhatIfModalOpen}
        onClose={() => setIsWhatIfModalOpen(false)}
        savingsGoals={savingsGoals}
        categoryDistribution={analytics?.categoryDistribution || []}
        totalIncome={summary.totalIncome}
        totalExpense={summary.totalExpense}
        initialCapital={summary.totalAccountBalance}
        token={token}
        onGoalCreated={() => {
          if (token) {
            fetchSavingsGoalsApi(token).then(setSavingsGoals).catch(() => {});
          }
        }}
        privacyMode={privacyMode}
      />

      {/* Retrospectiva "Seu Mês em Revista" (Wrapped) */}
      <MonthlyWrappedModal
        isOpen={isMonthlyWrappedOpen}
        onClose={() => setIsMonthlyWrappedOpen(false)}
        selectedMonth={selectedMonth}
        summary={summary}
        categoryDistribution={analytics?.categoryDistribution || []}
        transactions={transactions}
        savingsGoals={savingsGoals}
        privacyMode={privacyMode}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 animate-fadeIn backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
};
export default App;
