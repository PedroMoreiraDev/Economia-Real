import React, { useEffect, useState, useCallback } from 'react';
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
  Wallet,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard as CardIcon,
  ShoppingBag,
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
  Calendar
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import { TransactionModal } from './components/TransactionModal';
import { CreditCardModal } from './components/CreditCardModal';
import { CreditCardPurchaseModal } from './components/CreditCardPurchaseModal';
import { PayInvoiceModal } from './components/PayInvoiceModal';
import { ImportModal } from './components/ImportModal';
import { AiTransactionModal } from './components/AiTransactionModal';
import { AnalyticsSection } from './components/AnalyticsSection';
import { BudgetModal } from './components/BudgetModal';
import { AiBudgetSuggestionModal } from './components/AiBudgetSuggestionModal';
import { RecurringBillsSection } from './components/RecurringBillsSection';
import { SavingsGoalsSection } from './components/SavingsGoalsSection';
import { exportTransactionsCsvApi } from './services/goalApi';
import { 
  Account, 
  Category, 
  Transaction, 
  TransactionType,
  FinancialSummary 
} from './types/financial';
import { 
  CreditCard, 
  CreditCardInvoice 
} from './types/card';
import { BudgetProgressDto } from './types/budget';
import { AnalyticsOverview } from './types/analytics';
import { 
  fetchAccountsApi, 
  fetchCategoriesApi, 
  fetchTransactionsApi, 
  fetchSummaryApi,
  deleteTransactionApi,
  deleteBatchTransactionsApi 
} from './services/financialApi';
import { 
  fetchCreditCardsApi, 
  fetchInvoicesApi 
} from './services/cardApi';
import { fetchBudgetsApi, deleteBudgetApi } from './services/budgetApi';
import { fetchAnalyticsOverviewApi } from './services/analyticsApi';

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

type TabType = 'overview' | 'analytics' | 'recurring' | 'goals' | 'cards';

const MainDashboard: React.FC = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const firstName = user?.fullName?.trim().split(' ')[0] || '';
  
  // Abas de navegação estilo Duolingo
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Navegação de Mês e Filtros Temporais Globais
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthStr());
  const [txFilterMode, setTxFilterMode] = useState<'month' | 'all'>('month');

  // Modais
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState<boolean>(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false);
  const [payInvoiceModalOpen, setPayInvoiceModalOpen] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<CreditCardInvoice | null>(null);
  const [selectedCardName, setSelectedCardName] = useState<string>('');
  const [initialTransactionType, setInitialTransactionType] = useState<TransactionType>('EXPENSE');
  const [aiBudgetModalOpen, setAiBudgetModalOpen] = useState<boolean>(false);

  // Meta global de gastos (Teto Mensal) - Isolado estritamente por ID de usuário (RULE[security_isolation])
  const [globalSpendingLimit, setGlobalSpendingLimit] = useState<number>(0);
  const [spendingLimitDisabled, setSpendingLimitDisabled] = useState<boolean>(false);
  const [isEditingLimit, setIsEditingLimit] = useState<boolean>(false);
  const [tempLimitInput, setTempLimitInput] = useState<string>('');

  // Seleção múltipla para exclusão em massa de transações
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState<boolean>(false);

  // Sincroniza o teto de gastos exclusivo para o usuário autenticado ativo
  useEffect(() => {
    // Remove chave legada global se existir no navegador para evitar vazamento
    if (localStorage.getItem('economia_real_spending_limit')) {
      localStorage.removeItem('economia_real_spending_limit');
    }

    if (user?.id) {
      const isDisabled = localStorage.getItem(`economia_real_spending_limit_disabled_${user.id}`) === 'true';
      setSpendingLimitDisabled(isDisabled);

      const saved = localStorage.getItem(`economia_real_spending_limit_${user.id}`);
      setGlobalSpendingLimit(saved ? parseFloat(saved) : 0);
    } else {
      setGlobalSpendingLimit(0);
      setSpendingLimitDisabled(false);
      setSelectedTxIds(new Set());
    }
  }, [user?.id]);

  // Dados financeiros
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [invoicesByCard, setInvoicesByCard] = useState<Record<string, CreditCardInvoice[]>>({});
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

  const loadFinancialData = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const { startDate, endDate } = getMonthRange(selectedMonth);
      const monthParam = `${selectedMonth}-01`;

      const [accs, cats, txs, sum, cards, bgs, anls] = await Promise.all([
        fetchAccountsApi(token),
        fetchCategoriesApi(token),
        fetchTransactionsApi(token),
        fetchSummaryApi(token, startDate, endDate),
        fetchCreditCardsApi(token),
        fetchBudgetsApi(token, monthParam),
        fetchAnalyticsOverviewApi(token, monthParam),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setSummary(sum);
      setCreditCards(cards);
      setBudgets(bgs);
      setAnalytics(anls);

      // Carrega faturas dos cartões
      const invoicesMap: Record<string, CreditCardInvoice[]> = {};
      for (const card of cards) {
        try {
          const invs = await fetchInvoicesApi(token, card.id);
          invoicesMap[card.id] = invs;
        } catch {
          invoicesMap[card.id] = [];
        }
      }
      setInvoicesByCard(invoicesMap);
    } catch (err) {
      console.warn('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token, selectedMonth]);

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
      setInvoicesByCard({});
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

  const handleOpenPayInvoice = (invoice: CreditCardInvoice, cardName: string) => {
    setSelectedInvoice(invoice);
    setSelectedCardName(cardName);
    setPayInvoiceModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!token) return;
    if (window.confirm('Deseja excluir o registro selecionado?')) {
      try {
        await deleteTransactionApi(token, id);
        setSelectedTxIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadFinancialData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Erro ao excluir movimentação.');
      }
    }
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

  // Transações exibidas de acordo com o filtro (mês selecionado ou todas)
  const displayedTransactions = txFilterMode === 'month'
    ? transactions.filter((t) => t.accrualDate && t.accrualDate.startsWith(selectedMonth))
    : transactions;

  const monthTransactionsCount = transactions.filter(
    (t) => t.accrualDate && t.accrualDate.startsWith(selectedMonth)
  ).length;

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

  const handleDeleteSelected = async () => {
    if (!token || selectedTxIds.size === 0) return;
    const count = selectedTxIds.size;
    const confirmMessage = count === 1
      ? 'Deseja excluir o registro selecionado?'
      : `Deseja excluir os ${count} registros selecionados?`;

    if (window.confirm(confirmMessage)) {
      try {
        setDeletingBatch(true);
        const ids = Array.from(selectedTxIds);
        await deleteBatchTransactionsApi(token, ids);
        setSelectedTxIds(new Set());
        await loadFinancialData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Erro ao excluir movimentações selecionadas.');
      } finally {
        setDeletingBatch(false);
      }
    }
  };

  // Limite global efetivo (soma das metas ou teto manual)
  const totalBudgetFromCategories = budgets.reduce((acc, b) => acc + (b.monthlyLimit || 0), 0);
  const effectiveGlobalLimit = spendingLimitDisabled
    ? 0
    : (globalSpendingLimit > 0 ? globalSpendingLimit : totalBudgetFromCategories);

  const handleSaveGlobalLimit = () => {
    const parsed = parseFloat(tempLimitInput);
    if (!isNaN(parsed) && parsed > 0) {
      setGlobalSpendingLimit(parsed);
      setSpendingLimitDisabled(false);
      if (user?.id) {
        localStorage.setItem(`economia_real_spending_limit_${user.id}`, parsed.toString());
        localStorage.removeItem(`economia_real_spending_limit_disabled_${user.id}`);
      }
      setIsEditingLimit(false);
    } else {
      handleRemoveGlobalLimit();
    }
  };

  const handleRemoveGlobalLimit = async () => {
    setGlobalSpendingLimit(0);
    setSpendingLimitDisabled(true);
    if (user?.id) {
      localStorage.removeItem(`economia_real_spending_limit_${user.id}`);
      localStorage.setItem(`economia_real_spending_limit_disabled_${user.id}`, 'true');
    }

    // Remove também quaisquer metas/orçamentos cadastrados no backend para o mês atual
    if (token && budgets.length > 0) {
      try {
        const toDelete = budgets.filter((b) => !!b.id);
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
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 flex flex-col font-sans">
      
      {/* Top Header Economia Real (Clean, Sofisticado com Borda Inferior e Acento Azul) */}
      <header className="bg-white border-b-2 border-slate-200/90 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo e Nome da Plataforma */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-economia-real.png"
              alt="Economia Real Logo"
              className="h-12 w-12 rounded-2xl object-cover border-2 border-blue-200 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Economia<span className="text-[#026CD6]">Real</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200 uppercase">
                  Inteligência Artificial 🎩
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold hidden sm:block">
                Economia real, utilizando inteligência artificial para te fazer economizar de verdade
              </p>
            </div>
          </div>

          {/* Área Direita: Perfil e Autenticação */}
          <div className="flex items-center gap-3">
            {/* Autenticação / Perfil do Usuário */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-50 border-2 border-blue-200 text-xs">
                  <div className="h-7 w-7 rounded-xl bg-[#026CD6] border-b-2 border-[#0153AB] text-white font-black flex items-center justify-center text-xs shadow-sm">
                    {user.fullName ? user.fullName.substring(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="font-extrabold text-slate-800 leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-blue-700 font-bold leading-tight">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 border-rose-200"
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
        
        {/* Banner Destaque Economia Real (Azul Suave, Moderno e Confiável) */}
        <div className="card-real-blue p-6 sm:p-8 relative overflow-hidden">
          <div className="max-w-2xl lg:max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border-2 border-blue-200 text-[#026CD6] text-xs font-black shadow-sm uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 fill-blue-400" />
              {isAuthenticated ? 'Painel de Controle Financeiro' : 'Sua Plataforma Financeira Inteligente'}
            </div>
            
            {isAuthenticated ? (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Olá{firstName ? `, ${firstName}` : ''}! <span className="text-[#026CD6] underline decoration-blue-300 decoration-4">Pronto para organizar suas contas? Vamos começar!</span> 🎩✨
              </h1>
            ) : (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Economia real, utilizando inteligência artificial <span className="text-[#026CD6] underline decoration-blue-300 decoration-4">para te fazer economizar de verdade</span> 🎩✨
              </h1>
            )}
            
            <p className="text-slate-700 text-sm sm:text-base font-bold leading-relaxed">
              {isAuthenticated
                ? 'Monitore seu fluxo de caixa, planeje seus lançamentos e acompanhe suas metas com precisão e suporte de IA.'
                : 'Monitore seu fluxo de caixa, planeje parcelas do cartão sem surpresas e alcance suas metas financeiras com precisão determinística e suporte de IA.'}
            </p>

            {/* Ações Rápidas em Destaque */}
            {isAuthenticated && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setTransactionModalOpen(true)}
                  className="btn-duo btn-duo-green text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Novo Lançamento
                </button>

                <button
                  onClick={() => setAiModalOpen(true)}
                  className="btn-duo btn-duo-purple text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Falar com a IA (Voz/Texto)
                </button>

                <button
                  onClick={() => setImportModalOpen(true)}
                  className="btn-duo btn-duo-white text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2"
                >
                  <UploadCloud className="h-4 w-4 text-[#0284C7]" />
                  Importar Extrato
                </button>

                <button
                  onClick={handleExportCsv}
                  disabled={transactions.length === 0 || exportingCsv}
                  className="btn-duo btn-duo-white text-xs sm:text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  title="Exportar para Excel em CSV formatado"
                >
                  <Download className={`h-4 w-4 text-blue-600 ${exportingCsv ? 'animate-bounce' : ''}`} />
                  {exportingCsv ? 'Gerando...' : 'Exportar Planilha'}
                </button>
              </div>
            )}
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

        {isAuthenticated && user ? (
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
              <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5"
                  title="Voltar para o mês anterior"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[3] text-slate-600" />
                  <span className="hidden sm:inline">Mês Anterior</span>
                </button>

                {/* Input de Seleção Direta de Mês / Ano */}
                <div className="relative flex items-center">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={handleSelectMonthInput}
                    aria-label="Escolher mês e ano de referência"
                    className="btn-duo btn-duo-white text-xs font-black px-3 py-1.5 cursor-pointer text-slate-700 hover:text-[#026CD6] border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-[#026CD6]"
                    title="Clique para escolher qualquer mês e ano diretamente"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="btn-duo btn-duo-white text-xs px-3 py-2 flex items-center gap-1.5"
                  title="Avançar para o próximo mês"
                >
                  <span className="hidden sm:inline">Próximo Mês</span>
                  <ChevronRight className="h-4 w-4 stroke-[3] text-slate-600" />
                </button>

                {!isCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleCurrentMonth}
                    className="btn-duo btn-duo-blue text-xs px-3.5 py-2 flex items-center gap-1.5 animate-fadeIn"
                    title="Voltar para o mês atual"
                  >
                    <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Mês Atual</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* 4 Cards de Métricas Principais (KPIs com Relevo 3D Estilo Duolingo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Receitas Totais */}
              <div className="card-duo p-5 space-y-2 hover:border-[#58CC02] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Entradas
                  </span>
                  <div className="h-10 w-10 rounded-2xl bg-[#E8F8E8] border-2 border-[#D7FFB8] text-[#58CC02] flex items-center justify-center shadow-sm">
                    <ArrowUpRight className="h-5 w-5 stroke-[3]" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#46A302] tracking-tight">
                  {formatBRL(summary.totalIncome)}
                </p>
                <p className="text-xs font-bold text-slate-400">Total recebido no período</p>
              </div>

              {/* Despesas de Consumo */}
              <div className="card-duo p-5 space-y-2 hover:border-rose-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Despesas
                  </span>
                  <div className="h-10 w-10 rounded-2xl bg-[#FFEAEA] border-2 border-[#FFDFDF] text-[#FF4B4B] flex items-center justify-center shadow-sm">
                    <ArrowDownLeft className="h-5 w-5 stroke-[3]" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[#FF4B4B] tracking-tight">
                  {formatBRL(summary.totalExpense)}
                </p>
                <p className="text-xs font-bold text-slate-400">Consumo real sem duplicidade</p>
              </div>

              {/* Disponível para Gastar / Meta de Gastos (substitui Economia conforme meta) */}
              <div className="card-duo p-5 space-y-2 hover:border-[#1CB0F6] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    {effectiveGlobalLimit > 0 ? 'Disponível no Mês' : 'Economia'}
                  </span>
                  <div className={`h-10 w-10 rounded-2xl border-2 flex items-center justify-center shadow-sm ${
                    effectiveGlobalLimit > 0
                      ? effectiveGlobalLimit - summary.totalExpense >= 0
                        ? 'bg-[#DDF4FF] border-[#BAE6FD] text-[#1CB0F6]'
                        : 'bg-[#FFEAEA] border-[#FFDFDF] text-[#FF4B4B]'
                      : 'bg-[#DDF4FF] border-[#BAE6FD] text-[#1CB0F6]'
                  }`}>
                    {effectiveGlobalLimit > 0 ? (
                      <Target className="h-5 w-5 stroke-[3]" />
                    ) : (
                      <TrendingUp className="h-5 w-5 stroke-[3]" />
                    )}
                  </div>
                </div>
                {effectiveGlobalLimit > 0 ? (
                  <>
                    <p className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      effectiveGlobalLimit - summary.totalExpense >= 0 ? 'text-[#1899D6]' : 'text-[#EA2B2B]'
                    }`}>
                      {formatBRL(effectiveGlobalLimit - summary.totalExpense)}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      {effectiveGlobalLimit - summary.totalExpense >= 0
                        ? `Restam da meta de ${formatBRL(effectiveGlobalLimit)}`
                        : `⚠️ Meta estourada em ${formatBRL(Math.abs(effectiveGlobalLimit - summary.totalExpense))}`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      (summary.totalIncome - summary.totalExpense) >= 0 ? 'text-[#1899D6]' : 'text-amber-600'
                    }`}>
                      {formatBRL(summary.totalIncome - summary.totalExpense)}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      Defina sua meta no painel ao lado
                    </p>
                  </>
                )}
              </div>

              {/* Saldo Total: Entradas menos Despesas */}
              <div className="card-duo p-5 space-y-2 hover:border-amber-400 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Saldo Total
                  </span>
                  <div className="h-10 w-10 rounded-2xl bg-[#FFF5D1] border-2 border-[#FDE68A] text-[#FF9600] flex items-center justify-center shadow-sm">
                    <Wallet className="h-5 w-5 stroke-[3]" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  (summary.totalIncome - summary.totalExpense) >= 0 ? 'text-slate-900' : 'text-[#EA2B2B]'
                }`}>
                  {formatBRL(summary.totalIncome - summary.totalExpense)}
                </p>
                <p className="text-xs font-bold text-slate-400">
                  Receitas menos despesas do período
                </p>
              </div>
            </div>

            {/* Abas de Navegação Estilo Duolingo (Pílulas Táteis 3D) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`btn-duo text-xs sm:text-sm px-4 py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'btn-duo-green'
                    : 'btn-duo-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Extrato & Contas</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`btn-duo text-xs sm:text-sm px-4 py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'btn-duo-green'
                    : 'btn-duo-white'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Gráficos & Orçamento</span>
              </button>

              <button
                onClick={() => setActiveTab('recurring')}
                className={`btn-duo text-xs sm:text-sm px-4 py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'recurring'
                    ? 'btn-duo-green'
                    : 'btn-duo-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Despesas Fixas</span>
              </button>

              <button
                onClick={() => setActiveTab('goals')}
                className={`btn-duo text-xs sm:text-sm px-4 py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'goals'
                    ? 'btn-duo-green'
                    : 'btn-duo-white'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Metas de Economia</span>
              </button>

              <button
                onClick={() => setActiveTab('cards')}
                className={`btn-duo text-xs sm:text-sm px-4 py-2.5 rounded-2xl whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'cards'
                    ? 'btn-duo-green'
                    : 'btn-duo-white'
                }`}
              >
                <CardIcon className="w-4 h-4" />
                <span>Cartões de Crédito ({creditCards.length})</span>
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
                          <ArrowUpRight className="h-5 w-5 text-[#46A302] stroke-[3]" />
                          Minhas Entradas
                        </h2>
                        <span className="text-xs font-bold text-slate-400">
                          {formatBRL(summary.totalIncome)} recebidos no mês
                        </span>
                      </div>
                      <button
                        onClick={handleOpenNewIncome}
                        className="btn-duo btn-duo-green text-xs px-3 py-1.5 flex items-center gap-1 shadow-sm"
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
                            className="btn-duo btn-duo-green text-xs px-3 py-1.5"
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
                              className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-between"
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
                                <span className="text-xs font-black text-[#46A302]">
                                  + {formatBRL(tx.amount)}
                                </span>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTransaction(tx)}
                                    className="p-1 text-slate-400 hover:text-[#1CB0F6] rounded-lg transition"
                                    title="Editar entrada"
                                  >
                                    <Pencil className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="p-1 text-slate-400 hover:text-[#EA2B2B] rounded-lg transition"
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
                  <div className="card-duo p-6 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#026CD6] stroke-[2.5]" />
                        <div>
                          <h2 className="text-base font-black text-slate-800">
                            Teto Máximo de Gastos
                          </h2>
                          <span className="text-xs font-bold text-slate-400">
                            Meta global para este mês
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
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={tempLimitInput}
                          onChange={(e) => setTempLimitInput(e.target.value)}
                          placeholder="Ex: 3500.00 (ou 0 para remover)"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-none focus:border-[#026CD6]"
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
                            <span className="text-2xl font-black text-slate-900">
                              {formatBRL(effectiveGlobalLimit)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-400 block uppercase">Gasto Atual</span>
                            <span className={`text-base font-black ${
                              summary.totalExpense > effectiveGlobalLimit ? 'text-[#EA2B2B]' : 'text-slate-800'
                            }`}>
                              {formatBRL(summary.totalExpense)}
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
                              className={`progress-duo-fill ${
                                summary.totalExpense >= effectiveGlobalLimit
                                  ? 'bg-[#FF4B4B]'
                                  : summary.totalExpense >= effectiveGlobalLimit * 0.85
                                  ? 'bg-[#FF9600]'
                                  : 'bg-[#58CC02]'
                              }`}
                              style={{
                                width: `${Math.min(100, (summary.totalExpense / effectiveGlobalLimit) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[11px] font-black pt-1">
                            {effectiveGlobalLimit - summary.totalExpense >= 0 ? (
                              <span className="text-[#388302] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Restam {formatBRL(effectiveGlobalLimit - summary.totalExpense)} para gastar este mês
                              </span>
                            ) : (
                              <span className="text-[#EA2B2B] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Teto estourado em {formatBRL(Math.abs(effectiveGlobalLimit - summary.totalExpense))}
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
                            className="btn-duo btn-duo-green text-xs px-3 py-1.5 w-full sm:w-auto"
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
                <div className="lg:col-span-2 card-duo p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-[#1CB0F6]" />
                        <h2 className="text-base font-black text-slate-800">
                          Extrato de Movimentações
                        </h2>
                      </div>
                      
                      {/* Pílulas de Alternância de Filtro: Mês Selecionado vs Todas */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setTxFilterMode('month')}
                          className={`btn-duo text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                            txFilterMode === 'month'
                              ? 'btn-duo-blue font-black'
                              : 'btn-duo-white font-bold text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{formatMonthLabel(selectedMonth)} ({monthTransactionsCount})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTxFilterMode('all')}
                          className={`btn-duo text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all ${
                            txFilterMode === 'all'
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
                        onClick={loadFinancialData}
                        disabled={loadingData}
                        className="btn-duo btn-duo-white text-xs px-2.5 py-1.5"
                        title="Atualizar lançamentos"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          setEditingTransaction(null);
                          setTransactionModalOpen(true);
                        }}
                        className="btn-duo btn-duo-green text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[3]" />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Barra Contextual de Ações em Massa */}
                  {selectedTxIds.size > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/90 border-2 border-blue-200 shadow-sm animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-[#026CD6] text-white text-xs font-black flex items-center justify-center shadow-xs">
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

                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        disabled={deletingBatch}
                        className="btn-duo btn-duo-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 shadow-sm disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{deletingBatch ? 'Excluindo...' : `Excluir selecionados (${selectedTxIds.size})`}</span>
                      </button>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    {displayedTransactions.length === 0 ? (
                      <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
                        <p className="text-xs font-bold text-slate-400">
                          {txFilterMode === 'month'
                            ? `Nenhuma movimentação registrada em ${formatMonthLabel(selectedMonth)}.`
                            : 'Nenhuma movimentação registrada.'}
                        </p>
                        <button
                          onClick={() => {
                            setEditingTransaction(null);
                            setTransactionModalOpen(true);
                          }}
                          className="btn-duo btn-duo-green text-xs px-4 py-2"
                        >
                          Registrar Primeiro Lançamento
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b-2 border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={displayedTransactions.length > 0 && selectedTxIds.size === displayedTransactions.length}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                                title={selectedTxIds.size === displayedTransactions.length ? 'Desmarcar todos' : 'Selecionar todos'}
                              />
                            </th>
                            <th className="py-3 px-3">Data</th>
                            <th className="py-3 px-3">Descrição</th>
                            <th className="py-3 px-3">Categoria</th>
                            <th className="py-3 px-3">Origem</th>
                            <th className="py-3 px-3">Tipo</th>
                            <th className="py-3 px-3 text-right">Valor</th>
                            <th className="py-3 px-3 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                          {displayedTransactions.map((tx) => {
                            const cat = categories.find((c) => c.id === tx.categoryId);
                            const isOtherOrUnassigned = !cat || cat.name.trim().toLowerCase() === 'outros';
                            const isSelected = selectedTxIds.has(tx.id);

                            return (
                              <tr 
                                key={tx.id} 
                                className={`transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-l-[#026CD6]' 
                                    : 'hover:bg-slate-50/80'
                                }`}
                              >
                                <td className="py-3.5 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectTx(tx.id)}
                                    className="w-4 h-4 rounded border-2 border-slate-300 text-[#026CD6] focus:ring-[#026CD6] cursor-pointer accent-[#026CD6]"
                                  />
                                </td>
                                <td className="py-3.5 px-3 text-slate-500 font-semibold font-mono">
                                  {tx.accrualDate}
                                </td>
                                <td className="py-3.5 px-3 text-slate-800">
                                  <div className="font-extrabold">{tx.description}</div>
                                  {tx.notes && (
                                    <span className="text-[10px] text-slate-400 font-normal">{tx.notes}</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  {isOtherOrUnassigned ? (
                                    <button
                                      type="button"
                                      onClick={() => handleEditTransaction(tx)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black shadow-xs transition-all cursor-pointer group"
                                      title="Categoria pendente de conferência. Clique para alterar manualmente!"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 animate-pulse stroke-[2.5]" />
                                      <span>{cat ? cat.name : 'Outros'}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-200/90 text-amber-950 rounded-md font-black uppercase tracking-wider group-hover:bg-amber-300">
                                        Editar
                                      </span>
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border"
                                      style={{
                                        backgroundColor: cat.colorHex ? `${cat.colorHex}15` : '#f1f5f9',
                                        color: cat.colorHex || '#334155',
                                        borderColor: cat.colorHex ? `${cat.colorHex}40` : '#cbd5e1',
                                      }}
                                    >
                                      <Tag className="w-3 h-3 stroke-[2.5]" />
                                      {cat.name}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  {tx.origin === 'AI_TEXT' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-full">
                                      <Sparkles className="w-2.5 h-2.5" /> IA Texto
                                    </span>
                                  ) : tx.origin === 'AI_AUDIO' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                      <Mic className="w-2.5 h-2.5" /> IA Voz
                                    </span>
                                  ) : tx.origin === 'CSV_IMPORT' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                      <FileSpreadsheet className="w-2.5 h-2.5 stroke-[2.5]" /> Fatura CSV
                                    </span>
                                  ) : tx.origin === 'OFX_IMPORT' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                      <FileText className="w-2.5 h-2.5 stroke-[2.5]" /> Extrato OFX
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                      Manual
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  {tx.type === 'INCOME' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F8E8] text-[#388302] border border-[#D7FFB8] text-[10px] font-black">
                                      <ArrowUpRight className="h-3 w-3 stroke-[3]" /> Receita
                                    </span>
                                  )}
                                  {tx.type === 'EXPENSE' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFEAEA] text-[#EA2B2B] border border-[#FFDFDF] text-[10px] font-black">
                                      <ArrowDownLeft className="h-3 w-3 stroke-[3]" /> Despesa
                                    </span>
                                  )}
                                  {tx.type === 'TRANSFER' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DDF4FF] text-[#1899D6] border border-[#BAE6FD] text-[10px] font-black">
                                      <ArrowLeftRight className="h-3 w-3 stroke-[3]" /> Transf.
                                    </span>
                                  )}
                                  {tx.type === 'INVOICE_PAYMENT' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black">
                                      <DollarSign className="h-3 w-3 stroke-[3]" /> Fatura
                                    </span>
                                  )}
                                </td>
                                <td className={`py-3.5 px-3 text-right font-black text-sm ${
                                  tx.type === 'INCOME' ? 'text-[#46A302]' : 'text-slate-800'
                                }`}>
                                  {tx.type === 'EXPENSE' ? `- ${formatBRL(tx.amount)}` : formatBRL(tx.amount)}
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditTransaction(tx)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-[#1CB0F6] hover:bg-slate-100 transition-colors"
                                      title="Editar movimentação"
                                    >
                                      <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTransaction(tx.id)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-[#EA2B2B] hover:bg-red-50 transition-colors"
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
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: ANÁLISE & ORÇAMENTOS */}
            {activeTab === 'analytics' && (
              <AnalyticsSection
                analytics={analytics}
                budgets={budgets}
                onOpenBudgetModal={() => setBudgetModalOpen(true)}
                onOpenAiBudgetModal={() => setAiBudgetModalOpen(true)}
                globalLimit={effectiveGlobalLimit}
              />
            )}

            {/* ABA 3: DESPESAS RECORRENTES */}
            {activeTab === 'recurring' && (
              <RecurringBillsSection
                categories={categories}
                accounts={accounts}
                creditCards={creditCards}
                selectedMonth={selectedMonth}
                onDataChanged={loadFinancialData}
              />
            )}

            {/* ABA 4: METAS DE ECONOMIA */}
            {activeTab === 'goals' && (
              <SavingsGoalsSection
                accounts={accounts}
                onDataChanged={loadFinancialData}
              />
            )}

            {/* ABA 5: CARTÕES DE CRÉDITO */}
            {activeTab === 'cards' && (
              <div className="card-duo p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <CardIcon className="h-6 w-6 text-[#1CB0F6]" />
                      Cartões de Crédito & Faturas Mensais
                    </h2>
                    <p className="text-xs font-bold text-slate-400">
                      Acompanhe limites, datas de fechamento e compras parceladas de 1x até 48x
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCardModalOpen(true)}
                      className="btn-duo btn-duo-white text-xs px-4 py-2 flex items-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Cartão
                    </button>
                    <button
                      onClick={() => setPurchaseModalOpen(true)}
                      disabled={creditCards.length === 0}
                      className="btn-duo btn-duo-blue text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Lançar Compra Parcelada
                    </button>
                  </div>
                </div>

                {creditCards.length === 0 ? (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-400">Nenhum cartão de crédito cadastrado.</p>
                    <button
                      onClick={() => setCardModalOpen(true)}
                      className="btn-duo btn-duo-green text-xs px-4 py-2"
                    >
                      Cadastrar Primeiro Cartão
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creditCards.map((card) => {
                      const cardInvoices = invoicesByCard[card.id] || [];
                      return (
                        <div
                          key={card.id}
                          className="rounded-3xl bg-white border-2 border-slate-200/90 shadow-[0_4px_0_0_#E2E8F0] p-6 space-y-4 hover:border-[#1CB0F6] transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-black text-slate-900 text-lg">{card.name}</h3>
                              <p className="text-xs font-bold text-slate-400">
                                Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                              </p>
                            </div>
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E8F8E8] text-[#388302] border border-[#D7FFB8]">
                              Ativo
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Limite de Crédito
                            </span>
                            <p className="text-xl font-black text-slate-900">
                              {formatBRL(card.creditLimit)}
                            </p>
                          </div>

                          {/* Faturas deste cartão */}
                          <div className="space-y-2">
                            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Faturas</p>
                            {cardInvoices.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Nenhuma fatura gerada para este cartão.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {cardInvoices.map((inv) => (
                                  <div
                                    key={inv.id}
                                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <p className="font-extrabold text-slate-800">Ref. {inv.referenceMonth}</p>
                                      <span className="text-[10px] font-bold text-slate-400">Vence em {inv.dueDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                        inv.status === 'PAID'
                                          ? 'bg-[#E8F8E8] text-[#388302] border-[#D7FFB8]'
                                          : 'bg-amber-100 text-amber-800 border-amber-200'
                                      }`}>
                                        {inv.status === 'PAID' ? 'Paga 🎉' : inv.status}
                                      </span>
                                      {inv.status !== 'PAID' && (
                                        <button
                                          onClick={() => handleOpenPayInvoice(inv, card.name)}
                                          className="btn-duo btn-duo-yellow text-[10px] px-2.5 py-1"
                                        >
                                          Pagar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* Estado Não Autenticado (Acolhedor e Amigável) */
          <div className="card-duo p-10 text-center space-y-5 max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-blue-50 border-2 border-blue-200 text-[#026CD6] shadow-sm mx-auto mb-1">
              <ShieldCheck className="h-8 w-8 stroke-[2.2]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Bem-vindo à Economia Real!</h2>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Economia real, utilizando inteligência artificial para te fazer economizar de verdade.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setAuthModalOpen(true);
                }}
                className="btn-duo btn-duo-green text-sm px-6 py-3"
              >
                Entrar na Minha Conta
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('register');
                  setAuthModalOpen(true);
                }}
                className="btn-duo btn-duo-white text-sm px-6 py-3"
              >
                Criar Conta Grátis
              </button>
            </div>
          </div>
        )}

        {/* Pilares de Rigor e Qualidade (Cards Limpos com Ícones Coloridos) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="card-duo p-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-[#026CD6] shadow-sm">
              <CheckCircle2 className="h-6 w-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">85 Testes Validados</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Cálculos em BigDecimal sem float/double, precisão monetária determinística e divisão de centavo na 1ª parcela.
            </p>
          </div>

          <div className="card-duo p-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-[#DDF4FF] border-2 border-[#BAE6FD] flex items-center justify-center text-[#1CB0F6] shadow-sm">
              <Layers className="h-6 w-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Sem Dupla Contagem</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              O pagamento de faturas e transferências não polui o consumo primário nem distorce seus relatórios contábeis.
            </p>
          </div>

          <div className="card-duo p-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-[#F5EBFF] border-2 border-[#E9D5FF] flex items-center justify-center text-[#CE82FF] shadow-sm">
              <Sparkles className="h-6 w-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Inteligência Amigável</h3>
            <p className="text-xs font-bold text-slate-500 leading-relaxed">
              Entrada por áudio e texto com sanitização de dados LGPD e fallback offline determinístico via regras.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Limpo e Amigável */}
      <footer className="border-t-2 border-slate-200 bg-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <p className="flex items-center gap-1.5">
            <span className="text-slate-700 font-black">💼 Economia Real</span> • <span>Inteligência Financeira e Previsibilidade Patrimonial</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Spring Boot 3.3.5</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">React 18</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">PostgreSQL 16</span>
          </p>
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
        onAccountCreated={loadFinancialData}
      />

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        accounts={accounts}
        categories={categories}
        onTransactionCreated={loadFinancialData}
        transactionToEdit={editingTransaction}
        initialType={initialTransactionType}
        defaultDate={defaultTxDate}
      />

      <CreditCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onCardCreated={loadFinancialData}
      />

      <CreditCardPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        cards={creditCards}
        categories={categories}
        onPurchaseCreated={loadFinancialData}
      />

      <PayInvoiceModal
        isOpen={payInvoiceModalOpen}
        onClose={() => setPayInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        cardName={selectedCardName}
        accounts={accounts}
        onInvoicePaid={loadFinancialData}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        accounts={accounts}
        onImportCompleted={loadFinancialData}
      />

      <AiTransactionModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        accounts={accounts}
        categories={categories}
        onTransactionCreated={loadFinancialData}
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
        onApplied={loadFinancialData}
        monthReference={`${selectedMonth}-01`}
      />
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
