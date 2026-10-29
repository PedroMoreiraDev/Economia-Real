import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  LogOut,
  LogIn,
  CheckCircle2,
  Layers,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  DollarSign,
  Receipt,
  UploadCloud,
  Mic,
  Download,
  PieChart,
  CalendarDays,
  Target,
  ShieldCheck,
  Pencil,
  Trash2,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  X,
  Eye,
  EyeOff,
  Compass,
  Repeat,
  Activity,
  Sun,
  Moon
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
import { InlineCategorySelect } from './components/InlineCategorySelect';
import { CategoryFilterDropdown } from './components/CategoryFilterDropdown';
import { InlineDatePicker } from './components/InlineDatePicker';
import { RecurringBillsSection } from './components/RecurringBillsSection';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { LandingPage } from './components/LandingPage';
import { ConfirmModal } from './components/ConfirmModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { CurrencyInput, InlineCurrencyInput } from './components/CurrencyInput';
import { TelemetryModal } from './components/TelemetryModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { KpiSummaryCards } from './components/dashboard/KpiSummaryCards';
import { exportTransactionsCsvApi } from './services/goalApi';
import { warmUpBackend } from './services/authApi';
import { cleanTransactionNotes } from './utils/recurringNotes';
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
import { fetchBudgetsApi, deleteBudgetApi } from './services/budgetApi';
import { fetchAnalyticsOverviewApi } from './services/analyticsApi';
import {
  resolveTimelineLimit,
  getSpendingLimitsTimeline,
  saveSpendingLimitForMonth,
  removeSpendingLimitForMonth,
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

interface RecurringProgressInfo {
  current: number;
  total: number;
  remaining: number;
  badgeLabel: string;
  tooltip: string;
}

function getRecurringProgressInfo(tx: Transaction): RecurringProgressInfo | null {
  let current = tx.recurringCurrent;
  let total = tx.recurringTotal;
  let remaining = tx.recurringRemaining;

  // Fallback 1: se não veio preenchido do backend, tenta extrair da descrição (ex: "Parcela 5/6", "5/6", "Havan 3/5")
  if ((!total || total <= 1) && tx.description) {
    const descMatch = tx.description.match(/(?:\b(?:parcela|parc\.?)\s*)?\(?(\d{1,2})\s*(?:\/|\s+de\s+)\s*(\d{1,2})\)?/i);
    if (descMatch) {
      const c = parseInt(descMatch[1], 10);
      const t = parseInt(descMatch[2], 10);
      if (!isNaN(c) && !isNaN(t) && t > 1 && c >= 1 && c <= t && t <= 99) {
        current = c;
        total = t;
        remaining = Math.max(0, t - c);
      }
    }
  }

  // Fallback 2: se não vier preenchido do backend, tenta extrair das notas se contiver "(X/Y)"
  if ((!total || total <= 1) && tx.notes) {
    const match = tx.notes.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      const c = parseInt(match[1], 10);
      const t = parseInt(match[2], 10);
      if (!isNaN(c) && !isNaN(t) && t > 1 && c >= 1 && c <= t) {
        current = c;
        total = t;
        remaining = Math.max(0, t - c);
      }
    }
  }

  if (!total || total <= 1) {
    return null;
  }

  const c = current || 1;
  const rem = remaining !== undefined ? remaining : Math.max(0, total - c);

  let badgeLabel = '';
  if (rem === 0) {
    badgeLabel = 'Última';
  } else if (rem === 1) {
    badgeLabel = tx.type === 'INCOME' ? 'Resta 1' : 'Falta 1';
  } else {
    badgeLabel = tx.type === 'INCOME' ? `Restam ${rem}` : `Faltam ${rem}`;
  }

  const tooltip = tx.type === 'INCOME'
    ? `Entrada ${c} de ${total} • Restam ${rem} para concluir`
    : `Parcela ${c} de ${total} • Faltam ${rem} para pagar por completo`;

  return { current: c, total, remaining: rem, badgeLabel, tooltip };
}

const CATEGORY_COLORS = [
  '#026CD6', // Azul Principal
  '#10B981', // Verde Esmeralda
  '#8B5CF6', // Roxo Moderno
  '#EC4899', // Rosa
  '#F59E0B', // Âmbar / Dourado
  '#EF4444', // Coral / Vermelho
  '#06B6D4', // Ciano
  '#64748B', // Ardósia Neutro
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

  // Abas de navegação estilo Duolingo
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Navegação de Mês e Filtros Temporais Globais
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthStr());
  const [txFilterMode, setTxFilterMode] = useState<'month' | 'all'>('month');

  // Modo Escuro (Dark Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('economia_real_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('economia_real_dark_mode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

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

  // Tutorial Guiado / Onboarding Interativo
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Exibe o tutorial automaticamente ao entrar na área logada (se o usuário não tiver desabilitado)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const isTourDisabled = localStorage.getItem(`economia_real_tutorial_disabled_${user.id}`) === 'true';
      if (!isTourDisabled) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } else {
      setIsTourOpen(false);
    }
  }, [isAuthenticated, user?.id]);

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
      const timeline = getSpendingLimitsTimeline(user.id);
      setSpendingTimeline(timeline);
      const res = resolveTimelineLimit(timeline, selectedMonth);
      setSpendingResolution(res);
    } else {
      setSpendingTimeline({});
      setSpendingResolution({ limit: 0, isInherited: false, isExplicitZero: false });
      setSelectedTxIds(new Set());
    }
  }, [user?.id, selectedMonth]);

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

  const handleSaveGlobalLimit = () => {
    const parsed = parseFloat(tempLimitInput);
    if (!isNaN(parsed) && parsed > 0) {
      if (user?.id) {
        const updated = saveSpendingLimitForMonth(user.id, selectedMonth, parsed);
        setSpendingTimeline(updated);
        const res = resolveTimelineLimit(updated, selectedMonth);
        setSpendingResolution(res);
      }
      setIsEditingLimit(false);
    } else {
      handleRemoveGlobalLimit();
    }
  };

  const handleRemoveGlobalLimit = async () => {
    if (user?.id) {
      const updated = removeSpendingLimitForMonth(user.id, selectedMonth);
      setSpendingTimeline(updated);
      const res = resolveTimelineLimit(updated, selectedMonth);
      setSpendingResolution(res);
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
    setTempLimitInput(effectiveGlobalLimit > 0 ? effectiveGlobalLimit.toString() : '');
    setIsEditingLimit(true);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">

      {/* Top Header Economia Real com Glassmorphism Refinado */}
      <header className="glass-panel sticky top-0 z-40 border-b-2 border-slate-200/90 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo e Nome da Plataforma */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="relative group shrink-0">
              <img
                src="/logo-economia-real.png"
                alt="Economia Real - Controle Financeiro Inteligente"
                width={48}
                height={48}
                loading="eager"
                fetchPriority="high"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover border-2 border-blue-200 shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" title="Sistema online e conectado" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Economia<span className="text-[#026CD6]">Real</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 border border-blue-200 shadow-sm uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-[#026CD6]" />
                  Inteligência Artificial 🎩
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold hidden sm:block">
                Economia real, utilizando inteligência artificial para te fazer economizar de verdade
              </p>
            </div>
          </div>

          {/* Área Direita: Controles, Perfil e Autenticação */}
          <div className="flex items-center gap-2.5">
            {/* Botão do Guia / Tutorial do App */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsTourOpen(true)}
                className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5 text-slate-700 hover:text-amber-600 transition-colors"
                title="Abrir o tutorial e guia passo a passo do site"
              >
                <Compass className="h-4 w-4 stroke-[2.5] text-amber-500" />
                <span className="hidden sm:inline">Guia</span>
              </button>
            )}

            {/* Botão de Modo Privacidade (Ocultar/Mostrar Valores) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={togglePrivacyMode}
                className={`btn-duo text-xs px-3 py-2 flex items-center gap-1.5 transition-all ${privacyMode
                  ? 'btn-duo-yellow font-black ring-2 ring-amber-300'
                  : 'btn-duo-white hover:text-[#026CD6]'
                  }`}
                title={privacyMode ? "Valores monetários ocultos. Clique para exibir." : "Ocultar valores monetários na tela (Modo Privacidade)"}
              >
                {privacyMode ? (
                  <>
                    <EyeOff className="h-4 w-4 stroke-[2.5]" />
                    <span className="hidden sm:inline">Oculto</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 stroke-[2.5] text-slate-500" />
                    <span className="hidden sm:inline">Privacidade</span>
                  </>
                )}
              </button>
            )}

            {/* Alternador de Modo Escuro / Claro */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5 text-slate-700 hover:text-blue-600 transition-colors"
              title={darkMode ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4 stroke-[2.5] text-amber-500" />
                  <span className="hidden sm:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 stroke-[2.5] text-indigo-500" />
                  <span className="hidden sm:inline">Escuro</span>
                </>
              )}
            </button>

            {/* Autenticação / Perfil do Usuário */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-50/90 border-2 border-blue-200 text-xs shadow-sm">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-[#026CD6] to-[#0153AB] border-b-2 border-[#0153AB] text-white font-black flex items-center justify-center text-xs shadow-sm">
                    {user.fullName ? user.fullName.substring(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="font-extrabold text-slate-800 leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-blue-700 font-bold leading-tight truncate max-w-[140px]">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50/50"
                  title="Encerrar sessão"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                  onMouseEnter={warmUpBackend}
                  onTouchStart={warmUpBackend}
                  className="btn-duo btn-duo-white text-xs px-4 py-2"
                >
                  <LogIn className="h-4 w-4 mr-1 text-slate-500" />
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  onMouseEnter={warmUpBackend}
                  onTouchStart={warmUpBackend}
                  className="btn-duo btn-duo-green text-xs px-4 py-2"
                >
                  Cadastrar Grátis
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {isAuthenticated && user ? (
          <>
            {/* Banner Destaque Economia Real (Azul Suave, Moderno e Confiável - Área Logada) */}
            <div className="card-real-blue p-4 sm:p-6 lg:p-8 relative overflow-hidden">
              <div className="max-w-2xl lg:max-w-3xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border-2 border-blue-200 text-[#026CD6] text-xs font-black shadow-sm uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-400" />
                  Painel de Controle Financeiro
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                  Olá{firstName ? `, ${firstName}` : ''}! <span className="text-[#026CD6] underline decoration-blue-300 decoration-4">Pronto para organizar suas contas? Vamos começar!</span> 🎩✨
                </h1>

                <p className="text-slate-700 text-xs sm:text-base font-bold leading-relaxed">
                  Monitore seu fluxo de caixa, planeje seus lançamentos e acompanhe suas metas com precisão e suporte de IA.
                </p>

                {/* Ações Rápidas em Destaque (Grid 2x2 no mobile, Flex no desktop) */}
                <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    id="tour-add-btn"
                    onClick={() => setTransactionModalOpen(true)}
                    className="btn-duo btn-duo-green text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 stroke-[3] shrink-0" />
                    <span className="truncate">Novo Lançamento</span>
                  </button>

                  <button
                    id="tour-ai-btn"
                    onClick={() => setAiModalOpen(true)}
                    className="btn-duo btn-duo-purple text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
                  >
                    <Mic className="h-4 w-4 shrink-0" />
                    <span className="truncate">Falar com IA</span>
                  </button>

                  <button
                    id="tour-import-btn"
                    onClick={() => setImportModalOpen(true)}
                    className="btn-duo btn-duo-white text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
                  >
                    <UploadCloud className="h-4 w-4 text-[#0284C7] shrink-0" />
                    <span className="truncate">Importar Extrato</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    disabled={transactions.length === 0 || exportingCsv}
                    className="btn-duo btn-duo-white text-xs sm:text-sm px-3 sm:px-4 py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto disabled:opacity-50"
                    title="Exportar para Excel em CSV formatado"
                  >
                    <Download className={`h-4 w-4 text-blue-600 shrink-0 ${exportingCsv ? 'animate-bounce' : ''}`} />
                    <span className="truncate">{exportingCsv ? 'Gerando...' : 'Exportar Planilha'}</span>
                  </button>
                </div>
              </div>

              {/* Indicador Flutuante de IA e Projeção de Economia */}
              <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none select-none items-center">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-blue-200/90 p-4 shadow-xl shadow-blue-900/10 space-y-2.5 w-64 rotate-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Radar de IA Ativo
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +18.4%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400">Economia Projetada</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">R$ 1.420,00</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100">
                    <Sparkles className="w-3.5 h-3.5 text-[#026CD6] shrink-0" />
                    <span>Otimização contínua ativada</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">

            {/* Seletor Global de Mês / Navegação Temporal no Estilo Duolingo */}
            <div className="card-duo p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white via-blue-50/40 to-white">

              {/* Lado Esquerdo: Identificação do Mês Ativo */}
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <div className="h-12 w-12 rounded-2xl bg-[#DDF4FF] border-2 border-[#BAE6FD] text-[#026CD6] flex items-center justify-center shadow-sm shrink-0">
                  <Calendar className="h-6 w-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Período de Referência
                    </span>
                    {isCurrentMonth ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E8F8E8] text-[#388302] border border-[#D7FFB8] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#58CC02] animate-pulse" />
                        Mês Atual
                      </span>
                    ) : selectedMonth < getCurrentMonthStr() ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Mês Anterior
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Planejamento Futuro
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
                    {formatMonthLabel(selectedMonth)}
                  </h2>
                </div>
              </div>

              {/* Lado Direito: Controles de Navegação (Mês Anterior, Seletor Rápido, Próximo Mês, Botão Mês Atual) */}
              <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn-duo btn-duo-white text-xs px-2.5 sm:px-3 py-2 flex items-center gap-1 sm:gap-1.5 shrink-0"
                  title="Voltar para o mês anterior"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3] text-slate-600" />
                  <span className="hidden sm:inline">Mês Anterior</span>
                </button>

                {/* Input de Seleção Direta de Mês / Ano */}
                <div className="relative flex-1 sm:flex-initial">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={handleSelectMonthInput}
                    aria-label="Escolher mês e ano de referência"
                    className="btn-duo btn-duo-white text-xs font-black px-2.5 sm:px-3 py-1.5 cursor-pointer text-slate-700 hover:text-[#026CD6] border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#026CD6] w-full text-center"
                    title="Clique para escolher qualquer mês e ano diretamente"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn-duo btn-duo-white text-xs px-2.5 sm:px-3 py-2 flex items-center gap-1 sm:gap-1.5 shrink-0"
                  title="Avançar para o próximo mês"
                >
                  <span className="hidden sm:inline">Próximo Mês</span>
                  <ChevronRight className="h-4 w-4 stroke-[3] text-slate-600" />
                </button>

                {!isCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleCurrentMonth}
                    className="btn-duo btn-duo-blue text-xs px-2.5 sm:px-3.5 py-2 flex items-center gap-1 sm:gap-1.5 animate-fadeIn shrink-0"
                    title="Voltar para o mês atual"
                  >
                    <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span className="hidden xs:inline sm:inline">Mês Atual</span>
                  </button>
                )}
              </div>
            </div>

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
                        <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
                          <p className="text-xs font-bold text-slate-400">Nenhuma entrada registrada este mês.</p>
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
                              className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between group"
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <p className="font-black text-xs text-slate-800 truncate">{tx.description}</p>
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
                                    className="p-1 text-slate-400 hover:text-[#026CD6] rounded-lg transition"
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
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#026CD6] stroke-[2.5]" />
                        <div>
                          <h2 className="text-base font-black text-slate-800">
                            Teto Máximo de Gastos
                          </h2>
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            {spendingResolution.isInherited ? (
                              <span className="text-[#026CD6] flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-[#026CD6] animate-pulse" />
                                Herdado de {spendingResolution.inheritedFromMonth?.split('-').reverse().join('/')}
                              </span>
                            ) : spendingResolution.limit > 0 ? (
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                Definido neste mês
                              </span>
                            ) : (
                              <span className="text-slate-400">
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
                      <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200/80">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                          Definir Teto Mensal (R$)
                        </label>
                        <CurrencyInput
                          value={tempLimitInput}
                          onChangeValue={(val) => setTempLimitInput(val > 0 ? val.toString() : '')}
                          placeholder="Ex: 3.500,00 (ou 0 para remover)"
                          className="bg-white border-2 border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-none focus:border-[#026CD6] py-2"
                          autoFocus
                        />
                        <div className="flex items-center justify-between pt-1">
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
                              Salvar Teto
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : effectiveGlobalLimit > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 block uppercase">Limite Definido</span>
                            <span className="text-2xl font-black text-slate-900 font-numeric">
                              {formatValue(effectiveGlobalLimit)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-400 block uppercase">Gasto Atual</span>
                            <span className={`text-base font-black font-numeric ${summary.totalExpense > effectiveGlobalLimit ? 'text-[#EA2B2B]' : 'text-slate-800'
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
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2.5">
                        <p className="text-xs font-bold text-slate-400">
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

                {/* Coluna 2 e 3: Extrato de Transações */}
                <div id="tour-statement-section" className="lg:col-span-2 card-duo p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-[#026CD6]" />
                        <h2 className="text-base font-black text-slate-800">
                          Extrato de Movimentações
                        </h2>
                      </div>

                      {/* Pílulas de Alternância de Filtro: Mês Selecionado vs Todas */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setTxFilterMode('month');
                            loadFinancialData({ loadAllTransactions: false });
                          }}
                          className={`btn-duo text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all ${txFilterMode === 'month'
                            ? 'btn-duo-blue font-black'
                            : 'btn-duo-white font-bold text-slate-500'
                            }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{formatMonthLabel(selectedMonth)} ({monthTransactionsCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTxFilterMode('all');
                            loadFinancialData({ loadAllTransactions: true });
                          }}
                          className={`btn-duo text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all ${txFilterMode === 'all'
                            ? 'btn-duo-blue font-black'
                            : 'btn-duo-white font-bold text-slate-500'
                            }`}
                        >
                          <span>Todas as Movimentações ({transactions.length})</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => loadFinancialData({ reloadStatic: true })}
                        disabled={loadingData}
                        className="btn-duo btn-duo-white text-xs px-2.5 py-1.5"
                        title="Atualizar lançamentos (sincronização completa)"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin text-[#026CD6]' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          setEditingTransaction(null);
                          setTransactionModalOpen(true);
                        }}
                        className="btn-duo btn-emerald text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[3]" />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Barra de Pesquisa Rápida e Filtros de Categoria e Tipo */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border-2 border-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                      {/* Campo de Busca Textual */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Pesquisar por descrição, categoria, notas..."
                          className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026CD6] focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            title="Limpar busca"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filtro por Categoria Moderno e Elegante */}
                      <CategoryFilterDropdown
                        categories={categories}
                        selectedCategoryId={categoryFilter}
                        uncategorizedCount={uncategorizedCount}
                        onChange={(catId) => {
                          setCategoryFilter(catId);
                          if (catId === 'NONE') {
                            setShowOnlyUncategorized(true);
                          } else {
                            setShowOnlyUncategorized(false);
                          }
                        }}
                      />
                    </div>

                    {/* Filtros por Tipo: Todas, Entradas, Despesas */}
                    <div className="flex items-center gap-1.5 self-center sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTypeFilter('ALL')}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${typeFilter === 'ALL'
                          ? 'bg-[#026CD6] text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('INCOME')}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${typeFilter === 'INCOME'
                          ? 'bg-[#10B981] text-white shadow-sm'
                          : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                      >
                        Receitas
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter('EXPENSE')}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${typeFilter === 'EXPENSE'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                          }`}
                      >
                        Despesas
                      </button>

                      {uncategorizedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (showOnlyUncategorized || categoryFilter === 'NONE') {
                              setShowOnlyUncategorized(false);
                              setCategoryFilter('ALL');
                            } else {
                              setShowOnlyUncategorized(true);
                              setCategoryFilter('NONE');
                            }
                          }}
                          className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-1 ${showOnlyUncategorized || categoryFilter === 'NONE'
                            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                            : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-2 border-amber-300/80'
                            }`}
                          title={showOnlyUncategorized ? 'Mostrar todas as movimentações' : 'Filtrar apenas movimentações sem categoria'}
                        >
                          <span className="text-xs leading-none select-none">⚠️</span>
                          <span>{uncategorizedCount} sem categoria</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra Contextual de Ações em Massa */}
                  {selectedTxIds.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/90 border-2 border-blue-200 shadow-sm animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-[#026CD6] text-white text-xs font-black flex items-center justify-center shadow-sm">
                          {selectedTxIds.size}
                        </span>
                        <span className="text-xs font-extrabold text-blue-950">
                          {selectedTxIds.size === 1
                            ? '1 movimentação selecionada'
                            : `${selectedTxIds.size} movimentações selecionadas`}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer"
                        >
                          Desmarcar todas
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        {/* Seletor Rápido de Categoria em Lote */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border-2 border-blue-200 shadow-sm">
                          <Tag className="w-3.5 h-3.5 text-[#026CD6] shrink-0" />
                          <select
                            disabled={batchUpdatingCategory}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleBatchChangeCategory(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
                          >
                            <option value="" disabled>
                              {batchUpdatingCategory ? 'Alterando...' : 'Mudar Categoria...'}
                            </option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleRequestDeleteSelected}
                          disabled={deletingBatch || batchUpdatingCategory}
                          className="btn-duo btn-duo-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 shadow-sm disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{deletingBatch ? 'Excluindo...' : `Excluir (${selectedTxIds.size})`}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    {displayedTransactions.length === 0 ? (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
                        <p className="text-xs font-bold text-slate-400">
                          {searchQuery
                            ? `Nenhum resultado encontrado para "${searchQuery}".`
                            : categoryFilter !== 'ALL'
                              ? `Nenhuma movimentação encontrada para o filtro de categoria selecionado.`
                              : showOnlyUncategorized
                                ? `Nenhuma movimentação sem categoria encontrada.`
                                : txFilterMode === 'month'
                                  ? `Nenhuma movimentação registrada em ${formatMonthLabel(selectedMonth)}.`
                                  : 'Nenhuma movimentação registrada.'}
                        </p>
                        {searchQuery || categoryFilter !== 'ALL' || showOnlyUncategorized ? (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setCategoryFilter('ALL');
                              setShowOnlyUncategorized(false);
                            }}
                            className="btn-duo btn-duo-white text-xs px-3.5 py-1.5"
                          >
                            Limpar filtros
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTransaction(null);
                              setTransactionModalOpen(true);
                            }}
                            className="btn-duo btn-emerald text-xs px-4 py-2"
                          >
                            Registrar Primeiro Lançamento
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* 1. Visualização em Cards Táteis para Dispositivos Móveis (< md) */}
                        <div className="block md:hidden space-y-3">
                          <div className="flex items-center justify-between pb-1 px-1 text-xs text-slate-500 font-bold border-b border-slate-100">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={displayedTransactions.length > 0 && selectedTxIds.size === displayedTransactions.length}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                              />
                              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                                {selectedTxIds.size > 0 ? `${selectedTxIds.size} de ${displayedTransactions.length}` : `Todos (${displayedTransactions.length})`}
                              </span>
                            </label>
                            <span className="text-[10px] text-slate-400">Toque no card para editar</span>
                          </div>

                          {displayedTransactions.map((tx) => {
                            const isSelected = selectedTxIds.has(tx.id);
                            const isRowUncategorized = !tx.categoryId && tx.type !== 'TRANSFER' && tx.type !== 'INVOICE_PAYMENT';

                            return (
                              <div
                                key={tx.id}
                                className={`p-3.5 rounded-2xl border-2 transition-all space-y-2.5 ${
                                  isSelected
                                    ? 'bg-blue-50/90 border-[#026CD6] shadow-sm'
                                    : isRowUncategorized
                                      ? 'bg-amber-50/40 border-amber-300 shadow-2xs'
                                      : 'bg-white border-slate-200/90 shadow-2xs'
                                }`}
                              >
                                {/* Linha 1: Checkbox, Data, Origem e Tipo */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectTx(tx.id)}
                                      className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                                    />
                                    <InlineDatePicker
                                      value={tx.accrualDate}
                                      onChange={(newDate) => handleInlineUpdateDate(tx, newDate)}
                                      disabled={inlineUpdatingTxId === tx.id}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {tx.origin === 'AI_TEXT' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-2.5 h-2.5" /> IA
                                      </span>
                                    ) : tx.origin === 'AI_AUDIO' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                                        <Mic className="w-2.5 h-2.5" /> Voz
                                      </span>
                                    ) : tx.origin === 'CSV_IMPORT' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        <FileSpreadsheet className="w-2.5 h-2.5 stroke-[2.5]" /> CSV
                                      </span>
                                    ) : tx.origin === 'OFX_IMPORT' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                        <FileText className="w-2.5 h-2.5 stroke-[2.5]" /> OFX
                                      </span>
                                    ) : null}

                                    {tx.type === 'INCOME' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                                        <ArrowUpRight className="h-3 w-3 stroke-[3]" /> Receita
                                      </span>
                                    )}
                                    {tx.type === 'EXPENSE' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black">
                                        <ArrowDownLeft className="h-3 w-3 stroke-[3]" /> Despesa
                                      </span>
                                    )}
                                    {tx.type === 'TRANSFER' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black">
                                        <ArrowLeftRight className="h-3 w-3 stroke-[3]" /> Transf.
                                      </span>
                                    )}
                                    {tx.type === 'INVOICE_PAYMENT' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                                        <DollarSign className="h-3 w-3 stroke-[3]" /> Fatura
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Linha 2: Descrição e Valor */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="font-black text-sm text-slate-800 truncate" title={tx.description}>
                                        {tx.description}
                                      </p>
                                      {(() => {
                                        const progress = getRecurringProgressInfo(tx);
                                        const isRec = Boolean(
                                          progress !== null ||
                                          (tx.notes && (
                                            tx.notes.includes('RECURRING_INCOME:') ||
                                            tx.notes.includes('RECURRING_EXPENSE:') ||
                                            tx.notes.includes('RECURRING_BILL:') ||
                                            tx.notes.includes('projetada automaticamente')
                                          )) ||
                                          (tx.recurringTotal && tx.recurringTotal > 1)
                                        );
                                        if (!isRec) return null;
                                        const isIncome = tx.type === 'INCOME';

                                        return (
                                          <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none ${
                                              isIncome
                                                ? 'text-emerald-700 bg-emerald-100/90 border border-emerald-300'
                                                : 'text-rose-700 bg-rose-100/90 border border-rose-300'
                                            }`}
                                            title={progress ? progress.tooltip : (isIncome ? 'Renda Recorrente' : 'Despesa Recorrente')}
                                          >
                                            <Repeat className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />
                                            <span className="whitespace-nowrap">Recorrente</span>
                                            {progress && (
                                              <>
                                                <span className="opacity-40 font-normal select-none">•</span>
                                                <span className="font-extrabold whitespace-nowrap">
                                                  {progress.badgeLabel}
                                                </span>
                                              </>
                                            )}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    {(() => {
                                      const displayNotes = cleanTransactionNotes(tx.notes, tx.description);
                                      if (!displayNotes) return null;
                                      return (
                                        <span className="text-[11px] text-slate-400 font-normal truncate block mt-0.5" title={displayNotes}>
                                          {displayNotes}
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  <div className="shrink-0 text-right">
                                    {privacyMode ? (
                                      <span className="font-numeric font-black text-slate-400 text-sm">••••••</span>
                                    ) : (
                                      <div className="inline-flex items-center justify-end gap-1">
                                        <span className={`text-xs font-black select-none ${tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-rose-500'}`}>
                                          {tx.type === 'EXPENSE' ? '-' : (tx.type === 'INCOME' ? '+' : '')} R$
                                        </span>
                                        <InlineCurrencyInput
                                          initialValue={tx.amount}
                                          disabled={inlineUpdatingTxId === tx.id}
                                          onSave={(val) => handleInlineUpdateAmount(tx, val)}
                                          className={`w-24 text-right font-black text-sm font-numeric bg-slate-50 hover:bg-blue-50/60 focus:bg-white px-2 py-1 rounded-xl border border-slate-200 hover:border-blue-300 focus:border-[#026CD6] focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer ${
                                            tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-slate-900'
                                          }`}
                                          title="Clique para alterar o valor (Enter para salvar)"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Linha 3: Categoria e Ações */}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                  <div className="flex-1 min-w-0">
                                    <InlineCategorySelect
                                      currentCategoryId={tx.categoryId}
                                      categories={categories}
                                      disabled={inlineUpdatingTxId === tx.id}
                                      onSelectCategory={(newCatId) => handleInlineUpdateCategory(tx, newCatId)}
                                      onOpenCreateCategory={() => setQuickCategoryModal({ isOpen: true, targetTx: tx })}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTransaction(tx)}
                                      className="p-2 min-h-[36px] min-w-[36px] rounded-xl text-slate-500 hover:text-[#026CD6] bg-slate-100 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                      title="Editar movimentação"
                                    >
                                      <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRequestDeleteTransaction(tx.id)}
                                      className="p-2 min-h-[36px] min-w-[36px] rounded-xl text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center"
                                      title="Excluir movimentação"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 2. Visualização em Tabela Completa para Desktop e Telas Grandes (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b-2 border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                                <th className="py-2.5 px-1.5 w-8 text-center">
                                  <input
                                    type="checkbox"
                                    checked={displayedTransactions.length > 0 && selectedTxIds.size === displayedTransactions.length}
                                    onChange={handleToggleSelectAll}
                                    className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                                    title={selectedTxIds.size === displayedTransactions.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                  />
                                </th>
                                <th className="py-2.5 px-1.5 w-[114px]">Data</th>
                                <th className="py-2.5 px-2">Descrição</th>
                                <th className="py-2.5 px-1.5">Categoria</th>
                                <th className="py-2.5 px-1.5 text-center">Origem</th>
                                <th className="py-2.5 px-1.5 text-center">Tipo</th>
                                <th className="py-2.5 px-1.5 text-right">Valor</th>
                                <th className="py-2.5 px-1 w-14 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-bold">
                              {displayedTransactions.map((tx) => {
                                const isSelected = selectedTxIds.has(tx.id);
                                const isRowUncategorized = !tx.categoryId && tx.type !== 'TRANSFER' && tx.type !== 'INVOICE_PAYMENT';

                                return (
                                  <tr
                                    key={tx.id}
                                    className={`transition-colors group ${isSelected
                                      ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-l-[#026CD6]'
                                      : isRowUncategorized
                                        ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                                        : 'hover:bg-slate-50/90'
                                      }`}
                                  >
                                    <td className="py-2 px-1.5 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectTx(tx.id)}
                                        className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                                      />
                                    </td>
                                    <td className="py-2 px-1.5 whitespace-nowrap">
                                      <InlineDatePicker
                                        value={tx.accrualDate}
                                        onChange={(newDate) => handleInlineUpdateDate(tx, newDate)}
                                        disabled={inlineUpdatingTxId === tx.id}
                                      />
                                    </td>
                                    <td className="py-2 px-2 text-slate-800 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-extrabold text-xs truncate max-w-[130px] sm:max-w-[160px] lg:max-w-[180px]" title={tx.description}>
                                          {tx.description}
                                        </span>
                                        {(() => {
                                          const progress = getRecurringProgressInfo(tx);
                                          const isRec = Boolean(
                                            progress !== null ||
                                            (tx.notes && (
                                              tx.notes.includes('RECURRING_INCOME:') ||
                                              tx.notes.includes('RECURRING_EXPENSE:') ||
                                              tx.notes.includes('RECURRING_BILL:') ||
                                              tx.notes.includes('projetada automaticamente')
                                            )) ||
                                            (tx.recurringTotal && tx.recurringTotal > 1)
                                          );
                                          if (!isRec) return null;
                                          const isIncome = tx.type === 'INCOME';

                                          return (
                                            <span
                                              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 leading-none ${
                                                isIncome
                                                  ? 'text-emerald-700 bg-emerald-100/90 border border-emerald-300'
                                                  : 'text-rose-700 bg-rose-100/90 border border-rose-300'
                                              }`}
                                              title={progress ? progress.tooltip : (isIncome ? 'Renda Recorrente' : 'Despesa Recorrente')}
                                            >
                                              <Repeat className="w-2.5 h-2.5 stroke-[2.5] shrink-0" />
                                              <span className="whitespace-nowrap">Recorrente</span>
                                              {progress && (
                                                <>
                                                  <span className="opacity-40 font-normal select-none">•</span>
                                                  <span className="font-extrabold whitespace-nowrap">
                                                    {progress.badgeLabel}
                                                  </span>
                                                </>
                                              )}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      {(() => {
                                        const displayNotes = cleanTransactionNotes(tx.notes, tx.description);
                                        if (!displayNotes) return null;
                                        return (
                                          <span className="text-[10px] text-slate-400 font-normal truncate block max-w-[130px] sm:max-w-[160px] lg:max-w-[180px]" title={displayNotes}>
                                            {displayNotes}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                    <td className="py-2 px-1.5 whitespace-nowrap">
                                      <InlineCategorySelect
                                        currentCategoryId={tx.categoryId}
                                        categories={categories}
                                        disabled={inlineUpdatingTxId === tx.id}
                                        onSelectCategory={(newCatId) => handleInlineUpdateCategory(tx, newCatId)}
                                        onOpenCreateCategory={() => setQuickCategoryModal({ isOpen: true, targetTx: tx })}
                                      />
                                    </td>
                                    <td className="py-2 px-1.5 text-center whitespace-nowrap">
                                      {tx.origin === 'AI_TEXT' ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                          <Sparkles className="w-2.5 h-2.5" /> IA Texto
                                        </span>
                                      ) : tx.origin === 'AI_AUDIO' ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                                          <Mic className="w-2.5 h-2.5" /> IA Voz
                                        </span>
                                      ) : tx.origin === 'CSV_IMPORT' ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                          <FileSpreadsheet className="w-2.5 h-2.5 stroke-[2.5]" /> Fatura CSV
                                        </span>
                                      ) : tx.origin === 'OFX_IMPORT' ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                          <FileText className="w-2.5 h-2.5 stroke-[2.5]" /> Extrato OFX
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                          Manual
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-1.5 text-center whitespace-nowrap">
                                      {tx.type === 'INCOME' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                                          <ArrowUpRight className="h-3 w-3 stroke-[3]" /> Receita
                                        </span>
                                      )}
                                      {tx.type === 'EXPENSE' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black">
                                          <ArrowDownLeft className="h-3 w-3 stroke-[3]" /> Despesa
                                        </span>
                                      )}
                                      {tx.type === 'TRANSFER' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black">
                                          <ArrowLeftRight className="h-3 w-3 stroke-[3]" /> Transf.
                                        </span>
                                      )}
                                      {tx.type === 'INVOICE_PAYMENT' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                                          <DollarSign className="h-3 w-3 stroke-[3]" /> Fatura
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-1.5 text-right whitespace-nowrap">
                                      {privacyMode ? (
                                        <span className="font-numeric font-black text-slate-400 text-xs">••••••</span>
                                      ) : (
                                        <div className="inline-flex items-center justify-end gap-1 group/amt">
                                          <span className={`text-[11px] font-black select-none ${tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-rose-500'
                                            }`}>
                                            {tx.type === 'EXPENSE' ? '-' : (tx.type === 'INCOME' ? '+' : '')} R$
                                          </span>
                                          <InlineCurrencyInput
                                            initialValue={tx.amount}
                                            disabled={inlineUpdatingTxId === tx.id}
                                            onSave={(val) => handleInlineUpdateAmount(tx, val)}
                                            className={`w-20 text-right font-black text-xs font-numeric bg-slate-50/80 hover:bg-blue-50/60 focus:bg-white px-1.5 py-0.5 rounded-lg border border-slate-200/90 hover:border-blue-300 focus:border-[#026CD6] focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer shadow-2xs disabled:opacity-50 ${tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-slate-900'
                                              }`}
                                            title="Clique para alterar o valor (Enter para salvar)"
                                          />
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-2 px-1 text-center whitespace-nowrap">
                                      <div className="flex items-center justify-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => handleEditTransaction(tx)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-[#026CD6] hover:bg-blue-50 transition-colors"
                                          title="Editar movimentação"
                                        >
                                          <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRequestDeleteTransaction(tx.id)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          title="Excluir movimentação"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: ANÁLISE & ORÇAMENTOS */}
            {activeTab === 'analytics' && (
              <div id="tour-analytics-tab-content">
                <AnalyticsSection
                  analytics={analytics}
                  budgets={budgets}
                  onOpenBudgetModal={() => setBudgetModalOpen(true)}
                  onOpenAiBudgetModal={() => setAiBudgetModalOpen(true)}
                  globalLimit={effectiveGlobalLimit}
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
                />
              </div>
            )}

            {/* ABA 4: METAS DE ECONOMIA */}
            {activeTab === 'goals' && (
              <SavingsGoalsSection
                accounts={accounts}
                onDataChanged={loadFinancialData}
              />
            )}

          </div>

          {/* Pilares de Valor do Produto (Área Logada) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="card-duo p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900">Precisão ao Centavo</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Controle faturas de cartão, parcelas futuras e saldos bancários com exatidão matemática. Saiba exatamente onde cada real está, sem surpresas no fim do mês.
              </p>
            </div>

            <div className="card-duo p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#DDF4FF] border-2 border-[#BAE6FD] flex items-center justify-center text-[#1CB0F6] shadow-sm">
                <Layers className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900">Visão Real dos Seus Gastos</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Pagamentos de faturas e transferências não distorcem seu orçamento. Você enxerga seu consumo real de despesas sem duplicidades nem confusão contábil.
              </p>
            </div>

            <div className="card-duo p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#F5EBFF] border-2 border-[#E9D5FF] flex items-center justify-center text-[#CE82FF] shadow-sm">
                <Sparkles className="h-6 w-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900">Lançamento Ágil com I.A</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
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
              className="hover:text-[#026CD6] transition-colors"
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
              className="hover:text-[#026CD6] transition-colors"
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
              className="hover:text-[#026CD6] transition-colors"
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
                className="text-[#026CD6] hover:text-[#0A7DEF] hover:underline font-black transition-colors"
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
        onApplied={(appliedGlobalLimit) => {
          if (user?.id && appliedGlobalLimit && appliedGlobalLimit > 0) {
            const updated = saveSpendingLimitForMonth(user.id, selectedMonth, appliedGlobalLimit);
            setSpendingTimeline(updated);
            const res = resolveTimelineLimit(updated, selectedMonth);
            setSpendingResolution(res);
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
                <div className="p-2.5 rounded-2xl bg-blue-50 text-[#026CD6] border border-blue-200 shadow-xs">
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
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#026CD6] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2.5 text-left">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-black">
                  <Repeat className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {singleTx.notes.includes('RECURRING_INCOME:') ? 'Renda Recorrente Detectada' : (singleTx.notes.includes('RECURRING_BILL:') ? 'Custo Fixo Recorrente Detectado' : 'Despesa Recorrente Detectada')}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white/60 hover:bg-white border border-amber-200/70 transition-colors">
                    <input
                      type="radio"
                      name="deleteScope"
                      checked={!deleteConfirmState.deleteFutureRecurring}
                      onChange={() => setDeleteConfirmState((prev) => ({ ...prev, deleteFutureRecurring: false }))}
                      className="text-[#026CD6] focus:ring-[#026CD6] accent-[#026CD6]"
                    />
                    <span>Excluir apenas o lançamento deste mês</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white/60 hover:bg-white border border-amber-200/70 transition-colors">
                    <input
                      type="radio"
                      name="deleteScope"
                      checked={!!deleteConfirmState.deleteFutureRecurring}
                      onChange={() => setDeleteConfirmState((prev) => ({ ...prev, deleteFutureRecurring: true }))}
                      className="text-rose-600 focus:ring-rose-500 accent-rose-600"
                    />
                    <span className="text-rose-700 font-extrabold">Excluir este e todos os meses futuros</span>
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
