import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowDownRight, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { RecurringBill } from '../types/recurring';
import { CreditCard } from '../types/card';

interface CashFlowForecastChartProps {
  currentBalance: number;
  recurringBills: RecurringBill[];
  creditCards?: CreditCard[];
  estimatedMonthlyIncome?: number;
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({
  currentBalance,
  recurringBills,
  creditCards = [],
  estimatedMonthlyIncome = 0,
  privacyMode,
}) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Projeta os próximos 30 dias a partir de hoje
  const { dailyPoints, minBalance, minDay, hasNegativeDip, totalUpcomingDebits, upcomingEventsCount } = useMemo(() => {
    const today = new Date();
    const points = [];
    let runningBalance = currentBalance;
    let lowest = runningBalance;
    let lowestDayStr = '';
    let totalDebits = 0;
    let eventsCounter = 0;

    for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset);
      const dayOfMonth = date.getDate();
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayOfWeekStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });

      const dayEvents: { title: string; amount: number; type: 'INCOME' | 'EXPENSE' }[] = [];

      // 1. Receita estimada se o usuário definiu (ex: dia 5 ou virada de mês)
      if (estimatedMonthlyIncome > 0 && dayOffset > 0 && dayOfMonth === 5) {
        runningBalance += estimatedMonthlyIncome;
        dayEvents.push({
          title: 'Entrada salarial prevista',
          amount: estimatedMonthlyIncome,
          type: 'INCOME',
        });
        eventsCounter++;
      }

      // 2. Contas recorrentes que vencem neste dia
      recurringBills.forEach((bill) => {
        if (bill.dayOfMonth === dayOfMonth) {
          runningBalance -= bill.amount;
          totalDebits += bill.amount;
          dayEvents.push({
            title: bill.description,
            amount: bill.amount,
            type: 'EXPENSE',
          });
          eventsCounter++;
        }
      });

      // 3. Faturas de cartão que vencem neste dia
      creditCards.forEach((card) => {
        if (card.dueDay === dayOfMonth) {
          const estimatedInvoice = (card.creditLimit || 0) * 0.25;
          if (estimatedInvoice > 0) {
            runningBalance -= estimatedInvoice;
            totalDebits += estimatedInvoice;
            dayEvents.push({
              title: `Vencimento Cartão ${card.name}`,
              amount: estimatedInvoice,
              type: 'EXPENSE',
            });
            eventsCounter++;
          }
        }
      });

      if (runningBalance < lowest) {
        lowest = runningBalance;
        lowestDayStr = dateStr;
      }

      points.push({
        dayOffset,
        dateStr,
        dayOfWeekStr,
        dayOfMonth,
        balance: runningBalance,
        events: dayEvents,
        hasEvents: dayEvents.length > 0,
      });
    }

    return {
      dailyPoints: points,
      minBalance: lowest,
      minDay: lowestDayStr || points[0].dateStr,
      hasNegativeDip: lowest < 0,
      totalUpcomingDebits: totalDebits,
      upcomingEventsCount: eventsCounter,
    };
  }, [currentBalance, recurringBills, creditCards, estimatedMonthlyIncome]);

  // Geometria do Gráfico de Linha SVG
  const width = 640;
  const height = 190;
  const paddingX = 40;
  const paddingY = 32;

  const maxVal = Math.max(...dailyPoints.map((p) => p.balance), 100);
  const minVal = Math.min(...dailyPoints.map((p) => p.balance), 0);
  const valRange = maxVal - minVal || 1;

  const getX = (index: number) => paddingX + (index / (dailyPoints.length - 1)) * (width - 2 * paddingX);
  const getY = (val: number) => height - paddingY - ((val - minVal) / valRange) * (height - 2 * paddingY);
  const zeroY = getY(0);

  const pathD = dailyPoints.reduce((acc, p, idx) => {
    const x = getX(idx);
    const y = getY(p.balance);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = `${pathD} L ${getX(dailyPoints.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  const focusedIndex = hoveredDay !== null ? hoveredDay : selectedDay;
  const focusedPoint = focusedIndex !== null ? dailyPoints[focusedIndex] : null;

  return (
    <div className="card-duo-green p-6 sm:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Previsão de Saldo Diário (Próximos 30 Dias)
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                hasNegativeDip
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              }`}>
                {hasNegativeDip ? 'Risco de Negativo' : 'Saldo Seguro'}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Projeção futura de caixa antecipando suas contas cadastradas e faturas
            </p>
          </div>
        </div>

        {/* Botão de Ajuda Didática */}
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/90 dark:bg-[#102D25] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 hover:border-[#D4A94F] shadow-xs transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-[#D4A94F]" />
          <span>Entenda esta projeção</span>
          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Painel Explicativo Colapsável */}
      {showExplanation && (
        <div className="p-5 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25]/95 border border-[#D4A94F]/40 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1C4939] dark:text-[#78C6A3]" />
            <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
              Como funciona o gráfico de Previsão de Saldo Diário?
            </h4>
          </div>
          <p className="text-xs text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
            Este gráfico <strong>não mostra o passado</strong>. Ele é um simulador preditivo para os <strong>próximos 30 dias</strong> a partir de hoje:
          </p>
          <ul className="text-xs text-[#526B61] dark:text-[#9AB3A8] space-y-1.5 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#D4A94F] font-bold">1.</span>
              <span><strong>Ponto de Partida:</strong> Começa exatamente no seu saldo disponível hoje nas suas contas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A94F] font-bold">2.</span>
              <span><strong>Quedas na Linha:</strong> Representam os dias exatos em que suas contas cadastradas (aluguel, água, luz, internet, assinaturas) e faturas de cartão vão vencer e debitar.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A94F] font-bold">3.</span>
              <span><strong>Subidas na Linha:</strong> Ocorrem no dia previsto de entrada salarial (caso cadastrado).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4A94F] font-bold">4.</span>
              <span><strong>Objetivo Principal:</strong> Evitar que você pague juros de cheque especial, mostrando com antecedência qual será o seu menor saldo do mês.</span>
            </li>
          </ul>
        </div>
      )}

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#102D25]/80 border border-[#1C4939]/15 dark:border-[#214E3E]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
            Saldo Inicial (Hoje)
          </span>
          <span className="text-base font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-mono tabular-nums">
            {formatBRL(currentBalance, privacyMode)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#102D25]/80 border border-[#1C4939]/15 dark:border-[#214E3E]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
            Contas Fixas a Debitar (30d)
          </span>
          <span className="text-base font-extrabold text-[#B93838] dark:text-rose-400 font-mono tabular-nums">
            - {formatBRL(totalUpcomingDebits, privacyMode)}
          </span>
          <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] block mt-0.5">
            {upcomingEventsCount} despesas mapeadas
          </span>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          hasNegativeDip 
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300' 
            : 'bg-white/80 dark:bg-[#102D25]/80 border-[#1C4939]/15 dark:border-[#214E3E]'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
            Menor Saldo Esperado
          </span>
          <span className={`text-base font-extrabold font-mono tabular-nums ${
            minBalance < 0 ? 'text-[#B93838] dark:text-rose-400' : 'text-[#102D25] dark:text-[#E8E4D9]'
          }`}>
            {formatBRL(minBalance, privacyMode)}
          </span>
          <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] block mt-0.5">
            previsto para o dia {minDay}
          </span>
        </div>
      </div>

      {/* Gráfico SVG de Projeção */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C4939" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1C4939" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linha Zero (se houver saldo negativo) */}
          {minVal < 0 && (
            <line
              x1={paddingX}
              y1={zeroY}
              x2={width - paddingX}
              y2={zeroY}
              stroke="#B93838"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-70"
            />
          )}

          {/* Área sombreada */}
          <path d={areaD} fill="url(#forecastAreaGrad)" />

          {/* Linha de Projeção do Saldo */}
          <path
            d={pathD}
            fill="none"
            stroke={hasNegativeDip ? '#D4A94F' : '#1C4939'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos Diários Interativos */}
          {dailyPoints.map((point, idx) => {
            const x = getX(idx);
            const y = getY(point.balance);
            const isHovered = hoveredDay === idx;
            const isSelected = selectedDay === idx;
            const isFocused = isHovered || isSelected;
            const hasEvents = point.hasEvents;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredDay(idx)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
              >
                {/* Linha guia vertical */}
                {isFocused && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#D4A94F"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Marcador de Evento (Anel com destaque se houver conta no dia) */}
                {hasEvents ? (
                  <g>
                    <circle
                      cx={x}
                      cy={y}
                      r={isFocused ? 7 : 5}
                      fill="#D4A94F"
                      stroke="#102D25"
                      strokeWidth={2}
                      className="transition-all duration-150 animate-pulse"
                    />
                  </g>
                ) : (
                  <circle
                    cx={x}
                    cy={y}
                    r={isFocused ? 5 : 2.5}
                    fill={isFocused ? '#D4A94F' : '#1C4939'}
                    stroke="#FAF8F4"
                    strokeWidth={1}
                    className="transition-all duration-150"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Eixo de Datas inferior */}
        <div className="flex justify-between text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8] px-4 pt-1">
          <span>Hoje ({dailyPoints[0]?.dateStr})</span>
          <span>+10 dias ({dailyPoints[10]?.dateStr})</span>
          <span>+20 dias ({dailyPoints[20]?.dateStr})</span>
          <span>+30 dias ({dailyPoints[30]?.dateStr})</span>
        </div>
      </div>

      {/* Detalhe do Dia Inspecionado */}
      {focusedPoint ? (
        <div className="p-4 rounded-xl bg-white/95 dark:bg-[#102D25]/95 border border-[#D4A94F]/40 shadow-sm space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8]">
                Previsão para {focusedPoint.dateStr} ({focusedPoint.dayOfWeekStr})
              </span>
              <p className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] text-sm mt-0.5">
                Saldo Projetado: <strong className={`font-mono tabular-nums ${focusedPoint.balance < 0 ? 'text-rose-600' : 'text-[#1C4939] dark:text-[#78C6A3]'}`}>
                  {formatBRL(focusedPoint.balance, privacyMode)}
                </strong>
              </p>
            </div>

            <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
              {focusedPoint.events.length === 0 ? 'Nenhuma despesa agendada neste dia' : `${focusedPoint.events.length} movimentação(ões)`}
            </span>
          </div>

          {focusedPoint.events.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#214E3E] space-y-1.5">
              {focusedPoint.events.map((ev, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1.5">
                    {ev.type === 'INCOME' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    {ev.title}
                  </span>
                  <span className={`font-mono tabular-nums font-bold ${ev.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ev.type === 'INCOME' ? '+' : '-'} {formatBRL(ev.amount, privacyMode)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#102D25]/60 border border-[#1C4939]/10 text-center text-xs text-[#526B61] dark:text-[#9AB3A8]">
          💡 Passe o mouse ou clique em qualquer ponto da linha para ver o saldo previsto e as contas agendadas daquele dia.
        </div>
      )}
    </div>
  );
};