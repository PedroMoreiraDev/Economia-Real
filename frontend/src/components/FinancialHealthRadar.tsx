import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  ShieldCheck 
} from 'lucide-react';
import { BudgetProgressDto } from '../types/budget';
import { SavingsGoal } from '../types/goal';
import { RecurringBill } from '../types/recurring';

interface FinancialHealthRadarProps {
  totalIncome: number;
  totalExpense: number;
  budgets: BudgetProgressDto[];
  savingsGoals?: SavingsGoal[];
  recurringBills?: RecurringBill[];
  creditCardExpense?: number;
}

interface AxisScore {
  name: string;
  label: string;
  score: number; // 0 a 100
  detail: string;
  explanation: string;
  howToImprove: string;
}

export const FinancialHealthRadar: React.FC<FinancialHealthRadarProps> = ({
  totalIncome,
  totalExpense,
  budgets,
  savingsGoals = [],
  recurringBills = [],
  creditCardExpense = 0,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [selectedAxisName, setSelectedAxisName] = useState<string | null>(null);

  const { axes, overallScore, qualitativeStatus, weakestAxis } = useMemo(() => {
    const income = Math.max(0, totalIncome);
    const expense = Math.max(0, totalExpense);

    // 1. Taxa de Poupança (Ideal: 20-30%+)
    const netSavings = income - expense;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;
    const scorePoupanca = Math.min(100, Math.max(0, Math.round(savingsRate * 3.33)));

    // 2. Controle de Cartão e Dívidas (Ideal: fatura < 30% da renda)
    const cardRatio = income > 0 
      ? (creditCardExpense / income) * 100 
      : (expense > 0 ? (creditCardExpense / expense) * 100 : 0);
    let scoreCartao = 100;
    if (cardRatio > 30) {
      scoreCartao = Math.max(10, Math.round(100 - (cardRatio - 30) * 1.8));
    }

    // 3. Reserva & Metas (Meses de gastos cobertos pelas metas de poupança: ideal 6 meses)
    const totalGoalsAmount = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const monthlyBurn = expense > 0 ? expense : 1500;
    const monthsCovered = totalGoalsAmount / monthlyBurn;
    const scoreReserva = Math.min(100, Math.max(15, Math.round((monthsCovered / 6) * 100)));

    // 4. Aderência ao Orçamento (% de categorias sem estouro)
    let scoreOrcamento = 100;
    if (budgets.length > 0) {
      const withinLimit = budgets.filter((b) => !b.isExceeded).length;
      scoreOrcamento = Math.round((withinLimit / budgets.length) * 100);
    }

    // 5. Previsibilidade de Custos Fixos (Peso das despesas fixas sobre a renda: ideal 30-50%)
    const fixedTotal = recurringBills.reduce((sum, r) => sum + (r.amount || 0), 0);
    const fixedRatio = income > 0 ? (fixedTotal / income) * 100 : (expense > 0 ? (fixedTotal / expense) * 100 : 0);
    let scorePrevisibilidade = 100;
    if (fixedRatio > 65) {
      scorePrevisibilidade = Math.max(20, Math.round(100 - (fixedRatio - 65) * 2.5));
    } else if (fixedRatio < 5) {
      // Pouquíssimas contas cadastradas: alerta de previsibilidade não mapeada
      scorePrevisibilidade = 50;
    } else if (fixedRatio < 15) {
      scorePrevisibilidade = 70;
    }

    const calculatedAxes: AxisScore[] = [
      {
        name: 'Poupança',
        label: 'Taxa de Poupança',
        score: scorePoupanca,
        detail: `${savingsRate.toFixed(0)}% da renda poupada`,
        explanation: 'Mede quanto sobra do que você ganha após todas as despesas do mês. O ideal é poupar acima de 20% a 30%.',
        howToImprove: 'Para subir este score, reduza gastos variáveis ou aumente suas receitas no mês.',
      },
      {
        name: 'Cartão',
        label: 'Controle de Cartão',
        score: scoreCartao,
        detail: `${cardRatio.toFixed(0)}% da renda comprometida`,
        explanation: 'Avalia se sua fatura de cartão de crédito consome mais do que 30% da sua renda mensal.',
        howToImprove: 'Evite compras parceladas longas e concentre despesas recorrentes no débito ou PIX.',
      },
      {
        name: 'Reserva',
        label: 'Reserva de Emergência',
        score: scoreReserva,
        detail: `${monthsCovered.toFixed(1)} meses de custo cobertos`,
        explanation: 'Calcula quantos meses você sobreviveria se sua renda parasse hoje, com base no saldo acumulado nas suas Metas de Poupança (o recomendado por especialistas são 6 meses).',
        howToImprove: 'Crie ou alimente uma Meta de Poupança (ex: "Reserva de Emergência") para elevar esta nota até 100.',
      },
      {
        name: 'Orçamento',
        label: 'Aderência a Tetos',
        score: scoreOrcamento,
        detail: `${scoreOrcamento}% das metas respeitadas`,
        explanation: 'Verifica se você está respeitando os limites mensais de gastos definidos nas categorias de orçamento.',
        howToImprove: 'Ajuste limites mais realistas ou segure os gastos nas categorias com alerta vermelho.',
      },
      {
        name: 'Previsibilidade',
        label: 'Previsibilidade Fixa',
        score: scorePrevisibilidade,
        detail: `${fixedRatio.toFixed(0)}% em contas cadastradas`,
        explanation: 'Avalia se seus custos fixos recorrentes (aluguel, água, luz, internet, assinaturas) estão devidamente cadastrados para evitar surpresas.',
        howToImprove: 'Cadastre suas contas na seção "Contas Recorrentes" para que o sistema consiga antecipar seus débitos.',
      },
    ];

    const avg = Math.round(
      calculatedAxes.reduce((sum, a) => sum + a.score, 0) / calculatedAxes.length
    );

    // Eixo com menor pontuação para dica imediata
    const sorted = [...calculatedAxes].sort((a, b) => a.score - b.score);
    const weakest = sorted[0];

    let status = {
      label: 'Excelente',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300',
      description: 'Finanças blindadas! Você possui forte capacidade de poupança e riscos controlados.',
    };

    if (avg < 50) {
      status = {
        label: 'Atenção Crítica',
        badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300',
        description: 'Comprometimento elevado de renda. É essencial estancar vazamentos de cartão e delivery.',
      };
    } else if (avg < 75) {
      status = {
        label: 'Em Evolução',
        badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300',
        description: 'Boa base construída! Pequenos ajustes nas dimensões em amarelo elevarão seu score.',
      };
    }

    return { 
      axes: calculatedAxes, 
      overallScore: avg, 
      qualitativeStatus: status,
      weakestAxis: weakest
    };
  }, [totalIncome, totalExpense, budgets, savingsGoals, recurringBills, creditCardExpense]);

  // Geometria do Radar SVG Pentagonal
  const size = 300;
  const center = size / 2;
  const radius = 105;
  const numAxes = axes.length;

  const getCoordinates = (index: number, score: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Níveis de grade concêntrica (25, 50, 75, 100)
  const gridLevels = [25, 50, 75, 100];
  const gridPolygons = gridLevels.map((lvl) => {
    return Array.from({ length: numAxes })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x},${y}`;
      })
      .join(' ');
  });

  // Polígono dos valores do usuário
  const dataPolygon = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, Math.max(10, axis.score));
      return `${x},${y}`;
    })
    .join(' ');

  const activeAxisObj = selectedAxisName 
    ? axes.find(a => a.name === selectedAxisName) 
    : weakestAxis;

  return (
    <div className="card-duo-green p-6 sm:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C4939]/20 dark:border-[#214E3E] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#1C4939] dark:bg-[#102D25] text-[#D4A94F] border border-[#D4A94F]/40 shadow-xs">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
                Radar de Saúde Financeira
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${qualitativeStatus.badgeClass}`}>
                {qualitativeStatus.label}
              </span>
            </div>
            <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8]">
              Avaliação holística da sua vida financeira em 5 pilares estratégicos
            </p>
          </div>
        </div>

        {/* Botão de Ajuda Didática e Badge do Score Geral */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/90 dark:bg-[#102D25] text-[#1C4939] dark:text-[#78C6A3] border border-[#1C4939]/20 hover:border-[#D4A94F] shadow-xs transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[#D4A94F]" />
            <span>Como é calculado?</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-3 bg-white/90 dark:bg-[#102D25]/90 px-4 py-2 rounded-2xl border border-[#1C4939]/20 dark:border-[#214E3E] shadow-sm">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#526B61] dark:text-[#9AB3A8] block">
                Score Geral
              </span>
              <span className="text-2xl font-black text-[#102D25] dark:text-[#E8E4D9] font-mono tabular-nums">
                {overallScore}
                <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]"> / 100</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/30">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>

      {/* Painel Explicativo Colapsável (O que é e como funciona) */}
      {showGuide && (
        <div className="p-5 rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25]/95 border border-[#D4A94F]/40 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1C4939] dark:text-[#78C6A3]" />
            <h4 className="text-sm font-extrabold text-[#102D25] dark:text-[#E8E4D9]">
              Como funciona o Radar de Saúde Financeira?
            </h4>
          </div>
          <p className="text-xs text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
            O radar combina <strong>5 pilares essenciais</strong> para atribuir uma nota justa e transparente de 0 a 100. Diferente de olhar apenas o saldo da conta, ele avalia se você está protegido contra imprevistos:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/80 border border-[#1C4939]/10">
              <strong className="text-[#102D25] dark:text-[#E8E4D9] block mb-0.5">💰 Taxa de Poupança (0–100)</strong>
              <span className="text-[#526B61] dark:text-[#9AB3A8]">Quanto sobrou da sua renda após as despesas. Poupar 30% ou mais garante nota 100.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/80 border border-[#1C4939]/10">
              <strong className="text-[#102D25] dark:text-[#E8E4D9] block mb-0.5">💳 Controle de Cartão (0–100)</strong>
              <span className="text-[#526B61] dark:text-[#9AB3A8]">Garante que suas faturas não ultrapassem 30% da sua renda mensal, evitando endividamento.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/80 border border-[#1C4939]/10">
              <strong className="text-[#102D25] dark:text-[#E8E4D9] block mb-0.5">🛡️ Reserva de Emergência (0–100)</strong>
              <span className="text-[#526B61] dark:text-[#9AB3A8]">Compara o saldo das suas Metas de Poupança com seus custos mensais. 6 meses guardados = nota 100.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/80 border border-[#1C4939]/10">
              <strong className="text-[#102D25] dark:text-[#E8E4D9] block mb-0.5">🎯 Aderência a Tetos (0–100)</strong>
              <span className="text-[#526B61] dark:text-[#9AB3A8]">Percentual de categorias de orçamento que não estouraram o limite planejado no mês.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#16382E]/80 border border-[#1C4939]/10 md:col-span-2">
              <strong className="text-[#102D25] dark:text-[#E8E4D9] block mb-0.5">📅 Previsibilidade Fixa (0–100)</strong>
              <span className="text-[#526B61] dark:text-[#9AB3A8]">Mede se suas contas fixas (aluguel, água, luz, assinaturas) estão cadastradas na aba de Contas Recorrentes para o sistema prever seu saldo futuro.</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar SVG Pentagonal Interativo */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[300px] h-[300px]">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
              <defs>
                <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D4A94F" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1C4939" stopOpacity="0.15" />
                </radialGradient>
              </defs>

              {/* Linhas de Grade Concêntricas */}
              {gridPolygons.map((points, idx) => (
                <polygon
                  key={idx}
                  points={points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-300 dark:text-[#214E3E]/60 stroke-dasharray-1"
                />
              ))}

              {/* Eixos Radiais */}
              {Array.from({ length: numAxes }).map((_, i) => {
                const { x, y } = getCoordinates(i, 100);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-[#214E3E]/40"
                  />
                );
              })}

              {/* Polígono de Dados do Usuário */}
              <polygon
                points={dataPolygon}
                fill="url(#radarGradient)"
                stroke="#1C4939"
                strokeWidth="2.5"
                className="transition-all duration-300 drop-shadow-md"
              />

              {/* Vértices Interativos */}
              {axes.map((axis, i) => {
                const { x, y } = getCoordinates(i, Math.max(10, axis.score));
                const isSelected = selectedAxisName === axis.name;

                return (
                  <g 
                    key={i} 
                    className="cursor-pointer"
                    onClick={() => setSelectedAxisName(selectedAxisName === axis.name ? null : axis.name)}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? "7" : "5"}
                      fill={isSelected ? "#1C4939" : "#D4A94F"}
                      stroke="#FAF8F4"
                      strokeWidth="2"
                      className="transition-all duration-200 hover:scale-125"
                    />
                  </g>
                );
              })}

              {/* Rótulos dos Vértices Clicáveis */}
              {axes.map((axis, i) => {
                const labelRadius = radius + 22;
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAxes;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                const isSelected = selectedAxisName === axis.name;

                return (
                  <text
                    key={i}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    onClick={() => setSelectedAxisName(selectedAxisName === axis.name ? null : axis.name)}
                    className={`text-[11px] font-black cursor-pointer transition-colors ${
                      isSelected 
                        ? 'fill-[#D4A94F] font-black underline' 
                        : 'fill-[#102D25] dark:fill-[#E8E4D9] hover:fill-[#D4A94F]'
                    }`}
                  >
                    {axis.name}
                  </text>
                );
              })}
            </svg>
          </div>

          <p className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-2">
            💡 Toque em um dos 5 pontos do radar para entender a nota
          </p>
        </div>

        {/* Lado Direito: Barras com Tooltip Explicativo + Card de Otimização */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Card de Foco / Diagnóstico do Eixo Selecionado */}
          {activeAxisObj && (
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#102D25]/95 border border-[#D4A94F]/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    activeAxisObj.score >= 75 ? 'bg-emerald-500' : activeAxisObj.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <h4 className="text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">
                    {activeAxisObj.label} ({activeAxisObj.score}/100)
                  </h4>
                </div>
                <span className="text-xs font-bold text-[#1C4939] dark:text-[#78C6A3]">
                  {activeAxisObj.detail}
                </span>
              </div>
              <p className="text-xs text-[#526B61] dark:text-[#9AB3A8]">
                {activeAxisObj.explanation}
              </p>
              <div className="p-2.5 rounded-xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#1C4939]/10 flex items-start gap-2 text-xs">
                <Lightbulb className="w-4 h-4 text-[#D4A94F] shrink-0 mt-0.5" />
                <span className="text-[#102D25] dark:text-[#E8E4D9] font-semibold">
                  <strong>Como melhorar:</strong> {activeAxisObj.howToImprove}
                </span>
              </div>
            </div>
          )}

          {/* Lista dos 5 Eixos com Barras de Progresso */}
          <div className="space-y-2">
            {axes.map((axis) => {
              const isSelected = selectedAxisName === axis.name;
              return (
                <div
                  key={axis.name}
                  onClick={() => setSelectedAxisName(axis.name)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-white dark:bg-[#16382E] border-[#1C4939] shadow-xs'
                      : 'bg-white/80 dark:bg-[#102D25]/80 border-[#1C4939]/15 dark:border-[#214E3E] hover:border-[#1C4939]/40'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-[#102D25] dark:text-[#E8E4D9] truncate">
                      {axis.label}
                    </p>
                    <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] font-semibold">
                      {axis.detail}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          axis.score >= 75 
                            ? 'bg-emerald-500' 
                            : axis.score >= 50 
                            ? 'bg-amber-500' 
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${axis.score}%` }}
                      />
                    </div>
                    <span className="font-mono tabular-nums font-black text-[#102D25] dark:text-[#E8E4D9] w-7 text-right">
                      {axis.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};