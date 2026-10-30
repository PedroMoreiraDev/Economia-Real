import React from 'react';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Flame, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Plus, 
  Calendar, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import { AnalyticsOverview } from '../types/analytics';
import { BudgetProgressDto } from '../types/budget';
import { FinancialEvolutionChart } from './FinancialEvolutionChart';

interface AnalyticsSectionProps {
  analytics: AnalyticsOverview | null;
  budgets: BudgetProgressDto[];
  onOpenBudgetModal: () => void;
  onOpenAiBudgetModal?: () => void;
  globalLimit?: number;
}

function formatBRL(val: number | undefined): string {
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  analytics,
  budgets,
  onOpenBudgetModal,
  onOpenAiBudgetModal,
  globalLimit,
}) => {
  if (!analytics) return null;

  const { monthlyEvolution, categoryDistribution, burnRate } = analytics;

  return (
    <div className="space-y-6">
      
      {/* 1. SEÇÃO DE BURN RATE & RITMO DE CONSUMO (Card Verde Suave Estilo Duolingo) */}
      <div className="card-duo-green p-6 sm:p-8 space-y-6 relative overflow-hidden dark:!bg-[#0F172A] dark:!border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-emerald-200 dark:!border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-3.5 rounded-2xl border-b-4 shadow-md ${
              burnRate.burnStatus === 'CRITICAL'
                ? 'bg-[#FF4B4B] text-white border-[#EA2B2B]'
                : burnRate.burnStatus === 'WARNING'
                ? 'bg-[#FF9600] text-white border-[#E67300]'
                : 'bg-[#58CC02] text-white border-[#46A302]'
            }`}>
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:!text-white">Ritmo de Gastos (Burn Rate)</h3>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  burnRate.burnStatus === 'CRITICAL'
                    ? 'bg-rose-100 dark:!bg-rose-950/80 text-rose-800 dark:!text-rose-300 border border-rose-300 dark:!border-rose-800'
                    : burnRate.burnStatus === 'WARNING'
                    ? 'bg-amber-100 dark:!bg-amber-950/80 text-amber-800 dark:!text-amber-300 border border-amber-300 dark:!border-amber-800'
                    : 'bg-white dark:!bg-slate-900 text-[#388302] dark:!text-emerald-400 border-2 border-[#58CC02] dark:!border-emerald-600'
                }`}>
                  {burnRate.burnStatus === 'CRITICAL'
                    ? '⚠️ Consumo Acelerado'
                    : burnRate.burnStatus === 'WARNING'
                    ? '⚡ Atenção ao Ritmo'
                    : '✅ Ritmo Saudável'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:!text-slate-400 mt-0.5">
                Projeção estatística baseada no seu gasto diário até o fim do mês
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onOpenAiBudgetModal && (
              <button
                onClick={onOpenAiBudgetModal}
                className="btn-duo btn-duo-blue text-xs px-4 py-2.5 flex items-center gap-2"
                title="Usar Inteligência Artificial para analisar despesas e distribuir o teto"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Distribuir Tetos com I.A</span>
              </button>
            )}
            <button
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-green text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Configurar Tetos de Gastos
            </button>
          </div>
        </div>

        {/* Indicadores do Burn Rate */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:!bg-[#1E293B] border-2 border-slate-200/90 dark:!border-slate-700/80 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
            <span className="text-xs font-bold text-slate-500 dark:!text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Gasto no Mês Até Hoje
            </span>
            <p className="text-xl font-black text-[#FF4B4B]">
              {formatBRL(burnRate.spentSoFar)}
            </p>
            <span className="text-[11px] font-bold text-slate-400">
              {burnRate.daysElapsed} dias transcorridos
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:!bg-[#1E293B] border-2 border-slate-200/90 dark:!border-slate-700/80 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
            <span className="text-xs font-bold text-slate-500 dark:!text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Média Diária
            </span>
            <p className="text-xl font-black text-slate-800 dark:!text-white">
              {formatBRL(burnRate.dailyAverage)}
            </p>
            <span className="text-[11px] font-bold text-slate-400">Por dia no mês</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:!bg-[#1E293B] border-2 border-slate-200/90 dark:!border-slate-700/80 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
            <span className="text-xs font-bold text-slate-500 dark:!text-slate-400 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              Projeção Fim do Mês
            </span>
            <p className={`text-xl font-black ${
              burnRate.monthlyBudgetTotal > 0 && burnRate.projectedMonthEnd > burnRate.monthlyBudgetTotal
                ? 'text-[#FF4B4B]'
                : 'text-[#1899D6] dark:!text-sky-400'
            }`}>
              {formatBRL(burnRate.projectedMonthEnd)}
            </p>
            <span className="text-[11px] font-bold text-slate-400">
              {burnRate.daysRemaining} dias restantes
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:!bg-[#1E293B] border-2 border-slate-200/90 dark:!border-slate-700/80 shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none">
            <span className="text-xs font-bold text-slate-500 dark:!text-slate-400 flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              Teto Máximo Mensal
            </span>
            <p className="text-xl font-black text-[#46A302] dark:!text-emerald-400">
              {(globalLimit && globalLimit > 0) 
                ? formatBRL(globalLimit) 
                : (burnRate.monthlyBudgetTotal > 0 ? formatBRL(burnRate.monthlyBudgetTotal) : 'Sem teto')}
            </p>
            <span className="text-[11px] font-bold text-slate-400">
              {globalLimit && globalLimit > 0 ? 'Teto global ativo' : 'Soma das categorias'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Temporal vs Orçamento */}
        {burnRate.monthlyBudgetTotal > 0 && (
          <div className="space-y-2 bg-white/70 dark:!bg-[#1E293B] p-4 rounded-2xl border-2 border-emerald-200 dark:!border-slate-700">
            <div className="flex justify-between text-xs font-black text-slate-700 dark:!text-slate-300">
              <span>Consumo do Orçamento Total</span>
              <span className="text-slate-900 dark:!text-white font-black">
                {Math.round((burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100)}% consumido
              </span>
            </div>
            <div className="progress-duo-track">
              <div
                className={`progress-duo-fill ${
                  burnRate.spentSoFar >= burnRate.monthlyBudgetTotal
                    ? 'bg-[#FF4B4B]'
                    : burnRate.spentSoFar >= burnRate.monthlyBudgetTotal * 0.85
                    ? 'bg-[#FF9600]'
                    : 'bg-[#58CC02]'
                }`}
                style={{
                  width: `${Math.min(100, (burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. GRÁFICOS: EVOLUÇÃO TEMPORAL (6 MESES) & DISTRIBUIÇÃO EM PIZZA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução Mensal (Componente Moderno e Interativo) */}
        <div className="lg:col-span-2">
          <FinancialEvolutionChart data={monthlyEvolution} />
        </div>

        {/* Gráfico 2: Distribuição por Categoria */}
        <div className="card-duo p-6 sm:p-8 space-y-5">
          <div className="space-y-0.5 border-b-2 border-slate-100 pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#1CB0F6]" />
              Gastos por Categoria
            </h3>
            <p className="text-xs font-bold text-slate-400">Distribuição percentual deste mês</p>
          </div>

          {categoryDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-center text-xs font-bold text-slate-400 dark:!text-slate-300 border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#090E17] rounded-2xl">
              Nenhuma despesa categorizada neste mês.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra segmentada horizontal colorida */}
              <div className="h-4 w-full bg-slate-100 dark:!bg-slate-800 rounded-full overflow-hidden flex border-2 border-slate-200 dark:!border-slate-700 shadow-inner">
                {categoryDistribution.map((cat) => (
                  <div
                    key={cat.categoryId}
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.colorHex,
                    }}
                    title={`${cat.categoryName}: ${cat.percentage}%`}
                    className="h-full transition-all duration-300 hover:opacity-85"
                  />
                ))}
              </div>

              {/* Lista detalhada das categorias com percentuais */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {categoryDistribution.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-50 dark:!bg-[#0F172A] border-2 border-slate-100 dark:!border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <span className="text-slate-800 dark:!text-white font-black">{cat.categoryName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:!text-white block">
                        {formatBRL(cat.totalAmount)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:!text-slate-400 font-extrabold">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. TERMOSTATO DE METAS POR CATEGORIA (Cards Táteis com Badges Gamificados) */}
      <div className="card-duo p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#58CC02]" />
              Metas Orçamentárias por Categoria
            </h3>
            <p className="text-xs font-bold text-slate-400">
              Acompanhe o consumo individual e receba avisos preventivos
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenAiBudgetModal && (
              <button
                onClick={onOpenAiBudgetModal}
                className="btn-duo btn-duo-blue text-xs px-3.5 py-2 flex items-center gap-1.5"
                title="Sugerir limites usando Inteligência Artificial"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Distribuir com I.A</span>
              </button>
            )}
            <button
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-green text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Nova Meta
            </button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:!border-slate-800 dark:!bg-[#090E17] text-center space-y-3">
            <p className="text-xs font-bold text-slate-400 dark:!text-slate-300">Você ainda não configurou metas para este mês.</p>
            <button
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-green text-xs px-4 py-2"
            >
              Definir Primeiro Limite
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const hasLimit = b.monthlyLimit > 0;
              return (
                <div
                  key={b.id || b.categoryId}
                  className={`p-5 rounded-3xl border-2 transition-all shadow-[0_3px_0_0_#E2E8F0] dark:shadow-none ${
                    !hasLimit
                      ? 'bg-slate-50/70 dark:!bg-[#1E293B] border-slate-200/90 dark:!border-slate-700 hover:border-blue-300'
                      : b.isExceeded
                      ? 'bg-rose-50/70 dark:!bg-[#1E293B] border-rose-300 dark:!border-rose-900'
                      : b.isWarning
                      ? 'bg-amber-50/70 dark:!bg-[#1E293B] border-amber-300 dark:!border-amber-900'
                      : 'bg-white dark:!bg-[#1E293B] border-slate-200/90 dark:!border-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: b.categoryColorHex }}
                      />
                      <span className="text-sm font-black text-slate-900 dark:!text-white">{b.categoryName}</span>
                    </div>

                    {!hasLimit ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-600 dark:!text-slate-300 bg-slate-100 dark:!bg-slate-800 border border-slate-300 dark:!border-slate-700 px-2.5 py-0.5 rounded-full">
                        Sem Teto Definido
                      </span>
                    ) : b.isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 dark:!text-rose-300 bg-rose-100 dark:!bg-rose-950/80 border border-rose-300 dark:!border-rose-800 px-2.5 py-0.5 rounded-full">
                        <AlertOctagon className="w-3.5 h-3.5" /> Estourou!
                      </span>
                    ) : b.isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 dark:!text-amber-300 bg-amber-100 dark:!bg-amber-950/80 border border-amber-300 dark:!border-amber-800 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" /> Atenção ({b.alertThresholdPercentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#388302] dark:!text-emerald-400 bg-[#E8F8E8] dark:!bg-emerald-950/80 border border-[#D7FFB8] dark:!border-emerald-800 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> No Limite
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso da Categoria */}
                  <div className="space-y-1.5 my-3">
                    <div className="progress-duo-track h-3">
                      <div
                        style={{ width: `${hasLimit ? Math.min(100, b.percentageUsed) : 100}%` }}
                        className={`progress-duo-fill ${
                          !hasLimit
                            ? 'bg-slate-400'
                            : b.isExceeded
                            ? 'bg-[#FF4B4B]'
                            : b.isWarning
                            ? 'bg-[#FF9600]'
                            : 'bg-[#58CC02]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 dark:!text-slate-400">
                      <span>Gasto: <strong className="text-slate-900 dark:!text-white">{formatBRL(b.spentAmount)}</strong></span>
                      <span>Meta: <strong className="text-slate-900 dark:!text-white">{hasLimit ? formatBRL(b.monthlyLimit) : 'Sem teto'}</strong></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-500 dark:!text-slate-400 pt-2 border-t-2 border-slate-100 dark:!border-slate-800">
                    {hasLimit ? (
                      <>
                        <span>{b.percentageUsed}% utilizado</span>
                        <span className={b.remainingAmount < 0 ? 'text-[#FF4B4B]' : 'text-slate-700 dark:!text-slate-300'}>
                          {b.remainingAmount < 0 ? 'Excedeu ' : 'Resta '}
                          {formatBRL(Math.abs(b.remainingAmount))}
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onOpenBudgetModal}
                          className="text-[#026CD6] hover:underline flex items-center gap-1 font-black"
                        >
                          + Definir teto
                        </button>
                        <span className="text-slate-600">Gasto Real</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
