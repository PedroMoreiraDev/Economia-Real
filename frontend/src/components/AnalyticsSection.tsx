import React from 'react';
import { 
  Flame, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Plus, 
  Clock, 
  Sparkles,
  Sliders,
  Trophy
} from 'lucide-react';
import { AnalyticsOverview } from '../types/analytics';
import { BudgetProgressDto } from '../types/budget';
import { Transaction } from '../types/financial';
import { RecurringBill } from '../types/recurring';
import { FinancialEvolutionChart } from './FinancialEvolutionChart';
import { CategoryDonutChart } from './CategoryDonutChart';
import { FiftyThirtyTwentyWidget } from './FiftyThirtyTwentyWidget';
import { SavingsLeakageSection } from './SavingsLeakageSection';

interface AnalyticsSectionProps {
  analytics: AnalyticsOverview | null;
  budgets: BudgetProgressDto[];
  transactions?: Transaction[];
  recurringBills?: RecurringBill[];
  onOpenBudgetModal: () => void;
  onOpenAiBudgetModal?: () => void;
  onOpenWhatIfSimulator?: (prefill?: { deliveryCut?: number; cancelBills?: number }) => void;
  onOpenMonthlyWrapped?: () => void;
  globalLimit?: number;
  privacyMode?: boolean;
}

function formatBRLGlobal(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  analytics,
  budgets,
  transactions = [],
  recurringBills = [],
  onOpenBudgetModal,
  onOpenAiBudgetModal,
  onOpenWhatIfSimulator,
  onOpenMonthlyWrapped,
  globalLimit,
  privacyMode,
}) => {
  if (!analytics) return null;

  const formatBRL = (val: number | undefined) => formatBRLGlobal(val, privacyMode);

  const { monthlyEvolution, categoryDistribution, burnRate } = analytics;

  // Total de receitas do mês corrente
  const totalIncome = monthlyEvolution.length > 0 ? (monthlyEvolution[monthlyEvolution.length - 1].income || 0) : 0;

  return (
    <div className="space-y-6">

      {/* BARRA DE FERRAMENTAS INTELIGENTES */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#E8E4D9] dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[#D4A94F]" />
          <span className="text-xs sm:text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
            Painel Analítico Avançado & Inteligência Financeira
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenWhatIfSimulator && (
            <button
              type="button"
              onClick={() => onOpenWhatIfSimulator()}
              className="btn-duo btn-duo-yellow px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulador de "E se...?"</span>
            </button>
          )}

          {onOpenMonthlyWrapped && (
            <button
              type="button"
              onClick={onOpenMonthlyWrapped}
              className="btn-duo btn-duo-green px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 shadow-xs"
            >
              <Trophy className="w-3.5 h-3.5 text-[#D4A94F]" />
              <span>Seu Mês em Revista</span>
            </button>
          )}
        </div>
      </div>
      
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

          <div className="flex items-center gap-2 text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] bg-[#FAF8F4]/80 dark:bg-[#102D25]/80 px-3.5 py-2 rounded-xl border border-[#1C4939]/15 dark:border-[#214E3E]">
            <Clock className="w-4 h-4 text-[#1C4939] dark:text-[#D4A94F]" />
            <span>Dia <strong>{burnRate.daysElapsed}</strong> de {burnRate.totalDaysInMonth} ({burnRate.daysRemaining} dias restantes)</span>
          </div>
        </div>

        {/* Métricas Principais de Burn Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm">
            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider block">Gasto Diário Médio</span>
            <p className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] mt-1 font-numeric">
              {formatBRL(burnRate.dailyAverage)}
              <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]"> /dia</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm">
            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider block">Gasto Acumulado</span>
            <p className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] mt-1 font-numeric">
              {formatBRL(burnRate.spentSoFar)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm">
            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider block">Projeção Fim do Mês</span>
            <p className={`text-xl font-extrabold mt-1 font-numeric ${
              burnRate.burnStatus === 'CRITICAL'
                ? 'text-[#B93838] dark:text-rose-400'
                : burnRate.burnStatus === 'WARNING'
                ? 'text-[#9A7220] dark:text-[#D4A94F]'
                : 'text-[#1C4939] dark:text-[#78C6A3]'
            }`}>
              {formatBRL(burnRate.projectedMonthEnd)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm">
            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8] uppercase tracking-wider block">Teto Orçado Mensal</span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-numeric">
                {burnRate.monthlyBudgetTotal > 0 ? formatBRL(burnRate.monthlyBudgetTotal) : (globalLimit ? formatBRL(globalLimit) : 'Sem teto')}
              </p>
              {burnRate.monthlyBudgetTotal === 0 && !globalLimit && (
                <button
                  type="button"
                  onClick={onOpenBudgetModal}
                  className="text-xs font-bold text-[#1C4939] dark:text-[#D4A94F] hover:underline"
                >
                  Definir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Termômetro e Barra de Progresso com Marcador de Tempo */}
        {(burnRate.monthlyBudgetTotal > 0 || (globalLimit && globalLimit > 0)) && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] font-numeric">
              <span>Consumo do Orçamento: <strong>{burnRate.monthlyBudgetTotal > 0 ? Math.round((burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100) : 0}%</strong></span>
              <span>Tempo Transcorrido: <strong>{Math.round((burnRate.daysElapsed / burnRate.totalDaysInMonth) * 100)}%</strong> do mês</span>
            </div>
            
            <div className="relative">
              <div className="progress-duo-track h-3.5">
                <div
                  style={{ width: `${Math.min(100, burnRate.monthlyBudgetTotal > 0 ? Math.round((burnRate.spentSoFar / burnRate.monthlyBudgetTotal) * 100) : 0)}%` }}
                  className={`progress-duo-fill ${
                    burnRate.burnStatus === 'CRITICAL'
                      ? 'bg-[#B93838]'
                      : burnRate.burnStatus === 'WARNING'
                      ? 'bg-[#D4A94F]'
                      : 'bg-[#1C4939]'
                  }`}
                />
              </div>

              {/* Marcador do dia do mês */}
              <div
                style={{ left: `${(burnRate.daysElapsed / burnRate.totalDaysInMonth) * 100}%` }}
                className="absolute -top-1 bottom-0 w-0.5 bg-[#102D25] dark:bg-[#E8E4D9] pointer-events-none"
                title={`Dia ${burnRate.daysElapsed}`}
              />
            </div>

            <div className="flex justify-between text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] pt-1">
              <span>R$ 0</span>
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#1C4939] dark:text-[#78C6A3]">
                <Clock className="w-3 h-3" /> Linha preta = Dia atual
              </span>
              <span>{formatBRL(burnRate.monthlyBudgetTotal > 0 ? burnRate.monthlyBudgetTotal : globalLimit)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. EVOLUÇÃO TEMPORAL (GRÁFICO INTERATIVO SVG) */}
      <FinancialEvolutionChart data={monthlyEvolution} privacyMode={privacyMode} />

      {/* 3. TERMOSTATO DE METAS POR CATEGORIA (LOGO APÓS EVOLUÇÃO FINANCEIRA) */}
      <div className="card-duo p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DDD0] dark:border-[#214E3E] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#1C4939] text-[#D4A94F] shadow-sm">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9]">Metas Orçamentárias por Categoria</h3>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">Acompanhamento em tempo real dos tetos definidos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAiBudgetModal && (
              <button
                type="button"
                onClick={onOpenAiBudgetModal}
                className="btn-duo btn-duo-yellow text-xs px-3.5 py-2 flex items-center gap-1.5"
                title="Sugerir e rebalancear orçamentos com base no seu histórico"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sugerir com</span> I.A
              </button>
            )}

            <button
              type="button"
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-white text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Meta</span>
            </button>
          </div>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Target className="w-10 h-10 text-[#829A90] mx-auto stroke-1" />
            <p className="text-sm font-bold text-[#102D25] dark:text-[#E8E4D9]">Nenhum teto configurado para este mês.</p>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] max-w-sm mx-auto">
              Definir limites por categoria ajuda você a saber exatamente quando parar de gastar antes do fim do mês.
            </p>
            <button
              type="button"
              onClick={onOpenBudgetModal}
              className="btn-duo btn-duo-green text-xs px-4 py-2 mt-2"
            >
              Configurar Primeiro Teto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const hasLimit = b.monthlyLimit > 0;
              return (
                <div
                  key={b.categoryId}
                  className="card-duo p-4 space-y-3 relative hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: b.categoryColorHex || '#1C4939' }}
                      />
                      <span className="font-extrabold text-xs text-[#102D25] dark:text-[#E8E4D9] truncate max-w-[130px]">
                        {b.categoryName}
                      </span>
                    </div>

                    {hasLimit ? (
                      b.isExceeded ? (
                        <span className="badge-duo badge-duo-red text-[10px] flex items-center gap-1 font-bold">
                          <AlertOctagon className="w-3 h-3" /> Estourado
                        </span>
                      ) : b.isWarning ? (
                        <span className="badge-duo badge-duo-yellow text-[10px] flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3" /> Atenção
                        </span>
                      ) : (
                        <span className="badge-duo badge-duo-green text-[10px] flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> No Limite
                        </span>
                      )
                    ) : (
                      <span className="badge-duo bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                        Sem Teto Definido
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
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

      {/* 4. GRÁFICO DONUT INTERATIVO COM DRILLDOWN */}
      <CategoryDonutChart
        distribution={categoryDistribution}
        transactions={transactions}
        privacyMode={privacyMode}
      />

      {/* 5. REGRA 50 / 30 / 20 */}
      <FiftyThirtyTwentyWidget
        transactions={transactions}
        totalIncome={totalIncome}
        privacyMode={privacyMode}
      />

      {/* 6. DETETIVE DE ECONOMIA / RASTREADOR DE VAZAMENTOS */}
      <SavingsLeakageSection
        transactions={transactions}
        recurringBills={recurringBills}
        onOpenWhatIfSimulator={(prefill) => onOpenWhatIfSimulator && onOpenWhatIfSimulator(prefill)}
        privacyMode={privacyMode}
      />

    </div>
  );
};
