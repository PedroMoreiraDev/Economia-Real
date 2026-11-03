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
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-[#526B61] dark:text-[#9AB3A8] tracking-wider">
            Entradas
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#E6EFEA] dark:bg-[#16382E] border border-[#1C4939]/25 dark:border-[#2B6B54] text-[#1C4939] dark:text-[#78C6A3] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          </div>
        </div>
        <p className="text-base sm:text-2xl lg:text-3xl font-extrabold text-[#1C4939] dark:text-[#78C6A3] tracking-tight font-numeric truncate">
          {formatValue(summary.totalIncome)}
        </p>
        <div className="flex items-center justify-between text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
          <span className="hidden sm:inline">Recebido</span>
          <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 dark:border-[#2B6B54]">
            +{incomeCount} entrada(s)
          </span>
        </div>
      </div>

      {/* Despesas de Consumo */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-[#526B61] dark:text-[#9AB3A8] tracking-wider">
            Despesas
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 text-[#B93838] dark:text-rose-400 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
          </div>
        </div>
        <p className="text-base sm:text-2xl lg:text-3xl font-extrabold text-[#B93838] dark:text-rose-400 tracking-tight font-numeric truncate">
          {formatValue(summary.totalExpense)}
        </p>
        <div className="flex items-center justify-between text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
          <span className="hidden sm:inline">Consumo</span>
          {summary.totalIncome > 0 ? (
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/40 text-[#B93838] dark:text-rose-300 border border-rose-200 dark:border-rose-700/60">
              {Math.round((summary.totalExpense / summary.totalIncome) * 100)}% da receita
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">No período</span>
          )}
        </div>
      </div>

      {/* Disponível para Gastar / Meta de Gastos */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-[#526B61] dark:text-[#9AB3A8] tracking-wider truncate mr-1">
            {effectiveGlobalLimit > 0 ? 'Disponível' : 'Economia'}
          </span>
          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0 ${
            effectiveGlobalLimit > 0
              ? effectiveGlobalLimit - summary.totalExpense >= 0
                ? 'bg-[#F7EFE0] dark:bg-[#16382E] border-[#D4A94F]/50 text-[#102D25] dark:text-[#D4A94F]'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-[#B93838] dark:text-rose-400'
              : 'bg-[#F7EFE0] dark:bg-[#16382E] border-[#D4A94F]/50 text-[#102D25] dark:text-[#D4A94F]'
          }`}>
            {effectiveGlobalLimit > 0 ? (
              <Target className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            ) : (
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
            )}
          </div>
        </div>
        {effectiveGlobalLimit > 0 ? (
          <>
            <p className={`text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-numeric truncate ${
              effectiveGlobalLimit - summary.totalExpense >= 0
                ? 'text-[#102D25] dark:text-[#D4A94F]'
                : 'text-[#B93838] dark:text-rose-400'
            }`}>
              {formatValue(effectiveGlobalLimit - summary.totalExpense)}
            </p>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-[#E2DDD0] dark:bg-[#0A1D17] rounded-full overflow-hidden border border-[#D5CFC0] dark:border-[#214E3E]">
                <div
                  className={`h-full rounded-full transition-all ${
                    summary.totalExpense >= effectiveGlobalLimit
                      ? 'bg-[#B93838]'
                      : summary.totalExpense >= effectiveGlobalLimit * 0.85
                        ? 'bg-[#D4A94F]'
                        : 'bg-[#1C4939] dark:bg-[#D4A94F]'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((summary.totalExpense / effectiveGlobalLimit) * 100))}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] truncate">
                {effectiveGlobalLimit - summary.totalExpense >= 0
                  ? `De ${formatValue(effectiveGlobalLimit)}`
                  : `Excedeu em ${formatValue(Math.abs(effectiveGlobalLimit - summary.totalExpense))}`}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className={`text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-numeric truncate ${
              netBalance >= 0 ? 'text-[#102D25] dark:text-[#D4A94F]' : 'text-[#B93838] dark:text-rose-400'
            }`}>
              {formatValue(netBalance)}
            </p>
            <p className="text-[10px] sm:text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] truncate">
              Saldo livre no período
            </p>
          </>
        )}
      </div>

      {/* Saldo Total: Entradas menos Despesas */}
      <div className="card-duo card-duo-interactive p-3.5 sm:p-5 space-y-1.5 sm:space-y-2.5 group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-[#526B61] dark:text-[#9AB3A8] tracking-wider">
            Saldo Total
          </span>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.4]" />
          </div>
        </div>
        <p className={`text-base sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-numeric truncate ${
          netBalance >= 0 ? 'text-[#102D25] dark:text-[#E8E4D9]' : 'text-[#B93838] dark:text-rose-400'
        }`}>
          {formatValue(netBalance)}
        </p>
        <div className="flex items-center justify-between text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
          <span className="hidden sm:inline">Resultado</span>
          {netBalance >= 0 ? (
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7EFE0] dark:bg-[#16382E] text-[#102D25] dark:text-[#D4A94F] border border-[#D4A94F]/40">
              Superávit
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-900/40 text-[#B93838] dark:text-rose-300 border border-rose-200 dark:border-rose-700/60">
              Déficit
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
