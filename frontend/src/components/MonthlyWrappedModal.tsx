import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  UtensilsCrossed, 
  Coins, 
  Calendar, 
  Share2, 
  Check, 
  Crown
} from 'lucide-react';
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
  categoryDistribution = [],
  transactions = [],
  savingsGoals = [],
  privacyMode,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  // Navegação por teclado (Seta esquerda, direita e ESC)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(5, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reseta para o primeiro slide ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
      setCopied(false);
    }
  }, [isOpen]);

  const monthTitle = formatMonthTitle(selectedMonth);
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const expenseTx = useMemo(() => transactions.filter((t) => t.type === 'EXPENSE'), [transactions]);

  // Top 3 Categorias do Mês (Pódio)
  const topCategories = useMemo(() => {
    if (!categoryDistribution || categoryDistribution.length === 0) return [];
    return [...categoryDistribution].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3);
  }, [categoryDistribution]);

  // Maior compra única do mês
  const largestTx = useMemo(() => {
    if (expenseTx.length === 0) return null;
    return expenseTx.reduce((max, t) => (t.amount > max.amount ? t : max), expenseTx[0]);
  }, [expenseTx]);

  // Dia da semana com maior volume de gastos
  const dayOfWeekStats = useMemo(() => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const sumByDay = [0, 0, 0, 0, 0, 0, 0];
    const countByDay = [0, 0, 0, 0, 0, 0, 0];

    expenseTx.forEach((tx) => {
      const dateStr = tx.settlementDate || tx.accrualDate;
      if (!dateStr) return;
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayIdx = d.getDay();
        sumByDay[dayIdx] += tx.amount;
        countByDay[dayIdx] += 1;
      }
    });

    let maxIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (sumByDay[i] > sumByDay[maxIdx]) {
        maxIdx = i;
      }
    }

    return {
      dayName: days[maxIdx],
      totalSpent: sumByDay[maxIdx],
      txCount: countByDay[maxIdx],
    };
  }, [expenseTx]);

  // Hábitos: Delivery e Gastos Pequenos
  const habitStats = useMemo(() => {
    const deliveryKeywords = ['delivery', 'ifood', 'rappi', 'ze delivery', 'ai que fome', 'mcdonald', 'burger', 'pizz', 'sushi'];
    const deliveryList = expenseTx.filter((t) => {
      const desc = (t.description || '').toLowerCase();
      return deliveryKeywords.some((kw) => desc.includes(kw));
    });
    const deliveryTotal = deliveryList.reduce((acc, t) => acc + t.amount, 0);

    const smallList = expenseTx.filter((t) => t.amount <= 35 && t.amount > 0);
    const smallTotal = smallList.reduce((acc, t) => acc + t.amount, 0);

    return {
      deliveryCount: deliveryList.length,
      deliveryTotal,
      smallCount: smallList.length,
      smallTotal,
      averagePerDay: totalExpense > 0 ? totalExpense / 30 : 0,
      totalCount: expenseTx.length,
    };
  }, [expenseTx, totalExpense]);

  // Nota do Mês
  let grade = 'A';
  if (savingsRate >= 25) grade = 'A+';
  else if (savingsRate >= 15) grade = 'A';
  else if (savingsRate >= 5) grade = 'B+';
  else if (savingsRate >= 0) grade = 'B';
  else grade = 'C';

  // Arquétipo Financeiro Gamificado do Mês
  const archetype = useMemo(() => {
    if (savingsRate >= 30) {
      return {
        title: 'Mestre da Rentabilidade',
        icon: '💎',
        bgBadge: 'bg-[#D4A94F]/20 text-[#D4A94F] border-[#D4A94F]/50',
        description: 'Você poupou mais de 30% de toda a sua renda! Seu controle orçamentário está em padrão de Private Banking.',
        highlight: 'Mais de 1/3 do seu salário virou patrimônio líquido.',
      };
    }
    if (savingsRate >= 15) {
      return {
        title: 'O Estrategista Blindado',
        icon: '🛡️',
        bgBadge: 'bg-[#1C4939] text-[#78C6A3] border-[#78C6A3]/40',
        description: 'Disciplina de ferro! Você manteve as contas sob rédeas curtas e garantiu uma sobra sólida para o futuro.',
        highlight: 'Excelente equilíbrio entre viver bem e investir forte.',
      };
    }
    if (savingsRate >= 0) {
      if (habitStats.deliveryTotal > totalExpense * 0.25 && habitStats.deliveryCount >= 5) {
        return {
          title: 'O Apaixonado por Conforto',
          icon: '🛵',
          bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
          description: 'Você fechou no azul, mas a frequência de delivery e conveniências pesou bastante no seu orçamento.',
          highlight: `${habitStats.deliveryCount} pedidos de delivery consumiram ${formatBRL(habitStats.deliveryTotal, privacyMode)}.`,
        };
      }
      if (habitStats.smallCount >= 12) {
        return {
          title: 'O Mestre dos Pequenos Detalhes',
          icon: '🐜',
          bgBadge: 'bg-amber-950/60 text-amber-300 border-amber-500/40',
          description: 'Mês equilibrado, mas o efeito formiguinha comeu pelas beiradas com muitos micro-gastos ao longo dos dias.',
          highlight: `${habitStats.smallCount} compras menores que R$ 35 somaram ${formatBRL(habitStats.smallTotal, privacyMode)}.`,
        };
      }
      return {
        title: 'O Mestre do Equilíbrio',
        icon: '⚖️',
        bgBadge: 'bg-[#16382E] text-[#E8E4D9] border-[#214E3E]',
        description: 'Equilíbrio total entre desfrutar o presente e pagar todas as contas em dia sem entrar no cheque especial.',
        highlight: 'Fechou com margem positiva e contas 100% honradas.',
      };
    }
    return {
      title: 'Guerreiro da Reconstrução',
      icon: '🧗',
      bgBadge: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
      description: 'Mês atípico onde as despesas superaram a renda. O plano de recuperação começa no dia 1º com cortes inteligentes.',
      highlight: 'Momento ideal para ligar o Detetive de Economia e estancar vazamentos.',
    };
  }, [savingsRate, habitStats, totalExpense, privacyMode]);

  // Projeção a Juros Compostos da Sobra
  const projection = useMemo(() => {
    if (netSavings <= 0) return null;
    const annualRate = 0.105; // 10.5% a.a. (~100% CDI)
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const fv1 = netSavings * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate);
    const fv5 = netSavings * ((Math.pow(1 + monthlyRate, 60) - 1) / monthlyRate);
    const passiveMonthly = fv5 * monthlyRate;

    return {
      inOneYear: Math.round(fv1),
      inFiveYears: Math.round(fv5),
      passiveMonthly: Math.round(passiveMonthly),
    };
  }, [netSavings]);

  // Função para copiar o resumo para a área de transferência
  const handleCopySummary = () => {
    const text = `🏆 MEU MÊS EM REVISTA (${monthTitle})
📊 Perfil do Mês: ${archetype.icon} ${archetype.title}
⭐ Nota do Mês: ${grade}
💰 Renda: ${formatBRL(totalIncome, privacyMode)}
💸 Despesas: ${formatBRL(totalExpense, privacyMode)}
✨ Sobra Líquida: ${formatBRL(netSavings, privacyMode)} (${savingsRate.toFixed(1)}% da renda)
${topCategories.length > 0 ? `🥇 Maior Gasto: ${topCategories[0].categoryName} (${formatBRL(topCategories[0].totalAmount, privacyMode)})` : ''}

Gerado pelo app Economia Real 🚀`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  // Definição dos 6 Stories Cinematográficos
  const slides = [
    // SLIDE 1: O GRANDE BALANÇO (CAPA DA REVISTA)
    {
      stepLabel: 'O Balanço',
      title: 'Seu Mês em Revista',
      subtitle: `Retrospectiva Oficial • ${monthTitle}`,
      content: (
        <div className="space-y-6 text-center py-2 animate-in fade-in duration-300">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#D4A94F] border-2 border-[#D4A94F]/40 shadow-xl ring-4 ring-[#D4A94F]/20">
            <Trophy className="w-12 h-12 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#526B61] dark:text-[#9AB3A8] block">
              Sobra Líquida Acumulada
            </span>
            <p className={`text-3xl sm:text-4xl font-black font-numeric tabular-nums tracking-tight ${
              netSavings >= 0 ? 'text-[#1C4939] dark:text-[#78C6A3]' : 'text-[#B93838] dark:text-rose-400'
            }`}>
              {formatBRL(netSavings, privacyMode)}
            </p>
            <p className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8] max-w-xs mx-auto">
              {netSavings >= 0 ? (
                <>Você guardou <strong>{savingsRate.toFixed(1)}%</strong> de toda a sua renda recebida!</>
              ) : (
                <>Suas despesas superaram as entradas neste período.</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] text-left">
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Entradas</span>
              <p className="text-base font-black text-[#1C4939] dark:text-[#78C6A3] font-numeric tabular-nums mt-0.5">
                {formatBRL(totalIncome, privacyMode)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] text-left">
              <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">Despesas</span>
              <p className="text-base font-black text-[#B93838] dark:text-rose-400 font-numeric tabular-nums mt-0.5">
                {formatBRL(totalExpense, privacyMode)}
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // SLIDE 2: O PÓDIO DOS GASTOS & MAIOR COMPRA
    {
      stepLabel: 'O Pódio',
      title: 'Onde Foi o Seu Dinheiro?',
      subtitle: 'O pódio das suas despesas no mês',
      content: (
        <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
          <div className="space-y-2.5 max-w-sm mx-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4A94F] block text-left">
              Top 3 Categorias de Consumo:
            </span>
            {topCategories.length > 0 ? (
              topCategories.map((cat, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                const pct = totalExpense > 0 ? (cat.totalAmount / totalExpense) * 100 : 0;
                return (
                  <div
                    key={cat.categoryId}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      idx === 0 
                        ? 'bg-[#1C4939] text-[#FAF8F4] border-[#D4A94F]/40 shadow-md' 
                        : 'bg-[#F7F5F0] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#D5CFC0] dark:border-[#214E3E]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{medals[idx]}</span>
                      <div className="text-left">
                        <strong className="text-xs sm:text-sm font-black block truncate max-w-[140px] sm:max-w-[180px]">
                          {cat.categoryName}
                        </strong>
                        <span className={`text-[10px] font-semibold block ${idx === 0 ? 'text-[#D4A94F]' : 'text-[#526B61] dark:text-[#9AB3A8]'}`}>
                          {pct.toFixed(0)}% de todos os seus gastos
                        </span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-black font-numeric tabular-nums">
                      {formatBRL(cat.totalAmount, privacyMode)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-[#526B61]">Nenhum lançamento no período.</p>
            )}
          </div>

          {largestTx && (
            <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] max-w-sm mx-auto text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
                  Maior Compra Única
                </span>
                <p className="text-xs font-black text-[#102D25] dark:text-[#E8E4D9] truncate max-w-[180px]">
                  {largestTx.description}
                </p>
                <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8] font-semibold">
                  {(largestTx.settlementDate || largestTx.accrualDate)?.split('-').reverse().join('/')}
                </span>
              </div>
              <p className="text-sm font-black text-[#B93838] dark:text-rose-400 font-numeric tabular-nums">
                {formatBRL(largestTx.amount, privacyMode)}
              </p>
            </div>
          )}
        </div>
      ),
    },

    // SLIDE 3: RAIO-X DE HÁBITOS & CURIOSIDADES
    {
      stepLabel: 'Hábitos',
      title: 'Raio-X dos Seus Hábitos',
      subtitle: 'Curiosidades reveladoras sobre seu bolso',
      content: (
        <div className="space-y-3.5 max-w-sm mx-auto py-2 animate-in fade-in duration-300">
          
          {/* Dia mais gastador */}
          <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1C4939] text-[#D4A94F]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
                  Dia Mais Gastador
                </span>
                <strong className="text-xs sm:text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">
                  {dayOfWeekStats.dayName}
                </strong>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black font-numeric tabular-nums text-[#B93838] dark:text-rose-400 block">
                {formatBRL(dayOfWeekStats.totalSpent, privacyMode)}
              </span>
              <span className="text-[10px] text-[#526B61] dark:text-[#9AB3A8]">
                {dayOfWeekStats.txCount} compras
              </span>
            </div>
          </div>

          {/* Frequência de Delivery */}
          <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1C4939] text-[#D4A94F]">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
                  Delivery & Restaurante
                </span>
                <strong className="text-xs sm:text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">
                  {habitStats.deliveryCount} pedidos no mês
                </strong>
              </div>
            </div>
            <span className="text-xs font-black font-numeric tabular-nums text-[#1C4939] dark:text-[#78C6A3]">
              {formatBRL(habitStats.deliveryTotal, privacyMode)}
            </span>
          </div>

          {/* Efeito Formiguinha */}
          <div className="p-3.5 rounded-2xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1C4939] text-[#D4A94F]">
                <Coins className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-[#526B61] dark:text-[#9AB3A8] block">
                  Gastos Formiguinha (&le; R$ 35)
                </span>
                <strong className="text-xs sm:text-sm font-black text-[#102D25] dark:text-[#E8E4D9]">
                  {habitStats.smallCount} pequenos gastos
                </strong>
              </div>
            </div>
            <span className="text-xs font-black font-numeric tabular-nums text-[#1C4939] dark:text-[#78C6A3]">
              {formatBRL(habitStats.smallTotal, privacyMode)}
            </span>
          </div>

          <p className="text-[11px] font-semibold text-[#526B61] dark:text-[#9AB3A8] text-center pt-1">
            Média diária de gastos: <strong>{formatBRL(habitStats.averagePerDay, privacyMode)}/dia</strong>
          </p>
        </div>
      ),
    },

    // SLIDE 4: SEU ARQUÉTIPO FINANCEIRO DO MÊS
    {
      stepLabel: 'Seu Perfil',
      title: 'Seu Perfil Financeiro',
      subtitle: 'Sua personalidade de consumo em destaque',
      content: (
        <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#FAF8F4] border-2 border-[#D4A94F]/40 shadow-xl max-w-sm mx-auto space-y-3">
            <span className="text-3xl block">{archetype.icon}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A94F] block">
                Arquétipo Conquistado
              </span>
              <h4 className="text-xl font-black text-white mt-0.5">
                {archetype.title}
              </h4>
            </div>

            <p className="text-xs font-medium text-[#E8E4D9] leading-relaxed">
              {archetype.description}
            </p>

            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-xs font-extrabold text-[#78C6A3]">
              ✨ {archetype.highlight}
            </div>
          </div>
        </div>
      ),
    },

    // SLIDE 5: O PODER DO FUTURO (BOLA DE NEVE)
    {
      stepLabel: 'Seu Futuro',
      title: 'O Potencial Deste Mês',
      subtitle: 'O efeito multiplicador da sua economia',
      content: (
        <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
          {projection ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#102D25] to-[#1C4939] text-[#FAF8F4] border-2 border-[#D4A94F]/40 shadow-xl max-w-sm mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#D4A94F] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Efeito Bola de Neve
                </span>
                <span className="text-[10px] font-black text-[#78C6A3]">10,5% a.a.</span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#9AB3A8] font-bold block">
                  Mantendo este aporte de {formatBRL(netSavings, privacyMode)} todo mês:
                </span>
                
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                    <span className="text-[10px] text-[#9AB3A8] font-bold block">Em 1 Ano:</span>
                    <strong className="text-sm font-black text-white font-numeric tabular-nums block">
                      {formatBRL(projection.inOneYear, privacyMode)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#D4A94F]/20 border border-[#D4A94F]/50">
                    <span className="text-[10px] text-[#D4A94F] font-bold block">Em 5 Anos:</span>
                    <strong className="text-sm font-black text-white font-numeric tabular-nums block">
                      {formatBRL(projection.inFiveYears, privacyMode)}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 text-left">
                  <span className="text-[10px] text-[#78C6A3] font-bold uppercase block">
                    Salário Passivo Estimado em 5 Anos:
                  </span>
                  <strong className="text-base font-black text-[#78C6A3] font-numeric tabular-nums block">
                    +{formatBRL(projection.passiveMonthly, privacyMode)}/mês
                  </strong>
                  <span className="text-[10px] text-[#9AB3A8] block">
                    rendendo na sua conta sem mexer no valor principal!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-[#F7F5F0] dark:bg-[#16382E] border border-[#D5CFC0] dark:border-[#214E3E] max-w-sm mx-auto space-y-3">
              <span className="text-3xl block">🚀</span>
              <h4 className="text-lg font-black text-[#102D25] dark:text-[#E8E4D9]">
                Pronto para Virar o Jogo?
              </h4>
              <p className="text-xs text-[#526B61] dark:text-[#9AB3A8] leading-relaxed">
                Cortando apenas 10% a 15% das despesas supérfluas no próximo mês, você gera uma sobra limpa para começar sua bola de neve de investimentos.
              </p>
            </div>
          )}

          {savingsGoals.length > 0 && (
            <p className="text-xs font-extrabold text-[#1C4939] dark:text-[#78C6A3]">
              🎯 Você possui {savingsGoals.length} meta(s) de economia ativas no app!
            </p>
          )}
        </div>
      ),
    },

    // SLIDE 6: CARTÃO EXECUTIVO FINAL & COMPARTILHAMENTO
    {
      stepLabel: 'Certificado',
      title: 'Capa da Sua Revista',
      subtitle: 'O resumo oficial do seu desempenho',
      content: (
        <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
          {/* Cartão de Revista Executiva */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#102D25] text-[#FAF8F4] border-2 border-[#D4A94F]/60 shadow-2xl max-w-sm mx-auto space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4A94F]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#D4A94F]">
                  Economia Real Review
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#9AB3A8] uppercase">
                {monthTitle}
              </span>
            </div>

            <div className="flex items-center justify-between px-2">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-[#9AB3A8] block">Perfil do Mês:</span>
                <strong className="text-base font-black text-white block">
                  {archetype.icon} {archetype.title}
                </strong>
                <span className="text-[11px] font-bold text-[#78C6A3] block mt-0.5">
                  Sobra: {formatBRL(netSavings, privacyMode)}
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#1C4939] border-2 border-[#D4A94F] flex flex-col items-center justify-center shadow-lg">
                <span className="text-[9px] uppercase font-bold text-[#D4A94F]">Nota</span>
                <span className="text-xl font-black text-white">{grade}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left text-xs font-semibold text-[#E8E4D9]">
              💡 <em>{archetype.description}</em>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full py-2.5 px-4 rounded-xl border border-[#D5CFC0] dark:border-[#214E3E] bg-[#FAF8F4] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] text-xs font-extrabold flex items-center justify-center gap-2 hover:border-[#D4A94F] transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Resumo Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#D4A94F]" />
                  <span>Copiar Resumo da Revista</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-duo btn-duo-green w-full py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2"
            >
              <span>Começar o Novo Mês com Tudo!</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="card-duo bg-[#FAF8F4] dark:bg-[#102D25] border-2 border-[#D5CFC0] dark:border-[#214E3E] max-w-md w-full p-5 sm:p-7 rounded-3xl shadow-2xl relative space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barra de progresso dos Stories */}
        <div className="flex gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#D5CFC0]/60 dark:bg-[#16382E] cursor-pointer"
              title={`Ir para ${s.stepLabel}`}
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide ? 'bg-[#1C4939] dark:bg-[#D4A94F]' : 'bg-transparent'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Topo com Título, Subtítulo e Botão Fechar */}
        <div className="flex items-center justify-between border-b border-[#D5CFC0] dark:border-[#214E3E] pb-3">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-[#102D25] dark:text-[#E8E4D9]">
                {current.title}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#1C4939] text-[#D4A94F]">
                {current.stepLabel}
              </span>
            </div>
            <p className="text-xs font-bold text-[#526B61] dark:text-[#9AB3A8]">
              {current.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#526B61] hover:text-[#102D25] dark:text-[#9AB3A8] dark:hover:text-[#FAF8F4] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Dinâmico do Story */}
        <div className="min-h-[310px] flex flex-col justify-center">
          {current.content}
        </div>

        {/* Navegação Inferior dos Stories */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D5CFC0] dark:border-[#214E3E]">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            className="px-3.5 py-2 rounded-xl text-xs font-black border border-[#D5CFC0] dark:border-[#214E3E] bg-[#F7F5F0] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] flex items-center gap-1 disabled:opacity-40 hover:border-[#1C4939] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <span className="text-[11px] font-bold text-[#526B61] dark:text-[#9AB3A8]">
            {currentSlide + 1} de {slides.length}
          </span>

          <button
            type="button"
            disabled={currentSlide === slides.length - 1}
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            className="btn-duo btn-duo-yellow px-4 py-2 text-xs font-black flex items-center gap-1 disabled:opacity-40"
          >
            <span>Avançar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
