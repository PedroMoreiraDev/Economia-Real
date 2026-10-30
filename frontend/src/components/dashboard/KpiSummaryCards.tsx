import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Target, TrendingUp, Wallet } from 'lucide-react';
import { FinancialSummary } from '../../types/financial';

interface KpiSummaryCardsProps {
  summary: FinancialSummary;
  incomeCount: number;
  effectiveGlobalLimit: number;
  formatValue: (amount: number) => string;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({
  summary,
  incomeCount,
  effectiveGlobalLimit,
  formatValue,
}) => {
  const netBalance = summary.totalIncome - summary.totalExpense;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-5">
      {/* Receitas Totais */}
      <div className="card-duo card-duo-interactive p-3 sm:p-5 space-y-1 sm:space-y-2.5 hover:border-emerald-400 group bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Entradas
          </span>
          <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#E8F8E8] dark:bg-emerald-950/60 border-2 border-[#D7FFB8] dark:border-emerald-800 text-[#10B981] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className="text-base sm:text-2xl lg:text-3xl font-black text-[#059669] dark:text-emerald-400 tracking-tight font-numeric truncate">
          {formatValue(summary.totalIncome)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Recebido</span>
          <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
            +{incomeCount} entrada(s)
          </span>
        </div>
      </div>

      {/* Despesas de Consumo */}
      <div className="card-duo card-duo-interactive p-3 sm:p-5 space-y-1 sm:space-y-2.5 hover:border-rose-400 group bg-gradient-to-b from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Despesas
          </span>
          <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#FFEAEA] dark:bg-rose-950/60 border-2 border-[#FFDFDF] dark:border-rose-800 text-[#EF4444] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform shrink-0">
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className="text-base sm:text-2xl lg:text-3xl font-black text-[#DC2626] dark:text-rose-400 tracking-tight font-numeric truncate">
          {formatValue(summary.totalExpense)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Consumo</span>
          {summary.totalIncome > 0 ? (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60">
              {Math.round((summary.totalExpense / summary.totalIncome) * 100)}% da receita
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">No período</span>
          )}
        </div>
      </div>

      {/* Disponível para Gastar / Meta de Gastos */}
      <div className="card-duo card-duo-interactive p-3 sm:p-5 space-y-1 sm:space-y-2.5 hover:border-[#026CD6] group bg-gradient-to-b from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider truncate mr-1">
            {effectiveGlobalLimit > 0 ? 'Disponível' : 'Economia'}
          </span>
          <div className={`h-7 w-7 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 ${effectiveGlobalLimit > 0
            ? effectiveGlobalLimit - summary.totalExpense >= 0
              ? 'bg-[#EBF5FF] dark:bg-blue-950/60 border-[#BAE0FD] dark:border-blue-800 text-[#026CD6] dark:text-blue-400'
              : 'bg-[#FFEAEA] dark:bg-rose-950/60 border-[#FFDFDF] dark:border-rose-800 text-[#EF4444] dark:text-rose-400'
            : 'bg-[#EBF5FF] dark:bg-blue-950/60 border-[#BAE0FD] dark:border-blue-800 text-[#026CD6] dark:text-blue-400'
            }`}>
            {effectiveGlobalLimit > 0 ? (
              <Target className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[3]" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[3]" />
            )}
          </div>
        </div>
        {effectiveGlobalLimit > 0 ? (
          <>
            <p className={`text-base sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${effectiveGlobalLimit - summary.totalExpense >= 0 ? 'text-[#026CD6] dark:text-blue-400' : 'text-[#DC2626] dark:text-rose-400'
              }`}>
              {formatValue(effectiveGlobalLimit - summary.totalExpense)}
            </p>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${summary.totalExpense >= effectiveGlobalLimit
                    ? 'bg-rose-500'
                    : summary.totalExpense >= effectiveGlobalLimit * 0.85
                      ? 'bg-amber-500'
                      : 'bg-[#026CD6]'
                    }`}
                  style={{ width: `${Math.min(100, Math.round((summary.totalExpense / effectiveGlobalLimit) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">
                {effectiveGlobalLimit - summary.totalExpense >= 0
                  ? `De ${formatValue(effectiveGlobalLimit)}`
                  : `⚠️ Excedeu em ${formatValue(Math.abs(effectiveGlobalLimit - summary.totalExpense))}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className={`text-base sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${netBalance >= 0 ? 'text-[#026CD6] dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
              {formatValue(netBalance)}
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
              Saldo livre
            </p>
          </>
        )}
      </div>

      {/* Saldo Total: Entradas menos Despesas */}
      <div className="card-duo card-duo-interactive p-3 sm:p-5 space-y-1 sm:space-y-2.5 hover:border-amber-400 group bg-gradient-to-b from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Saldo Total
          </span>
          <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#FFF8E6] dark:bg-amber-950/60 border-2 border-[#FDE68A] dark:border-amber-800 text-[#D97706] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform shrink-0">
            <Wallet className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className={`text-base sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${netBalance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-[#DC2626] dark:text-rose-400'
          }`}>
          {formatValue(netBalance)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Resultado</span>
          {netBalance >= 0 ? (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
              Superávit ✨
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60">
              Déficit ⚠️
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
