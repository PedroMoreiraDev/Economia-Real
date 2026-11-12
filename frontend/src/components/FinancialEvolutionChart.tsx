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
  privacyMode?: boolean;
}

function formatBRLGlobal(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatCompactBRLGlobal(val: number, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
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

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({ data, privacyMode }) => {
  const formatBRL = (val: number | undefined) => formatBRLGlobal(val, privacyMode);
  const formatCompactBRL = (val: number) => formatCompactBRLGlobal(val, privacyMode);

  const [viewMode, setViewMode] = useState<'bars' | 'area'>('bars');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [highlightMetric, setHighlightMetric] = useState<'all' | 'income' | 'expense' | 'savings'>('all');
  const chartId = useId();

  const hasData = data && data.length > 0 && data.some(d => d.income > 0 || d.expense > 0);

  const totalIncome = data.reduce((acc, m) => acc + (m.income || 0), 0);
  const totalExpense = data.reduce((acc, m) => acc + (m.expense || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const avgIncome = data.length > 0 ? totalIncome / data.length : 0;
  const avgExpense = data.length > 0 ? totalExpense / data.length : 0;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const rawMax = Math.max(...data.flatMap(m => [m.income || 0, m.expense || 0]), 1000);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalizedMax = Math.ceil(rawMax / (magnitude / 2)) * (magnitude / 2);
  const maxScale = Math.max(normalizedMax, 1000);

  const svgWidth = 680;
  const svgHeight = 250;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const count = data.length;
  const step = count > 0 ? chartWidth / count : chartWidth;

  const monthCoords = data.map((item, idx) => {
    const centerX = paddingLeft + (idx + 0.5) * step;
    const incomeH = Math.max(0, ((item.income || 0) / maxScale) * chartHeight);
    const expenseH = Math.max(0, ((item.expense || 0) / maxScale) * chartHeight);
    
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

  const gridLevels = [1, 0.66, 0.33, 0];

  const activeMonthIdx = hoveredIdx !== null ? hoveredIdx : (count > 0 ? count - 1 : null);
  const activeMonthData = activeMonthIdx !== null ? data[activeMonthIdx] : null;

  return (
    <div className="card-duo p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-hidden">
      
      {/* 1. CABEÇALHO DO GRÁFICO & CONTROLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-[#E2DDD0] dark:border-[#214E3E] pb-3 sm:pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/30 shadow-xs shrink-0">
              <TrendingUp className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight flex items-center gap-2">
                Evolução Financeira
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFECE3] dark:bg-[#16382E] text-[#355248] dark:text-[#D4A94F] border border-[#D5CFC0] dark:border-[#285C49]">
                  Últimos 6 Meses
                </span>
              </h3>
              <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                Histórico comparativo de receitas, despesas e taxa de economia líquida
              </p>
            </div>
          </div>
        </div>

        {/* Alternador de Modo de Visualização (Barras vs Linhas) */}
        <div className="flex items-center gap-3">
          <div className="bg-[#EFECE3] dark:bg-[#0D241D] p-1 rounded-xl border border-[#D5CFC0] dark:border-[#214E3E] flex items-center gap-1">
            <button
              onClick={() => setViewMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'bars'
                  ? 'bg-[#102D25] text-[#E8E4D9] dark:bg-[#D4A94F] dark:text-[#102D25] shadow-xs'
                  : 'text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9]'
              }`}
              title="Visualização em Barras com Curva de Saldo"
            >
              <BarChart3 className="w-3.5 h-3.5 stroke-[2.3]" />
              <span>Barras & Saldo</span>
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'area'
                  ? 'bg-[#102D25] text-[#E8E4D9] dark:bg-[#D4A94F] dark:text-[#102D25] shadow-xs'
                  : 'text-[#526B61] dark:text-[#9AB3A8] hover:text-[#102D25] dark:hover:text-[#E8E4D9]'
              }`}
              title="Visualização em Curvas de Tendência Fluida"
            >
              <LineChart className="w-3.5 h-3.5 stroke-[2.3]" />
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
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            highlightMetric === 'income'
              ? 'bg-[#E6EFEA] dark:bg-[#16382E] border-[#1C4939] dark:border-[#78C6A3] ring-1 ring-[#1C4939]/30'
              : 'bg-[#EFECE3]/60 dark:bg-[#16382E]/50 border-[#D5CFC0] dark:border-[#214E3E] hover:border-[#1C4939]/50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] mb-1">
            <span className="flex items-center gap-1.5 text-[#1C4939] dark:text-[#78C6A3]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]" />
              Receitas no Período
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1C4939] dark:text-[#78C6A3]" />
          </div>
          <p className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-numeric">{formatBRL(totalIncome)}</p>
          <p className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5 font-numeric">
            Média de <span className="font-bold text-[#1C4939] dark:text-[#78C6A3]">{formatBRL(avgIncome)}/mês</span>
          </p>
        </div>

        {/* Despesas Médias */}
        <div 
          onClick={() => setHighlightMetric(prev => prev === 'expense' ? 'all' : 'expense')}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            highlightMetric === 'expense'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-[#B93838] ring-1 ring-rose-300'
              : 'bg-[#EFECE3]/60 dark:bg-[#16382E]/50 border-[#D5CFC0] dark:border-[#214E3E] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] mb-1">
            <span className="flex items-center gap-1.5 text-[#B93838] dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B93838]" />
              Despesas no Período
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#B93838] dark:text-rose-400" />
          </div>
          <p className="text-lg font-extrabold text-[#102D25] dark:text-[#E8E4D9] font-numeric">{formatBRL(totalExpense)}</p>
          <p className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5 font-numeric">
            Média de <span className="font-bold text-[#B93838] dark:text-rose-400">{formatBRL(avgExpense)}/mês</span>
          </p>
        </div>

        {/* Saldo Líquido e Taxa de Poupança (Dourado Prestige) */}
        <div 
          onClick={() => setHighlightMetric(prev => prev === 'savings' ? 'all' : 'savings')}
          className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
            highlightMetric === 'savings'
              ? 'bg-[#F7EFE0] dark:bg-[#16382E] border-[#D4A94F] ring-1 ring-[#D4A94F]/40'
              : 'bg-[#EFECE3]/60 dark:bg-[#16382E]/50 border-[#D5CFC0] dark:border-[#214E3E] hover:border-[#D4A94F]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] mb-1">
            <span className="flex items-center gap-1.5 text-[#9A7220] dark:text-[#D4A94F]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A94F]" />
              Saldo Líquido Acumulado
            </span>
            <PiggyBank className="w-3.5 h-3.5 text-[#9A7220] dark:text-[#D4A94F]" />
          </div>
          <p className={`text-lg font-extrabold font-numeric ${netSavings >= 0 ? 'text-[#102D25] dark:text-[#D4A94F]' : 'text-[#B93838] dark:text-rose-400'}`}>
            {formatBRL(netSavings)}
          </p>
          <p className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5">
            {savingsRate >= 0 ? (
              <span className="text-[#1C4939] dark:text-[#78C6A3] font-bold">+{savingsRate}% da renda poupada</span>
            ) : (
              <span className="text-[#B93838] dark:text-rose-400 font-bold">{savingsRate}% de déficit</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. ÁREA PRINCIPAL DO GRÁFICO SVG */}
      {!hasData ? (
        <div className="h-72 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#D5CFC0] dark:border-[#214E3E] bg-[#EFECE3]/40 dark:bg-[#0D241D] rounded-2xl transition-all">
          <div className="w-14 h-14 rounded-2xl bg-[#102D25] border border-[#D4A94F]/40 flex items-center justify-center text-[#D4A94F] shadow-sm mb-3.5">
            <Wallet className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h4 className="text-base sm:text-lg font-extrabold tracking-tight text-[#102D25] dark:text-[#E8E4D9]">
            Nenhum dado consolidado no período
          </h4>
          <p className="text-xs sm:text-sm font-medium max-w-md mt-2 leading-relaxed text-[#526B61] dark:text-[#9AB3A8]">
            À medida que você adicionar receitas e despesas ou importar seus extratos, o comparativo mês a mês aparecerá aqui.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7EFE0] dark:bg-[#16382E] border border-[#D4A94F]/40 text-xs font-bold text-[#102D25] dark:text-[#D4A94F]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A94F] shrink-0" />
            <span>Adicione lançamentos ou extratos para gerar as barras</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full bg-[#EFECE3]/40 dark:bg-[#0D241D] border border-[#D5CFC0] dark:border-[#214E3E] rounded-2xl p-3 sm:p-5">
            {/* Tooltip Flutuante Suave com Efeito Glassmorphism & Borda Dourada Semi-translúcida */}
            {hoveredIdx !== null && (() => {
              const hoveredCoord = monthCoords.find((c) => c.idx === hoveredIdx);
              if (!hoveredCoord) return null;

              const percentX = Math.round((hoveredCoord.centerX / svgWidth) * 100);
              // Garante que o tooltip não corte nas extremidades esquerda ou direita
              const clampedLeft = Math.max(16, Math.min(84, percentX));

              return (
                <div
                  className="absolute pointer-events-none z-30 transition-all duration-150 ease-out -translate-x-1/2 top-4 sm:top-5 animate-fade-in"
                  style={{ left: `${clampedLeft}%` }}
                >
                  <div className="backdrop-blur-md bg-[#102D25]/92 dark:bg-[#0A1D17]/95 border border-[#D4A94F]/35 shadow-2xl rounded-2xl p-3 text-xs text-[#E8E4D9] space-y-1.5 min-w-[190px] ring-1 ring-black/10">
                    <div className="flex items-center justify-between border-b border-[#285E4B] pb-1.5">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-[#D4A94F] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A94F] animate-pulse" />
                        {hoveredCoord.item.monthLabel}
                      </span>
                      <span className="text-[10px] text-[#9AB3A8] font-semibold">
                        {hoveredCoord.item.monthIso}
                      </span>
                    </div>

                    <div className="space-y-1 font-numeric text-[11px] font-bold">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#78C6A3]">
                          <span className="w-2 h-2 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]" /> Entradas:
                        </span>
                        <span className="font-extrabold text-[#78C6A3]">+{formatBRL(hoveredCoord.item.income)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-rose-300">
                          <span className="w-2 h-2 rounded-full bg-[#B93838]" /> Saídas:
                        </span>
                        <span className="font-extrabold text-rose-300">-{formatBRL(hoveredCoord.item.expense)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#285E4B]/60">
                        <span className="flex items-center gap-1.5 text-[#D4A94F]">
                          <span className="w-2 h-2 rounded-full bg-[#D4A94F]" /> Saldo Líquido:
                        </span>
                        <span className={`font-extrabold ${hoveredCoord.item.netSavings >= 0 ? 'text-[#D4A94F]' : 'text-rose-400'}`}>
                          {formatBRL(hoveredCoord.item.netSavings)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SVG Responsivo */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible select-none"
            >
              <defs>
                {/* Gradiente Receitas (Barras: Verde #1C4939 -> #102D25) */}
                <linearGradient id={`${chartId}-incomeBar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#286650" />
                  <stop offset="100%" stopColor="#1C4939" />
                </linearGradient>

                {/* Gradiente Despesas (Barras) */}
                <linearGradient id={`${chartId}-expenseBar`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D65A5A" />
                  <stop offset="100%" stopColor="#B93838" />
                </linearGradient>

                {/* Gradiente Área Receitas */}
                <linearGradient id={`${chartId}-incomeArea`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1C4939" stopOpacity="0.35" />
                  <stop offset="85%" stopColor="#1C4939" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#1C4939" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradiente Área Despesas */}
                <linearGradient id={`${chartId}-expenseArea`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B93838" stopOpacity="0.28" />
                  <stop offset="85%" stopColor="#B93838" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#B93838" stopOpacity="0.0" />
                </linearGradient>

                {/* Filtro de Sombra Suave */}
                <filter id={`${chartId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#102D25" floodOpacity="0.18" />
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
                      stroke={lvl === 0 ? '#B5AFA0' : '#D5CFC0'}
                      strokeOpacity={0.5}
                      strokeWidth={lvl === 0 ? 1.5 : 1}
                      strokeDasharray={lvl === 0 ? undefined : '4 4'}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-bold fill-[#526B61] dark:fill-[#9AB3A8]"
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
                      rx="12"
                      className={`cursor-pointer transition-all duration-150 ${
                        isHovered ? 'fill-[#D4A94F]/15 stroke-1 stroke-[#D4A94F]/50' : 'fill-transparent'
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
                          rx="5"
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
                          rx="5"
                          fill={`url(#${chartId}-expenseBar)`}
                          opacity={expenseOpacity}
                          className="transition-all duration-200"
                          filter={isHovered ? `url(#${chartId}-shadow)` : undefined}
                        />
                      </g>
                    );
                  })}

                  {/* Linha Spline de Saldo Líquido Sobreposta em Dourado #D4A94F */}
                  {(highlightMetric === 'all' || highlightMetric === 'savings') && (
                    <g>
                      <path
                        d={savingsSpline}
                        fill="none"
                        stroke="#D4A94F"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#${chartId}-shadow)`}
                        className="transition-all duration-300"
                      />

                      {monthCoords.map((coord) => {
                        const isHovered = hoveredIdx === coord.idx;
                        const isPositive = coord.item.netSavings >= 0;

                        return (
                          <g key={`savings-dot-${coord.idx}`}>
                            <circle
                              cx={coord.centerX}
                              cy={coord.savingsY}
                              r={isHovered ? 6.5 : 4.5}
                              fill={isPositive ? '#D4A94F' : '#B93838'}
                              stroke="#102D25"
                              strokeWidth={isHovered ? 2.5 : 2}
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
                  {(highlightMetric === 'all' || highlightMetric === 'income') && (
                    <g>
                      <path d={incomeAreaPath} fill={`url(#${chartId}-incomeArea)`} />
                      <path
                        d={incomeSpline}
                        fill="none"
                        stroke="#1C4939"
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
                          fill="#1C4939"
                          stroke="#FAF8F4"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  )}

                  {(highlightMetric === 'all' || highlightMetric === 'expense') && (
                    <g>
                      <path d={expenseAreaPath} fill={`url(#${chartId}-expenseArea)`} />
                      <path
                        d={expenseSpline}
                        fill="none"
                        stroke="#B93838"
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
                          fill="#B93838"
                          stroke="#FAF8F4"
                          strokeWidth="2"
                          className="transition-all duration-150"
                        />
                      ))}
                    </g>
                  )}

                  {(highlightMetric === 'all' || highlightMetric === 'savings') && (
                    <g>
                      <path
                        d={savingsSpline}
                        fill="none"
                        stroke="#D4A94F"
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
                          fill="#D4A94F"
                          stroke="#102D25"
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
                        ? 'fill-[#102D25] dark:fill-[#D4A94F] font-extrabold'
                        : 'fill-[#526B61] dark:fill-[#9AB3A8] font-bold'
                    }`}
                  >
                    {coord.item.monthLabel}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* 4. CARD INFORMATIVO DE DETALHES DO MÊS SELECIONADO COM ESTÉTICA FINTECH */}
          {activeMonthData && (
            <div className="backdrop-blur-md bg-[#FAF8F4]/90 dark:bg-[#102D25]/90 border border-[#D4A94F]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 font-extrabold text-xs uppercase tracking-wider shadow-xs">
                  {activeMonthData.monthLabel}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-2">
                    Resumo de {activeMonthData.monthLabel}
                    {hoveredIdx !== null && (
                      <span className="text-[10px] font-bold text-[#102D25] bg-[#D4A94F] px-2 py-0.5 rounded-full shadow-2xs">
                        Em foco
                      </span>
                    )}
                  </h4>
                  <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                    Balanço consolidado de competência ({activeMonthData.monthIso})
                  </p>
                </div>
              </div>

              {/* Indicadores do Mês */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold font-numeric">
                <div className="flex items-center gap-1.5 bg-[#EFECE3]/70 dark:bg-[#16382E] border border-[#1C4939]/30 dark:border-[#285E4B] px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]" />
                  <span className="text-[#526B61] dark:text-[#9AB3A8]">Entradas:</span>
                  <span className="text-[#1C4939] dark:text-[#78C6A3] font-extrabold">+{formatBRL(activeMonthData.income)}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#EFECE3]/70 dark:bg-[#16382E] border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B93838]" />
                  <span className="text-[#526B61] dark:text-[#9AB3A8]">Saídas:</span>
                  <span className="text-[#B93838] dark:text-rose-300 font-extrabold">-{formatBRL(activeMonthData.expense)}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#FAF3E3] dark:bg-[#16382E] border border-[#D4A94F]/40 px-3 py-1.5 rounded-xl shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A94F]" />
                  <span className="text-[#526B61] dark:text-[#9AB3A8]">Saldo:</span>
                  <span className={`font-extrabold ${activeMonthData.netSavings >= 0 ? 'text-[#102D25] dark:text-[#D4A94F]' : 'text-[#B93838] dark:text-rose-400'}`}>
                    {formatBRL(activeMonthData.netSavings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. LEGENDA INTERATIVA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-bold text-[#355248] dark:text-[#B8C7C0]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setHighlightMetric(prev => prev === 'income' ? 'all' : 'income')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              highlightMetric === 'income'
                ? 'bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/30'
                : 'hover:bg-[#EFECE3] dark:hover:bg-[#16382E]'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#1C4939] dark:bg-[#78C6A3]" />
            <span>Receitas (Entradas)</span>
          </button>

          <button
            onClick={() => setHighlightMetric(prev => prev === 'expense' ? 'all' : 'expense')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              highlightMetric === 'expense'
                ? 'bg-rose-100 dark:bg-rose-950/80 text-[#B93838] dark:text-rose-300 border border-rose-300'
                : 'hover:bg-[#EFECE3] dark:hover:bg-[#16382E]'
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#B93838]" />
            <span>Despesas (Saídas)</span>
          </button>

          <button
            onClick={() => setHighlightMetric(prev => prev === 'savings' ? 'all' : 'savings')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
              highlightMetric === 'savings'
                ? 'bg-[#F7EFE0] dark:bg-[#16382E] text-[#102D25] dark:text-[#D4A94F] border border-[#D4A94F]/50'
                : 'hover:bg-[#EFECE3] dark:hover:bg-[#16382E]'
            }`}
          >
            <span className="w-3 h-1 bg-[#D4A94F] rounded-full" />
            <span>Saldo Líquido</span>
          </button>
        </div>

        <span className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
          Dica: Passe o mouse para inspecionar cada mês ou alterne entre Barras e Curvas
        </span>
      </div>

    </div>
  );
};
