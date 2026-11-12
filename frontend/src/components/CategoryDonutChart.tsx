import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  Receipt
} from 'lucide-react';
import { CategoryDistributionItem } from '../types/analytics';
import { Transaction } from '../types/financial';

interface CategoryDonutChartProps {
  distribution: CategoryDistributionItem[];
  transactions: Transaction[];
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

// Paleta moderna e harmoniosa alinhada às regras do DESIGN.md
const MODERN_FINTECH_PALETTE = [
  '#1C4939', // Verde Floresta Institucional
  '#D4A94F', // Dourado Nobre
  '#2563EB', // Azul Safira Moderno
  '#E07A5F', // Terracota / Salmão Nobre
  '#0D9488', // Teal / Petróleo
  '#8B5CF6', // Violeta Suave
  '#F59E0B', // Âmbar Ouro
  '#10B981', // Esmeralda Fresco
  '#64748B', // Slate Neutro
  '#D946EF', // Orquídea
];

/**
 * Constrói o caminho SVG de um setor anular (Donut Slice) matematicamente fechado
 * Evita completamente sobreposições ou distorções de bordas redondas
 */
function describeDonutSlice(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
): string {
  const angleDiff = endAngle - startAngle;

  // Círculo fechado (100% de uma só categoria)
  if (angleDiff >= 2 * Math.PI - 0.001) {
    const midAngle = startAngle + Math.PI;
    const x1Out = cx + rOut * Math.cos(startAngle);
    const y1Out = cy + rOut * Math.sin(startAngle);
    const xMidOut = cx + rOut * Math.cos(midAngle);
    const yMidOut = cy + rOut * Math.sin(midAngle);
    
    const x1In = cx + rIn * Math.cos(startAngle);
    const y1In = cy + rIn * Math.sin(startAngle);
    const xMidIn = cx + rIn * Math.cos(midAngle);
    const yMidIn = cy + rIn * Math.sin(midAngle);

    return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 1 1 ${xMidOut} ${yMidOut} A ${rOut} ${rOut} 0 1 1 ${x1Out} ${y1Out} M ${x1In} ${y1In} A ${rIn} ${rIn} 0 1 0 ${xMidIn} ${yMidIn} A ${rIn} ${rIn} 0 1 0 ${x1In} ${y1In} Z`;
  }

  const x1Out = cx + rOut * Math.cos(startAngle);
  const y1Out = cy + rOut * Math.sin(startAngle);
  const x2Out = cx + rOut * Math.cos(endAngle);
  const y2Out = cy + rOut * Math.sin(endAngle);

  const x2In = cx + rIn * Math.cos(endAngle);
  const y2In = cy + rIn * Math.sin(endAngle);
  const x1In = cx + rIn * Math.cos(startAngle);
  const y1In = cy + rIn * Math.sin(startAngle);

  const largeArcFlag = angleDiff > Math.PI ? 1 : 0;

  return [
    `M ${x1Out} ${y1Out}`,
    `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${x2Out} ${y2Out}`,
    `L ${x2In} ${y2In}`,
    `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${x1In} ${y1In}`,
    'Z',
  ].join(' ');
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  distribution,
  transactions,
  privacyMode,
}) => {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [hoveredCategoryName, setHoveredCategoryName] = useState<string | null>(null);

  const totalExpense = useMemo(() => {
    return distribution.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }, [distribution]);

  // Categoria ativa (hover tem prioridade temporária, ou selecionada, ou nula para exibir o total)
  const activeCategory = useMemo(() => {
    if (!distribution || distribution.length === 0) return null;
    const targetName = hoveredCategoryName || selectedCategoryName;
    if (targetName) {
      return distribution.find((d) => d.categoryName === targetName) || null;
    }
    return null;
  }, [distribution, hoveredCategoryName, selectedCategoryName]);

  // Transações detalhadas da categoria ativa para o Drilldown
  const drilldownTransactions = useMemo(() => {
    const focusCategory = selectedCategoryName 
      ? distribution.find(d => d.categoryName === selectedCategoryName) 
      : activeCategory;

    if (!focusCategory) return [];

    return transactions
      .filter((t) => {
        const matchesCategory = t.categoryId === focusCategory.categoryId || 
          t.description.toLowerCase().includes(focusCategory.categoryName.toLowerCase());
        return matchesCategory && t.type === 'EXPENSE';
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // top 5 gastos
  }, [transactions, selectedCategoryName, activeCategory, distribution]);

  if (!distribution || distribution.length === 0 || totalExpense === 0) {
    return null;
  }

  // Ordena por maior gasto para composição harmônica
  const sortedDistribution = [...distribution].sort((a, b) => b.totalAmount - a.totalAmount);

  // Parâmetros do Donut
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const defaultROut = 118;
  const defaultRIn = 80;
  const activeROut = 124;
  const activeRIn = 76;

  let currentAngle = -Math.PI / 2; // Início no topo às 12 horas
  const count = sortedDistribution.length;
  // Gap angular preciso entre fatias (apenas se houver mais de 1 fatia)
  const padAngle = count > 1 ? 0.045 : 0; // ~2.5 graus de respiro nítido

  const slices = sortedDistribution.map((item, index) => {
    const pct = item.totalAmount / totalExpense;
    const sliceAngle = pct * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = startAngle + sliceAngle;
    currentAngle = endAngle;

    const isSelected = selectedCategoryName === item.categoryName;
    const isHovered = hoveredCategoryName === item.categoryName;
    const isFocused = isSelected || isHovered;

    // Respiro limpo entre fatias
    const effectiveStartAngle = count > 1 ? startAngle + padAngle / 2 : startAngle;
    const effectiveEndAngle = count > 1 ? endAngle - padAngle / 2 : endAngle;

    // Raio expandido suavemente para a fatia em foco
    const rOut = isFocused ? activeROut : defaultROut;
    const rIn = isFocused ? activeRIn : defaultRIn;

    const pathData = describeDonutSlice(
      cx,
      cy,
      rIn,
      rOut,
      effectiveStartAngle,
      effectiveEndAngle
    );

    const color = item.colorHex && item.colorHex !== '#000000'
      ? item.colorHex
      : MODERN_FINTECH_PALETTE[index % MODERN_FINTECH_PALETTE.length];

    return {
      ...item,
      color,
      pct,
      pathData,
      isFocused,
      isSelected,
      isHovered,
    };
  });

  return (
    <div className="card-duo-green p-6 sm:p-8 space-y-6 transition-all duration-200">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
            <PieChart className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Distribuição de Gastos
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20">
                <Sparkles className="w-3 h-3 text-[#D4A94F]" />
                Interativo
              </span>
            </div>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Passe o mouse para inspecionar ou clique para ver os maiores lançamentos
            </p>
          </div>
        </div>

        {selectedCategoryName && (
          <button
            type="button"
            onClick={() => setSelectedCategoryName(null)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/90 dark:bg-[#102D25] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 hover:border-[#D4A94F] shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver Todas as Categorias
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Lado Esquerdo: Donut SVG com Setores Anulares Perfeitos */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[280px] h-[280px] flex items-center justify-center select-none">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="drop-shadow-xs overflow-visible"
            >
              {/* Trilho de Fundo Translúcido */}
              <path
                d={describeDonutSlice(cx, cy, defaultRIn, defaultROut, 0, 2 * Math.PI)}
                fill="currentColor"
                className="text-[#E8E4D9]/40 dark:text-[#16382E]/40"
              />

              {/* Fatias Fechadas e Recortadas Matematicamente (Zero Sobreposição) */}
              {slices.map((slice, index) => (
                <path
                  key={slice.categoryId || index}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                  className="cursor-pointer transition-all duration-200 hover:brightness-105"
                  style={{
                    filter: slice.isFocused 
                      ? `drop-shadow(0 4px 10px ${slice.color}80)` 
                      : 'none',
                    opacity: activeCategory && !slice.isFocused ? 0.45 : 1,
                  }}
                  onMouseEnter={() => setHoveredCategoryName(slice.categoryName)}
                  onMouseLeave={() => setHoveredCategoryName(null)}
                  onClick={() => {
                    setSelectedCategoryName(
                      selectedCategoryName === slice.categoryName ? null : slice.categoryName
                    );
                  }}
                />
              ))}
            </svg>

            {/* Núcleo Central de Finanças */}
            <div 
              className="absolute inset-[82px] rounded-full bg-white/95 dark:bg-[#102D25]/95 border border-[#1C4939]/15 dark:border-[#214E3E] shadow-sm backdrop-blur-xs flex flex-col items-center justify-center text-center p-2.5 pointer-events-none transition-all duration-200"
            >
              <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] line-clamp-1 max-w-[110px]">
                {activeCategory ? activeCategory.categoryName : 'Total de Gastos'}
              </span>

              <p className="text-lg sm:text-xl font-black text-[#102D25] dark:text-[#E8E4D9] mt-0.5 tracking-tight font-mono tabular-nums">
                {activeCategory
                  ? formatBRL(activeCategory.totalAmount, privacyMode)
                  : formatBRL(totalExpense, privacyMode)}
              </p>

              <div className="mt-0.5">
                {activeCategory ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 font-mono tabular-nums">
                    {((activeCategory.totalAmount / totalExpense) * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
                    {sortedDistribution.length} categorias
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4A94F]" />
            <span>Clique numa fatia para abrir o detalhamento</span>
          </div>
        </div>

        {/* Lado Direito: Alternância Inteligente (Detalhamento ou Lista Executiva com Barras) */}
        <div className="lg:col-span-7">
          {selectedCategoryName && activeCategory ? (
            /* Painel de Drilldown da Categoria Selecionada */
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#102D25]/90 border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#214E3E] pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full ring-4 ring-black/5 dark:ring-white/10 shrink-0"
                    style={{ backgroundColor: activeCategory.colorHex || '#1C4939' }}
                  />
                  <div>
                    <h4 className="text-base font-black text-[#102D25] dark:text-[#E8E4D9]">
                      {activeCategory.categoryName}
                    </h4>
                    <span className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
                      {formatBRL(activeCategory.totalAmount, privacyMode)} consumidos este mês
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 font-mono tabular-nums">
                    {((activeCategory.totalAmount / totalExpense) * 100).toFixed(1)}% do total
                  </span>
                </div>
              </div>

              {/* Lista dos Maiores Gastos da Categoria */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#1C4939] dark:text-[#78C6A3]" />
                    Maiores Lançamentos Desta Categoria
                  </p>
                  <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
                    Top {drilldownTransactions.length} gastos
                  </span>
                </div>

                {drilldownTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {drilldownTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E]/60 border border-[#1C4939]/10 dark:border-[#214E3E] text-xs hover:border-[#1C4939]/30 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
                            <span>
                              {tx.accrualDate ? tx.accrualDate.split('-').reverse().join('/') : ''}
                            </span>
                            {tx.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{tx.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right font-black text-[#B93838] dark:text-rose-400 shrink-0 font-mono tabular-nums text-sm">
                          - {formatBRL(tx.amount, privacyMode)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E]/40 border border-dashed border-[#1C4939]/20 text-center">
                    <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                      Nenhum lançamento individual encontrado para os filtros deste período.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryName(null)}
                  className="text-xs font-bold text-[#1C4939] dark:text-[#78C6A3] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para lista completa de categorias
                </button>
              </div>
            </div>
          ) : (
            /* Lista Executiva de Categorias com Barras Proporcionais */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 text-[11px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8]">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1C4939] dark:text-[#78C6A3]" />
                  Categorias por Volume
                </span>
                <span>Participação</span>
              </div>

              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {slices.map((cat, idx) => {
                  const isHovered = hoveredCategoryName === cat.categoryName;
                  const pctFormatted = (cat.pct * 100).toFixed(1);

                  return (
                    <div
                      key={cat.categoryId || idx}
                      onMouseEnter={() => setHoveredCategoryName(cat.categoryName)}
                      onMouseLeave={() => setHoveredCategoryName(null)}
                      onClick={() => setSelectedCategoryName(cat.categoryName)}
                      className={`group cursor-pointer p-3 rounded-xl border transition-all duration-150 ${
                        isHovered
                          ? 'bg-white dark:bg-[#16382E] border-[#1C4939] shadow-xs'
                          : 'bg-white/70 dark:bg-[#102D25]/70 border-[#1C4939]/10 dark:border-[#214E3E] hover:border-[#1C4939]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/50 dark:ring-black/20"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] truncate">
                            {cat.categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono tabular-nums font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                            {formatBRL(cat.totalAmount, privacyMode)}
                          </span>
                          <span className="font-mono tabular-nums font-black text-[11px] px-2 py-0.5 rounded-lg bg-[#FAF8F4] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/15">
                            {pctFormatted}%
                          </span>
                        </div>
                      </div>

                      {/* Micro-Barra de Distribuição Proporcional */}
                      <div className="w-full bg-[#E8E4D9]/40 dark:bg-[#0A1D17]/40 h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.max(2, cat.pct * 100)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};