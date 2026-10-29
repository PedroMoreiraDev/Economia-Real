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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
      {/* Receitas Totais */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 hover:border-emerald-400 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Entradas
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#E8F8E8] border-2 border-[#D7FFB8] text-[#10B981] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#059669] tracking-tight font-numeric truncate">
          {formatValue(summary.totalIncome)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Recebido</span>
          <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            +{incomeCount} entrada(s)
          </span>
        </div>
      </div>

      {/* Despesas de Consumo */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 hover:border-rose-400 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Despesas
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#FFEAEA] border-2 border-[#FFDFDF] text-[#EF4444] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#DC2626] tracking-tight font-numeric truncate">
          {formatValue(summary.totalExpense)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Consumo</span>
          {summary.totalIncome > 0 ? (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              {Math.round((summary.totalExpense / summary.totalIncome) * 100)}% da receita
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">No período</span>
          )}
        </div>
      </div>

      {/* Disponível para Gastar / Meta de Gastos */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 hover:border-[#026CD6] group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider truncate mr-1">
            {effectiveGlobalLimit > 0 ? 'Disponível' : 'Economia'}
          </span>
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 ${effectiveGlobalLimit > 0
            ? effectiveGlobalLimit - summary.totalExpense >= 0
              ? 'bg-[#EBF5FF] border-[#BAE0FD] text-[#026CD6]'
              : 'bg-[#FFEAEA] border-[#FFDFDF] text-[#EF4444]'
            : 'bg-[#EBF5FF] border-[#BAE0FD] text-[#026CD6]'
            }`}>
            {effectiveGlobalLimit > 0 ? (
              <Target className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
            ) : (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
            )}
          </div>
        </div>
        {effectiveGlobalLimit > 0 ? (
          <>
            <p className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${effectiveGlobalLimit - summary.totalExpense >= 0 ? 'text-[#026CD6]' : 'text-[#DC2626]'
              }`}>
              {formatValue(effectiveGlobalLimit - summary.totalExpense)}
            </p>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 truncate">
                {effectiveGlobalLimit - summary.totalExpense >= 0
                  ? `De ${formatValue(effectiveGlobalLimit)}`
                  : `⚠️ Excedeu em ${formatValue(Math.abs(effectiveGlobalLimit - summary.totalExpense))}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${netBalance >= 0 ? 'text-[#026CD6]' : 'text-amber-600'
              }`}>
              {formatValue(netBalance)}
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 truncate">
              Saldo livre
            </p>
          </>
        )}
      </div>

      {/* Saldo Total: Entradas menos Despesas */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 hover:border-amber-400 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
            Saldo Total
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#FFF8E6] border-2 border-[#FDE68A] text-[#D97706] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </div>
        </div>
        <p className={`text-lg sm:text-2xl lg:text-3xl font-black tracking-tight font-numeric truncate ${netBalance >= 0 ? 'text-slate-900' : 'text-[#DC2626]'
          }`}>
          {formatValue(netBalance)}
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="hidden sm:inline">Resultado</span>
          {netBalance >= 0 ? (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Superávit ✨
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Déficit ⚠️
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
