import React from 'react';
import {
  Receipt,
  Calendar,
  RefreshCw,
  Plus,
  Search,
  X,
  Tag,
  Trash2,
  Mic,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  DollarSign,
  Repeat,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { Transaction, Category } from '../../types/financial';
import { CategoryFilterDropdown } from '../CategoryFilterDropdown';
import { InlineDatePicker } from '../InlineDatePicker';
import { InlineCategorySelect } from '../InlineCategorySelect';
import { InlineCurrencyInput } from '../CurrencyInput';
import { cleanTransactionNotes } from '../../utils/recurringNotes';

export interface RecurringProgressInfo {
  current: number;
  total: number;
  remaining: number;
  badgeLabel: string;
  tooltip: string;
}

export function getRecurringProgressInfo(tx: Transaction): RecurringProgressInfo | null {
  let current = tx.recurringCurrent;
  let total = tx.recurringTotal;
  let remaining = tx.recurringRemaining;

  // Fallback 1: se não veio preenchido do backend, tenta extrair da descrição
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

export interface StatementTableProps {
  transactions: Transaction[];
  displayedTransactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  monthTransactionsCount: number;
  loadingData: boolean;
  privacyMode: boolean;
  formatMonthLabel: (month: string) => string;

  // Filtros
  txFilterMode: 'month' | 'all';
  onTxFilterModeChange: (mode: 'month' | 'all') => void;
  onRefreshData: () => void;
  onAddNewTransaction: () => void;

  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  showOnlyUncategorized: boolean;
  onShowOnlyUncategorizedChange: (val: boolean) => void;
  uncategorizedCount: number;
  typeFilter: 'ALL' | 'INCOME' | 'EXPENSE';
  onTypeFilterChange: (type: 'ALL' | 'INCOME' | 'EXPENSE') => void;

  // Ações em massa
  selectedTxIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectTx: (id: string) => void;
  onClearSelection: () => void;
  onBatchChangeCategory: (catId: string) => void;
  batchUpdatingCategory: boolean;
  onRequestDeleteSelected: () => void;
  deletingBatch: boolean;

  // Edição inline
  inlineUpdatingTxId: string | null;
  onInlineUpdateDate: (tx: Transaction, newDate: string) => void;
  onInlineUpdateCategory: (tx: Transaction, newCatId: string) => void;
  onInlineUpdateAmount: (tx: Transaction, newAmount: number) => void;

  // Ações pontuais
  onEditTransaction: (tx: Transaction) => void;
  onRequestDeleteTransaction: (id: string) => void;
  onOpenCreateCategory: (tx: Transaction) => void;
}

export const StatementTable: React.FC<StatementTableProps> = ({
  transactions,
  displayedTransactions,
  categories,
  selectedMonth,
  monthTransactionsCount,
  loadingData,
  privacyMode,
  formatMonthLabel,
  txFilterMode,
  onTxFilterModeChange,
  onRefreshData,
  onAddNewTransaction,
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  showOnlyUncategorized,
  onShowOnlyUncategorizedChange,
  uncategorizedCount,
  typeFilter,
  onTypeFilterChange,
  selectedTxIds,
  onToggleSelectAll,
  onToggleSelectTx,
  onClearSelection,
  onBatchChangeCategory,
  batchUpdatingCategory,
  onRequestDeleteSelected,
  deletingBatch,
  inlineUpdatingTxId,
  onInlineUpdateDate,
  onInlineUpdateCategory,
  onInlineUpdateAmount,
  onEditTransaction,
  onRequestDeleteTransaction,
  onOpenCreateCategory,
}) => {
  return (
    <div id="tour-statement-section" className="lg:col-span-2 card-duo p-4 sm:p-5 space-y-4">
      {/* 1. Cabeçalho do Extrato e Pílulas de Alternância */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#1C4939]" />
            <h2 className="text-base font-black text-slate-800">
              Extrato de Movimentações
            </h2>
          </div>

          {/* Pílulas de Alternância de Filtro: Mês Selecionado vs Todas */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => onTxFilterModeChange('month')}
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
              onClick={() => onTxFilterModeChange('all')}
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
            onClick={onRefreshData}
            disabled={loadingData}
            className="btn-duo btn-duo-white text-xs px-2.5 py-1.5"
            title="Atualizar lançamentos (sincronização completa)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin text-[#1C4939]' : ''}`} />
          </button>

          <button
            onClick={onAddNewTransaction}
            className="btn-duo btn-emerald text-xs px-3.5 py-1.5 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            Adicionar
          </button>
        </div>
      </div>

      {/* 2. Barra de Pesquisa Rápida e Filtros de Categoria e Tipo */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border-2 border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Campo de Busca Textual */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Pesquisar por descrição, categoria, notas..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1C4939] focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
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
              onCategoryFilterChange(catId);
              if (catId === 'NONE') {
                onShowOnlyUncategorizedChange(true);
              } else {
                onShowOnlyUncategorizedChange(false);
              }
            }}
          />
        </div>

        {/* Filtros por Tipo: Todas, Entradas, Despesas */}
        <div className="flex items-center gap-1.5 self-center sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onTypeFilterChange('ALL')}
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${
              typeFilter === 'ALL'
                ? 'bg-[#1C4939] text-white shadow-sm'
                : 'bg-white dark:!bg-slate-800 text-slate-600 dark:!text-slate-300 hover:bg-slate-100 dark:hover:!bg-slate-700 border border-slate-200 dark:!border-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('INCOME')}
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${
              typeFilter === 'INCOME'
                ? 'bg-[#10B981] text-white shadow-sm'
                : 'bg-white dark:!bg-slate-800 text-emerald-700 dark:!text-emerald-400 hover:bg-emerald-50 dark:hover:!bg-emerald-950/40 border border-emerald-200 dark:!border-emerald-800'
            }`}
          >
            Receitas
          </button>
          <button
            type="button"
            onClick={() => onTypeFilterChange('EXPENSE')}
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl transition-all ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:!bg-slate-800 text-rose-700 dark:!text-rose-400 hover:bg-rose-50 dark:hover:!bg-rose-950/40 border border-rose-200 dark:!border-rose-800'
            }`}
          >
            Despesas
          </button>

          {uncategorizedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (showOnlyUncategorized || categoryFilter === 'NONE') {
                  onShowOnlyUncategorizedChange(false);
                  onCategoryFilterChange('ALL');
                } else {
                  onShowOnlyUncategorizedChange(true);
                  onCategoryFilterChange('NONE');
                }
              }}
              className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-1 ${
                showOnlyUncategorized || categoryFilter === 'NONE'
                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-amber-50 dark:!bg-amber-950/40 text-amber-900 dark:!text-amber-300 hover:bg-amber-100 dark:hover:!bg-amber-900/60 border-2 border-amber-300/80 dark:!border-amber-700'
              }`}
              title={showOnlyUncategorized ? 'Mostrar todas as movimentações' : 'Filtrar apenas movimentações sem categoria'}
            >
              <span className="text-xs leading-none select-none">⚠️</span>
              <span>{uncategorizedCount} sem categoria</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Barra Contextual de Ações em Massa */}
      {selectedTxIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/90 border-2 border-blue-200 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-[#1C4939] text-white text-xs font-black flex items-center justify-center shadow-sm">
              {selectedTxIds.size}
            </span>
            <span className="text-xs font-extrabold text-blue-950">
              {selectedTxIds.size === 1
                ? '1 movimentação selecionada'
                : `${selectedTxIds.size} movimentações selecionadas`}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline ml-2 cursor-pointer"
            >
              Desmarcar todas
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Seletor Rápido de Categoria em Lote */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border-2 border-blue-200 shadow-sm">
              <Tag className="w-3.5 h-3.5 text-[#1C4939] shrink-0" />
              <select
                disabled={batchUpdatingCategory}
                onChange={(e) => {
                  if (e.target.value) {
                    onBatchChangeCategory(e.target.value);
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
              onClick={onRequestDeleteSelected}
              disabled={deletingBatch || batchUpdatingCategory}
              className="btn-duo btn-duo-white text-xs px-3.5 py-1.5 flex items-center gap-1.5 text-rose-600 hover:text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100 shadow-sm disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{deletingBatch ? 'Excluindo...' : `Excluir (${selectedTxIds.size})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Tabela / Cards de Movimentações */}
      <div className="overflow-x-auto">
        {displayedTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#0A1D17] text-center space-y-3">
            <p className="text-xs font-bold text-slate-400 dark:!text-slate-300">
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
                  onSearchQueryChange('');
                  onCategoryFilterChange('ALL');
                  onShowOnlyUncategorizedChange(false);
                }}
                className="btn-duo btn-duo-white text-xs px-3.5 py-1.5"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={onAddNewTransaction}
                className="btn-duo btn-emerald text-xs px-4 py-2"
              >
                Registrar Primeiro Lançamento
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 4.1 Visualização em Cards Táteis para Dispositivos Móveis (< md) */}
            <div className="block md:hidden space-y-3">
              <div className="flex items-center justify-between pb-1 px-1 text-xs text-slate-500 font-bold border-b border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={displayedTransactions.length > 0 && selectedTxIds.size === displayedTransactions.length}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-slate-300 text-[#1C4939] focus:ring-[#1C4939] cursor-pointer accent-[#1C4939]"
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
                        ? 'bg-blue-50/90 dark:!bg-blue-950/40 border-[#1C4939] dark:!border-blue-600 shadow-sm'
                        : isRowUncategorized
                          ? 'bg-amber-50/40 dark:!bg-amber-950/30 border-amber-300 dark:!border-amber-800 shadow-2xs'
                          : 'bg-white dark:!bg-slate-900 border-slate-200/90 dark:!border-slate-800 shadow-2xs'
                    }`}
                  >
                    {/* Linha 1: Checkbox, Data, Origem e Tipo */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectTx(tx.id)}
                          className="w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-600 text-[#1C4939] focus:ring-[#1C4939] cursor-pointer accent-[#1C4939]"
                        />
                        <InlineDatePicker
                          value={tx.accrualDate}
                          onChange={(newDate) => onInlineUpdateDate(tx, newDate)}
                          disabled={inlineUpdatingTxId === tx.id}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {tx.origin === 'AI_TEXT' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" /> IA
                          </span>
                        ) : tx.origin === 'AI_AUDIO' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                            <Mic className="w-2.5 h-2.5" /> Voz
                          </span>
                        ) : tx.origin === 'CSV_IMPORT' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            <FileSpreadsheet className="w-2.5 h-2.5 stroke-[2.5]" /> CSV
                          </span>
                        ) : tx.origin === 'OFX_IMPORT' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            <FileText className="w-2.5 h-2.5 stroke-[2.5]" /> OFX
                          </span>
                        ) : null}

                        {tx.type === 'INCOME' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black">
                            <ArrowUpRight className="h-3 w-3 stroke-[3]" /> Receita
                          </span>
                        )}
                        {tx.type === 'EXPENSE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-black">
                            <ArrowDownLeft className="h-3 w-3 stroke-[3]" /> Despesa
                          </span>
                        )}
                        {tx.type === 'TRANSFER' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8E4D9] dark:bg-[#16382E] text-[#1C4939] dark:text-[#E8E4D9] border border-[#C8C1B0] dark:border-[#214E3E] text-[10px] font-black">
                            <ArrowLeftRight className="h-3 w-3 stroke-[3]" /> Transf.
                          </span>
                        )}
                        {tx.type === 'INVOICE_PAYMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black">
                            <DollarSign className="h-3 w-3 stroke-[3]" /> Fatura
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linha 2: Descrição e Valor */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-sm text-slate-800 dark:!text-white truncate" title={tx.description}>
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
                                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800'
                                    : 'text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800'
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
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal truncate block mt-0.5" title={displayNotes}>
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
                              onSave={(val) => onInlineUpdateAmount(tx, val)}
                              className={`w-24 text-right font-black text-sm font-numeric bg-slate-50 dark:!bg-slate-800 hover:bg-blue-50/60 dark:hover:!bg-slate-700 focus:bg-white dark:focus:!bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:!border-slate-700 hover:border-blue-300 dark:hover:!border-blue-500 focus:border-[#1C4939] focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-all cursor-pointer ${
                                tx.type === 'INCOME' ? 'text-[#10B981] dark:text-emerald-400' : 'text-slate-900 dark:!text-white'
                              }`}
                              title="Clique para alterar o valor (Enter para salvar)"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Linha 3: Categoria e Ações */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:!border-slate-800">
                      <div className="flex-1 min-w-0">
                        <InlineCategorySelect
                          currentCategoryId={tx.categoryId}
                          categories={categories}
                          disabled={inlineUpdatingTxId === tx.id}
                          onSelectCategory={(newCatId) => onInlineUpdateCategory(tx, newCatId)}
                          onOpenCreateCategory={() => onOpenCreateCategory(tx)}
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl text-slate-500 hover:text-[#1C4939] dark:text-slate-300 dark:hover:text-[#D4A94F] bg-slate-100 hover:bg-[#E8E4D9] dark:bg-slate-800 dark:hover:bg-[#16382E] transition-colors flex items-center justify-center"
                          title="Editar movimentação"
                        >
                          <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteTransaction(tx.id)}
                          className="p-2 min-h-[36px] min-w-[36px] rounded-xl text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center"
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

            {/* 4.2 Visualização em Tabela Completa para Desktop e Telas Grandes (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-1.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={displayedTransactions.length > 0 && selectedTxIds.size === displayedTransactions.length}
                        onChange={onToggleSelectAll}
                        className="w-4 h-4 rounded border-2 border-slate-300 text-[#1C4939] focus:ring-[#1C4939] cursor-pointer accent-[#1C4939]"
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
                        className={`transition-colors group ${
                          isSelected
                            ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-l-[#1C4939]'
                            : isRowUncategorized
                              ? 'bg-amber-50/50 hover:bg-amber-100/60 border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50/90'
                        }`}
                      >
                        <td className="py-2 px-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectTx(tx.id)}
                            className="w-4 h-4 rounded border-2 border-slate-300 text-[#1C4939] focus:ring-[#1C4939] cursor-pointer accent-[#1C4939]"
                          />
                        </td>
                        <td className="py-2 px-1.5 whitespace-nowrap">
                          <InlineDatePicker
                            value={tx.accrualDate}
                            onChange={(newDate) => onInlineUpdateDate(tx, newDate)}
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
                            onSelectCategory={(newCatId) => onInlineUpdateCategory(tx, newCatId)}
                            onOpenCreateCategory={() => onOpenCreateCategory(tx)}
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8E4D9] dark:bg-[#16382E] text-[#1C4939] dark:text-[#E8E4D9] border border-[#C8C1B0] dark:border-[#214E3E] text-[10px] font-black">
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
                              <span className={`text-[11px] font-black select-none ${
                                tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-rose-500'
                              }`}>
                                {tx.type === 'EXPENSE' ? '-' : (tx.type === 'INCOME' ? '+' : '')} R$
                              </span>
                              <InlineCurrencyInput
                                initialValue={tx.amount}
                                disabled={inlineUpdatingTxId === tx.id}
                                onSave={(val) => onInlineUpdateAmount(tx, val)}
                                className={`w-20 text-right font-black text-xs font-numeric bg-slate-50/80 hover:bg-blue-50/60 focus:bg-white px-1.5 py-0.5 rounded-lg border border-slate-200/90 hover:border-blue-300 focus:border-[#1C4939] focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all cursor-pointer shadow-2xs disabled:opacity-50 ${
                                  tx.type === 'INCOME' ? 'text-[#10B981]' : 'text-slate-900'
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
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-[#1C4939] hover:bg-blue-50 transition-colors"
                              title="Editar movimentação"
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteTransaction(tx.id)}
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
  );
};
