import React, { useState } from 'react';
import { X, Sparkles, Award, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { FinancialSummary, Transaction } from '../types/financial';
import { CategoryDistributionItem } from '../types/analytics';
import { SavingsGoal } from '../types/goal';

interface MonthlyWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  summary: FinancialSummary;
  categoryDistribution: CategoryDistributionItem[];
  transactions: Transaction[];
  savingsGoals?: SavingsGoal[];
  privacyMode?: boolean;
}

function formatBRL(val: number | undefined, privacyMode?: boolean): string {
  if (privacyMode) return '••••••';
  if (val === undefined || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatMonthTitle(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export const MonthlyWrappedModal: React.FC<MonthlyWrappedModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  summary,
  categoryDistribution,
  transactions,
  savingsGoals = [],
  privacyMode,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const monthTitle = formatMonthTitle(selectedMonth);
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Top Categoria
  const topCategory = categoryDistribution && categoryDistribution.length > 0
    ? categoryDistribution[0]
    : null;

  // Maior compra única do mês
  const expenseTx = transactions.filter((t) => t.type === 'EXPENSE');
  const largestTx = expenseTx.length > 0
    ? expenseTx.reduce((max, t) => (t.amount > max.amount ? t : max), expenseTx[0])
    : null;

  // Nota do Mês
  let grade = 'A';
  if (savingsRate >= 25) grade = 'A+';
  else if (savingsRate >= 15) grade = 'A';
  else if (savingsRate >= 5) grade = 'B+';
  else if (savingsRate >= 0) grade = 'B';
  else grade = 'C';

  const slides = [
    // Slide 1: Grande Balanço
    {
      title: 'Seu Mês em Revista',
      subtitle: `Retrospectiva Financeira de ${monthTitle}`,
      content: (
        <div className="space-y-6 text-center py-4">
          <div className="inline-flex p-4 rounded-3xl bg-[#1C4939] text-[#D4A94F] shadow-lg ring-4 ring-[#D4A94F]/20">
            <Trophy className="w-12 h-12 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#526B61] dark:text-[#9AB3A8]">
              Saldo Líquido Economizado
            </span>
            <p className={`text-3xl sm:text-4xl font-black ${netSavings >= 0 ? 'text-[#1C4939] dark:text-[#78C6A3]' : 'text-[#B93838]'}`}>
              {formatBRL(netSavings, privacyMode)}
            </p>
            <p className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">
              {savingsRate >= 0 ? `Você poupou ${savingsRate.toFixed(1)}% de todas as suas entradas!` : 'Gastos superaram as receitas neste mês.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#16382E] border border-slate-200 dark:border-[#214E3E]">
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Entradas</span>
              <p className="text-base font-black text-[#102D25] dark:text-[#E8E4D9] mt-0.5">{formatBRL(totalIncome, privacyMode)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#16382E] border border-slate-200 dark:border-[#214E3E]">
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Despesas</span>
              <p className="text-base font-black text-[#B93838] dark:text-rose-400 mt-0.5">{formatBRL(totalExpense, privacyMode)}</p>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 2: Raio-X de Gastos
    {
      title: 'Onde Foi o Seu Dinheiro?',
      subtitle: 'Principais fatias e destaques de consumo',
      content: (
        <div className="space-y-6 text-center py-4">
          {topCategory ? (
            <div className="p-6 rounded-3xl bg-[#FAF8F4] dark:bg-[#16382E] border border-[#D4A94F]/40 space-y-3 max-w-sm mx-auto">
              <span className="text-[10px] font-black uppercase text-[#D4A94F] tracking-wider block">
                Categoria Campeã de Gastos
              </span>
              <h4 className="text-2xl font-black text-[#102D25] dark:text-[#E8E4D9]">
                {topCategory.categoryName}
              </h4>
              <p className="text-lg font-extrabold text-[#B93838] dark:text-rose-400">
                {formatBRL(topCategory.totalAmount, privacyMode)}
              </p>
              <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] block">
                Representou {((topCategory.totalAmount / (totalExpense || 1)) * 100).toFixed(0)}% de todos os seus gastos
              </span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#526B61]">Nenhuma despesa registrada no período.</p>
          )}

          {largestTx && (
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#102D25] border border-slate-200 dark:border-[#214E3E] max-w-sm mx-auto text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Maior Compra Única</span>
                <p className="text-xs font-black text-[#102D25] dark:text-[#E8E4D9] truncate max-w-[180px]">{largestTx.description}</p>
              </div>
              <p className="text-sm font-black text-[#B93838] dark:text-rose-400">{formatBRL(largestTx.amount, privacyMode)}</p>
            </div>
          )}
        </div>
      ),
    },

    // Slide 3: Metas & Conquistas
    {
      title: 'Suas Conquistas Financeiras',
      subtitle: 'Construindo o seu patrimônio com disciplina',
      content: (
        <div className="space-y-6 text-center py-4">
          <div className="inline-flex p-4 rounded-3xl bg-[#FAF8F4] dark:bg-[#16382E] text-[#D4A94F] border border-[#D4A94F]/40">
            <Award className="w-12 h-12 stroke-[2]" />
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-black text-[#102D25] dark:text-[#E8E4D9]">
              {savingsGoals.length} Metas em Andamento
            </h4>
            <p className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">
              {savingsGoals.filter((g) => g.isReached).length} metas já foram concluídas!
            </p>
          </div>

          <div className="space-y-2 max-w-sm mx-auto max-h-40 overflow-y-auto">
            {savingsGoals.slice(0, 3).map((g) => (
              <div key={g.id} className="p-3 rounded-xl bg-white dark:bg-[#16382E] border border-slate-200 dark:border-[#214E3E] flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#102D25] dark:text-[#E8E4D9]">{g.title}</span>
                <span className="font-black text-[#1C4939] dark:text-[#78C6A3]">
                  {formatBRL(g.currentAmount, privacyMode)} / {formatBRL(g.targetAmount, privacyMode)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // Slide 4: Conselho do Mascote & Nota do Mês
    {
      title: 'Nota do Mês & Conselho I.A',
      subtitle: 'Dicas do Mascote Economia Real',
      content: (
        <div className="space-y-6 text-center py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-[#1C4939] text-[#D4A94F] flex items-center justify-center font-black text-2xl border-2 border-[#D4A94F]/60 shadow-lg">
              {grade}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Avaliação do Mês</span>
              <h4 className="text-lg font-black text-[#102D25] dark:text-[#E8E4D9]">
                {grade.startsWith('A') ? 'Desempenho Impecável!' : 'Bom Controle Financeiro'}
              </h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#16382E] border border-[#1C4939]/20 dark:border-[#214E3E] text-xs font-semibold text-[#102D25] dark:text-[#E8E4D9] leading-relaxed max-w-sm mx-auto">
            <p className="flex items-start gap-2 text-left">
              <Sparkles className="w-5 h-5 text-[#D4A94F] shrink-0 mt-0.5" />
              <span>
                {grade.startsWith('A')
                  ? 'Você manteve os gastos essenciais controlados e garantiu margem de investimento. Para o próximo mês, mantenha o foco nos aportes automáticos logo após o pagamento!'
                  : 'Fique atento aos pedidos de delivery aos finais de semana e estabeleça um teto rigoroso para pequenos gastos invisíveis no próximo mês.'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-duo btn-duo-green px-8 py-3 text-xs sm:text-sm font-black"
          >
            Começar o Novo Mês com Tudo! 🚀
          </button>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="card-duo bg-white dark:!bg-[#102D25] border-2 border-slate-200/90 dark:!border-[#214E3E] max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl relative space-y-6 my-auto">
        
        {/* Barra de progresso dos Stories */}
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-[#1C4939] dark:bg-[#D4A94F]' : 'bg-transparent'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Topo com Título e Fechar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#214E3E] pb-3">
          <div>
            <h3 className="text-lg font-black text-[#102D25] dark:text-[#E8E4D9]">{current.title}</h3>
            <p className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">{current.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E4D9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Slide */}
        <div>{current.content}</div>

        {/* Navegação Inferior */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#214E3E]">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            className="btn-duo btn-duo-white px-4 py-2 text-xs font-black flex items-center gap-1 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <span className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">
            {currentSlide + 1} de {slides.length}
          </span>

          <button
            type="button"
            disabled={currentSlide === slides.length - 1}
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            className="btn-duo btn-duo-yellow px-4 py-2 text-xs font-black flex items-center gap-1 disabled:opacity-40"
          >
            <span>Próximo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
