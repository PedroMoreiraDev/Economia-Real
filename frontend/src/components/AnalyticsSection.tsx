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
      
      {/* 1. SEÇÃO DE BURN RATE & RITMO DE CONSUMO */}
      <div className="card-duo-green p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-3.5 rounded-xl border shadow-sm ${
              burnRate.burnStatus === 'CRITICAL'
                ? 'bg-[#B93838] text-white border-[#962A2A]'
                : burnRate.burnStatus === 'WARNING'
                ? 'bg-[#D4A94F] text-[#102D25] border-[#B88B32]'
                : 'bg-[#102D25] text-[#D4A94F] border-[#D4A94F]/40'
            }`}>
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Ritmo de Gastos (Burn Rate)</h3>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  burnRate.burnStatus === 'CRITICAL'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-[#B93838] dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : burnRate.burnStatus === 'WARNING'
                    ? 'bg-[#F7EFE0] dark:bg-[#16382E] text-[#9A7220] dark:text-[#D4A94F] border border-[#D4A94F]/50'
                    : 'bg-[#FAF8F4] dark:bg-[#102D25] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/40'
                }`}>
                  {burnRate.burnStatus === 'CRITICAL'
                    ? 'Consumo Acelerado'
                    : burnRate.burnStatus === 'WARNING'
                    ? 'Atenção ao Ritmo'
                    : 'Ritmo Saudável'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5">
                Projeção estatística baseada no seu gasto diário até o fim do mês
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {onOpenAiBudgetModal && (
              <button
                onClick={onOpenAiBudgetModal}
                className="btn-duo btn-duo-purple text-xs px-4 py-2.5 flex items-center gap-2"
                title="Usar Inteligência Artificial para analisar despesas e distribuir o teto"
              >
                <Sparkles className="w-4 h-4 text-[#102D25]" />
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
          <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#526B61] dark:text-[#9AB3A8]" />
              Gasto no Mês Até Hoje
            </span>
            <p className="text-xl font-extrabold text-[#B93838] dark:text-rose-400 font-numeric">
              {formatBRL(burnRate.spentSoFar)}
            </p>
            <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              {burnRate.daysElapsed} dias transcorridos
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#526B61] dark:text-[#9AB3A8]" />
              Média Diária
            </span>
            <p className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-numeric">
              {formatBRL(burnRate.dailyAverage)}
            </p>
            <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">Por dia no mês</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#526B61] dark:text-[#9AB3A8]" />
              Projeção Fim do Mês
            </span>
            <p className={`text-xl font-extrabold font-numeric ${
              burnRate.monthlyBudgetTotal > 0 && burnRate.projectedMonthEnd > burnRate.monthlyBudgetTotal
                ? 'text-[#B93838] dark:text-rose-400'
                : 'text-[#102D25] dark:text-[#D4A94F]'
            }`}>
              {formatBRL(burnRate.projectedMonthEnd)}
            </p>
            <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              {burnRate.daysRemaining} dias restantes
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xs">
            <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-[#D4A94F]" />
              Teto Máximo Mensal
            </span>
            <p className="text-xl font-extrabold text-[#1C4939] dark:text-[#78C6A3] font-numeric">
              {(globalLimit && globalLimit > 0) 
                ? formatBRL(globalLimit) 
                : (burnRate.monthlyBudgetTotal > 0 ? formatBRL(burnRate.monthlyBudgetTotal) : 'Sem teto')}
            </p>
            <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              {globalLimit && globalLimit > 0 ? 'Teto global ativo' : 'Soma das categorias'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Temporal vs Orçamento */}
        {burnRate.monthlyBudgetTotal > 0 && (
          <div className="space-y-2 bg-[#FAF8F4]/90 dark:bg-[#102D25] p-4 rounded-xl border border-[#D5CFC0] dark:border-[#214E3E]">
            <div className="flex justify-between text-xs font-bold text-[#355248] dark:text-[#B8C7C0]">
              <span>Consumo do Orçamento Total</span>
              <span className="text-[#102D25] dark:text-[#E8E4D9] font-extrabold font-numeric">
                {Math.round((burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100)}% consumido
              </span>
            </div>
            <div className="progress-duo-track">
              <div
                className={`progress-duo-fill ${
                  burnRate.spentSoFar >= burnRate.monthlyBudgetTotal
                    ? 'bg-[#B93838]'
                    : burnRate.spentSoFar >= burnRate.monthlyBudgetTotal * 0.85
                    ? 'bg-[#D4A94F]'
                    : 'bg-[#1C4939]'
                }`}
                style={{
                  width: `${Math.min(100, (burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. GRÁFICOS: EVOLUÇÃO TEMPORAL (6 MESES) & DISTRIBUIÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução Mensal */}
        <div className="lg:col-span-2">
          <FinancialEvolutionChart data={monthlyEvolution} />
        </div>

        {/* Gráfico 2: Distribuição por Categoria */}
        <div className="card-duo p-6 sm:p-8 space-y-5">
          <div className="space-y-0.5 border-b border-[#E2DDD0] dark:border-[#214E3E] pb-3">
            <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-[#1C4939] dark:text-[#D4A94F]" />
              Gastos por Categoria
            </h3>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">Distribuição percentual deste mês</p>
          </div>

          {categoryDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-center text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] border border-dashed border-[#D5CFC0] dark:border-[#214E3E] bg-[#EFECE3]/40 dark:bg-[#0D241D] rounded-xl">
              Nenhuma despesa categorizada neste mês.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barra segmentada horizontal */}
              <div className="h-3.5 w-full bg-[#E2DDD0] dark:bg-[#0A1D17] rounded-full overflow-hidden flex border border-[#D5CFC0] dark:border-[#214E3E]">
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
                    className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#EFECE3]/60 dark:bg-[#16382E]/60 border border-[#E2DDD0] dark:border-[#214E3E] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <span className="text-[#102D25] dark:text-[#E8E4D9] font-bold">{cat.categoryName}</span>
                    </div>
                    <div className="text-right font-numeric">
                      <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] block">
                        {formatBRL(cat.totalAmount)}
                      </span>
                      <span className="text-[11px] text-[#526B61] dark:text-[#9AB3A8] font-bold">
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

      {/* 3. TERMOSTATO DE METAS POR CATEGORIA */}
      <div className="card-duo p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2DDD0] dark:border-[#214E3E] pb-4">
          <div className="space-y-0.5">
            <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#D4A94F]" />
              Metas Orçamentárias por Categoria
            </h3>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Acompanhe o consumo individual e receba avisos preventivos
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onOpenAiBudgetModal && (
              <button
                onClick={onOpenAiBudgetModal}
                className="btn-duo btn-duo-purple text-xs px-3.5 py-2 flex items-center gap-1.5"
                title="Sugerir limites usando Inteligência Artificial"
              >
                <Sparkles className="w-4 h-4 text-[#102D25]" />
                <span>Distribuir com I.A</span>
              </button>
            )}
            <button
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-green text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nova Meta
            </button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[#D5CFC0] dark:border-[#214E3E] bg-[#EFECE3]/40 dark:bg-[#0D241D] text-center space-y-3">
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">Você ainda não configurou metas para este mês.</p>
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
                  className={`p-5 rounded-2xl border transition-all ${
                    !hasLimit
                      ? 'bg-[#EFECE3]/50 dark:bg-[#16382E]/50 border-[#D5CFC0] dark:border-[#214E3E]'
                      : b.isExceeded
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      : b.isWarning
                      ? 'bg-[#F7EFE0]/70 dark:bg-[#16382E] border-[#D4A94F]/50'
                      : 'bg-[#FAF8F4] dark:bg-[#16382E]/70 border-[#D5CFC0] dark:border-[#214E3E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: b.categoryColorHex }}
                      />
                      <span className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">{b.categoryName}</span>
                    </div>

                    {!hasLimit ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] bg-[#E8E4D9] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] px-2.5 py-0.5 rounded-full">
                        Sem Teto Definido
                      </span>
                    ) : b.isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B93838] dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 rounded-full">
                        <AlertOctagon className="w-3.5 h-3.5" /> Excedido
                      </span>
                    ) : b.isWarning ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9A7220] dark:text-[#D4A94F] bg-[#F7EFE0] dark:bg-[#102D25] border border-[#D4A94F]/50 px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5" /> Atenção ({b.alertThresholdPercentage}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1C4939] dark:text-[#78C6A3] bg-[#E6EFEA] dark:bg-[#102D25] border border-[#1C4939]/30 dark:border-[#2B6B54] px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" /> No Limite
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso da Categoria */}
                  <div className="space-y-1.5 my-3">
                    <div className="progress-duo-track h-2.5">
                      <div
                        style={{ width: `${hasLimit ? Math.min(100, b.percentageUsed) : 100}%` }}
                        className={`progress-duo-fill ${
                          !hasLimit
                            ? 'bg-[#829A90]'
                            : b.isExceeded
                            ? 'bg-[#B93838]'
                            : b.isWarning
                            ? 'bg-[#D4A94F]'
                            : 'bg-[#1C4939]'
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] font-numeric">
                      <span>Gasto: <strong className="text-[#102D25] dark:text-[#E8E4D9]">{formatBRL(b.spentAmount)}</strong></span>
                      <span>Meta: <strong className="text-[#102D25] dark:text-[#E8E4D9]">{hasLimit ? formatBRL(b.monthlyLimit) : 'Sem teto'}</strong></span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] pt-2 border-t border-[#E2DDD0] dark:border-[#214E3E] font-numeric">
                    {hasLimit ? (
                      <>
                        <span>{b.percentageUsed}% utilizado</span>
                        <span className={b.remainingAmount < 0 ? 'text-[#B93838] dark:text-rose-400' : 'text-[#102D25] dark:text-[#E8E4D9]'}>
                          {b.remainingAmount < 0 ? 'Excedeu ' : 'Resta '}
                          {formatBRL(Math.abs(b.remainingAmount))}
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onOpenBudgetModal}
                          className="text-[#1C4939] dark:text-[#D4A94F] hover:underline flex items-center gap-1 font-extrabold"
                        >
                          + Definir teto
                        </button>
                        <span>Gasto Real</span>
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
