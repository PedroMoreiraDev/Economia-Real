import React, { useState, useId } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  LineChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { MonthlyEvolutionItem } from '../types/analytics';

interface FinancialEvolutionChartProps {
  data: MonthlyEvolutionItem[];
}

function formatBRL(val: number | undefined): string {
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatCompactBRL(val: number): string {
  if (val >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  }
  if (val >= 1000) {
    return `R$ ${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  }
  return `R$ ${Math.round(val)}`;
}

/**
 * Gera caminho cúbico suave Bézier para um array de pontos
 */
function getSmoothSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'bars' | 'area'>('bars');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [highlightMetric, setHighlightMetric] = useState<'all' | 'income' | 'expense' | 'savings'>('all');
  const chartId = useId();

  // Se não houver dados
  const hasData = data && data.length > 0 && data.some(d => d.income > 0 || d.expense > 0);

  // Totais e médias semestrais
  const totalIncome = data.reduce((acc, m) => acc + (m.income || 0), 0);
  const totalExpense = data.reduce((acc, m) => acc + (m.expense || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const avgIncome = data.length > 0 ? totalIncome / data.length : 0;
  const avgExpense = data.length > 0 ? totalExpense / data.length : 0;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Cálculo da escala máxima para o eixo Y
  const rawMax = Math.max(...data.flatMap(m => [m.income || 0, m.expense || 0]), 1000);
  // Arredonda para cima de forma limpa (múltiplos de 500, 1000, etc.)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalizedMax = Math.ceil(rawMax / (magnitude / 2)) * (magnitude / 2);
  const maxScale = Math.max(normalizedMax, 1000);

  // Dimensões do SVG
  const svgWidth = 680;
  const svgHeight = 250;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Pontos de coordenadas para cada mês
  const count = data.length;
  const step = count > 0 ? chartWidth / count : chartWidth;

  const monthCoords = data.map((item, idx) => {
    const centerX = paddingLeft + (idx + 0.5) * step;
    const incomeH = Math.max(0, ((item.income || 0) / maxScale) * chartHeight);
    const expenseH = Math.max(0, ((item.expense || 0) / maxScale) * chartHeight);
    
    // Saldo líquido normalizado (pode ser positivo ou negativo)
    const positiveSavings = Math.max(0, item.netSavings || 0);
    const savingsH = Math.max(0, (positiveSavings / maxScale) * chartHeight);

    return {
      item,
      idx,
      centerX,
      incomeY: paddingTop + chartHeight - incomeH,
      incomeH,
      expenseY: paddingTop + chartHeight - expenseH,
      expenseH,
      savingsY: paddingTop + chartHeight - savingsH,
      savingsH,
    };
  });

  // Caminhos para curvas spline no modo área
  const incomePoints = monthCoords.map(c => ({ x: c.centerX, y: c.incomeY }));
  const expensePoints = monthCoords.map(c => ({ x: c.centerX, y: c.expenseY }));
  const savingsPoints = monthCoords.map(c => ({ x: c.centerX, y: c.savingsY }));

  const incomeSpline = getSmoothSplinePath(incomePoints);
  const expenseSpline = getSmoothSplinePath(expensePoints);
  const savingsSpline = getSmoothSplinePath(savingsPoints);

  const baseY = paddingTop + chartHeight;
  const firstX = monthCoords[0]?.centerX || paddingLeft;
  const lastX = monthCoords[count - 1]?.centerX || (paddingLeft + chartWidth);

  const incomeAreaPath = count > 0
    ? `${incomeSpline} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
    : '';

  const expenseAreaPath = count > 0
    ? `${expenseSpline} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
    : '';

  // Divisões do Eixo Y (4 linhas de grid)
  const gridLevels = [1, 0.66, 0.33, 0];

  // Mês focado (ou o último mês por padrão se nenhum tiver hover)
  const activeMonthIdx = hoveredIdx !== null ? hoveredIdx : (count > 0 ? count - 1 : null);
  const activeMonthData = activeMonthIdx !== null ? data[activeMonthIdx] : null;

  return (
    <div className="card-duo p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-hidden dark:!bg-[#0F172A] dark:!border-slate-800">
      
      {/* 1. CABEÇALHO DO GRÁFICO & CONTROLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b-2 border-slate-100 dark:!border-slate-800 pb-3 sm:pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_3px_0_0_#047857] shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:!text-white tracking-tight flex items-center gap-2">
                Evolução Financeira
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:!bg-slate-800 text-slate-600 dark:!text-slate-300 border border-slate-200 dark:!border-slate-700">
                  Últimos 6 Meses
                </span>
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:!text-slate-400">
                Histórico comparativo de receitas, despesas e taxa de economia
              </p>
            </div>
          </div>
        </div>

        {/* Alternador de Modo de Visualização (Barras vs Linhas) */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:!bg-slate-800/80 p-1 rounded-2xl border-2 border-slate-200 dark:!border-slate-700 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setViewMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'bars'
                  ? 'bg-white dark:!bg-slate-900 text-slate-900 dark:!text-white shadow-sm border border-slate-200/60 dark:!border-slate-700'
                  : 'text-slate-500 dark:!text-slate-400 hover:text-slate-800 dark:hover:!text-white'
              }`}
              title="Visualização em Barras com Curva de Saldo"
            >
              <BarChart3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Barras & Saldo</span>
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                viewMode === 'area'
                  ? 'bg-white dark:!bg-slate-900 text-[#026CD6] dark:!text-sky-400 shadow-sm border border-slate-200/60 dark:!border-slate-700'
                  : 'text-slate-500 dark:!text-slate-400 hover:text-slate-800 dark:hover:!text-white'
              }`}
              title="Visualização em Curvas de Tendência Fluida"
            >
              <LineChart className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Curvas de Tendência</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIS RESUMO DO SEMESTRE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Receitas Médias */}
        <div 
          onClick={() => setHighlightMetric(prev => prev === 'income' ? 'all' : 'income')}
          className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
            highlightMetric === 'income'
              ? 'bg-emerald-50 dark:!bg-[#0F172A] border-emerald-300 dark:!border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/60'
              : 'bg-slate-50/70 dark:!bg-[#1E293B] border-slate-200/80 dark:!border-slate-800 hover:bg-emerald-50/40 dark:hover:!bg-[#253347] hover:border-emerald-200 dark:hover:!border-emerald-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:!text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:!text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm" />
              Receitas no Período
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:!text-emerald-400" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:!text-white">{formatBRL(totalIncome)}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 mt-0.5">
            Média de <span className="font-black text-emerald-700 dark:!text-emerald-400">{formatBRL(avgIncome)}/mês</span>
          </p>
        </div>

        {/* Despesas Médias */}
        <div 
          onClick={() => setHighlightMetric(prev => prev === 'expense' ? 'all' : 'expense')}
          className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
            highlightMetric === 'expense'
              ? 'bg-rose-50 dark:!bg-[#0F172A] border-rose-300 dark:!border-rose-600 ring-2 ring-rose-200 dark:ring-rose-900/60'
              : 'bg-slate-50/70 dark:!bg-[#1E293B] border-slate-200/80 dark:!border-slate-800 hover:bg-rose-50/40 dark:hover:!bg-[#253347] hover:border-rose-200 dark:hover:!border-rose-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:!text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-rose-700 dark:!text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] shadow-sm" />
              Despesas no Período
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:!text-rose-400" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:!text-white">{formatBRL(totalExpense)}</p>
          <p className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 mt-0.5">
            Média de <span className="font-black text-rose-700 dark:!text-rose-400">{formatBRL(avgExpense)}/mês</span>
          </p>
        </div>

        {/* Saldo Líquido e Taxa de Poupança */}
        <div 
          onClick={() => setHighlightMetric(prev => prev === 'savings' ? 'all' : 'savings')}
          className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all ${
            highlightMetric === 'savings'
              ? 'bg-blue-50 dark:!bg-[#0F172A] border-blue-300 dark:!border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900/60'
              : 'bg-slate-50/70 dark:!bg-[#1E293B] border-slate-200/80 dark:!border-slate-800 hover:bg-blue-50/40 dark:hover:!bg-[#253347] hover:border-blue-200 dark:hover:!border-blue-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:!text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-blue-700 dark:!text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#026CD6] shadow-sm" />
              Saldo Líquido Acumulado
            </span>
            <PiggyBank className="w-3.5 h-3.5 text-blue-600 dark:!text-sky-400" />
          </div>
          <p className={`text-lg font-black ${netSavings >= 0 ? 'text-[#026CD6] dark:!text-sky-400' : 'text-rose-600 dark:!text-rose-400'}`}>
            {formatBRL(netSavings)}
          </p>
          <p className="text-[11px] font-bold text-slate-500 dark:!text-slate-400 mt-0.5">
            {savingsRate >= 0 ? (
              <span className="text-emerald-700 dark:!text-emerald-400 font-black">+{savingsRate}% da renda poupada</span>
            ) : (
              <span className="text-rose-600 dark:!text-rose-400 font-black">{savingsRate}% de déficit</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. ÁREA PRINCIPAL DO GRÁFICO SVG */}
      {!hasData ? (
        <div className="chart-empty-state h-72 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-3xl transition-all">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 dark:from-blue-600/30 dark:to-emerald-600/25 border-2 border-blue-400/40 dark:border-blue-500/50 flex items-center justify-center text-[#026CD6] dark:text-sky-400 shadow-md mb-3.5">
            <Wallet className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h4 className="text-base sm:text-lg font-black tracking-tight text-slate-800 dark:!text-white">
            Nenhum dado consolidado no período
          </h4>
          <p className="text-xs sm:text-sm font-bold max-w-md mt-2 leading-relaxed text-slate-600 dark:!text-slate-100">
            À medida que você adicionar receitas e despesas ou importar seus extratos, o comparativo mês a mês aparecerá aqui.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-[#0F1E36] border border-blue-200 dark:border-blue-800/80 text-xs font-black text-blue-700 dark:text-sky-300 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
            <span>Adicione lançamentos ou extratos para gerar as barras</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full bg-slate-50/40 dark:!bg-[#090E17] border-2 border-slate-100 dark:!border-slate-800 rounded-3xl p-3 sm:p-5">
            
            {/* SVG Responsivo */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible select-none"
            >
              <defs>
                {/* Gradiente Receitas (Barras) */}
                <linearGradient id={`${chartId}-incomeBar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Gradiente Despesas (Barras) */}
                <linearGradient id={`${chartId}-expenseBar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#E11D48" />
                </linearGradient>

                {/* Gradiente Área Receitas */}
                <linearGradient id={`${chartId}-incomeArea`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                  <stop offset="85%" stopColor="#10B981" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradiente Área Despesas */}
                <linearGradient id={`${chartId}-expenseArea`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.30" />
                  <stop offset="85%" stopColor="#F43F5E" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                </linearGradient>

                {/* Filtro de Sombra Suave para Linhas e Pontos */}
                <filter id={`${chartId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.15" />
                </filter>
              </defs>

              {/* 1. Gridlines Horizontais e Eixo Y */}
              {gridLevels.map((lvl, i) => {
                const y = paddingTop + chartHeight * (1 - lvl);
                const valueLabel = formatCompactBRL(maxScale * lvl);

                return (
                  <g key={i}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + chartWidth}
                      y2={y}
                      stroke={lvl === 0 ? '#CBD5E1' : '#E2E8F0'}
                      strokeWidth={lvl === 0 ? 2 : 1}
                      strokeDasharray={lvl === 0 ? undefined : '4 4'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-bold fill-slate-400"
                    >
                      {valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* 2. Áreas de Fundo no Hover do Mês */}
              {monthCoords.map((coord) => {
                const isHovered = hoveredIdx === coord.idx;
                const colWidth = step;
                const colX = paddingLeft + coord.idx * step;

                return (
                  <g key={`hover-bg-${coord.idx}`}>
                    <rect
                      x={colX + 2}
                      y={paddingTop - 10}
                      width={colWidth - 4}
                      height={chartHeight + 20}
                      rx="14"
                      className={`cursor-pointer transition-all duration-150 ${
                        isHovered ? 'fill-blue-50/70 stroke-2 stroke-blue-200/80' : 'fill-transparent'
                      }`}
                      onMouseEnter={() => setHoveredIdx(coord.idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                );
              })}

              {/* 3. MODO 1: BARRAS COMPARATIVAS */}
              {viewMode === 'bars' && (
                <g>
                  {monthCoords.map((coord) => {
                    const isHovered = hoveredIdx === coord.idx;
                    const barWidth = Math.min(22, step * 0.28);
                    const gap = 5;

                    const incomeOpacity = highlightMetric === 'all' || highlightMetric === 'income' ? 1 : 0.25;
                    const expenseOpacity = highlightMetric === 'all' || highlightMetric === 'expense' ? 1 : 0.25;

                    return (
                      <g
                        key={`bar-${coord.idx}`}
                        className="cursor-pointer transition-opacity duration-200"
                        onMouseEnter={() => setHoveredIdx(coord.idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        {/* Barra de Receita */}
                        <rect
                          x={coord.centerX - barWidth - gap / 2}
                          y={coord.incomeY}
                          width={barWidth}
                          height={Math.max(4, coord.incomeH)}
                          rx="6"
                          fill={`url(#${chartId}-incomeBar)`}
                          opacity={incomeOpacity}
                          className="transition-all duration-200"
                          filter={isHovered ? `url(#${chartId}-shadow)` : undefined}
                        />

                        {/* Barra de Despesa */}
                        <rect
                          x={coord.centerX + gap / 2}
                          y={coord.expenseY}
                          width={barWidth}
                          height={Math.max(4, coord.expenseH)}
                          rx="6"
                          fill={`url(#${chartId}-expenseBar)`}
                          opacity={expenseOpacity}
                          className="transition-all duration-200"
                          filter={isHovered ? `url(#${chartId}-shadow)` : undefined}
                        />
                      </g>
                    );
                  })}

                  {/* Linha Spline de Saldo Líquido Sobreposta */}
                  {(highlightMetric === 'all' || highlightMetric === 'savings') && (
                    <g>
                      <path
                        d={savingsSpline}
                        fill="none"
                        stroke="#026CD6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${chartId}-shadow)`}
                        className="transition-all duration-300"
                      />

                      {/* Pontos de Saldo Líquido */}
                      {monthCoords.map((coord) => {
                        const isHovered = hoveredIdx === coord.idx;
                        const isPositive = coord.item.netSavings >= 0;

                        return (
                          <g key={`savings-dot-${coord.idx}`}>
                            <circle
                              cx={coord.centerX}
                              cy={coord.savingsY}
                              r={isHovered ? 6.5 : 4.5}
                              fill={isPositive ? '#10B981' : '#EF4444'}
                              stroke="#FFFFFF"
                              strokeWidth={isHovered ? 3 : 2}
                              filter={`url(#${chartId}-shadow)`}
                              className="transition-all duration-150 cursor-pointer"
                              onMouseEnter={() => setHoveredIdx(coord.idx)}
                              onMouseLeave={() => setHoveredIdx(null)}
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              )}

              {/* 4. MODO 2: ÁREA & TENDÊNCIA FLUÍDA */}
              {viewMode === 'area' && (
                <g>
                  {/* Área e Linha de Receitas */}
                  {(highlightMetric === 'all' || highlightMetric === 'income') && (
                    <g>
                      <path d={incomeAreaPath} fill={`url(#${chartId}-incomeArea)`} />
                      <path
                        d={incomeSpline}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${chartId}-shadow)`}
                      />
                      {monthCoords.map((coord) => (
                        <circle
                          key={`inc-dot-${coord.idx}`}
                          cx={coord.centerX}
                          cy={coord.incomeY}
                          r={hoveredIdx === coord.idx ? 6 : 4}
                          fill="#10B981"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  )}

                  {/* Área e Linha de Despesas */}
                  {(highlightMetric === 'all' || highlightMetric === 'expense') && (
                    <g>
                      <path d={expenseAreaPath} fill={`url(#${chartId}-expenseArea)`} />
                      <path
                        d={expenseSpline}
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${chartId}-shadow)`}
                      />
                      {monthCoords.map((coord) => (
                        <circle
                          key={`exp-dot-${coord.idx}`}
                          cx={coord.centerX}
                          cy={coord.expenseY}
                          r={hoveredIdx === coord.idx ? 6 : 4}
                          fill="#F43F5E"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  )}

                  {/* Linha de Saldo Líquido */}
                  {(highlightMetric === 'all' || highlightMetric === 'savings') && (
                    <g>
                      <path
                        d={savingsSpline}
                        fill="none"
                        stroke="#026CD6"
                        strokeWidth="3"
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {monthCoords.map((coord) => (
                        <circle
                          key={`sav-dot-${coord.idx}`}
                          cx={coord.centerX}
                          cy={coord.savingsY}
                          r={hoveredIdx === coord.idx ? 6 : 4}
                          fill="#026CD6"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  )}
                </g>
              )}

              {/* 5. Rótulos do Eixo X (Meses) */}
              {monthCoords.map((coord) => {
                const isHovered = hoveredIdx === coord.idx;
                return (
                  <text
                    key={`label-${coord.idx}`}
                    x={coord.centerX}
                    y={paddingTop + chartHeight + 22}
                    textAnchor="middle"
                    className={`text-xs select-none transition-colors duration-150 ${
                      isHovered
                        ? 'fill-[#026CD6] font-black'
                        : 'fill-slate-500 font-bold'
                    }`}
                  >
                    {coord.item.monthLabel}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* 4. CARD INFORMATIVO DE DETALHES DO MÊS SELECIONADO */}
          {activeMonthData && (
            <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50/80 dark:!bg-none dark:!bg-[#0B111E] border-2 border-blue-200/80 dark:!border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#026CD6] text-white shadow-sm font-black text-xs uppercase tracking-wider">
                  {activeMonthData.monthLabel}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:!text-white flex items-center gap-2">
                    Resumo de {activeMonthData.monthLabel}
                    {hoveredIdx !== null && (
                      <span className="text-[10px] font-bold text-blue-600 dark:!text-sky-300 bg-blue-100/80 dark:!bg-blue-950/80 border border-blue-200 dark:!border-blue-800 px-2 py-0.5 rounded-full">
                        Em foco
                      </span>
                    )}
                  </h4>
                  <p className="text-xs font-bold text-slate-500 dark:!text-slate-300">
                    Balanço do mês de competência ({activeMonthData.monthIso})
                  </p>
                </div>
              </div>

              {/* Indicadores do Mês */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-black">
                {/* Entradas */}
                <div className="flex items-center gap-1.5 bg-white/90 dark:!bg-[#0F172A] border border-emerald-200 dark:!border-emerald-800/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-slate-500 dark:!text-slate-300 font-bold">Entradas:</span>
                  <span className="text-emerald-700 dark:!text-emerald-400 font-black">+{formatBRL(activeMonthData.income)}</span>
                </div>

                {/* Saídas */}
                <div className="flex items-center gap-1.5 bg-white/90 dark:!bg-[#0F172A] border border-rose-200 dark:!border-rose-800/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
                  <span className="text-slate-500 dark:!text-slate-300 font-bold">Saídas:</span>
                  <span className="text-rose-700 dark:!text-rose-400 font-black">-{formatBRL(activeMonthData.expense)}</span>
                </div>

                {/* Saldo Líquido */}
                <div className={`flex items-center gap-1.5 bg-white/90 dark:!bg-[#0F172A] border px-3 py-1.5 rounded-xl shadow-xs ${
                  activeMonthData.netSavings >= 0
                    ? 'border-blue-200 dark:!border-blue-800/80'
                    : 'border-amber-300 dark:!border-amber-800/80'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#026CD6]" />
                  <span className="text-slate-500 dark:!text-slate-300 font-bold">Saldo:</span>
                  <span className={`font-black ${activeMonthData.netSavings >= 0 ? 'text-[#026CD6] dark:!text-sky-400' : 'text-rose-600 dark:!text-rose-400'}`}>
                    {formatBRL(activeMonthData.netSavings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. LEGENDA INTERATIVA COM GUIA VISUAL */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-black text-slate-600 dark:!text-slate-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHighlightMetric(prev => prev === 'income' ? 'all' : 'income')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              highlightMetric === 'income'
                ? 'bg-emerald-100 dark:!bg-emerald-950/80 text-emerald-800 dark:!text-emerald-300 border border-emerald-300 dark:!border-emerald-800'
                : 'hover:bg-slate-100 dark:hover:!bg-[#1E293B] text-slate-600 dark:!text-slate-300'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-xs" />
            <span>Receitas (Entradas)</span>
          </button>

          <button
            onClick={() => setHighlightMetric(prev => prev === 'expense' ? 'all' : 'expense')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              highlightMetric === 'expense'
                ? 'bg-rose-100 dark:!bg-rose-950/80 text-rose-800 dark:!text-rose-300 border border-rose-300 dark:!border-rose-800'
                : 'hover:bg-slate-100 dark:hover:!bg-[#1E293B] text-slate-600 dark:!text-slate-300'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#F43F5E] shadow-xs" />
            <span>Despesas (Saídas)</span>
          </button>

          <button
            onClick={() => setHighlightMetric(prev => prev === 'savings' ? 'all' : 'savings')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              highlightMetric === 'savings'
                ? 'bg-blue-100 dark:!bg-blue-950/80 text-blue-800 dark:!text-blue-300 border border-blue-300 dark:!border-blue-800'
                : 'hover:bg-slate-100 dark:hover:!bg-[#1E293B] text-slate-600 dark:!text-slate-300'
            }`}
          >
            <span className="w-3 h-1 bg-[#026CD6] rounded-full shadow-xs" />
            <span>Saldo Líquido</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-400 dark:!text-slate-400">
          💡 Dica: Passe o mouse para inspecionar cada mês ou alterne entre Barras e Curvas
        </span>
      </div>

    </div>
  );
};
